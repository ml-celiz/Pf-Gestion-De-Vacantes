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
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->crearSolicitud($input)) {
            http_response_code(201);
            echo json_encode(["message" => "Postulación realizada con éxito."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo procesar la postulación."]);
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
        echo json_encode($this->service->obtenerOrdenesMerito());
    }

    public function crearOrdenMerito(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->crearOrdenMerito($input)) {
            http_response_code(201);
            echo json_encode(["message" => "Orden de mérito creada exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo registrar la orden de mérito."]);
        }
    }

    public function listarEstados(): void {

        echo json_encode(
            $this->service->obtenerEstados()
        );
    }
}