<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *"); // Allows all origins (for development)
header("Access-Control-Allow-Methods: POST, GET, OPTIONS"); // Allow specific methods
header("Access-Control-Allow-Headers: Content-Type"); // Allow specific headers

// Function to handle and log errors
function handle_error($error_message) {
    $response = ["error" => $error_message];
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit;
}

// Set up an exception handler to catch any uncaught exceptions
set_exception_handler(function($exception) {
    handle_error("Error: " . $exception->getMessage());
});

// Check if the required POST data is set
if (!isset($_POST['query'])) {
    $response = ["error" => "Missing required POST parameters"];
    echo json_encode($response);
    exit;
}

/* *******************************************************************************
ATTENTION ALL STUDENTS - YOU MUST UPDATE THE FOLLOWING VARIABLES WITH YOUR DETAILS
******************************************************************************* */ 
$hostname = "localhost"; // Update with your hostname, normally "localhost"
$username = "kathan01"; // update with your mySQL username
$password = "V10qPqqxhmCvF4vq"; // update with your mySQL password
$database = "CSC1034_2526_018"; // update with the database name to be used. 

/* ********************************************************************************
CHANGE NOTHING AFTER THIS  LINE
******************************************************************************* */


// Get POST data - the SQL Query 
$query = $_POST['query'];

// Create connection
$conn = new mysqli($hostname, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    handle_error("Connection failed: " . $conn->connect_error);
}

// Execute query
if ($result = $conn->query($query)) {
    // Check if the result is a SELECT query
    if (strpos(strtoupper($query), 'SELECT') === 0) {
        // Fetch all results into an associative array
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        $response = ["success" => true, "data" => $data];
        echo json_encode($response, JSON_PRETTY_PRINT);
        $result->free();
    } else {
        // For non-SELECT queries, return the affected rows
        $response = ["success" => true, "affected_rows" => $conn->affected_rows];
        echo json_encode($response, JSON_PRETTY_PRINT);
    }
} else {
    handle_error("Query failed: " . $conn->error);
}

$conn->close();
?>
