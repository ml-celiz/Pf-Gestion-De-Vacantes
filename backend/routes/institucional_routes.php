<?php

require_once __DIR__ . '/../controllers/institucional_controller.php';
require_once __DIR__ . '/../utils/helpers.php';

function handleInstitucionalRoutes(
    string $method,
    array $uriParts
): void {

    $controller = new InstitucionalController();

    $subResource = $uriParts[2] ?? null;

    $id = isset($uriParts[3]) && is_numeric($uriParts[3]) ? (int)$uriParts[3] : null;

    /* --- USUARIOS JFC --- */

    if ($subResource === 'usuarios-jfc') {

        if ($method === 'GET') {
            $controller->listarUsuariosJfc();
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    /* --- DEPARTAMENTOS --- */

    if ($subResource === 'departamentos') {

        if ($method === 'GET' && $id === null) {
            $controller->listarDepartamentos();
            return;
        }

        if ($method === 'GET' && $id !== null) {
            $controller->obtenerDepartamentoPorId($id);
            return;
        }

        if ($method === 'POST' && $id === null) {
            $controller->crearDepartamento();
            return;
        }

        if ($method === 'PUT' && $id !== null) {
            $controller->actualizarDepartamento($id);
            return;
        }

        if ($method === 'DELETE' && $id !== null) {
            $controller->eliminarDepartamento($id);
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    /* --- CÁTEDRAS --- */

    if ($subResource === 'catedras') {

        if ($method === 'GET' && $id === null) {
            $controller->listarCatedras();
            return;
        }

        if ($method === 'GET' && $id !== null) {
            $controller->obtenerCatedraPorId($id);
            return;
        }

        if ($method === 'POST' && $id === null) {
            $controller->crearCatedra();
            return;
        }

        if ($method === 'PUT' && $id !== null) {
            $controller->actualizarCatedra($id);
            return;
        }

        if ($method === 'DELETE' && $id !== null) {
            $controller->eliminarCatedra($id);
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    http_response_code(404);

    echo json_encode([
        "message" =>
            "Sub-recurso institucional no encontrado."
    ]);
}