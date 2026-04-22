var stockFilterChart = null;

function formatDate(value) {
    if (!value) {
        return "Not set";
    }
    return new Date(value).toLocaleDateString("en-GB");
}

function drawStockFilterChart(rows) {
    var canvas = document.querySelector("#stockFilterChart");
    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    var names = [];
    var totals = [];

    for (var i = 0; i < rows.length; i++) {
        var found = -1;

        for (var j = 0; j < names.length; j++) {
            if (names[j] === rows[i].category) {
                found = j;
            }
        }

        if (found === -1) {
            names.push(rows[i].category);
            totals.push(Number(rows[i].quantity_in_stock));
        } else {
            totals[found] = totals[found] + Number(rows[i].quantity_in_stock);
        }
    }

    if (stockFilterChart) {
        stockFilterChart.destroy();
    }

    stockFilterChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: names,
            datasets: [{
                label: "Quantity In Stock",
                data: totals,
                backgroundColor: "#2e5d50"
            }]
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
}

async function loadFoodBanks() {
    var select = document.querySelector("#foodBankFilter");
    var result = await runQuery("SELECT foodbank_id, foodbank_name FROM FoodBank ORDER BY foodbank_name;");

    if (!result || result.success !== true) {
        return;
    }

    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].foodbank_id;
        option.textContent = result.data[i].foodbank_name;
        select.appendChild(option);
    }
}

async function loadCategories() {
    var select = document.querySelector("#categoryFilter");
    var result = await runQuery("SELECT DISTINCT category FROM FoodItem ORDER BY category;");

    if (!result || result.success !== true) {
        return;
    }

    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].category;
        option.textContent = result.data[i].category;
        select.appendChild(option);
    }
}

async function loadStockItems() {
    var select = document.querySelector("#stockSearch");
    var result = await runQuery("SELECT item_name FROM FoodItem ORDER BY item_name;");

    if (!result || result.success !== true) {
        return;
    }

    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].item_name;
        option.textContent = result.data[i].item_name;
        select.appendChild(option);
    }
}

async function printTable() {
    var output = document.querySelector("#stockOutput");
    output.textContent = "Loading stock data...";

    var foodBankId = document.querySelector("#foodBankFilter").value;
    var category = document.querySelector("#categoryFilter").value;
    var stockSearch = document.querySelector("#stockSearch").value;
    var maxRows = document.querySelector("#maxRows").value;

    var sql = "SELECT s.stock_id, fb.foodbank_name, fi.item_name, fi.category, fi.unit_type, s.quantity_in_stock, s.last_updated FROM Stock s JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id JOIN FoodItem fi ON s.item_id = fi.item_id WHERE 1 = 1";

    if (foodBankId !== "") {
        sql += " AND s.foodbank_id = " + Number(foodBankId);
    }

    if (category !== "") {
        sql += " AND fi.category = '" + category.replace(/'/g, "''") + "'";
    }

    if (stockSearch !== "") {
        sql += " AND fi.item_name = '" + stockSearch.replace(/'/g, "''") + "'";
    }

    sql += " ORDER BY s.quantity_in_stock ASC, fi.item_name ASC LIMIT " + Number(maxRows) + ";";

    var result = await runQuery(sql);

    if (!result || result.success !== true || !result.data || result.data.length === 0) {
        output.textContent = "No rows returned.";
        document.querySelector("#visibleStockRows").textContent = "0";
        document.querySelector("#visibleLowStockRows").textContent = "0";
        document.querySelector("#visibleStockQuantity").textContent = "0";
        drawStockFilterChart([]);
        return;
    }

    var rows = result.data;
    var lowStockCount = 0;
    var totalQuantity = 0;

    for (var i = 0; i < rows.length; i++) {
        totalQuantity = totalQuantity + Number(rows[i].quantity_in_stock);
        if (Number(rows[i].quantity_in_stock) <= 75) {
            lowStockCount++;
        }
    }

    document.querySelector("#visibleStockRows").textContent = rows.length;
    document.querySelector("#visibleLowStockRows").textContent = lowStockCount;
    document.querySelector("#visibleStockQuantity").textContent = totalQuantity;
    drawStockFilterChart(rows);

    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var headings = ["Stock ID", "Food Bank", "Item", "Category", "Unit", "Quantity", "Last Updated"];

    for (var h = 0; h < headings.length; h++) {
        var th = document.createElement("th");
        th.textContent = headings[h];
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");

    for (var r = 0; r < rows.length; r++) {
        var tr = document.createElement("tr");
        if (Number(rows[r].quantity_in_stock) <= 75) {
            tr.className = "low-row";
        }

        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        var td5 = document.createElement("td");
        var td6 = document.createElement("td");
        var td7 = document.createElement("td");

        td1.textContent = rows[r].stock_id;
        td2.textContent = rows[r].foodbank_name;
        td3.textContent = rows[r].item_name;
        td4.textContent = rows[r].category;
        td5.textContent = rows[r].unit_type;
        td6.textContent = rows[r].quantity_in_stock;
        td7.textContent = formatDate(rows[r].last_updated);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tr.appendChild(td5);
        tr.appendChild(td6);
        tr.appendChild(td7);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    output.innerHTML = "";
    output.appendChild(table);
}

document.querySelector("#stockFilterForm").addEventListener("submit", function (event) {
    event.preventDefault();
    printTable();
});

document.querySelector("#clearStockFiltersBtn").addEventListener("click", function () {
    document.querySelector("#stockFilterForm").reset();
    printTable();
});

document.addEventListener("DOMContentLoaded", async function () {
    await loadFoodBanks();
    await loadCategories();
    await loadStockItems();
    printTable();
});
