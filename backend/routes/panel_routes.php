<?php

require_once __DIR__ . '/../controllers/panel_controller.php';
require_once __DIR__ . '/../services/auth_services.php';

// Los paneles se administran desde la pantalla de roles: módulo `roles`
function handlePanelRoutes(string $method, array $uriParts): void {
    exigirPermiso(verificarAutenticacion(), 'roles', accionSegunMetodo($method));

    $controller = new PanelController();
    $id = isset($uriParts[2]) && is_numeric($uriParts[2]) ? (int)$uriParts[2] : null;

    // GET /api/paneles
    if ($method === 'GET' && $id === null) {
        $controller->listar();
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
