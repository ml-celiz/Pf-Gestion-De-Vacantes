<?php

require_once __DIR__ . '/../services/vacantes_services.php';
require_once __DIR__ . '/../services/auth_services.php';

class VacantesController {
    private VacanteService $service;

    public function __construct() {
        $this->service = new VacanteService();
    }

    // --- VACANTES ---

    /*
    * Público (lo ve también el invitado). Si consulta un jefe de
    * cátedra, solo recibe las vacantes de sus cátedras.
    */
    public function listarVacantes(): void {
        $idJefe = idJefeDeCatedraParaFiltrar(obtenerSesionOpcional());

        echo json_encode($this->service->obtenerVacantes($idJefe));
    }

    public function crearVacante(): void {

        $sesionActual = verificarAutenticacion();

        exigirRol($sesionActual, ['admin', 'ra']);

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
        exigirRol(verificarAutenticacion(), ['admin', 'ra']);

        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->actualizarVacante($id, $input)) {
            echo json_encode(["message" => "Vacante actualizada correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar la vacante."]);
        }
    }

    public function eliminarVacante(int $id): void {
        exigirRol(verificarAutenticacion(), ['admin', 'ra']);

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
        $sesionActual = verificarAutenticacion();

        $idVacante =
            isset($_GET['id_vacante']) &&
            is_numeric($_GET['id_vacante'])
                ? (int)$_GET['id_vacante']
                : null;

        $idUsuario =
            isset($_GET['id_usuario']) &&
            is_numeric($_GET['id_usuario'])
                ? (int)$_GET['id_usuario']
                : null;

        /*
        * admin y ra ven las postulaciones de cualquiera; el jefe de
        * cátedra, solo las de vacantes de sus cátedras; el resto solo
        * las propias, pida lo que pida en la URL.
        */
        $idJefe = idJefeDeCatedraParaFiltrar($sesionActual);

        if ($idJefe === null && !usuarioTieneAlgunRol((int)$sesionActual['id_usuario'], ['admin', 'ra', 'jfc'])) {
            $idUsuario = (int)$sesionActual['id_usuario'];
        }

        echo json_encode(
            $this->service->obtenerSolicitudes($idVacante, $idUsuario, $idJefe)
        );
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

    public function eliminarSolicitud(int $id): void {

        $sesionActual = verificarAutenticacion();

        $solicitud = $this->service->obtenerSolicitudPorId($id);

        if (!$solicitud) {
            http_response_code(404);
            echo json_encode(["message" => "Solicitud no encontrada."]);
            return;
        }

        // Solo el postulante (o un admin) puede dar de baja su postulación
        exigirSelfOAdmin($sesionActual, (int)$solicitud['id_usuario']);

        try {
            $this->service->eliminarSolicitud($id);
            echo json_encode(["message" => "Postulación cancelada correctamente."]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 400);
            echo json_encode(["message" => $e->getMessage()]);
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

        // `ra` ve los postulados y su CV, pero no evalúa
        exigirRol(verificarAutenticacion(), ['jfc', 'admin']);

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