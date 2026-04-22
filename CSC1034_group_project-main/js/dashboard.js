// this changes the date into normal uk format
function formatDate(value) {
    if (!value) {
        return "Not set";
    }

    return new Date(value).toLocaleDateString("en-GB");
}

// this loads the 4 main numbers on the dashboard
async function loadDashboardCounts() {
    var foodBankResult = await runQuery("SELECT COUNT(*) AS total FROM FoodBank;");
    var donationResult = await runQuery("SELECT COUNT(*) AS total FROM Donation;");
    var householdResult = await runQuery("SELECT COUNT(*) AS total FROM Household;");
    var lowStockResult = await runQuery("SELECT COUNT(*) AS total FROM Stock WHERE quantity_in_stock <= 75;");

    if (foodBankResult && foodBankResult.success) {
        document.querySelector("#foodBankCount").textContent = foodBankResult.data[0].total;
    } else {
        document.querySelector("#foodBankCount").textContent = "0";
    }

    if (donationResult && donationResult.success) {
        document.querySelector("#donationCount").textContent = donationResult.data[0].total;
    } else {
        document.querySelector("#donationCount").textContent = "0";
    }

    if (householdResult && householdResult.success) {
        document.querySelector("#householdCount").textContent = householdResult.data[0].total;
    } else {
        document.querySelector("#householdCount").textContent = "0";
    }

    if (lowStockResult && lowStockResult.success) {
        document.querySelector("#lowStockCount").textContent = lowStockResult.data[0].total;
    } else {
        document.querySelector("#lowStockCount").textContent = "0";
    }
}

// this prints a small low stock table on the dashboard
async function printLowStockTable() {
    var output = document.querySelector("#lowStockTable");

    if (!output) {
        return;
    }

    var sql = `
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
        ORDER BY s.quantity_in_stock ASC
        LIMIT 8;
    `;

    var result = await runQuery(sql);

    if (!result || !result.data || result.data.length === 0) {
        output.textContent = "No low stock rows returned.";
        return;
    }

    var html = "<table>";
    html += "<thead>";
    html += "<tr>";
    html += "<th>Food Bank</th>";
    html += "<th>Item</th>";
    html += "<th>Category</th>";
    html += "<th>Quantity</th>";
    html += "<th>Last Updated</th>";
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";

    for (var i = 0; i < result.data.length; i++) {
        var row = result.data[i];

        html += "<tr class='low-row'>";
        html += "<td>" + row.foodbank_name + "</td>";
        html += "<td>" + row.item_name + "</td>";
        html += "<td>" + row.category + "</td>";
        html += "<td>" + row.quantity_in_stock + "</td>";
        html += "<td>" + formatDate(row.last_updated) + "</td>";
        html += "</tr>";
    }

    html += "</tbody>";
    html += "</table>";

    output.innerHTML = html;
}

// this prints a quick table showing distributions by food bank
async function printDistributionSummaryTable() {
    var output = document.querySelector("#householdSummaryTable");

    if (!output) {
        return;
    }

    var sql = `
        SELECT
            fb.foodbank_name,
            COUNT(d.distribution_id) AS distribution_total,
            MAX(d.distribution_date) AS most_recent_distribution
        FROM FoodBank fb
        LEFT JOIN Distribution d ON fb.foodbank_id = d.foodbank_id
        GROUP BY fb.foodbank_id, fb.foodbank_name
        ORDER BY distribution_total DESC;
    `;

    var result = await runQuery(sql);

    if (!result || !result.data || result.data.length === 0) {
        output.textContent = "No distribution summary returned.";
        return;
    }

    var html = "<table>";
    html += "<thead>";
    html += "<tr>";
    html += "<th>Food Bank</th>";
    html += "<th>Distributions</th>";
    html += "<th>Most Recent</th>";
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";

    for (var i = 0; i < result.data.length; i++) {
        var row = result.data[i];

        html += "<tr>";
        html += "<td>" + row.foodbank_name + "</td>";
        html += "<td>" + row.distribution_total + "</td>";
        html += "<td>" + formatDate(row.most_recent_distribution) + "</td>";
        html += "</tr>";
    }

    html += "</tbody>";
    html += "</table>";

    output.innerHTML = html;
}

// run everything when the page loads
document.addEventListener("DOMContentLoaded", function () {
    loadDashboardCounts();
    printLowStockTable();
    printDistributionSummaryTable();
});
