let stockChart = null;
let activeReportIndex = 0;

const formatDate = (value) => {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
};

const reports = [
    {
        tab: "Stock priority",
        title: "Report Title: Low Stock Food Banks (Stock Priority)",
        tableTitle: "Food banks with the lowest stock",
        problem: "Problem: understocked food banks need to be prioritised for redistribution before shortages happen.",
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
                fb.foodbank_name,
                SUM(s.quantity_in_stock) AS total_stock
            FROM Stock s
            LEFT JOIN FoodBank fb ON s.foodbank_id = fb.foodbank_id
            GROUP BY fb.foodbank_name
            HAVING total_stock > 0
            ORDER BY total_stock ASC
            LIMIT 10;
        `
    },
    {
        tab: "Top donors",
        title: "Report Title: Top Donors by Contribution",
        tableTitle: "Donors contributing the most items",
        problem: "Problem: the organisation needs to identify key donors and maintain strong donor relationships.",
        chartLabel: "Total Donated",
        chartType: "bar",
        labelField: "donor_name",
        valueField: "total_donated",
        columns: [
            { heading: "Donor", field: "donor_name" },
            { heading: "Total Donated", field: "total_donated" }
        ],
        sql: `
            SELECT
                d.donor_name,
                SUM(di.quantity) AS total_donated
            FROM Donation d
            INNER JOIN DonationItem di ON d.donation_id = di.donation_id
            GROUP BY d.donor_name
            HAVING total_donated > 0
            ORDER BY total_donated DESC
            LIMIT 10;
        `
    },
    {
        tab: "Avg household",
        title: "Report Title: Average Household Size per Food Bank",
        tableTitle: "Average household size served",
        problem: "Problem: food parcel sizes should match the household sizes each food bank supports.",
        chartLabel: "Average Household Size",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "avg_household_size",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Average Household Size", field: "avg_household_size" }
        ],
        sql: `
            SELECT
                fb.foodbank_name,
                ROUND(AVG(h.household_size), 2) AS avg_household_size
            FROM FoodBank fb
            INNER JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
            INNER JOIN Household h ON d.household_id = h.household_id
            GROUP BY fb.foodbank_name
            HAVING avg_household_size > 0
            ORDER BY avg_household_size DESC
            LIMIT 10;
        `
    },
    {
        tab: "Stock balance",
        title: "Report Title: Donations vs Distribution",
        tableTitle: "Donation and distribution balance",
        problem: "Problem: food banks need to know whether they receive enough donations compared with what they give out.",
        chartLabel: "Net Balance",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "net_balance",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Total Donated", field: "total_donated" },
            { heading: "Total Distributed", field: "total_distributed" },
            { heading: "Net Balance", field: "net_balance" }
        ],
        sql: `
            SELECT
    fb.foodbank_name,
    d_total.total_donated AS total_donated,
    dist_total.total_distributed AS total_distributed,
    d_total.total_donated - dist_total.total_distributed AS net_balance
FROM FoodBank fb
LEFT JOIN (
    SELECT
        d.foodbank_id,
        SUM(di.quantity) AS total_donated
    FROM Donation d
    INNER JOIN DonationItem di ON d.donation_id = di.donation_id
    GROUP BY d.foodbank_id
) d_total ON fb.foodbank_id = d_total.foodbank_id
LEFT JOIN (
    SELECT
        dist.foodbank_id,
        SUM(di.quantity_given) AS total_distributed
    FROM Distribution dist
    INNER JOIN DistributionItem di ON dist.distribution_id = di.distribution_id
    GROUP BY dist.foodbank_id
) dist_total ON fb.foodbank_id = dist_total.foodbank_id
ORDER BY net_balance ASC
LIMIT 10;

        `
    },
    {
        tab: "Waste risk",
        title: "Report Title: Food Waste Risk",
        tableTitle: "Short shelf-life items with stock",
        problem: "Problem: items with short shelf life and stock available may be wasted if they are not distributed quickly.",
        chartLabel: "Quantity In Stock",
        chartType: "bar",
        labelField: "item_name",
        valueField: "quantity_in_stock",
        columns: [
            { heading: "Item", field: "item_name" },
            { heading: "Shelf Life Days", field: "shelf_life_days" },
            { heading: "Quantity In Stock", field: "quantity_in_stock" }
        ],
        sql: `
            SELECT
                fi.item_name,
                fi.shelf_life_days,
                s.quantity_in_stock
            FROM Stock s
            INNER JOIN FoodItem fi ON s.item_id = fi.item_id
            WHERE fi.shelf_life_days IS NOT NULL
            AND s.quantity_in_stock > 0
            ORDER BY fi.shelf_life_days ASC, s.quantity_in_stock DESC
            LIMIT 10;
        `
    },
    {
        tab: "Top items",
        title: "Report Title: Most Distributed Items",
        tableTitle: "Food items used most often",
        problem: "Problem: high-demand items need stronger stock planning to prevent frequent shortages.",
        chartLabel: "Total Distributed",
        chartType: "bar",
        labelField: "item_name",
        valueField: "total_distributed",
        columns: [
            { heading: "Item", field: "item_name" },
            { heading: "Category", field: "category" },
            { heading: "Total Distributed", field: "total_distributed" },
            { heading: "Times Distributed", field: "times_distributed" }
        ],
        sql: `
            SELECT
                fi.item_name,
                fi.category,
                SUM(di.quantity_given) AS total_distributed,
                COUNT(DISTINCT d.distribution_id) AS times_distributed
            FROM FoodItem fi
            LEFT JOIN DistributionItem di ON fi.item_id = di.item_id
            LEFT JOIN Distribution d ON di.distribution_id = d.distribution_id
            GROUP BY fi.item_id, fi.item_name, fi.category
            HAVING total_distributed IS NOT NULL
            ORDER BY total_distributed DESC
            LIMIT 10;
        `
    },
    {
        tab: "Household fairness",
        title: "Report Title: Distribution per Household",
        tableTitle: "Items received per person",
        problem: "Problem: the organisation needs to check whether resources are being distributed fairly across households.",
        chartLabel: "Items Per Person",
        chartType: "bar",
        labelField: "household_id",
        valueField: "items_per_person",
        columns: [
            { heading: "Household ID", field: "household_id" },
            { heading: "Household Size", field: "household_size" },
            { heading: "Total Visits", field: "total_visits" },
            { heading: "Total Items Received", field: "total_items_received" },
            { heading: "Items Per Person", field: "items_per_person" }
        ],
        sql: `
            SELECT
                h.household_id,
                h.household_size,
                COUNT(DISTINCT d.distribution_id) AS total_visits,
                SUM(di.quantity_given) AS total_items_received,
                ROUND(SUM(di.quantity_given) / NULLIF(h.household_size, 0), 2) AS items_per_person
            FROM Household h
            INNER JOIN Distribution d ON h.household_id = d.household_id
            LEFT JOIN DistributionItem di ON d.distribution_id = di.distribution_id
            GROUP BY h.household_id, h.household_size
            HAVING total_items_received IS NOT NULL
            ORDER BY items_per_person DESC
            LIMIT 10;
        `
    },
    {
        tab: "Avg visit",
        title: "Report Title: Average Items per Visit",
        tableTitle: "Average items given per distribution",
        problem: "Problem: food banks need to check whether parcel sizes are consistent across centres.",
        chartLabel: "Average Items per Visit",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "avg_items_per_visit",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Total Visits", field: "total_visits" },
            { heading: "Total Items Distributed", field: "total_items_distributed" },
            { heading: "Average Items per Visit", field: "avg_items_per_visit" }
        ],
        sql: `
            SELECT
                fb.foodbank_name,
                COUNT(DISTINCT d.distribution_id) AS total_visits,
                SUM(di.quantity_given) AS total_items_distributed,
                ROUND(SUM(di.quantity_given) / NULLIF(COUNT(DISTINCT d.distribution_id), 0), 2) AS avg_items_per_visit
            FROM FoodBank fb
            INNER JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
            LEFT JOIN DistributionItem di ON d.distribution_id = di.distribution_id
            GROUP BY fb.foodbank_id, fb.foodbank_name
            HAVING total_visits > 0
            ORDER BY avg_items_per_visit DESC
            LIMIT 10;
        `
    },
    {
        tab: "Donation variety",
        title: "Report Title: Donation Diversity",
        tableTitle: "Variety of donated items by food bank",
        problem: "Problem: food banks need a varied supply, not just a high quantity of the same items.",
        chartLabel: "Unique Items Received",
        chartType: "bar",
        labelField: "foodbank_name",
        valueField: "unique_items_received",
        columns: [
            { heading: "Food Bank", field: "foodbank_name" },
            { heading: "Unique Items Received", field: "unique_items_received" },
            { heading: "Total Items Received", field: "total_items_received" }
        ],
        sql: `
            SELECT
                fb.foodbank_name,
                COUNT(DISTINCT di.item_id) AS unique_items_received,
                SUM(di.quantity) AS total_items_received
            FROM FoodBank fb
            LEFT JOIN Donation d ON fb.foodbank_id = d.foodbank_id
            LEFT JOIN DonationItem di ON d.donation_id = di.donation_id
            GROUP BY fb.foodbank_id, fb.foodbank_name
            HAVING total_items_received IS NOT NULL
            ORDER BY unique_items_received DESC
            LIMIT 10;
        `
    }
];

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

const formatCellValue = (row, column) => {
    const value = row[column.field];

    if (column.type === "date") {
        return formatDate(value);
    }

    return value === null || value === undefined || value === "" ? "Not set" : value;
};

const drawChart = (report, rows) => {
    const canvas = document.querySelector("#stockChart");

    if (!canvas || typeof Chart === "undefined") {
        return;
    }

    const labels = [];
    const values = [];

    for (let row of rows) {
        labels.push(row[report.labelField]);
        values.push(Number(row[report.valueField]));
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
};

const printTable = (report, rows) => {
    const output = document.querySelector("#reportTableOutput");
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    for (let column of report.columns) {
        const th = document.createElement("th");
        th.textContent = column.heading;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (let row of rows) {
        const tr = document.createElement("tr");

        for (let column of report.columns) {
            const td = document.createElement("td");
            td.textContent = formatCellValue(row, column);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    output.textContent = "";
    output.appendChild(table);
};

const setReportText = (report) => {
    document.querySelector("#reportChartTitle").textContent = report.title;
    document.querySelector("#reportProblemText").textContent = report.problem;
    document.querySelector("#reportTableTitle").textContent = report.tableTitle;
};

const setActiveTab = () => {
    const buttons = document.querySelectorAll(".report-tab");

    buttons.forEach((button, index) => {
        button.classList.toggle("is-active", index === activeReportIndex);
    });
};

const runActiveReport = async () => {
    const report = reports[activeReportIndex];
    const output = document.querySelector("#reportTableOutput");

    setReportText(report);
    output.textContent = "Loading report data...";

    try {
        const result = await runQuery(report.sql);

        if (!result || result.success !== true) {
            output.textContent = result && result.error ? result.error : "Report query failed.";
            return;
        }

        if (!Array.isArray(result.data) || result.data.length === 0) {
            output.textContent = "No rows returned.";
            return;
        }

        drawChart(report, result.data);
        printTable(report, result.data);
    } catch (error) {
        output.textContent = `Report could not load: ${error.message}`;
    }
};

const buildReportTabs = () => {
    const tabBox = document.querySelector("#reportTabs");

    reports.forEach((report, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "report-tab";
        button.textContent = report.tab;

        button.addEventListener("click", () => {
            activeReportIndex = index;
            setActiveTab();
            runActiveReport();
        });

        tabBox.appendChild(button);
    });

    setActiveTab();
};

document.querySelector("#reportFilterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    runActiveReport();
});

document.addEventListener("DOMContentLoaded", () => {
    buildReportTabs();
    runActiveReport();
});
