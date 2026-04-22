var editingHouseholdId = "";

// this shows a message above the table/form
function showMessage(message, cssClass) {
    document.querySelector("#householdMessage").textContent = message;
    document.querySelector("#householdMessage").className = "message-box " + cssClass;
}

// this clears the message box
function clearMessage() {
    document.querySelector("#householdMessage").textContent = "";
    document.querySelector("#householdMessage").className = "message-box";
}

// this resets the form back to normal add mode
function resetForm() {
    document.querySelector("#householdForm").reset();
    document.querySelector("#householdFormTitle").textContent = "Add a household";
    document.querySelector("#saveHouseholdBtn").textContent = "Save household";
    editingHouseholdId = "";
    clearMessage();
}

// simple form check
function validateForm() {
    var householdSize = document.querySelector("#householdSize").value;
    var postcode = document.querySelector("#postcode").value.trim();
    var referralSource = document.querySelector("#referralSource").value.trim();

    if (householdSize === "" || postcode === "" || referralSource === "") {
        return "Please complete all fields.";
    }

    if (householdSize < 1 || householdSize > 20) {
        return "Household size must be between 1 and 20.";
    }

    return "";
}

// this prints all households into the table area
async function printHouseholds() {
    var result = await runQuery("SELECT household_id, household_size, postcode, referral_source FROM Household ORDER BY household_id DESC;");
    var output = document.querySelector("#householdTable");

    if (!result || !result.data || result.data.length === 0) {
        output.textContent = "No households returned.";
        return;
    }

    var html = "<table>";
    html += "<thead>";
    html += "<tr>";
    html += "<th>Household ID</th>";
    html += "<th>Household Size</th>";
    html += "<th>Postcode</th>";
    html += "<th>Referral Source</th>";
    html += "<th>Actions</th>";
    html += "</tr>";
    html += "</thead>";
    html += "<tbody>";

    for (var i = 0; i < result.data.length; i++) {
        var row = result.data[i];

        html += "<tr>";
        html += "<td>" + row.household_id + "</td>";
        html += "<td>" + row.household_size + "</td>";
        html += "<td>" + row.postcode + "</td>";
        html += "<td>" + row.referral_source + "</td>";
        html += "<td>";
        html += "<button type='button' class='main-button grey-button small-button' onclick=\"startEdit('" + row.household_id + "','" + row.household_size + "','" + row.postcode + "','" + row.referral_source + "')\">Edit</button> ";
        html += "<button type='button' class='main-button red-button small-button' onclick='deleteHousehold(" + row.household_id + ")'>Delete</button>";
        html += "</td>";
        html += "</tr>";
    }

    html += "</tbody>";
    html += "</table>";

    output.innerHTML = html;
}

// this fills the form with one household so it can be edited
function startEdit(id, size, postcode, referral) {
    editingHouseholdId = id;
    document.querySelector("#householdFormTitle").textContent = "Edit household";
    document.querySelector("#saveHouseholdBtn").textContent = "Update household";
    document.querySelector("#householdSize").value = size;
    document.querySelector("#postcode").value = postcode;
    document.querySelector("#referralSource").value = referral;
    showMessage("Now editing household " + id, "good-message");
}

// this saves either a new household or an edited one
async function saveHousehold() {
    var check = validateForm();

    if (check !== "") {
        showMessage(check, "bad-message");
        return;
    }

    var householdSize = document.querySelector("#householdSize").value;
    var postcode = document.querySelector("#postcode").value.trim();
    var referralSource = document.querySelector("#referralSource").value.trim();
    var sql = "";

    if (editingHouseholdId === "") {
        sql = "INSERT INTO Household (household_size, postcode, referral_source) VALUES (" + householdSize + ", '" + postcode + "', '" + referralSource + "');";
    } else {
        sql = "UPDATE Household SET household_size = " + householdSize + ", postcode = '" + postcode + "', referral_source = '" + referralSource + "' WHERE household_id = " + editingHouseholdId + ";";
    }

    var result = await runQuery(sql);

    if (!result || result.success !== true) {
        showMessage("Could not save household.", "bad-message");
        return;
    }

    showMessage("Saved.", "good-message");
    resetForm();
    printHouseholds();
}

// this deletes one household
async function deleteHousehold(id) {
    var yes = confirm("Delete this household?");

    if (!yes) {
        return;
    }

    var sql = "DELETE FROM Household WHERE household_id = " + id + ";";
    var result = await runQuery(sql);

    if (!result || result.success !== true) {
        showMessage("Could not delete household.", "bad-message");
        return;
    }

    if (editingHouseholdId == id) {
        resetForm();
    }

    showMessage("Deleted.", "good-message");
    printHouseholds();
}

// when the form is submitted, save the household
document.querySelector("#householdForm").addEventListener("submit", function(event) {
    event.preventDefault();
    saveHousehold();
});

// reset button clears the form
document.querySelector("#resetHouseholdBtn").addEventListener("click", function() {
    resetForm();
});

// load all households when page opens
document.addEventListener("DOMContentLoaded", function() {
    printHouseholds();
});
