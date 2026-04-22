var stockChart = null;
var activeReportIndex = 0;

// this changes dates into normal uk style dates
function formatDate(value) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
}

// this is the big list of all reports on the page
// each one has the button name, headings, chart info and sql query
var reports = [
    {
        tab: "Low stock",
        title: "Report Title: Food Banks with Low Stock",
        tableTitle: "Food banks with the least stock",
        problem: "Problem: finding food banks that may run out of stock soon.",
        chartLabel: "Total Stock",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "total_stock",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Total Stock", field: "total_stock" }
        ],
        sql: `
            SELECT 
                foodbank_name,
                total_stock
            FROM vw_foodbank_total_stock
            WHERE total_stock IS NOT NULL
            ORDER BY total_stock ASC
            LIMIT 10;
        `
    },
        {
        tab: "Stock variety",
        title: "Report Title: Food Banks with Widest Stock Variety",
        tableTitle: "Food banks with the most item types",
        problem: "Problem: seeing which food banks have the widest range of items.",
        chartLabel: "Item Types",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "item_types",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Item Types", field: "item_types" },
            { heading: "Total Stock", field: "total_stock" }
        ],
        sql: `
            SELECT 
                fb.foodbank_name,
                COUNT(DISTINCT s.item_id) AS item_types,
                SUM(s.quantity_in_stock) AS total_stock
            FROM FoodBank fb
            LEFT JOIN Stock s ON fb.foodbank_id = s.foodbank_id
            GROUP BY fb.foodbank_id, fb.foodbank_name
            HAVING item_types > 0
            ORDER BY item_types DESC, total_stock DESC
            LIMIT 10;
        `
    },
    {
        tab: "Top donors",
        title: "Report Title: Donors Giving the Most",
        tableTitle: "Top donors by quantity",
        problem: "Problem: identifying donors who give the most support.",
        chartLabel: "Items Donated",
        chartType: "bar",
        labelField: "donor_name",
        valueField: "total_donated",
        columns: [
            { heading: "Donor", field: "donor_name" },
            { heading: "Items Donated", field: "total_donated" }
        ],
        sql: `
            SELECT 
                d.donor_name,
                SUM(di.quantity) AS total_donated
            FROM Donation d
            INNER JOIN DonationItem di ON d.donation_id = di.donation_id
            GROUP BY d.donor_name
            ORDER BY total_donated DESC
            LIMIT 10;
        `
    },
    {
        tab: "Active donors",
        title: "Report Title: Most Active Donors",
        tableTitle: "Donors by number of donations",
        problem: "Problem: finding donors who donate often.",
        chartLabel: "Donation Count",
        chartType: "bar",
        labelField: "donor_name",
        valueField: "donation_count",
        columns: [
            { heading: "Donor", field: "donor_name" },
            { heading: "Donation Count", field: "donation_count" }
        ],
        sql: `
            SELECT 
                donor_name,
                donation_count
            FROM vw_donor_activity
            ORDER BY donation_count DESC
            LIMIT 10;
        `
    },
    {
        tab: "Busy banks",
        title: "Report Title: Food Banks Serving Most Households",
        tableTitle: "Food banks with highest household reach",
        problem: "Problem: seeing which food banks are helping the most households.",
        chartLabel: "Households Served",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "households_served",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Households Served", field: "households_served" }
        ],
        sql: `
            SELECT 
                fb.foodbank_name,
                COUNT(DISTINCT d.household_id) AS households_served
            FROM FoodBank fb
            LEFT JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
            GROUP BY fb.foodbank_id, fb.foodbank_name
            ORDER BY households_served DESC
            LIMIT 10;
        `
    },
    {
        tab: "Big homes",
        title: "Report Title: Largest Households",
        tableTitle: "Households with the most people",
        problem: "Problem: finding larger households that may need more support.",
        chartLabel: "Household Size",
        chartType: "bar",
        labelField: "household_id",
        valueField: "household_size",
        columns: [
            { heading: "Household ID", field: "household_id" },
            { heading: "Household Size", field: "household_size" }
        ],
        sql: `
            SELECT 
                h.household_id,
                h.household_size
            FROM Household h
            LEFT JOIN Distribution d ON h.household_id = d.household_id
            GROUP BY h.household_id, h.household_size
            ORDER BY h.household_size DESC
            LIMIT 10;
        `
    },
    {
        tab: "Top items",
        title: "Report Title: Most Given Out Items",
        tableTitle: "Items distributed the most",
        problem: "Problem: finding which food items are in highest demand.",
        chartLabel: "Total Given",
        chartType: "bar",
        labelField: "item_name",
        valueField: "total_given",
        columns: [
            { heading: "Item", field: "item_name" },
            { heading: "Total Given", field: "total_given" }
        ],
        sql: `
            SELECT 
                item_name,
                total_given
            FROM vw_item_distribution_totals
            ORDER BY total_given DESC
            LIMIT 10;
        `
    },
    {
        tab: "Low items",
        title: "Report Title: Least Distributed Items",
        tableTitle: "Items given out the least",
        problem: "Problem: spotting items that are rarely used.",
        chartLabel: "Total Given",
        chartType: "bar",
        labelField: "item_name",
        valueField: "total_given",
        columns: [
            { heading: "Item", field: "item_name" },
            { heading: "Total Given", field: "total_given" }
        ],
        sql: `
            SELECT 
                fi.item_name,
                SUM(di.quantity_given) AS total_given
            FROM FoodItem fi
            INNER JOIN DistributionItem di ON fi.item_id = di.item_id
            GROUP BY fi.item_id, fi.item_name
            ORDER BY total_given ASC
            LIMIT 10;
        `
    },
    {
        tab: "Popular type",
        title: "Report Title: Most Distributed Categories",
        tableTitle: "Item categories used the most",
        problem: "Problem: understanding which categories are most needed.",
        chartLabel: "Total Given",
        chartType: "bar",
        labelField: "category",
        valueField: "total_given",
        columns: [
            { heading: "Category", field: "category" },
            { heading: "Total Given", field: "total_given" }
        ],
        sql: `
            SELECT 
                fi.category,
                SUM(di.quantity_given) AS total_given
            FROM FoodItem fi
            INNER JOIN DistributionItem di ON fi.item_id = di.item_id
            GROUP BY fi.category
            ORDER BY total_given DESC
            LIMIT 10;
        `
    },
    {
        tab: "Stock by item",
        title: "Report Title: Items with Highest Stock",
        tableTitle: "Items currently most in stock",
        problem: "Problem: seeing which items are heavily stocked.",
        chartLabel: "Stock",
        chartType: "bar",
        labelField: "item_name",
        valueField: "stock_total",
        columns: [
            { heading: "Item", field: "item_name" },
            { heading: "Stock", field: "stock_total" }
        ],
        sql: `
            SELECT 
                item_name,
                stock_total
            FROM vw_item_stock_totals
            WHERE stock_total IS NOT NULL
            ORDER BY stock_total DESC
            LIMIT 10;
        `
    },
    {
        tab: "Recent help",
        title: "Report Title: Households Helped Most Often",
        tableTitle: "Households with the most distributions",
        problem: "Problem: identifying households receiving support most often.",
        chartLabel: "Distribution Count",
        chartType: "bar",
        labelField: "household_id",
        valueField: "times_helped",
        columns: [
            { heading: "Household ID", field: "household_id" },
            { heading: "Distribution Count", field: "times_helped" }
        ],
        sql: `
            SELECT 
                h.household_id,
                COUNT(d.distribution_id) AS times_helped
            FROM Household h
            LEFT JOIN Distribution d ON h.household_id = d.household_id
            GROUP BY h.household_id
            ORDER BY times_helped DESC
            LIMIT 10;
        `
    },
    {
        tab: "Avg parcel",
        title: "Report Title: Average Items Per Distribution",
        tableTitle: "Average items given out by food bank",
        problem: "Problem: comparing how much each food bank gives per visit.",
        chartLabel: "Average Items",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "avg_items",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Average Items", field: "avg_items" }
        ],
        sql: `
            SELECT 
                fb.foodbank_name,
                ROUND(AVG(di.quantity_given), 2) AS avg_items
            FROM FoodBank fb
            INNER JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
            INNER JOIN DistributionItem di ON d.distribution_id = di.distribution_id
            GROUP BY fb.foodbank_id, fb.foodbank_name
            ORDER BY avg_items DESC
            LIMIT 10;
        `
    }
];

// these are the colours for the chart bars or pie slices
var chartColors = [
    "#2ea66f",
    "#3e84d8",
    "#ef9732",
    "#815ac8",
    "#d96b6b",
    "#2e5d50",
    "#7b8794",
    "#b08d2d",
    "#4f9a94"
];

// this gets one value out of one row for the table
// if the value is empty it just says not set
// if the column is a date it formats it first
function formatCellValue(row, column) {
    var value = row[column.field];

    if (column.type == "date") {
        return formatDate(value);
    }

    if (value === null || value === undefined || value === "") {
        return "Not set";
    }

    return value;
}

// this makes the chart on the page
// it gets the labels and values from the sql result rows
function drawChart(report, rows) {
    var canvas = document.querySelector("#stockChart");
    var labels = [];
    var values = [];

    for (var i = 0; i < rows.length; i++) {
        labels.push(rows[i][report.labelField]);
        values.push(Number(rows[i][report.valueField]));
    }

    // if there is already a chart there, remove it first
    if (stockChart) {
        stockChart.destroy();
    }

    stockChart = new Chart(canvas, {
        type: report.chartType,
        data: {
            labels: labels,
            datasets: [
                {
                    label: report.chartLabel,
                    data: values,
                    backgroundColor: report.chartType == "pie" ? chartColors : "#2e5d50"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: report.chartType == "pie" ? {} : {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// this prints the report table under the chart
// it just builds the html as one string and puts it on the page
function printTable(report, rows) {
    var output = document.querySelector("#reportTableOutput");
    var html = "<table>";
    html += "<thead><tr>";

    for (var i = 0; i < report.columns.length; i++) {
        html += "<th>" + report.columns[i].heading + "</th>";
    }

    html += "</tr></thead>";
    html += "<tbody>";

    for (var r = 0; r < rows.length; r++) {
        html += "<tr>";

        for (var c = 0; c < report.columns.length; c++) {
            html += "<td>" + formatCellValue(rows[r], report.columns[c]) + "</td>";
        }

        html += "</tr>";
    }

    html += "</tbody></table>";
    output.innerHTML = html;
}

// this changes the text above the chart and table
// each report has its own title and problem text
function setReportText(report) {
    document.querySelector("#reportChartTitle").textContent = report.title;
    document.querySelector("#reportProblemText").textContent = report.problem;
    document.querySelector("#reportTableTitle").textContent = report.tableTitle;
}

// this highlights the selected report button
function setActiveTab() {
    var buttons = document.querySelectorAll(".report-tab");

    for (var i = 0; i < buttons.length; i++) {
        if (i == activeReportIndex) {
            buttons[i].classList.add("is-active");
        } else {
            buttons[i].classList.remove("is-active");
        }
    }
}

// this runs whichever report is selected right now
// it changes the text, runs the sql, then draws the chart and table
async function runActiveReport() {
    var report = reports[activeReportIndex];
    var output = document.querySelector("#reportTableOutput");
    var result;

    setReportText(report);
    output.textContent = "Loading report data...";

    result = await runQuery(report.sql);

    if (!result || !result.data || result.data.length == 0) {
        output.textContent = "No rows returned.";
        return;
    }

    drawChart(report, result.data);
    printTable(report, result.data);
}

// this makes all the report buttons at the top
// it loops through the reports array and makes one button for each report
function buildReportTabs() {
    var tabBox = document.querySelector("#reportTabs");

    for (var i = 0; i < reports.length; i++) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "report-tab";
        button.textContent = reports[i].tab;
        button.setAttribute("onclick", "openReport(" + i + ")");
        tabBox.appendChild(button);
    }

    setActiveTab();
}

// this runs when someone clicks one of the report buttons
function openReport(index) {
    activeReportIndex = index;
    setActiveTab();
    runActiveReport();
}

// this stops the form from refreshing the whole page
// instead it just reruns the current report on the same page
document.querySelector("#reportFilterForm").addEventListener("submit", function(event) {
    event.preventDefault();
    runActiveReport();
});

// when the page first loads, make the buttons and run the first report
// so the page is not empty when it opens
document.addEventListener("DOMContentLoaded", function() {
    buildReportTabs();
    runActiveReport();
});



