const runQuery = async (sql) => {
    if (window.location.protocol === "file:") {
        return {
            success: false,
            error: "Open the website through localhost or your hosted server so dbConnector.php can run."
        };
    }

    try {
        // This is the PHP file that receives the SQL and talks to the database.
        const url = "dbConnector.php";

        // Send the SQL to PHP as form data in a POST request.
        const response = await fetch(url, {
            method: "POST",
            body: new URLSearchParams({ query: sql })
        });

        // Throw an error if the web request itself failed.
        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        // Convert the JSON text from the server into a JavaScript object.
        const result = await response.json();
        return result;

    } catch (error) {
        // Log the error so it can be inspected in the browser console.
        console.log(error.message);
        return {
            success: false,
            error: error.message
        };
    }
};
