<?php

/*
* PUNTO DE ENTRADA DEL BACKEND
* Todos los pedidos a la API pasan por este archivo: fija las cabeceras
* (JSON y CORS), configura el manejo de errores, carga backend/.env y
* deriva el pedido al router (routes/router.php).
*
* Estructura del backend:
*   routes/       qué URL y método atiende cada controlador (y qué permiso exige)
*   controllers/  leen el pedido HTTP y arman la respuesta JSON
*   services/     lógica de negocio, validaciones y consultas SQL
*   models/       una fila de la base representada como objeto
*   utils/        helpers de respuesta, validaciones y envío de correos
*   config/       conexión a la base de datos (PostgreSQL)
*/

// --- CABECERAS: respuestas JSON y CORS (el frontend corre en otro puerto) ---
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
// Para que el frontend pueda leer el nombre del CV descargado
header("Access-Control-Expose-Headers: Content-Disposition");
require_once __DIR__ . '/utils/helpers.php';

// --- ERRORES ---
// Los errores de PHP nunca se muestran en la respuesta (romperían el JSON y
// expondrían detalles internos): solo se registran en el log del servidor
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Cualquier excepción no capturada responde un 500 genérico
set_exception_handler(function (Throwable $e) {
    error_log("Error no controlado: " . $e->getMessage() . " en " . $e->getFile() . ":" . $e->getLine());

    if (!headers_sent()) {
        http_response_code(500);
    }

    echo json_encode(["message" => "Ocurrió un error inesperado. Intentá nuevamente."]);
});

// --- PREFLIGHT CORS: el navegador pregunta antes de un PUT/DELETE ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- VARIABLES DE ENTORNO: backend/.env (base de datos, correo, URL) ---
if (file_exists(__DIR__ . '/.env')) {
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// --- RUTEO ---
require_once __DIR__ . '/routes/router.php';

routeRequest();

/*
* CÓMO LEVANTAR EL PROYECTO EN LOCAL (ubicación: C:\xampp\htdocs)
*
* Backend:
*   cd backend
*   C:\xampp\php\php.exe -S localhost:8000 main.php
*
* Frontend:
*   C:\xampp\php\php.exe -S localhost:5500
*/
