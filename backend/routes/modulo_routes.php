<?php

require_once __DIR__ . '/../controllers/modulo_controller.php';
require_once __DIR__ . '/../services/auth_services.php';

// Los modulos se administran desde la pantalla de roles: solo admin
function handleModuloRoutes(string $method, array $uriParts): void {
    exigirRol(verificarAutenticacion(), ['admin']);

    $controller = new ModuloController();
    $id = isset($uriParts[2]) && is_numeric($uriParts[2]) ? (int)$uriParts[2] : null;

    // GET /api/modulos
    if ($method === 'GET' && $id === null) {
        $controller->listar();
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
