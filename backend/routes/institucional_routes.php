<?php

require_once __DIR__ . '/../controllers/institucional_controller.php';
require_once __DIR__ . '/../services/auth_services.php';
require_once __DIR__ . '/../utils/helpers.php';

/*
* Departamentos y cátedras se administran desde "Gestión de vacantes"
* (admin y ra). Solo el listado de cátedras es público: el panel de
* vacantes lo usa también en modo invitado.
*/
function handleInstitucionalRoutes(string $method, array $uriParts): void {
    $controller = new InstitucionalController();

    $subResource = $uriParts[2] ?? null;
    $id = isset($uriParts[3]) && is_numeric($uriParts[3]) ? (int)$uriParts[3] : null;

    $esListadoPublico = $subResource === 'catedras' && $method === 'GET' && $id === null;

    if (!$esListadoPublico) {
        exigirRol(verificarAutenticacion(), ['admin', 'ra']);
    }

    /* --- USUARIOS JFC --- */

    if ($subResource === 'usuarios-jfc') {
        // GET /api/institucional/usuarios-jfc
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
        // GET /api/institucional/catedras (público)
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
