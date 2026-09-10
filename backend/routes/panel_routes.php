<?php

require_once __DIR__ . '/../controllers/panel_controller.php';

function handlePanelRoutes(string $method, array $uriParts): void {
    $controller = new PanelController();
    $id = isset($uriParts[2]) && is_numeric($uriParts[2]) ? (int)$uriParts[2] : null;

    // GET /api/paneles
    if ($method === 'GET' && $id === null) {
        $controller->listar();
        return;
    }

    // GET /api/paneles/{id}
    if ($method === 'GET' && $id !== null) {
        $controller->obtenerPorId($id);
        return;
    }

    // POST /api/paneles
    if ($method === 'POST' && $id === null) {
        $controller->crear();
        return;
    }

    // PUT /api/paneles/{id}
    if ($method === 'PUT' && $id !== null) {
        $controller->actualizar($id);
        return;
    }

    // DELETE /api/paneles/{id}
    if ($method === 'DELETE' && $id !== null) {
        $controller->eliminar($id);
        return;
    }

    http_response_code(405);
    echo json_encode(["message" => "Método no permitido para esta ruta."]);
}