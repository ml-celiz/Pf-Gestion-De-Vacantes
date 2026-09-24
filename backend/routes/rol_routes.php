<?php

require_once __DIR__ . '/../controllers/rol_controller.php';
require_once __DIR__ . '/../services/auth_services.php';
require_once __DIR__ . '/../utils/helpers.php';

function handleRolRoutes(string $method, array $uriParts): void {

    /*
    * Solo `admin` administra roles. Sin esto, cualquier usuario autenticado
    * podría asignarse el rol admin con POST /api/roles/{id}/usuarios.
    */
    exigirRol(verificarAutenticacion(), ['admin']);

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

            // Los permisos de un módulo se cambian (y quitan) con PUT
            case 'modulos':
                if ($method === 'GET') $controller->listarModulos($id);
                elseif ($method === 'POST') $controller->asignarModulo($id);
                elseif ($method === 'PUT' && $subId !== null) $controller->actualizarModulo($id, $subId);
                else respondMethodNotAllowed();
                return;

            case 'usuarios':
                if ($method === 'POST') $controller->asignarUsuario($id);
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