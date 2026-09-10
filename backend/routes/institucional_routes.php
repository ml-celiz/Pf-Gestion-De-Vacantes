<?php

require_once __DIR__ . '/../controllers/institucional_controller.php';

function handleInstitucionalRoutes(string $method, array $uriParts): void {
    $controller = new InstitucionalController();

    // $uriParts[0] = 'api', $uriParts[1] = 'institucional'
    $subResource = $uriParts[2] ?? null; // 'departamentos' o 'catedras'
    $id = isset($uriParts[3]) && is_numeric($uriParts[3]) ? (int)$uriParts[3] : null;

    // --- DEPARTAMENTOS ---
    if ($subResource === 'departamentos') {

        // GET /api/institucional/departamentos
        if ($method === 'GET' && $id === null) {
            $controller->listarDepartamentos();
            return;
        }

        // GET /api/institucional/departamentos/{id}
        if ($method === 'GET' && $id !== null) {
            $controller->obtenerDepartamentoPorId($id);
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

    // --- CÁTEDRAS ---
    if ($subResource === 'catedras') {

        // GET /api/institucional/catedras
        if ($method === 'GET' && $id === null) {
            $controller->listarCatedras();
            return;
        }

        // GET /api/institucional/catedras/{id}
        if ($method === 'GET' && $id !== null) {
            $controller->obtenerCatedraPorId($id);
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

function respondMethodNotAllowed(): void {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido para esta ruta."]);
}