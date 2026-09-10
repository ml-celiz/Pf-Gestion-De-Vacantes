<?php

require_once __DIR__ . '/../controllers/rol_controller.php';

function handleRolRoutes(string $method, array $uriParts): void {
    $controller = new RolController();
    
    $id = isset($uriParts[2]) && is_numeric($uriParts[2]) ? (int)$uriParts[2] : null;
    $subResource = $uriParts[3] ?? null;
    $subId = isset($uriParts[4]) && is_numeric($uriParts[4]) ? (int)$uriParts[4] : null;

    // Rutas para asociaciones de roles con paneles, módulos y usuarios
    if ($id !== null && $subResource !== null) {
        switch ($subResource) {
            case 'paneles':
                if ($method === 'GET') $controller->listarPaneles($id);
                elseif ($method === 'POST') $controller->asignarPanel($id);
                elseif ($method === 'DELETE' && $subId !== null) $controller->desasignarPanel($id, $subId);
                else respondMethodNotAllowed();
                return;

            case 'modulos':
                if ($method === 'GET') $controller->listarModulos($id);
                elseif ($method === 'POST') $controller->asignarModulo($id);
                elseif ($method === 'PUT' && $subId !== null) $controller->actualizarModulo($id, $subId);
                elseif ($method === 'DELETE' && $subId !== null) $controller->desasignarModulo($id, $subId);
                else respondMethodNotAllowed();
                return;

            case 'usuarios':
                if ($method === 'GET') $controller->listarUsuarios($id);
                elseif ($method === 'POST') $controller->asignarUsuario($id);
                elseif ($method === 'DELETE' && $subId !== null) $controller->desasignarUsuario($id, $subId);
                else respondMethodNotAllowed();
                return;
        }
    }

    // GET /api/roles
    if ($method === 'GET' && $id === null) {
        $controller->listar();
        return;
    }

    // GET /api/roles/{id}
    if ($method === 'GET' && $id !== null) {
        $controller->obtenerPorId($id);
        return;
    }

    // POST /api/roles
    if ($method === 'POST' && $id === null) {
        $controller->crear();
        return;
    }

    // PUT /api/roles/{id}
    if ($method === 'PUT' && $id !== null) {
        $controller->actualizar($id);
        return;
    }

    // DELETE /api/roles/{id}
    if ($method === 'DELETE' && $id !== null) {
        $controller->eliminar($id);
        return;
    }

    respondMethodNotAllowed();
}

function respondMethodNotAllowed(): void {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido para esta ruta."]);
}