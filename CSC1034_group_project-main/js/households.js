var editingHouseholdId = "";

function showMessage(message, cssClass) {
    var output = document.querySelector("#householdMessage");
    output.textContent = message;
    output.className = "message-box " + cssClass;
}

function clearMessage() {
    var output = document.querySelector("#householdMessage");
    output.textContent = "";
    output.className = "message-box";
}

function resetForm() {
    document.querySelector("#householdForm").reset();
    document.querySelector("#householdFormTitle").textContent = "Add a household";
    document.querySelector("#saveHouseholdBtn").textContent = "Save household";
    editingHouseholdId = "";
    clearMessage();
}

function validateForm() {
    var householdSize = Number(document.querySelector("#householdSize").value);
    var postcode = document.querySelector("#postcode").value.trim();
    var referralSource = document.querySelector("#referralSource").value.trim();

    if (postcode === "" || referralSource === "") {
        return "Please complete all required fields.";
    }

    if (householdSize < 1 || householdSize > 20) {
        return "Household size must be between 1 and 20.";
    }

    return "";
}

async function printHouseholds() {
    var output = document.querySelector("#householdTable");
    var result = await runQuery("SELECT household_id, household_size, postcode, referral_source FROM Household ORDER BY household_id DESC;");

    if (!result || result.success !== true || !result.data || result.data.length === 0) {
        output.textContent = "No households returned.";
        return;
    }

    var rows = result.data;
    var table = document.createElement("table");
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var headings = ["Household ID", "Household Size", "Postcode", "Referral Source", "Actions"];

    for (var i = 0; i < headings.length; i++) {
        var th = document.createElement("th");
        th.textContent = headings[i];
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");

    for (var r = 0; r < rows.length; r++) {
        var tr = document.createElement("tr");
        var td1 = document.createElement("td");
        var td2 = document.createElement("td");
        var td3 = document.createElement("td");
        var td4 = document.createElement("td");
        var td5 = document.createElement("td");
        var editButton = document.createElement("button");
        var deleteButton = document.createElement("button");

        td1.textContent = rows[r].household_id;
        td2.textContent = rows[r].household_size;
        td3.textContent = rows[r].postcode;
        td4.textContent = rows[r].referral_source;

        editButton.type = "button";
        editButton.className = "main-button grey-button small-button";
        editButton.textContent = "Edit";
        editButton.setAttribute("onclick", "startEdit(" + rows[r].household_id + "," + rows[r].household_size + ",'" + rows[r].postcode.replace(/'/g, "\\'") + "','" + rows[r].referral_source.replace(/'/g, "\\'") + "')");

        deleteButton.type = "button";
        deleteButton.className = "main-button red-button small-button";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("onclick", "deleteHousehold(" + rows[r].household_id + ")");

        td5.appendChild(editButton);
        td5.appendChild(deleteButton);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        tr.appendChild(td4);
        tr.appendChild(td5);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    output.innerHTML = "";
    output.appendChild(table);
}

function startEdit(id, size, postcode, referral) {
    editingHouseholdId = id;
    document.querySelector("#householdFormTitle").textContent = "Edit household #" + id;
    document.querySelector("#saveHouseholdBtn").textContent = "Update household";
    document.querySelector("#householdSize").value = size;
    document.querySelector("#postcode").value = postcode;
    document.querySelector("#referralSource").value = referral;
    showMessage("Edit the values and save again.", "good-message");
}

async function saveHousehold() {
    var validationMessage = validateForm();
    if (validationMessage !== "") {
        showMessage(validationMessage, "bad-message");
        return;
    }

    var saveButton = document.querySelector("#saveHouseholdBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    var householdSize = Number(document.querySelector("#householdSize").value);
    var postcode = document.querySelector("#postcode").value.trim().toUpperCase().replace(/'/g, "''");
    var referralSource = document.querySelector("#referralSource").value.trim().replace(/'/g, "''");
    var sql = "";

    if (editingHouseholdId === "") {
        sql = "INSERT INTO Household (household_size, postcode, referral_source) VALUES (" + householdSize + ", '" + postcode + "', '" + referralSource + "');";
    } else {
        sql = "UPDATE Household SET household_size = " + householdSize + ", postcode = '" + postcode + "', referral_source = '" + referralSource + "' WHERE household_id = " + editingHouseholdId + ";";
    }

    var result = await runQuery(sql);

    saveButton.disabled = false;
    saveButton.textContent = "Save household";

    if (!result || result.success !== true) {
        showMessage("Could not save household.", "bad-message");
        return;
    }

    showMessage("Saved.", "good-message");
    resetForm();
    printHouseholds();
}

async function deleteHousehold(id) {
    if (!window.confirm("Delete this household?")) {
        return;
    }

    var result = await runQuery("DELETE FROM Household WHERE household_id = " + id + ";");

    if (!result || result.success !== true) {
        showMessage("Could not delete household.", "bad-message");
        return;
    }

    if (String(editingHouseholdId) === String(id)) {
        resetForm();
    }

    showMessage("Deleted.", "good-message");
    printHouseholds();
}

document.querySelector("#householdForm").addEventListener("submit", function (event) {
    event.preventDefault();
    saveHousehold();
});

document.querySelector("#resetHouseholdBtn").addEventListener("click", resetForm);

document.addEventListener("DOMContentLoaded", printHouseholds);
