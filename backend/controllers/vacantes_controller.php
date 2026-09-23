<?php

require_once __DIR__ . '/../services/vacantes_services.php';
require_once __DIR__ . '/../services/auth_services.php';

class VacantesController {
    private VacanteService $service;

    public function __construct() {
        $this->service = new VacanteService();
    }

    // --- VACANTES ---

    public function listarVacantes(): void {
        $idUsuario = isset($_GET['id_usuario']) && is_numeric($_GET['id_usuario']) 
            ? (int)$_GET['id_usuario'] 
            : null;
        echo json_encode($this->service->obtenerVacantes($idUsuario));
    }

    public function obtenerVacantePorId(int $id): void {
        $vacante = $this->service->obtenerVacantePorId($id);
        if ($vacante) {
            echo json_encode($vacante);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Vacante no encontrada."]);
        }
    }

    public function crearVacante(): void {

        $sesionActual = verificarAutenticacion();

        $idUsuario =
            isset($sesionActual['id_usuario'])
                ? (int)$sesionActual['id_usuario']
                : null;

        if (!$idUsuario) {
            http_response_code(401);
            echo json_encode([
                "message" =>
                    "No se pudo identificar al usuario autenticado."
            ]);
            return;
        }

        $input =
            json_decode(
                file_get_contents('php://input'),
                true
            ) ?? [];

        /*
        * El frontend NO decide el usuario.
        * El backend lo obtiene de la sesión.
        */
        $input['id_usuario'] = $idUsuario;

        if (
            $this->service->crearVacante(
                $input,
                $idUsuario
            )
        ) {
            http_response_code(201);
            echo json_encode([
                "message" =>
                    "Vacante creada exitosamente."
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                "message" =>
                    "No se pudo crear la vacante. Verifique los datos."
            ]);
        }
    }

    public function actualizarVacante(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->actualizarVacante($id, $input)) {
            echo json_encode(["message" => "Vacante actualizada correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar la vacante."]);
        }
    }

    public function eliminarVacante(int $id): void {
        if ($this->service->eliminarVacante($id)) {
            echo json_encode(["message" => "Vacante eliminada correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Vacante no encontrada."]);
        }
    }

    // --- SOLICITUDES DE VACANTES ---

    public function listarSolicitudes(): void
    {
        $idVacante =
            isset($_GET['id_vacante']) &&
            is_numeric($_GET['id_vacante'])
                ? (int)$_GET['id_vacante']
                : null;

        echo json_encode(
            $this->service->obtenerSolicitudes($idVacante)
        );
    }

    public function obtenerSolicitudPorId(int $id): void {
        $solicitud = $this->service->obtenerSolicitudPorId($id);
        if ($solicitud) {
            echo json_encode($solicitud);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Solicitud no encontrada."]);
        }
    }

    public function crearSolicitud(): void {

        $sesionActual = verificarAutenticacion();

        exigirRol($sesionActual, ['admin', 'pos']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        /*
        * El frontend solo indica la vacante. El usuario sale de la sesión,
        * la fecha es la actual y el estado inicial es PENDIENTE.
        */
        $idVacante = isset($input['id_vacante']) && is_numeric($input['id_vacante'])
            ? (int)$input['id_vacante']
            : 0;

        try {
            $id = $this->service->crearSolicitud(
                $idVacante,
                (int)$sesionActual['id_usuario']
            );

            http_response_code(201);
            echo json_encode([
                "message" => "Postulación realizada con éxito.",
                "id"      => $id
            ]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    public function actualizarEstadoSolicitud(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if (!isset($input['id_estado'])) {
            http_response_code(400);
            echo json_encode(["message" => "El id_estado es obligatorio."]);
            return;
        }

        if ($this->service->actualizarEstadoSolicitud($id, (int)$input['id_estado'])) {
            echo json_encode(["message" => "Estado de la postulación actualizado."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar la postulación."]);
        }
    }

    public function eliminarSolicitud(int $id): void {
        if ($this->service->eliminarSolicitud($id)) {
            echo json_encode(["message" => "Postulación cancelada correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Solicitud no encontrada."]);
        }
    }

    // --- ORDENES DE MÉRITO ---

    public function listarOrdenesMerito(): void {

        exigirRol(verificarAutenticacion(), ['admin', 'pos', 'ra']);

        $idVacante =
            isset($_GET['id_vacante']) &&
            is_numeric($_GET['id_vacante'])
                ? (int)$_GET['id_vacante']
                : null;

        echo json_encode($this->service->obtenerOrdenesMerito($idVacante));
    }

    public function crearOrdenMerito(): void {

        // Publican resultados los mismos roles que ven los postulados
        exigirRol(verificarAutenticacion(), ['jfc', 'admin', 'ra']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $id = $this->service->crearOrdenMerito($input);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 400);
            echo json_encode(["message" => $e->getMessage()]);
            return;
        }

        if ($id !== false) {
            http_response_code(201);
            echo json_encode([
                "message" => "Orden de mérito creada exitosamente.",
                "id"      => $id
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                "message" => "No se pudo registrar la orden de mérito. Verifique los datos."
            ]);
        }
    }

    public function listarEstados(): void {

        echo json_encode(
            $this->service->obtenerEstados()
        );
    }
}