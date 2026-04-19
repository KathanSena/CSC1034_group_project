const formatDate = (value) => {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
};

const loadFoodBanks = async () => {
    const select = document.querySelector("#foodBankFilter");
    const sql = "SELECT foodbank_id, foodbank_name FROM FoodBank ORDER BY foodbank_name;";
    const result = await runQuery(sql);

    if (!result || result.success !== true) {
        return;
    }

    for (let row of result.data) {
        const option = document.createElement("option");
        option.value = row.foodbank_id;
        option.textContent = row.foodbank_name;
        select.appendChild(option);
    }
};

const loadCategories = async () => {
    const select = document.querySelector("#categoryFilter");
    const sql = "SELECT DISTINCT category FROM FoodItem ORDER BY category;";
    const result = await runQuery(sql);

    if (!result || result.success !== true) {
        return;
    }

    for (let row of result.data) {
        const option = document.createElement("option");
        option.value = row.category;
        option.textContent = row.category;
        select.appendChild(option);
    }
};

const printTable = async () => {
    const output = document.querySelector("#stockOutput");
    output.textContent = "Loading stock data...";

    const foodBankId = document.querySelector("#foodBankFilter").value;
    const category = document.querySelector("#categoryFilter").value;
    const searchText = document.querySelector("#stockSearch").value.trim();
    const maxRows = Number(document.querySelector("#maxRows").value) || 50;

    let sql = `
        SELECT
            s.stock_id,
            fb.foodbank_name,
            fi.item_name,
            fi.category,
            fi.unit_type,
            s.quantity_in_stock,
            s.last_updated
        FROM Stock s
        INNER JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
        INNER JOIN FoodItem fi ON s.item_id = fi.item_id
        WHERE 1 = 1
    `;

    if (foodBankId !== "") {
        sql += ` AND s.foodbank_id = ${Number(foodBankId)}`;
    }

    if (category !== "") {
        sql += ` AND fi.category = '${category.replace(/'/g, "''")}'`;
    }

    if (searchText !== "") {
        const safeSearch = searchText.replace(/'/g, "''");
        sql += ` AND (
            fi.item_name LIKE '%${safeSearch}%'
            OR fb.foodbank_name LIKE '%${safeSearch}%'
            OR fi.category LIKE '%${safeSearch}%'
        )`;
    }

    sql += ` ORDER BY s.quantity_in_stock ASC, fi.item_name ASC LIMIT ${maxRows};`;

    const result = await runQuery(sql);

    if (!result || result.success !== true || result.data.length === 0) {
        output.textContent = "No rows returned.";
        document.querySelector("#visibleStockRows").textContent = "0";
        document.querySelector("#visibleLowStockRows").textContent = "0";
        document.querySelector("#visibleStockQuantity").textContent = "0";
        return;
    }

    const rows = result.data;
    let lowStockCount = 0;
    let totalQuantity = 0;

    for (let row of rows) {
        totalQuantity += Number(row.quantity_in_stock);

        if (Number(row.quantity_in_stock) <= 75) {
            lowStockCount++;
        }
    }

    document.querySelector("#visibleStockRows").textContent = rows.length;
    document.querySelector("#visibleLowStockRows").textContent = lowStockCount;
    document.querySelector("#visibleStockQuantity").textContent = totalQuantity;

    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headings = [
        "Stock ID",
        "Food Bank",
        "Item",
        "Category",
        "Unit",
        "Quantity",
        "Last Updated"
    ];

    for (let heading of headings) {
        const th = document.createElement("th");
        th.textContent = heading;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (let row of rows) {
        const tr = document.createElement("tr");

        if (Number(row.quantity_in_stock) <= 75) {
            tr.className = "row-warning";
        }

        const tdStockId = document.createElement("td");
        const tdFoodBank = document.createElement("td");
        const tdItem = document.createElement("td");
        const tdCategory = document.createElement("td");
        const tdUnit = document.createElement("td");
        const tdQuantity = document.createElement("td");
        const tdUpdated = document.createElement("td");

        tdStockId.textContent = row.stock_id;
        tdFoodBank.textContent = row.foodbank_name;
        tdItem.textContent = row.item_name;
        tdCategory.textContent = row.category;
        tdUnit.textContent = row.unit_type;
        tdQuantity.textContent = row.quantity_in_stock;
        tdUpdated.textContent = formatDate(row.last_updated);

        tr.appendChild(tdStockId);
        tr.appendChild(tdFoodBank);
        tr.appendChild(tdItem);
        tr.appendChild(tdCategory);
        tr.appendChild(tdUnit);
        tr.appendChild(tdQuantity);
        tr.appendChild(tdUpdated);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    output.textContent = "";
    output.appendChild(table);
};

document.querySelector("#stockFilterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    printTable();
});

document.querySelector("#clearStockFiltersBtn").addEventListener("click", () => {
    document.querySelector("#stockFilterForm").reset();
    printTable();
});

document.addEventListener("DOMContentLoaded", async () => {
    await loadFoodBanks();
    await loadCategories();
    printTable();
});
