<?php

require_once __DIR__ . '/../controllers/institucional_controller.php';
require_once __DIR__ . '/../services/auth_services.php';
require_once __DIR__ . '/../utils/helpers.php';

/*
* Departamentos y cátedras se administran desde "Gestión de vacantes".
* Cada uno se controla con su módulo (`departamentos`, `catedras`) según
* roles_modulos. El listado de cátedras admite consultas sin sesión:
* en ese caso se evalúan los permisos del rol invitado.
*/
function handleInstitucionalRoutes(string $method, array $uriParts): void {
    $controller = new InstitucionalController();

    $subResource = $uriParts[2] ?? null;
    $id = isset($uriParts[3]) && is_numeric($uriParts[3]) ? (int)$uriParts[3] : null;

    $esListadoCatedras = $subResource === 'catedras' && $method === 'GET' && $id === null;

    $sesion = $esListadoCatedras ? obtenerSesionOpcional() : verificarAutenticacion();

    if ($subResource === 'departamentos' || $subResource === 'catedras') {
        exigirPermiso($sesion, $subResource, accionSegunMetodo($method));
    }

    /* --- USUARIOS JFC --- */

    if ($subResource === 'usuarios-jfc') {
        // GET /api/institucional/usuarios-jfc
        // Solo sirve para elegir el jefe al crear o editar una cátedra
        if (
            !tienePermiso((int)$sesion['id_usuario'], 'catedras', 'escribir') &&
            !tienePermiso((int)$sesion['id_usuario'], 'catedras', 'editar')
        ) {
            http_response_code(403);
            echo json_encode(["message" => "No tiene permisos para realizar esta acción."]);
            return;
        }

        if ($method === 'GET') {
            $controller->listarUsuariosJfc();
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    /* --- DEPARTAMENTOS --- */

    if ($subResource === 'departamentos') {
        // GET /api/institucional/departamentos
        if ($method === 'GET' && $id === null) {
            $controller->listarDepartamentos();
            return;
        }

        // POST /api/institucional/departamentos
        if ($method === 'POST' && $id === null) {
            $controller->crearDepartamento();
            return;
        }

        // PUT /api/institucional/departamentos/{id}
        if ($method === 'PUT' && $id !== null) {
            $controller->actualizarDepartamento($id);
            return;
        }

        // DELETE /api/institucional/departamentos/{id}
        if ($method === 'DELETE' && $id !== null) {
            $controller->eliminarDepartamento($id);
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    /* --- CÁTEDRAS --- */

    if ($subResource === 'catedras') {
        // GET /api/institucional/catedras (también sin sesión, con los permisos de `inv`)
        if ($method === 'GET' && $id === null) {
            $controller->listarCatedras();
            return;
        }

        // POST /api/institucional/catedras
        if ($method === 'POST' && $id === null) {
            $controller->crearCatedra();
            return;
        }

        // PUT /api/institucional/catedras/{id}
        if ($method === 'PUT' && $id !== null) {
            $controller->actualizarCatedra($id);
            return;
        }

        // DELETE /api/institucional/catedras/{id}
        if ($method === 'DELETE' && $id !== null) {
            $controller->eliminarCatedra($id);
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    http_response_code(404);
    echo json_encode(["message" => "Sub-recurso institucional no encontrado."]);
}
