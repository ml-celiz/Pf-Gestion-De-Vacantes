<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Vacante.php';
require_once __DIR__ . '/../models/SolicitudVacante.php';
require_once __DIR__ . '/../models/OrdenMerito.php';

class VacanteService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // ==========================================
    // 1. VACANTES
    // ==========================================

    public function obtenerVacantes(?int $idUsuario = null): array {
        if ($idUsuario !== null) {
            $sql = "SELECT v.*, e.nombre as estado_nombre 
                    FROM public.vacantes v
                    JOIN public.estados e ON v.id_estado = e.id
                    WHERE v.id_usuario = :id_usuario ORDER BY v.id ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id_usuario' => $idUsuario]);
        } else {
            $sql = "SELECT v.*, e.nombre as estado_nombre 
                    FROM public.vacantes v
                    JOIN public.estados e ON v.id_estado = e.id
                    ORDER BY v.id ASC";
            $stmt = $this->db->query($sql);
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerVacantePorId(int $id): ?array {
        $sql = "SELECT v.*, e.nombre as estado_nombre 
                FROM public.vacantes v
                JOIN public.estados e ON v.id_estado = e.id
                WHERE v.id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function crearVacante(array $data): bool {
        $vacante = new Vacante($data);
        if (empty($vacante->titulo) || !$vacante->idEstado || !$vacante->idCatedra || !$vacante->idUsuario) {
            return false;
        }

        try {
            $sql = "INSERT INTO public.vacantes (titulo, descripcion, requisitos, inicio, fin, id_estado, id_catedra, id_usuario)
                    VALUES (:titulo, :descripcion, :requisitos, :inicio, :fin, :id_estado, :id_catedra, :id_usuario)";
            $stmt = $this->db->prepare($sql);

            $reqJson = is_array($vacante->requisitos) ? json_encode($vacante->requisitos) : $vacante->requisitos;

            return $stmt->execute([
                'titulo'      => $vacante->titulo,
                'descripcion' => $vacante->descripcion,
                'requisitos'  => $reqJson,
                'inicio'      => $vacante->inicio ?? date('Y-m-d H:i:sP'),
                'fin'         => $vacante->fin,
                'id_estado'   => $vacante->idEstado,
                'id_catedra'  => $vacante->idCatedra,
                'id_usuario'  => $vacante->idUsuario
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear vacante: " . $e->getMessage());
            return false;
        }
    }

    public function actualizarVacante(int $id, array $data): bool {
        $existente = $this->obtenerVacantePorId($id);
        if (!$existente) return false;

        try {
            $reqJson = isset($data['requisitos']) 
                ? (is_array($data['requisitos']) ? json_encode($data['requisitos']) : $data['requisitos'])
                : $existente['requisitos'];

            $sql = "UPDATE public.vacantes 
                    SET titulo = :titulo, descripcion = :descripcion, requisitos = :requisitos,
                        inicio = :inicio, fin = :fin, id_estado = :id_estado,
                        id_catedra = :id_catedra, id_usuario = :id_usuario
                    WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id'          => $id,
                'titulo'      => $data['titulo'] ?? $existente['titulo'],
                'descripcion' => $data['descripcion'] ?? $existente['descripcion'],
                'requisitos'  => $reqJson,
                'inicio'      => $data['inicio'] ?? $existente['inicio'],
                'fin'         => $data['fin'] ?? $existente['fin'],
                'id_estado'   => $data['id_estado'] ?? $existente['id_estado'],
                'id_catedra'  => $data['id_catedra'] ?? $existente['id_catedra'],
                'id_usuario'  => $data['id_usuario'] ?? $existente['id_usuario']
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar vacante: " . $e->getMessage());
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

    public function obtenerSolicitudes(?int $idUsuario = null): array {
        if ($idUsuario !== null) {
            $sql = "SELECT s.*, e.nombre as estado_nombre, v.titulo as vacante_titulo
                    FROM public.solicitudes_vacantes s
                    JOIN public.estados e ON s.id_estado = e.id
                    JOIN public.vacantes v ON s.id_vacante = v.id
                    WHERE s.id_usuario = :id_usuario ORDER BY s.id ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id_usuario' => $idUsuario]);
        } else {
            $sql = "SELECT s.*, e.nombre as estado_nombre, v.titulo as vacante_titulo
                    FROM public.solicitudes_vacantes s
                    JOIN public.estados e ON s.id_estado = e.id
                    JOIN public.vacantes v ON s.id_vacante = v.id
                    ORDER BY s.id ASC";
            $stmt = $this->db->query($sql);
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function obtenerSolicitudPorId(int $id): ?array {
        $sql = "SELECT s.*, e.nombre as estado_nombre, v.titulo as vacante_titulo
                FROM public.solicitudes_vacantes s
                JOIN public.estados e ON s.id_estado = e.id
                JOIN public.vacantes v ON s.id_vacante = v.id
                WHERE s.id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function crearSolicitud(array $data): bool {
        $solicitud = new SolicitudVacante($data);
        if (empty($solicitud->cv) || !$solicitud->idEstado || !$solicitud->idVacante || !$solicitud->idUsuario) {
            return false;
        }

        try {
            $sql = "INSERT INTO public.solicitudes_vacantes (fecha_postulacion, cv, id_estado, id_vacante, id_usuario)
                    VALUES (:fecha_postulacion, :cv, :id_estado, :id_vacante, :id_usuario)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'fecha_postulacion' => $solicitud->fechaPostulacion ?? date('Y-m-d H:i:sP'),
                'cv'                => $solicitud->cv,
                'id_estado'         => $solicitud->idEstado,
                'id_vacante'        => $solicitud->idVacante,
                'id_usuario'        => $solicitud->idUsuario
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear solicitud: " . $e->getMessage());
            return false;
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

    public function obtenerOrdenesMerito(): array {
        $sql = "SELECT om.*, s.id_usuario, u.usuario as usuario_nombre, s.id_vacante
                FROM public.ordenes_merito om
                JOIN public.solicitudes_vacantes s ON om.id_solicitud = s.id
                JOIN public.usuarios u ON s.id_usuario = u.id
                ORDER BY om.posicion ASC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crearOrdenMerito(array $data): bool {
        $om = new OrdenMerito($data);
        if (!$om->idSolicitud) return false;

        try {
            $sql = "INSERT INTO public.ordenes_merito (puntaje, posicion, observaciones, fecha_publicacion, id_solicitud)
                    VALUES (:puntaje, :posicion, :observaciones, :fecha_publicacion, :id_solicitud)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'puntaje'           => $om->puntaje,
                'posicion'          => $om->posicion,
                'observaciones'     => $om->observaciones,
                'fecha_publicacion' => $om->fechaPublicacion ?? date('H:i:sP'),
                'id_solicitud'      => $om->idSolicitud
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear orden de mérito: " . $e->getMessage());
            return false;
        }
    }
}