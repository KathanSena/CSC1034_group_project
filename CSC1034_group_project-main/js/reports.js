// this will hold the chart object after chart.js makes it
// we keep it here so we can destroy the old chart before drawing a new one
let stockChart = null;

// this keeps track of which report tab is selected right now
// 0 means the first report in the reports array
let activeReportIndex = 0;

// this changes a database date into a normal uk date format like dd/mm/yyyy
// if there is no date at all then it just says "Not set"
const formatDate = (value) => {
    if (!value) return "Not set";
    return new Date(value).toLocaleDateString("en-GB");
};

// this is the full list of reports for the reports page
// every object here is one button/tab and one sql report
// each one stores:
// - the tab name
// - the big report title
// - the table title
// - the problem sentence
// - chart settings
// - table column settings
// - and the sql query that gets the data
const reports = [
    {
        // this is the small button text
        tab: "Low stock",

        // this is the heading above the chart
        title: "Report Title: Food Banks with Low Stock",

        // this is the heading above the table
        tableTitle: "Food banks with the least stock",

        // this is the short explanation of why the report matters
        problem: "Problem: finding food banks that may run out of stock soon.",

        // this is the chart legend label
        chartLabel: "Total Stock",

        // this tells chart.js what chart type to draw
        chartType: "bar",

        // this says which field from the sql result should be used as labels
        labelField: "foodbank_name",

        // this says which field from the sql result should be used as the number values
        valueField: "total_stock",

        // these are the table columns we want to print
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Total Stock", field: "total_stock" }
        ],

        // this is the actual sql query for this report
        sql: `
            SELECT fb.foodbank_name, SUM(s.quantity_in_stock) AS total_stock
            FROM Stock s
            JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id                            //kathan query 1
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
        ],
        sql: `
            SELECT fb.foodbank_name, SUM(s.quantity_in_stock) AS total_stock                          //kathan query 2
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
        ],
        sql: `
            SELECT d.donor_name, SUM(di.quantity) AS total_donated                           //kathan query 3
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
        ],
        sql: `
            SELECT donor_name, COUNT(*) AS donation_count                         // dan query 1
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
        ],
        sql: `
            SELECT fb.foodbank_name, COUNT(DISTINCT d.household_id) AS households_served     // dan query 2
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
        ],
        sql: `
            SELECT household_id, household_size                                             //dan  query 3
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
        ],
        sql: `
            SELECT fi.item_name, SUM(di.quantity_given) AS total_given                      //dev query 1
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
        ],
        sql: `
            SELECT fi.item_name, SUM(di.quantity_given) AS total_given                      //dev query 2
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
        ],
        sql: `
            SELECT fi.category, SUM(di.quantity_given) AS total_given                     //dev query 3
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
        ],
        sql: `
            SELECT fi.item_name, SUM(s.quantity_in_stock) AS stock_total                                               // james query 1
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
        ],
        sql: `
            SELECT household_id, COUNT(*) AS times_helped                                              // james query 2
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
        ],
        sql: `
            SELECT fb.foodbank_name, ROUND(AVG(di.quantity_given), 2) AS avg_items                                              // james query 3
            FROM Distribution d
            JOIN DistributionItem di ON d.distribution_id = di.distribution_id
            JOIN FoodBank fb ON d.foodbank_id = fb.foodbank_id
            GROUP BY fb.foodbank_name
            ORDER BY avg_items DESC
            LIMIT 10;
        `
    }
];

// these are just the colours used if we ever use a pie chart
// for bar charts we are mostly using one green colour instead
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

// this gets the value for one table cell
// if the column says it is a date, it formats the date first
// if the value is empty, null, or missing, it says "Not set"
const formatCellValue = (row, column) => {
    const value = row[column.field];

    if (column.type === "date") {
        return formatDate(value);
    }

    return value === null || value === undefined || value === "" ? "Not set" : value;
};

// this makes the chart on the page
// it takes the current report settings and the rows from the sql result
const drawChart = (report, rows) => {
    // this gets the canvas from the html where chart.js will draw
    const canvas = document.querySelector("#stockChart");

    // if the canvas is missing or chart.js did not load, stop here
    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    // labels are the x axis names
    // values are the number amounts
    const labels = [];
    const values = [];

    // go through every row from the database
    // pick out the label field and value field based on this report
    for (let row of rows) {
        labels.push(row[report.labelField]);
        values.push(Number(row[report.valueField]));
    }

    // if a chart already exists, remove it first
    // this stops new charts from drawing on top of old ones
    if (stockChart) {
        stockChart.destroy();
    }

    // now make a brand new chart
    stockChart = new Chart(canvas, {
        type: report.chartType,
        data: {
            labels: labels,
            datasets: [
                {
                    // this is the small label in the chart legend
                    label: report.chartLabel,

                    // these are the number values from the sql result
                    data: values,

                    // pie charts use lots of colours
                    // bar charts just use one colour
                    backgroundColor: report.chartType === "pie" ? chartColors : "#2e5d50"
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            // pie charts do not use normal y axis settings
            // bar charts do, and we want them to start at 0
            scales: report.chartType === "pie" ? {} : {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
};

// this prints the html table under the chart
// it uses the columns list from the report object
const printTable = (report, rows) => {
    const output = document.querySelector("#reportTableOutput");
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    // make the top header row of the table
    for (let column of report.columns) {
        const th = document.createElement("th");
        th.textContent = column.heading;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    // now make the main table rows using the sql result data
    for (let row of rows) {
        const tr = document.createElement("tr");

        for (let column of report.columns) {
            const td = document.createElement("td");

            // put the correct value in each cell
            td.textContent = formatCellValue(row, column);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    // clear out old content first
    output.textContent = "";

    // then add the new table
    output.appendChild(table);
};

// this updates the text above the chart and table
// every report has its own title and problem sentence
const setReportText = (report) => {
    document.querySelector("#reportChartTitle").textContent = report.title;
    document.querySelector("#reportProblemText").textContent = report.problem;
    document.querySelector("#reportTableTitle").textContent = report.tableTitle;
};

// this highlights the tab that is currently selected
// it loops through every tab button and checks if its index matches activeReportIndex
const setActiveTab = () => {
    const buttons = document.querySelectorAll(".report-tab");

    buttons.forEach((button, index) => {
        button.classList.toggle("is-active", index === activeReportIndex);
    });
};

// this is the main function that runs the current report
// it updates the headings, runs the sql, then makes the chart and table
const runActiveReport = async () => {
    const report = reports[activeReportIndex];
    const output = document.querySelector("#reportTableOutput");

    // update the text on the page for this report
    setReportText(report);

    // show loading while waiting for the database result
    output.textContent = "Loading report data...";

    try {
        // send the sql query to the database using runQuery from myJs.js
        const result = await runQuery(report.sql);

        // if something went wrong, show an error message
        if (!result || result.success !== true) {
            output.textContent = result && result.error ? result.error : "Report query failed.";
            return;
        }

        // if the query worked but returned no rows, say that clearly
        if (!Array.isArray(result.data) || result.data.length === 0) {
            output.textContent = "No rows returned.";
            return;
        }

        // if we got rows back, draw the chart and print the table
        drawChart(report, result.data);
        printTable(report, result.data);
    } catch (error) {
        // this catches fetch/js errors and shows them on screen
        output.textContent = `Report could not load: ${error.message}`;
    }
};

// this builds all the report buttons at the top of the page
// instead of writing 12 buttons in html, we make them here from the reports array
const buildReportTabs = () => {
    const tabBox = document.querySelector("#reportTabs");

    reports.forEach((report, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "report-tab";
        button.textContent = report.tab;

        // when a tab is clicked, change the active report,
        // update the green selected tab style,
        // and run that report
        button.addEventListener("click", () => {
            activeReportIndex = index;
            setActiveTab();
            runActiveReport();
        });

        tabBox.appendChild(button);
    });

    // make sure the first tab is marked active when the page starts
    setActiveTab();
};

// this stops the form from doing a full page reload
// and just runs the current report on the same page instead
document.querySelector("#reportFilterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    runActiveReport();
});

// wait until the html has loaded first
// then build the tabs and run the first report automatically
document.addEventListener("DOMContentLoaded", () => {
    buildReportTabs();
    runActiveReport();
});
