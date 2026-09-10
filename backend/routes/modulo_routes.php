<?php

require_once __DIR__ . '/../controllers/modulo_controller.php';

function handleModuloRoutes(string $method, array $uriParts): void {
    $controller = new ModuloController();
    $id = isset($uriParts[2]) && is_numeric($uriParts[2]) ? (int)$uriParts[2] : null;

    // GET /api/modulos
    if ($method === 'GET' && $id === null) {
        $controller->listar();
        return;
    }

    // GET /api/modulos/{id}
    if ($method === 'GET' && $id !== null) {
        $controller->obtenerPorId($id);
        return;
    }

    // POST /api/modulos
    if ($method === 'POST' && $id === null) {
        $controller->crear();
        return;
    }

    // PUT /api/modulos/{id}
    if ($method === 'PUT' && $id !== null) {
        $controller->actualizar($id);
        return;
    }

    // DELETE /api/modulos/{id}
    if ($method === 'DELETE' && $id !== null) {
        $controller->eliminar($id);
        return;
    }

    http_response_code(405);
    echo json_encode(["message" => "Método no permitido para esta ruta."]);
}