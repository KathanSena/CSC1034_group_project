<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

function handle_error($error_message) {
    $response = ["error" => $error_message];
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

set_exception_handler(function($exception) {
    handle_error("Error: " . $exception->getMessage());
});

if (!isset($_POST['query'])) {
    $response = ["error" => "Missing required POST parameters"];
    echo json_encode($response);
    exit;
}

$hostname = "localhost";
$username = "jbarton09";
$password = "5sMpc0QKlDQMHXVC";
$database = "CSC1034_2526_018";

$query = $_POST['query'];

$conn = new mysqli($hostname, $username, $password, $database);

if ($conn->connect_error) {
    handle_error("Connection failed: " . $conn->connect_error);
}

if ($result = $conn->query($query)) {
    if (strpos(strtoupper($query), 'SELECT') === 0) {
        $data = [];

        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        $response = ["success" => true, "data" => $data];
        echo json_encode($response, JSON_PRETTY_PRINT);
        $result->free();
    } else {
        $response = ["success" => true, "affected_rows" => $conn->affected_rows];
        echo json_encode($response, JSON_PRETTY_PRINT);
    }
} else {
    handle_error("Query failed: " . $conn->error);
}

$conn->close();
?>
