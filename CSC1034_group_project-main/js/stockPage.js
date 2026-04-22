// this will hold the chart instance so we can destroy it later if needed
var stockFilterChart = null;

// function to format a date nicely
function formatDate(value) {
    // if no date is given, return a default message
    if (!value) {
        return "Not set";
    }
    // convert the date into uk format (dd/mm/yyyy)
    return new Date(value).toLocaleDateString("en-GB");
}

// function to draw the bar chart based on stock data
function drawStockFilterChart(rows) {
    // get the canvas element where the chart will be drawn
    var canvas = document.querySelector("#stockFilterChart");

    // if canvas doesn't exist or chart.js isn't loaded, stop here
    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    // arrays to store category names and their total quantities
    var names = [];
    var totals = [];

    // loop through all rows of data
    for (var i = 0; i < rows.length; i++) {
        // assume we haven't found this category yet
        var found = -1;

        // check if this category already exists in names array
        for (var j = 0; j < names.length; j++) {
            if (names[j] === rows[i].category) {
                found = j; // store index if found
            }
        }

        // if category is new, add it to names and totals
        if (found === -1) {
            names.push(rows[i].category);
            totals.push(Number(rows[i].quantity_in_stock));
        } else {
            // if category already exists, add quantity to existing total
            totals[found] = totals[found] + Number(rows[i].quantity_in_stock);
        }
    }

    // if a chart already exists, destroy it before creating a new one
    if (stockFilterChart) {
        stockFilterChart.destroy();
    }

    // create a new bar chart
    stockFilterChart = new Chart(canvas, {
        type: "bar", // chart type
        data: {
            labels: names, // x-axis labels (categories)
            datasets: [{
                label: "Quantity In Stock", // legend label
                data: totals, // y-axis values
                backgroundColor: "#2e5d50" // bar color
            }]
        },
        options: {
            responsive: true, // makes chart resize with screen
            maintainAspectRatio: false, // allows custom height/width
            scales: {
                y: {
                    beginAtZero: true // y-axis starts from 0
                }
            }
        }
    });
}

// load all food banks into dropdown
async function loadFoodBanks() {
    // get the select element
    var select = document.querySelector("#foodBankFilter");

    // run sql query to get food banks
    var result = await runQuery("SELECT foodbank_id, foodbank_name FROM FoodBank ORDER BY foodbank_name;");

    // if query failed, stop
    if (!result || result.success !== true) {
        return;
    }

    // loop through results and create option elements
    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].foodbank_id; // set value
        option.textContent = result.data[i].foodbank_name; // set visible text
        select.appendChild(option); // add to dropdown
    }
}

// load categories into dropdown
async function loadCategories() {
    var select = document.querySelector("#categoryFilter");

    // get unique categories from database
    var result = await runQuery("SELECT DISTINCT category FROM FoodItem ORDER BY category;");

    if (!result || result.success !== true) {
        return;
    }

    // add each category as an option
    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].category;
        option.textContent = result.data[i].category;
        select.appendChild(option);
    }
}

// load item names into dropdown
async function loadStockItems() {
    var select = document.querySelector("#stockSearch");

    // get all item names
    var result = await runQuery("SELECT item_name FROM FoodItem ORDER BY item_name;");

    if (!result || result.success !== true) {
        return;
    }

    // add each item name to dropdown
    for (var i = 0; i < result.data.length; i++) {
        var option = document.createElement("option");
        option.value = result.data[i].item_name;
        option.textContent = result.data[i].item_name;
        select.appendChild(option);
    }
}

// main function to load and display stock data
async function printTable() {
    // get output area
    var output = document.querySelector("#stockOutput");

    // show loading message
    output.textContent = "Loading stock data...";

    // get filter values from form
    var foodBankId = document.querySelector("#foodBankFilter").value;
    var category = document.querySelector("#categoryFilter").value;
    var stockSearch = document.querySelector("#stockSearch").value;
    var maxRows = document.querySelector("#maxRows").value;

    // base sql query
    var sql = "SELECT s.stock_id, fb.foodbank_name, fi.item_name, fi.category, fi.unit_type, s.quantity_in_stock, s.last_updated FROM Stock s JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id JOIN FoodItem fi ON s.item_id = fi.item_id WHERE 1 = 1";

    // apply filters if user selected anything

    // filter by food bank
    if (foodBankId !== "") {
        sql += " AND s.foodbank_id = " + Number(foodBankId);
    }

    // filter by category (escape quotes to avoid sql issues)
    if (category !== "") {
        sql += " AND fi.category = '" + category.replace(/'/g, "''") + "'";
    }

    // filter by item name
    if (stockSearch !== "") {
        sql += " AND fi.item_name = '" + stockSearch.replace(/'/g, "''") + "'";
    }

    // sort results and limit number of rows
    sql += " ORDER BY s.quantity_in_stock ASC, fi.item_name ASC LIMIT " + Number(maxRows) + ";";

    // run query
    var result = await runQuery(sql);

    // if no data returned, reset everything
    if (!result || result.success !== true || !result.data || result.data.length === 0) {
        output.textContent = "No rows returned.";
        document.querySelector("#visibleStockRows").textContent = "0";
        document.querySelector("#visibleLowStockRows").textContent = "0";
        document.querySelector("#visibleStockQuantity").textContent = "0";
        drawStockFilterChart([]);
        return;
    }

    var rows = result.data;

    // variables for stats
    var lowStockCount = 0;
    var totalQuantity = 0;

    // loop through rows to calculate stats
    for (var i = 0; i < rows.length; i++) {
        totalQuantity = totalQuantity + Number(rows[i].quantity_in_stock);

        // count low stock items (<= 75)
        if (Number(rows[i].quantity_in_stock) <= 75) {
            lowStockCount++;
        }
    }

    // update stats in ui
    document.querySelector("#visibleStockRows").textContent = rows.length;
    document.querySelector("#visibleLowStockRows").textContent = lowStockCount;
    document.querySelector("#visibleStockQuantity").textContent = totalQuantity;

    // update chart
    drawStockFilterChart(rows);

    // create table elements
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");

    // column headings
    var headings = ["Stock ID", "Food Bank", "Item", "Category", "Unit", "Quantity", "Last Updated"];

    // create header cells
    for (var h = 0; h < headings.length; h++) {
        var th = document.createElement("th");
        th.textContent = headings[h];
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");

    // create rows for each data entry
    for (var r = 0; r < rows.length; r++) {
        var tr = document.createElement("tr");

        // highlight low stock rows
        if (Number(rows[r].quantity_in_stock) <= 75) {
            tr.className = "low-row";
        }

        // create cells for each column
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        var td5 = document.createElement("td");
        var td6 = document.createElement("td");
        var td7 = document.createElement("td");

        // fill cells with data
        td1.textContent = rows[r].stock_id;
        td2.textContent = rows[r].foodbank_name;
        td3.textContent = rows[r].item_name;
        td4.textContent = rows[r].category;
        td5.textContent = rows[r].unit_type;
        td6.textContent = rows[r].quantity_in_stock;
        td7.textContent = formatDate(rows[r].last_updated);

        // add cells to row
        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tr.appendChild(td5);
        tr.appendChild(td6);
        tr.appendChild(td7);

        // add row to table body
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    // clear previous output and add new table
    output.innerHTML = "";
    output.appendChild(table);
}

// when form is submitted, prevent reload and run query
document.querySelector("#stockFilterForm").addEventListener("submit", function (event) {
    event.preventDefault();
    printTable();
});

// clear filters and reload data
document.querySelector("#clearStockFiltersBtn").addEventListener("click", function () {
    document.querySelector("#stockFilterForm").reset();
    printTable();
});

// when page loads, load dropdowns and initial data
document.addEventListener("DOMContentLoaded", async function () {
    await loadFoodBanks();
    await loadCategories();
    await loadStockItems();
    printTable();
});
