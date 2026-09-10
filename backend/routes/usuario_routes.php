<?php

require_once __DIR__ . '/../controllers/usuario_controller.php';

function handleUsuarioRoutes(string $method, array $uriParts): void {
    $controller = new UsuarioController();
    $id = isset($uriParts[2]) && is_numeric($uriParts[2]) ? (int)$uriParts[2] : null;

    // GET /api/usuarios
    if ($method === 'GET' && $id === null) {
        $controller->listar();
        return;
    }

    // GET /api/usuarios/{id}
    if ($method === 'GET' && $id !== null) {
        $controller->obtenerPorId($id);
        return;
    }

    // POST /api/usuarios
    if ($method === 'POST' && $id === null) {
        $controller->crear();
        return;
    }

    // PUT /api/usuarios/{id}
    if ($method === 'PUT' && $id !== null) {
        $controller->actualizar($id);
        return;
    }

    // DELETE /api/usuarios/{id}
    if ($method === 'DELETE' && $id !== null) {
        $controller->eliminar($id);
        return;
    }

    http_response_code(405);
    echo json_encode(["message" => "Método no permitido para esta ruta."]);
}