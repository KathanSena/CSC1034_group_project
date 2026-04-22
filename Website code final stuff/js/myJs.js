async function runQuery(sql) {
    var response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql.trim() })
    });

    return await response.json();
}
