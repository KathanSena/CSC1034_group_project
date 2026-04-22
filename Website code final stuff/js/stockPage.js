var stockFilterChart = null;

// changes the date into normal uk format
function formatDate(value) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
}

// draws the chart using the stock rows
function drawStockFilterChart(rows) {
    var canvas = document.querySelector("#stockFilterChart");
    var names = [];
    var totals = [];

    for (var i = 0; i < rows.length; i++) {
        var found = -1;

        for (var j = 0; j < names.length; j++) {
            if (names[j] == rows[i].category) {
                found = j;
            }
        }

        if (found == -1) {
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
            datasets: [
                {
                    label: "Quantity In Stock",
                    data: totals,
                    backgroundColor: "#2e5d50"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// loads food banks into the dropdown
async function loadFoodBanks() {
    var select = document.querySelector("#foodBankFilter");
    var result = await runQuery("SELECT foodbank_id, foodbank_name FROM FoodBank ORDER BY foodbank_name;");

    if (!result || !result.data) {
        return;
    }

    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].foodbank_id;
        option.textContent = result.data[i].foodbank_name;
        select.appendChild(option);
    }
}

// loads categories into the dropdown
async function loadCategories() {
    var select = document.querySelector("#categoryFilter");
    var result = await runQuery("SELECT DISTINCT category FROM FoodItem ORDER BY category;");

    if (!result || !result.data) {
        return;
    }

    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].category;
        option.textContent = result.data[i].category;
        select.appendChild(option);
    }
}

// loads item names into the dropdown
async function loadStockItems() {
    var select = document.querySelector("#stockSearch");
    var result = await runQuery("SELECT item_name FROM FoodItem ORDER BY item_name;");

    if (!result || !result.data) {
        return;
    }

    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].item_name;
        option.textContent = result.data[i].item_name;
        select.appendChild(option);
    }
}

// main function to print stock table
async function printTable() {
    var output = document.querySelector("#stockOutput");
    var foodBankId = document.querySelector("#foodBankFilter").value;
    var category = document.querySelector("#categoryFilter").value;
    var stockSearch = document.querySelector("#stockSearch").value;
    var maxRows = document.querySelector("#maxRows").value;

    output.textContent = "Loading stock data...";

    var sql = "SELECT s.stock_id, fb.foodbank_name, fi.item_name, fi.category, fi.unit_type, s.quantity_in_stock, s.last_updated FROM Stock s JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id JOIN FoodItem fi ON s.item_id = fi.item_id WHERE 1=1";

    if (foodBankId != "") {
        sql += " AND s.foodbank_id = " + foodBankId;
    }

    if (category != "") {
        sql += " AND fi.category = '" + category + "'";
    }

    if (stockSearch != "") {
        sql += " AND fi.item_name = '" + stockSearch + "'";
    }

    sql += " ORDER BY s.quantity_in_stock ASC LIMIT " + maxRows + ";";

    var result = await runQuery(sql);

    if (!result || !result.data || result.data.length == 0) {
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
    var html = "<table>";
    html += "<thead>";
    html += "<tr>";
    html += "<th>Stock ID</th>";
    html += "<th>Food Bank</th>";
    html += "<th>Item</th>";
    html += "<th>Category</th>";
    html += "<th>Unit</th>";
    html += "<th>Quantity</th>";
    html += "<th>Last Updated</th>";
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";

    for (var i = 0; i < rows.length; i++) {
        totalQuantity = totalQuantity + Number(rows[i].quantity_in_stock);

        if (Number(rows[i].quantity_in_stock) <= 75) {
            lowStockCount++;
            html += "<tr class='low-row'>";
        } else {
            html += "<tr>";
        }

        html += "<td>" + rows[i].stock_id + "</td>";
        html += "<td>" + rows[i].foodbank_name + "</td>";
        html += "<td>" + rows[i].item_name + "</td>";
        html += "<td>" + rows[i].category + "</td>";
        html += "<td>" + rows[i].unit_type + "</td>";
        html += "<td>" + rows[i].quantity_in_stock + "</td>";
        html += "<td>" + formatDate(rows[i].last_updated) + "</td>";
        html += "</tr>";
    }

    html += "</tbody>";
    html += "</table>";

    document.querySelector("#visibleStockRows").textContent = rows.length;
    document.querySelector("#visibleLowStockRows").textContent = lowStockCount;
    document.querySelector("#visibleStockQuantity").textContent = totalQuantity;

    drawStockFilterChart(rows);

    output.innerHTML = html;
}

// stops form from reloading page
document.querySelector("#stockFilterForm").addEventListener("submit", function(event) {
    event.preventDefault();
    printTable();
});

// clears filters and reloads everything
document.querySelector("#clearStockFiltersBtn").addEventListener("click", function() {
    document.querySelector("#stockFilterForm").reset();
    printTable();
});

// load dropdowns and stock table when page opens
document.addEventListener("DOMContentLoaded", async function() {
    await loadFoodBanks();
    await loadCategories();
    await loadStockItems();
    printTable();
});

