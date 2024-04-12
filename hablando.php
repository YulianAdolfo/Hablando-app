<?php
include 'connectionDatabase.php';
function registerPhoneNumber () {
    $connection = establishConnecionToDatabase();
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    $phone_number = $data['number'];
    $status = 0;

    $exist_contact = $connection->query('SELECT ID FROM global_contacts WHERE cellphone = '.$phone_number);
    if($exist_contact->num_rows > 0) {
        $status = 1;
    } else {
        $status = 0;
    }  
    $response = array(
        'status' => $status
    );
    echo json_encode($response);
}

function updateHash() {
    $connection = establishConnecionToDatabase();
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    $hash = $data['hash'];
    $phone = $data['phone'];
    $update = $connection->query('UPDATE global_contacts SET hash="'.$hash.'" WHERE cellphone='.$phone);
    $response = array(
        'status' => $update
    );
    echo json_encode($response);
}
function getHashFrom() {
    $hash_for_connection = '';
    $connection = establishConnecionToDatabase();
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    $phone = $data['phone'];
    $getHash = $connection->query('SELECT hash FROM global_contacts WHERE cellphone = '.$phone);  
    if($getHash->num_rows > 0) {
        $dataHash = $getHash->fetch_assoc();
        $hash_for_connection = $dataHash['hash'];
    }
    $response = array(
        'hash' => $hash_for_connection
    );
    echo json_encode($response);
}

header('Access-Control-Allow-Origin: *');
// Obtener la parte de la ruta de la URL
$request_uri = $_SERVER['REQUEST_URI'];
// Dividir la ruta en segmentos
$request_segments = explode('/', $request_uri);

// Obtener el último segmento de la ruta
$action = end($request_segments);

// Manejar las solicitudes según el segmento de la ruta
switch ($action) {
    case 'register':
        registerPhoneNumber();
        break;
    case 'update_hash':
        updateHash();
        break;
    case 'get_hash':
        getHashFrom();
        break;
    default:
        // Si la solicitud no coincide con ninguna ruta válida, devolver un error 404
        http_response_code(404);
        break;
}
?>