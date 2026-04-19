let stockChart = null;

const formatDate = (value) => {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
};

const loadFoodBanks = async () => {
    const select = document.querySelector("#reportFoodBankFilter");
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

const drawChart = (rows) => {
    const canvas = document.querySelector("#stockChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const labels = [];
    const values = [];

    for (let row of rows) {
        labels.push(row.category);
        values.push(Number(row.total_quantity));
    }

    if (stockChart) {
        stockChart.destroy();
    }

    stockChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Total Quantity",
                    data: values,
                    backgroundColor: "#2e5d50"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

const printReportTable = async () => {
    const output = document.querySelector("#reportTableOutput");
    output.textContent = "Loading report data...";

    const foodBankId = document.querySelector("#reportFoodBankFilter").value;
    const minimumQuantity = Number(document.querySelector("#minimumQuantity").value) || 20;
    const topLimit = Number(document.querySelector("#topLimit").value) || 6;

    let whereSql = "";

    if (foodBankId !== "") {
        whereSql = `WHERE s.foodbank_id = ${Number(foodBankId)}`;
    }

    const chartSql = `
        SELECT
            fi.category,
            SUM(s.quantity_in_stock) AS total_quantity
        FROM Stock s
        INNER JOIN FoodItem fi ON s.item_id = fi.item_id
        ${whereSql}
        GROUP BY fi.category
        ORDER BY total_quantity DESC
        LIMIT ${topLimit};
    `;

    const tableSql = `
        SELECT
            fb.foodbank_name,
            fi.item_name,
            fi.category,
            s.quantity_in_stock,
            s.last_updated
        FROM Stock s
        INNER JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
        INNER JOIN FoodItem fi ON s.item_id = fi.item_id
        ${whereSql === "" ? "WHERE" : `${whereSql} AND`}
        s.quantity_in_stock <= ${minimumQuantity}
        ORDER BY s.quantity_in_stock ASC, fi.item_name ASC;
    `;

    const chartResult = await runQuery(chartSql);
    const tableResult = await runQuery(tableSql);

    if (chartResult && chartResult.success) {
        drawChart(chartResult.data);
    }

    if (!tableResult || tableResult.success !== true || tableResult.data.length === 0) {
        output.textContent = "No rows returned.";
        return;
    }

    const rows = tableResult.data;
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
        tr.className = "row-warning";

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

document.querySelector("#reportFilterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    printReportTable();
});

document.addEventListener("DOMContentLoaded", async () => {
    await loadFoodBanks();
    printReportTable();
});
