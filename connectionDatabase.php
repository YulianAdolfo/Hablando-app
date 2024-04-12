<?php
function establishConnecionToDatabase() {
    $host = "localhost:3306";
    $user = "root";
    $password = "root";
    $database = "hablando_wp813";

    $connection = new mysqli($host, $user, $password, $database);

    if ($connection->connect_error) {
        die("An Error has occured while connection to the database: " . $connection->connect_error);
    }

    return $connection;
}
?>