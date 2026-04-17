<?php
header("Content-Type: application/json; charset=UTF-8");

$dbHost = "127.0.0.1";
$dbName = "CSC1034_2526_018";
$dbUser = "jbarton09";
$dbPass = "5sMpc0QKlDQMHXVC";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Only POST requests are allowed."
    ]);
    exit;
}

$query = trim($_POST["query"] ?? "");

if ($query === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "No SQL query was provided."
    ]);
    exit;
}

if (!preg_match("/^SELECT\\s/i", $query)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Only SELECT queries are allowed."
    ]);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $statement = $pdo->query($query);
    $rows = $statement->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $rows
    ]);
} catch (PDOException $error) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $error->getMessage()
    ]);
}
