<?php

/*
* RESPUESTAS COMUNES
* Funciones usadas por las rutas y los controladores para responder errores
* siempre con el mismo formato JSON: { "message": "..." }.
*/

// 405: la ruta existe pero no admite ese método HTTP
function respondMethodNotAllowed(): void {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
}

// Error de validación o de negocio lanzado por un servicio:
// el mensaje va al usuario y el código de la excepción es el HTTP status
function responderError(RuntimeException $e): void {
    http_response_code($e->getCode() ?: 400);
    echo json_encode(["message" => $e->getMessage()]);
}
