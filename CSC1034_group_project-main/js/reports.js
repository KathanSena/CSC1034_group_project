let stockChart = null;
let activeReportIndex = 0;

// changes a date into normal uk format
function formatDate(value) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
}

const reports = [
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
        ], //kathan query 1
        sql: ` 
            SELECT fb.foodbank_name, SUM(s.quantity_in_stock) AS total_stock
            FROM Stock s
            JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
            GROUP BY fb.foodbank_name
            ORDER BY total_stock ASC
            LIMIT 10;
        `
    },
    {
        tab: "Top stock",
        title: "Report Title: Food Banks with Most Stock",
        tableTitle: "Food banks with the most stock",
        problem: "Problem: seeing which food banks are currently well supplied.",
        chartLabel: "Total Stock",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "total_stock",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Total Stock", field: "total_stock" }
        ], //kathan query 2
        sql: `
            SELECT fb.foodbank_name, SUM(s.quantity_in_stock) AS total_stock
            FROM Stock s
            JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
            GROUP BY fb.foodbank_name
            ORDER BY total_stock DESC
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
        ],//kathan query 3
        sql: `
            SELECT d.donor_name, SUM(di.quantity) AS total_donated
            FROM Donation d
            JOIN DonationItem di ON d.donation_id = di.donation_id
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
        ], // dan query 1 
        sql: `
            SELECT donor_name, COUNT(*) AS donation_count
            FROM Donation
            GROUP BY donor_name
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
        ], // dan query 2 
        sql: `
            SELECT fb.foodbank_name, COUNT(DISTINCT d.household_id) AS households_served
            FROM Distribution d
            JOIN FoodBank fb ON d.foodbank_id = fb.foodbank_id
            GROUP BY fb.foodbank_name
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
        ],// dan query 3  
        sql: `
            SELECT household_id, household_size
            FROM Household
            ORDER BY household_size DESC
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
        ], // dev query 1 
        sql: `
            SELECT fi.item_name, SUM(di.quantity_given) AS total_given
            FROM DistributionItem di
            JOIN FoodItem fi ON di.item_id = fi.item_id
            GROUP BY fi.item_name
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
        ], // dev query 2
        sql: `
            SELECT fi.item_name, SUM(di.quantity_given) AS total_given
            FROM DistributionItem di
            JOIN FoodItem fi ON di.item_id = fi.item_id
            GROUP BY fi.item_name
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
        ], // dev query 3
        sql: `
            SELECT fi.category, SUM(di.quantity_given) AS total_given
            FROM DistributionItem di
            JOIN FoodItem fi ON di.item_id = fi.item_id
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
        ], // james query 1
        sql: `
            SELECT fi.item_name, SUM(s.quantity_in_stock) AS stock_total
            FROM Stock s
            JOIN FoodItem fi ON s.item_id = fi.item_id
            GROUP BY fi.item_name
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
        ], // james query 2
        sql: `
            SELECT household_id, COUNT(*) AS times_helped
            FROM Distribution
            GROUP BY household_id
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
        ], // james query 3
        sql: `
            SELECT fb.foodbank_name, ROUND(AVG(di.quantity_given), 2) AS avg_items
            FROM Distribution d
            JOIN DistributionItem di ON d.distribution_id = di.distribution_id
            JOIN FoodBank fb ON d.foodbank_id = fb.foodbank_id
            GROUP BY fb.foodbank_name
            ORDER BY avg_items DESC
            LIMIT 10;
        `
    }
];

// colours for charts
const chartColors = [
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

// gets the value to print in the table
function formatCellValue(row, column) {
    var value = row[column.field];

    if (column.type === "date") {
        return formatDate(value);
    }

    if (value === null || value === undefined || value === "") {
        return "Not set";
    }

    return value;
}

// draws the chart
function drawChart(report, rows) {
    var canvas = document.querySelector("#stockChart");
    var labels = [];
    var values = [];

    for (var i = 0; i < rows.length; i++) {
        labels.push(rows[i][report.labelField]);
        values.push(Number(rows[i][report.valueField]));
    }

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
                    backgroundColor: report.chartType === "pie" ? chartColors : "#2e5d50"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: report.chartType === "pie" ? {} : {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// prints the table under the chart
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

// changes the text above the chart and table
function setReportText(report) {
    document.querySelector("#reportChartTitle").textContent = report.title;
    document.querySelector("#reportProblemText").textContent = report.problem;
    document.querySelector("#reportTableTitle").textContent = report.tableTitle;
}

// highlights the selected tab
function setActiveTab() {
    var buttons = document.querySelectorAll(".report-tab");

    for (var i = 0; i < buttons.length; i++) {
        if (i === activeReportIndex) {
            buttons[i].classList.add("is-active");
        } else {
            buttons[i].classList.remove("is-active");
        }
    }
}

// runs the current report
async function runActiveReport() {
    var report = reports[activeReportIndex];
    var output = document.querySelector("#reportTableOutput");
    var result;

    setReportText(report);
    output.textContent = "Loading report data...";

    result = await runQuery(report.sql);

    if (!result || !result.data || result.data.length === 0) {
        output.textContent = "No rows returned.";
        return;
    }

    drawChart(report, result.data);
    printTable(report, result.data);
}

// makes the report buttons
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

// this runs when a tab is clicked
function openReport(index) {
    activeReportIndex = index;
    setActiveTab();
    runActiveReport();
}

// stops the form from reloading the page
document.querySelector("#reportFilterForm").addEventListener("submit", function(event) {
    event.preventDefault();
    runActiveReport();
});

// load tabs and first report when page opens
document.addEventListener("DOMContentLoaded", function() {
    buildReportTabs();
    runActiveReport();
});
