const runQuery = async (sql) => {
    if (window.location.protocol === "file:") {
        return {
            success: false,
            message: "Open the site through http://localhost/... not by double-clicking the HTML file."
        };
    }

    try {
        const response = await fetch("dbConnector.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ query: sql })
        });

        if (!response.ok) {
            return {
                success: false,
                message: `dbConnector.php returned HTTP ${response.status}.`
            };
        }

        const rawText = await response.text();

        try {
            return JSON.parse(rawText);
        } catch (error) {
            return {
                success: false,
                message: "dbConnector.php did not return valid JSON. Check whether PHP is running and whether the file path is correct.",
                rawResponse: rawText
            };
        }
    } catch (error) {
        console.log(error.message);
        return {
            success: false,
            message: `Could not connect to dbConnector.php. ${error.message}`
        };
    }
};
