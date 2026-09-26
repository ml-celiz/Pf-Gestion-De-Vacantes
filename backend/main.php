<?php

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
// Para que el frontend pueda leer el nombre del CV descargado
header("Access-Control-Expose-Headers: Content-Disposition");
require_once __DIR__ . '/utils/helpers.php';

// Los errores de PHP nunca se muestran en la respuesta (romperían el JSON y
// expondrían detalles internos): solo se registran en el log del servidor
ini_set('display_errors', '0');
ini_set('log_errors', '1');

set_exception_handler(function (Throwable $e) {
    error_log("Error no controlado: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());

    if (!headers_sent()) {
        http_response_code(500);
    }

    echo json_encode(["message" => "Ocurrió un error inesperado. Intentá nuevamente."]);
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

require_once __DIR__ . '/routes/router.php';

routeRequest();

// cd backend
// C:\xampp\php\php.exe -S localhost:8000 main.php

// frontend
// C:\xampp\php\php.exe -S localhost:5500

// UBICACION ARCHIVO:
// C:\xampp\htdocs