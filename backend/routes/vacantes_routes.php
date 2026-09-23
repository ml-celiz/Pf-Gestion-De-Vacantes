<?php

require_once __DIR__ . '/../controllers/vacantes_controller.php';

function handleVacantesRoutes(string $method, array $uriParts): void {
    $controller = new VacantesController();

    $subResource = $uriParts[2] ?? null; // 'solicitudes', 'ordenes_merito' o ID de vacante (si es numérico)

    if ($subResource === 'estados') {

        if ($method === 'GET') {
            $controller->listarEstados();
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    // --- SOLICITUDES VACANTES ---
    if ($subResource === 'solicitudes') {
        $idSolicitud = isset($uriParts[3]) && is_numeric($uriParts[3]) ? (int)$uriParts[3] : null;

        // GET /api/vacantes/solicitudes
        if ($method === 'GET' && $idSolicitud === null) {
            $controller->listarSolicitudes();
            return;
        }

        // GET /api/vacantes/solicitudes/{id}
        if ($method === 'GET' && $idSolicitud !== null) {
            $controller->obtenerSolicitudPorId($idSolicitud);
            return;
        }

        // POST /api/vacantes/solicitudes
        if ($method === 'POST' && $idSolicitud === null) {
            $controller->crearSolicitud();
            return;
        }

        // PUT /api/vacantes/solicitudes/{id}
        if ($method === 'PUT' && $idSolicitud !== null) {
            $controller->actualizarEstadoSolicitud($idSolicitud);
            return;
        }

        // DELETE /api/vacantes/solicitudes/{id}
        if ($method === 'DELETE' && $idSolicitud !== null) {
            $controller->eliminarSolicitud($idSolicitud);
            return;
        }

        respondMethodNotAllowed();
        return;
    }


    // --- ORDENES DE MÉRITO ---
    if ($subResource === 'ordenes_merito') {

        // GET /api/vacantes/ordenes_merito
        if ($method === 'GET') {
            $controller->listarOrdenesMerito();
            return;
        }

        // POST /api/vacantes/ordenes_merito
        if ($method === 'POST') {
            $controller->crearOrdenMerito();
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    // --- VACANTES ---
    $idVacante = is_numeric($subResource) ? (int)$subResource : null;

    // GET /api/vacantes
    if ($method === 'GET' && $idVacante === null) {
        $controller->listarVacantes();
        return;
    }

    // GET /api/vacantes/{id}
    if ($method === 'GET' && $idVacante !== null) {
        $controller->obtenerVacantePorId($idVacante);
        return;
    }

    // POST /api/vacantes
    if ($method === 'POST' && $idVacante === null) {
        $controller->crearVacante();
        return;
    }

    // PUT /api/vacantes/{id}
    if ($method === 'PUT' && $idVacante !== null) {
        $controller->actualizarVacante($idVacante);
        return;
    }

    // DELETE /api/vacantes/{id}
    if ($method === 'DELETE' && $idVacante !== null) {
        $controller->eliminarVacante($idVacante);
        return;
    }

    http_response_code(404);
    echo json_encode(["message" => "Recurso de vacantes no encontrado."]);
}