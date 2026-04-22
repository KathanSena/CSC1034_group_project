// this function sends the sql query to dbconnector.php
// then it waits for the database result and gives it back
async function runQuery(sql) {
    // send the sql to the php file using post
    var response = await fetch("dbConnector.php", {
        method: "POST",
        body: new URLSearchParams({ query: sql.trim() })
    });

    // turn the response into json and return it
    return await response.json();
}
