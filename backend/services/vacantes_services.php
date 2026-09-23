<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Vacante.php';
require_once __DIR__ . '/../models/SolicitudVacante.php';
require_once __DIR__ . '/../models/OrdenMerito.php';

class VacanteService {
    // Ids de public.estados
    public const ESTADO_VACANTE_ABIERTA    = 1;
    public const ESTADO_SOLICITUD_PENDIENTE = 4;
    public const ESTADO_SOLICITUD_ACEPTADA  = 5;
    public const ESTADO_SOLICITUD_CANCELADA = 6;

    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // ==========================================
    // 1. VACANTES
    // ==========================================

    public function obtenerVacantes(?int $idUsuario = null): array
    {
        $sql = "SELECT
                    v.id,
                    v.titulo,
                    v.descripcion,
                    v.requisitos,
                    v.inicio,
                    v.fin,
                    v.id_estado,
                    v.id_catedra,
                    v.id_usuario,

                    e.nombre AS estado_nombre,
                    c.nombre AS catedra_nombre

                FROM public.vacantes v

                JOIN public.estados e
                    ON v.id_estado = e.id

                JOIN public.catedras c
                    ON v.id_catedra = c.id

                WHERE v.id_estado IN (1, 2)";

        // Si se recibe un usuario, además se filtran
        // únicamente sus propias vacantes.
        if ($idUsuario !== null) {
            $sql .= " AND v.id_usuario = :id_usuario";
        }

        $sql .= " ORDER BY v.id ASC";

        $stmt = $this->db->prepare($sql);

        if ($idUsuario !== null) {
            $stmt->execute([
                'id_usuario' => $idUsuario
            ]);
        } else {
            $stmt->execute();
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(
            fn($row) =>
                (new Vacante($row))->toArray(),
            $rows
        );
    }

    public function obtenerVacantePorId(int $id): ?array {

        $sql = "SELECT
                    v.id,
                    v.titulo,
                    v.descripcion,
                    v.requisitos,
                    v.inicio,
                    v.fin,
                    v.id_estado,
                    v.id_catedra,
                    v.id_usuario,

                    e.nombre AS estado_nombre,
                    c.nombre AS catedra_nombre

                FROM public.vacantes v

                JOIN public.estados e
                    ON v.id_estado = e.id

                JOIN public.catedras c
                    ON v.id_catedra = c.id

                WHERE v.id = :id";


        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);


        $row =
            $stmt->fetch(PDO::FETCH_ASSOC);


        return $row
            ? (new Vacante($row))->toArray()
            : null;
    }

    public function crearVacante(
        array $data,
        int $idUsuario
    ): bool {

        $vacante = new Vacante($data);

        if (
            empty($vacante->titulo) ||
            !$vacante->idEstado ||
            !$vacante->idCatedra
        ) {
            return false;
        }

        try {

            $sql = "INSERT INTO public.vacantes
                        (
                            titulo,
                            descripcion,
                            requisitos,
                            inicio,
                            fin,
                            id_estado,
                            id_catedra,
                            id_usuario
                        )
                    VALUES
                        (
                            :titulo,
                            :descripcion,
                            :requisitos,
                            :inicio,
                            :fin,
                            :id_estado,
                            :id_catedra,
                            :id_usuario
                        )";

            $stmt = $this->db->prepare($sql);

            $reqJson =
                is_array($vacante->requisitos)
                    ? json_encode($vacante->requisitos)
                    : $vacante->requisitos;

            return $stmt->execute([

                'titulo' =>
                    $vacante->titulo,

                'descripcion' =>
                    $vacante->descripcion,

                'requisitos' =>
                    $reqJson,

                'inicio' =>
                    $vacante->inicio
                        ?? date('Y-m-d H:i:sP'),

                'fin' =>
                    $vacante->fin,

                'id_estado' =>
                    $vacante->idEstado,

                'id_catedra' =>
                    $vacante->idCatedra,

                // SIEMPRE sale de la sesión
                'id_usuario' =>
                    $idUsuario
            ]);

        } catch (PDOException $e) {
            error_log(
                "Error PDO al crear vacante: "
                . $e->getMessage()
            );
            return false;
        }
    }

    public function actualizarVacante(
        int $id,
        array $data
    ): bool {

        $existente =
            $this->obtenerVacantePorId($id);


        if (!$existente) {
            return false;
        }

        try {

            $reqJson =
                isset($data['requisitos'])
                    ? (
                        is_array($data['requisitos'])
                            ? json_encode($data['requisitos'])
                            : $data['requisitos']
                    )
                    : $existente['requisitos'];

            $sql = "UPDATE public.vacantes
                    SET
                        titulo = :titulo,
                        descripcion = :descripcion,
                        requisitos = :requisitos,
                        inicio = :inicio,
                        fin = :fin,
                        id_estado = :id_estado,
                        id_catedra = :id_catedra
                    WHERE id = :id";

            $stmt = $this->db->prepare($sql);

            return $stmt->execute([

                'id' =>
                    $id,

                'titulo' =>
                    $data['titulo']
                        ?? $existente['titulo'],

                'descripcion' =>
                    $data['descripcion']
                        ?? $existente['descripcion'],

                'requisitos' =>
                    $reqJson,

                'inicio' =>
                    $data['inicio']
                        ?? $existente['inicio'],

                'fin' =>
                    $data['fin']
                        ?? $existente['fin'],

                'id_estado' =>
                    $data['id_estado']
                        ?? $existente['id_estado'],

                'id_catedra' =>
                    $data['id_catedra']
                        ?? $existente['id_catedra']
            ]);

        } catch (PDOException $e) {
            error_log(
                "Error PDO al actualizar vacante: "
                . $e->getMessage()
            );
            return false;
        }
    }

    public function eliminarVacante(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM public.vacantes WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 2. SOLICITUDES / POSTULACIONES
    // ==========================================

    public function obtenerSolicitudes(?int $idVacante = null): array
    {
        $sql = "SELECT
                    s.id,
                    s.fecha_postulacion,
                    u.cv AS cv,
                    s.id_estado,

                    e.nombre AS estado_nombre,

                    s.id_vacante,
                    v.titulo AS vacante_titulo,

                    s.id_usuario,

                    u.nombre AS usuario_nombre,
                    u.apellido AS usuario_apellido,
                    u.email AS usuario_email,
                    u.dni AS usuario_dni,
                    u.telefono AS usuario_telefono

                FROM public.solicitudes_vacantes s

                JOIN public.estados e
                    ON s.id_estado = e.id

                JOIN public.vacantes v
                    ON s.id_vacante = v.id

                JOIN public.usuarios u
                    ON s.id_usuario = u.id";

        if ($idVacante !== null) {
            $sql .= " WHERE s.id_vacante = :id_vacante";
        }

        $sql .= " ORDER BY s.id ASC";

        $stmt = $this->db->prepare($sql);

        if ($idVacante !== null) {
            $stmt->execute([
                'id_vacante' => $idVacante
            ]);
        } else {
            $stmt->execute();
        }

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return array_map(
            fn($row) =>
                (new SolicitudVacante($row))->toArray(),
            $rows
        );
    }

    public function obtenerSolicitudPorId(int $id): ?array {
        $sql = "SELECT s.*, u.cv AS cv, e.nombre as estado_nombre, v.titulo as vacante_titulo
                FROM public.solicitudes_vacantes s
                JOIN public.estados e ON s.id_estado = e.id
                JOIN public.vacantes v ON s.id_vacante = v.id
                JOIN public.usuarios u ON s.id_usuario = u.id
                WHERE s.id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Postula a un usuario a una vacante.
     * La fecha es la actual y el estado inicial siempre es PENDIENTE.
     * Devuelve el id de la solicitud creada; ante un dato inválido lanza
     * RuntimeException cuyo código es el HTTP status a responder.
     */
    public function crearSolicitud(int $idVacante, int $idUsuario): int {
        if ($idVacante <= 0) {
            throw new RuntimeException("Debe indicar la vacante a la que desea postularse.", 400);
        }

        $stmt = $this->db->prepare("SELECT id_estado FROM public.vacantes WHERE id = :id");
        $stmt->execute(['id' => $idVacante]);
        $vacante = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$vacante) {
            throw new RuntimeException("Vacante no encontrada.", 404);
        }

        if ((int)$vacante['id_estado'] !== self::ESTADO_VACANTE_ABIERTA) {
            throw new RuntimeException("La vacante no está abierta para postulaciones.", 409);
        }

        $stmt = $this->db->prepare(
            "SELECT 1 FROM public.solicitudes_vacantes
             WHERE id_vacante = :id_vacante AND id_usuario = :id_usuario
             LIMIT 1"
        );
        $stmt->execute(['id_vacante' => $idVacante, 'id_usuario' => $idUsuario]);

        if ($stmt->fetchColumn() !== false) {
            throw new RuntimeException("Ya se encuentra postulado a esta vacante.", 409);
        }

        try {
            $stmt = $this->db->prepare(
                "INSERT INTO public.solicitudes_vacantes (fecha_postulacion, id_estado, id_vacante, id_usuario)
                 VALUES (NOW(), :id_estado, :id_vacante, :id_usuario)
                 RETURNING id"
            );
            $stmt->execute([
                'id_estado'  => self::ESTADO_SOLICITUD_PENDIENTE,
                'id_vacante' => $idVacante,
                'id_usuario' => $idUsuario
            ]);

            return (int)$stmt->fetchColumn();
        } catch (PDOException $e) {
            error_log("Error PDO al crear solicitud: " . $e->getMessage());
            throw new RuntimeException("No se pudo procesar la postulación.", 400);
        }
    }

    public function actualizarEstadoSolicitud(int $id, int $idEstado): bool {
        try {
            $stmt = $this->db->prepare("UPDATE public.solicitudes_vacantes SET id_estado = :id_estado WHERE id = :id");
            return $stmt->execute(['id' => $id, 'id_estado' => $idEstado]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar solicitud: " . $e->getMessage());
            return false;
        }
    }

    public function eliminarSolicitud(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM public.solicitudes_vacantes WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ==========================================
    // 3. ORDENES DE MÉRITO
    // ==========================================

    /**
     * Resultados generales: ordenes de mérito publicadas, de la mejor
     * posición (1) hacia abajo. Si se indica una vacante, solo las de esa vacante.
     * No incluye observaciones: son notas de la evaluación de cada postulante.
     */
    public function obtenerOrdenesMerito(?int $idVacante = null): array {
        $sql = "SELECT
                    om.id,
                    om.puntaje,
                    om.posicion,
                    om.fecha_publicacion,
                    om.id_solicitud,

                    s.id_usuario,
                    s.id_vacante,

                    u.dni AS usuario_dni

                FROM public.ordenes_merito om

                JOIN public.solicitudes_vacantes s
                    ON om.id_solicitud = s.id

                JOIN public.usuarios u
                    ON s.id_usuario = u.id";

        if ($idVacante !== null) {
            $sql .= " WHERE s.id_vacante = :id_vacante";
        }

        $sql .= " ORDER BY om.posicion ASC, om.id ASC";

        $stmt = $this->db->prepare($sql);

        if ($idVacante !== null) {
            $stmt->execute(['id_vacante' => $idVacante]);
        } else {
            $stmt->execute();
        }

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function existeOrdenMeritoDeSolicitud(int $idSolicitud): bool {
        $stmt = $this->db->prepare(
            "SELECT 1 FROM public.ordenes_merito WHERE id_solicitud = :id_solicitud LIMIT 1"
        );
        $stmt->execute(['id_solicitud' => $idSolicitud]);
        return $stmt->fetchColumn() !== false;
    }

    /**
     * Publica la orden de mérito de una postulación y actualiza el estado
     * de esa postulación (ACEPTADA o CANCELADA) en una misma transacción.
     * Devuelve el id creado, o false si los datos no son válidos; si la
     * postulación no existe o ya tiene orden de mérito lanza RuntimeException
     * cuyo código es el HTTP status a responder.
     */
    public function crearOrdenMerito(array $data): int|false {
        $om = new OrdenMerito($data);

        // El modelo convierte los faltantes en 0, por eso se valida sobre $data
        $puntajeValido  = isset($data['puntaje'])  && filter_var($data['puntaje'],  FILTER_VALIDATE_INT) !== false && (int)$data['puntaje']  >= 0;
        $posicionValida = isset($data['posicion']) && filter_var($data['posicion'], FILTER_VALIDATE_INT) !== false && (int)$data['posicion'] >= 1;

        $idEstado = filter_var($data['id_estado'] ?? null, FILTER_VALIDATE_INT);
        $estadoValido = in_array(
            $idEstado,
            [self::ESTADO_SOLICITUD_ACEPTADA, self::ESTADO_SOLICITUD_CANCELADA],
            true
        );

        if (!$om->idSolicitud || !$puntajeValido || !$posicionValida || !$estadoValido) {
            return false;
        }

        $stmt = $this->db->prepare("SELECT 1 FROM public.solicitudes_vacantes WHERE id = :id");
        $stmt->execute(['id' => $om->idSolicitud]);

        if ($stmt->fetchColumn() === false) {
            throw new RuntimeException("Solicitud no encontrada.", 404);
        }

        if ($this->existeOrdenMeritoDeSolicitud($om->idSolicitud)) {
            throw new RuntimeException("Este postulante ya tiene una orden de mérito publicada.", 409);
        }

        $observaciones = is_string($om->observaciones)
            ? trim($om->observaciones)
            : null;

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                "INSERT INTO public.ordenes_merito (puntaje, posicion, observaciones, fecha_publicacion, id_solicitud)
                 VALUES (:puntaje, :posicion, :observaciones, :fecha_publicacion, :id_solicitud)
                 RETURNING id"
            );
            $stmt->execute([
                'puntaje'           => $om->puntaje,
                'posicion'          => $om->posicion,
                'observaciones'     => $observaciones !== '' ? $observaciones : null,
                'fecha_publicacion' => $om->fechaPublicacion ?? date('H:i:sP'),
                'id_solicitud'      => $om->idSolicitud
            ]);

            $id = $stmt->fetchColumn();

            $stmt = $this->db->prepare(
                "UPDATE public.solicitudes_vacantes SET id_estado = :id_estado WHERE id = :id"
            );
            $stmt->execute([
                'id_estado' => $idEstado,
                'id'        => $om->idSolicitud
            ]);

            $this->db->commit();

            return $id !== false ? (int)$id : false;
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            error_log("Error PDO al crear orden de mérito: " . $e->getMessage());
            return false;
        }
    }

    // --- HELPERS ---
    public function obtenerEstados(): array {

        $sql = "SELECT
                    id,
                    nombre
                FROM public.estados
                WHERE id IN (1, 2, 3)
                ORDER BY id ASC";

        $stmt = $this->db->query($sql);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

}