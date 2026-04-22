async function runQuery(sql) {
    var cleanSql = sql.trim();

    if (window.location.protocol === "file:") {
        return {
            success: false,
            error: "Open the website through localhost or your hosted server so dbConnector.php can run."
        };
    }

    try {
        var url = "dbConnector.php";

        var response = await fetch(url, {
            method: "POST",
            body: new URLSearchParams({ query: cleanSql })
        });

        if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
        }

        var result = await response.json();
        return result;

    } catch (error) {
        console.log(error.message);
        return {
            success: false,
            error: error.message
        };
    }
}
