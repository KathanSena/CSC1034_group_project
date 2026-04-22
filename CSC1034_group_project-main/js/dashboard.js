const formatDate = (value) => {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
};

const loadDashboardCounts = async () => {
    const message = document.querySelector("#dashboardMessage");
    const foodBankResult = await runQuery("SELECT COUNT(*) AS total FROM FoodBank;");
    const donationResult = await runQuery("SELECT COUNT(*) AS total FROM Donation;");
    const householdResult = await runQuery("SELECT COUNT(*) AS total FROM Household;");
    const lowStockResult = await runQuery("SELECT COUNT(*) AS total FROM Stock WHERE quantity_in_stock <= 75;");
    const results = [foodBankResult, donationResult, householdResult, lowStockResult];

    if (foodBankResult && foodBankResult.success) {
        document.querySelector("#foodBankCount").textContent = foodBankResult.data[0].total;
    } else {
        document.querySelector("#foodBankCount").textContent = "Error";
    }

    if (donationResult && donationResult.success) {
        document.querySelector("#donationCount").textContent = donationResult.data[0].total;
    } else {
        document.querySelector("#donationCount").textContent = "Error";
    }

    if (householdResult && householdResult.success) {
        document.querySelector("#householdCount").textContent = householdResult.data[0].total;
    } else {
        document.querySelector("#householdCount").textContent = "Error";
    }

    if (lowStockResult && lowStockResult.success) {
        document.querySelector("#lowStockCount").textContent = lowStockResult.data[0].total;
    } else {
        document.querySelector("#lowStockCount").textContent = "Error";
    }

    if (message) {
        if (results.every((result) => result && result.success)) {
            message.textContent = "Dashboard counts loaded from the database.";
            message.className = "message-box good-message";
        } else {
            const firstError = results.find((result) => !result || !result.success);
            message.textContent = firstError && firstError.error
                ? `Dashboard data could not load: ${firstError.error}`
                : "Dashboard data could not load. Check the PHP server and database connection.";
            message.className = "message-box bad-message";
        }
    }
};

const printLowStockTable = async () => {
    const output = document.querySelector("#lowStockTable");

    if (!output) {
        return;
    }

    const sql = `
        SELECT
            fb.foodbank_name,
            fi.item_name,
            fi.category,
            s.quantity_in_stock,
            s.last_updated
        FROM Stock s
        INNER JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
        INNER JOIN FoodItem fi ON s.item_id = fi.item_id
        WHERE s.quantity_in_stock <= 75
        ORDER BY s.quantity_in_stock ASC, fi.item_name ASC
        LIMIT 8;
    `;

    const result = await runQuery(sql);

    if (!result || result.success !== true || result.data.length === 0) {
        output.textContent = "No low stock rows returned.";
        return;
    }

    const rows = result.data;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headings = ["Food Bank", "Item", "Category", "Quantity", "Last Updated"];

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
        tr.className = "low-row";

        const tdFoodBank = document.createElement("td");
        const tdItem = document.createElement("td");
        const tdCategory = document.createElement("td");
        const tdQuantity = document.createElement("td");
        const tdUpdated = document.createElement("td");

        tdFoodBank.textContent = row.foodbank_name;
        tdItem.textContent = row.item_name;
        tdCategory.textContent = row.category;
        tdQuantity.textContent = row.quantity_in_stock;
        tdUpdated.textContent = formatDate(row.last_updated);

        tr.appendChild(tdFoodBank);
        tr.appendChild(tdItem);
        tr.appendChild(tdCategory);
        tr.appendChild(tdQuantity);
        tr.appendChild(tdUpdated);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    output.textContent = "";
    output.appendChild(table);
};

const printDistributionSummaryTable = async () => {
    const output = document.querySelector("#householdSummaryTable");

    if (!output) {
        return;
    }

    const sql = `
        SELECT
            fb.foodbank_name,
            COUNT(d.distribution_id) AS distribution_total,
            MAX(d.distribution_date) AS most_recent_distribution
        FROM FoodBank fb
        LEFT JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
        GROUP BY fb.foodbank_id, fb.foodbank_name
        ORDER BY distribution_total DESC, fb.foodbank_name ASC;
    `;

    const result = await runQuery(sql);

    if (!result || result.success !== true || result.data.length === 0) {
        output.textContent = "No distribution summary returned.";
        return;
    }

    const rows = result.data;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headings = ["Food Bank", "Distributions", "Most Recent"];

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

        const tdFoodBank = document.createElement("td");
        const tdTotal = document.createElement("td");
        const tdRecent = document.createElement("td");

        tdFoodBank.textContent = row.foodbank_name;
        tdTotal.textContent = row.distribution_total;
        tdRecent.textContent = formatDate(row.most_recent_distribution);

        tr.appendChild(tdFoodBank);
        tr.appendChild(tdTotal);
        tr.appendChild(tdRecent);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    output.textContent = "";
    output.appendChild(table);
};

document.addEventListener("DOMContentLoaded", () => {
    loadDashboardCounts();
    printLowStockTable();
    printDistributionSummaryTable();
});
