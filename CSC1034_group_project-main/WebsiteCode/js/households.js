let editingHouseholdId = null;

const showMessage = (message, cssClass) => {
    const output = document.querySelector("#householdMessage");
    output.textContent = message;
    output.className = `message-box ${cssClass}`;
};

const clearMessage = () => {
    const output = document.querySelector("#householdMessage");
    output.textContent = "";
    output.className = "message-box";
};

const resetForm = () => {
    document.querySelector("#householdForm").reset();
    document.querySelector("#householdFormTitle").textContent = "Add a household";
    document.querySelector("#saveHouseholdBtn").textContent = "Save household";
    editingHouseholdId = null;
    clearMessage();
};

const validateForm = () => {
    const householdSize = Number(document.querySelector("#householdSize").value);
    const postcode = document.querySelector("#postcode").value.trim();
    const referralSource = document.querySelector("#referralSource").value.trim();

    if (postcode === "" || referralSource === "") {
        return "Please complete all required fields.";
    }

    if (!Number.isInteger(householdSize) || householdSize < 1 || householdSize > 20) {
        return "Household size must be a whole number between 1 and 20.";
    }

    if (postcode.length < 5 || postcode.length > 20) {
        return "Postcode must be between 5 and 20 characters.";
    }

    return "";
};

const printHouseholds = async () => {
    const output = document.querySelector("#householdTable");
    const sql = `
        SELECT household_id, household_size, postcode, referral_source
        FROM Household
        ORDER BY household_id DESC;
    `;

    const result = await runQuery(sql);

    if (!result || result.success !== true || result.data.length === 0) {
        output.textContent = "No households returned.";
        return;
    }

    const rows = result.data;
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const headings = [
        "Household ID",
        "Household Size",
        "Postcode",
        "Referral Source",
        "Actions"
    ];

    for (let heading of headings) {
        const th = document.createElement("th");
        th.textContent = heading;
        headerRow.appendChild(th);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (let row of rows) {
        const tr = document.createElement("tr");

        const tdId = document.createElement("td");
        const tdSize = document.createElement("td");
        const tdPostcode = document.createElement("td");
        const tdReferral = document.createElement("td");
        const tdActions = document.createElement("td");

        tdId.textContent = row.household_id;
        tdSize.textContent = row.household_size;
        tdPostcode.textContent = row.postcode;
        tdReferral.textContent = row.referral_source;

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "main-button grey-button small-button";
        editButton.textContent = "Edit";
        editButton.dataset.id = row.household_id;
        editButton.dataset.size = row.household_size;
        editButton.dataset.postcode = row.postcode;
        editButton.dataset.referral = row.referral_source;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "main-button red-button small-button";
        deleteButton.textContent = "Delete";
        deleteButton.dataset.id = row.household_id;

        tdActions.appendChild(editButton);
        tdActions.appendChild(deleteButton);

        tr.appendChild(tdId);
        tr.appendChild(tdSize);
        tr.appendChild(tdPostcode);
        tr.appendChild(tdReferral);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    output.textContent = "";
    output.appendChild(table);
};

const saveHousehold = async () => {
    const validationMessage = validateForm();

    if (validationMessage !== "") {
        showMessage(validationMessage, "bad-message");
        return;
    }

    const saveButton = document.querySelector("#saveHouseholdBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    const householdSize = Number(document.querySelector("#householdSize").value);
    const postcode = document.querySelector("#postcode").value.trim().toUpperCase().replace(/'/g, "''");
    const referralSource = document.querySelector("#referralSource").value.trim().replace(/'/g, "''");

    let sql = `
        INSERT INTO Household (household_size, postcode, referral_source)
        VALUES (${householdSize}, '${postcode}', '${referralSource}');
    `;

    if (editingHouseholdId !== null) {
        sql = `
            UPDATE Household
            SET household_size = ${householdSize},
                postcode = '${postcode}',
                referral_source = '${referralSource}'
            WHERE household_id = ${editingHouseholdId};
        `;
    }

    const result = await runQuery(sql);

    saveButton.disabled = false;
    saveButton.textContent = "Save household";

    if (!result || result.success !== true) {
        showMessage("The household could not be saved.", "bad-message");
        return;
    }

    if (editingHouseholdId === null) {
        showMessage("Household added successfully.", "good-message");
    } else {
        showMessage("Household updated successfully.", "good-message");
    }

    resetForm();
    printHouseholds();
};

const deleteHousehold = async (householdId) => {
    const shouldDelete = window.confirm("Are you sure you want to delete this household?");

    if (!shouldDelete) {
        return;
    }

    const sql = `DELETE FROM Household WHERE household_id = ${householdId};`;
    const result = await runQuery(sql);

    if (!result || result.success !== true) {
        showMessage("The household could not be deleted.", "bad-message");
        return;
    }

    if (Number(editingHouseholdId) === Number(householdId)) {
        resetForm();
    }

    showMessage("Household deleted successfully.", "good-message");
    printHouseholds();
};

document.querySelector("#householdForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveHousehold();
});

document.querySelector("#resetHouseholdBtn").addEventListener("click", resetForm);

document.querySelector("#householdTable").addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button) {
        return;
    }

    if (button.textContent === "Edit") {
        editingHouseholdId = button.dataset.id;
        document.querySelector("#householdFormTitle").textContent = `Edit household #${editingHouseholdId}`;
        document.querySelector("#householdSize").value = button.dataset.size;
        document.querySelector("#postcode").value = button.dataset.postcode;
        document.querySelector("#referralSource").value = button.dataset.referral;
        showMessage("Edit mode enabled. Update the values and save again.", "good-message");
    }

    if (button.textContent === "Delete") {
        deleteHousehold(button.dataset.id);
    }
});

document.addEventListener("DOMContentLoaded", printHouseholds);
