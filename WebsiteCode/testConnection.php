<?php
header("Content-Type: text/html; charset=UTF-8");

$dbHost = "127.0.0.1";
$dbName = "jbarton09";
$dbUser = "jbarton09";
$dbPass = "5sMpc0QKlDQMHXVC";

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $result = $pdo->query("SELECT DATABASE() AS db_name")->fetch(PDO::FETCH_ASSOC);

    echo "<h1>Database connection successful</h1>";
    echo "<p>Connected to database: " . htmlspecialchars($result["db_name"] ?? "unknown") . "</p>";
} catch (PDOException $error) {
    echo "<h1>Database connection failed</h1>";
    echo "<p>" . htmlspecialchars($error->getMessage()) . "</p>";
}
