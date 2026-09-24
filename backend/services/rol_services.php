<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Rol.php';

class RolService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // --- ROL ---

    public function obtenerTodos(): array {
        $stmt = $this->db->query("SELECT * FROM public.roles ORDER BY id ASC");
        return array_map(fn($row) => (new Rol($row))->toArray(), $stmt->fetchAll());
    }

    public function obtenerPorId(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM public.roles WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? (new Rol($row))->toArray() : null;
    }

    public function crear(array $data): int|false {

        $rol = new Rol($data);

        if (empty($rol->nombre)) {
            return false;
        }

        try {

            $stmt = $this->db->prepare("
                INSERT INTO public.roles (
                    nombre,
                    token_duracion
                )
                VALUES (
                    :nombre,
                    :token_duracion
                )
                RETURNING id
            ");

            $stmt->execute([
                'nombre'         => $rol->nombre,
                'token_duracion' => $rol->duracionToken
            ]);

            $id = $stmt->fetchColumn();

            return $id !== false
                ? (int)$id
                : false;

        } catch (PDOException $e) {
            error_log("Error PDO: " . $e->getMessage());
            return false;
        }
    }

    public function actualizar(int $id, array $data): bool {
        $rolExistente = $this->obtenerPorId($id);

        if (!$rolExistente) {
            return false;
        }

        $rol = new Rol($data);

        try {
            $stmt = $this->db->prepare("
                UPDATE public.roles
                SET
                    nombre = :nombre,
                    token_duracion = :token_duracion
                WHERE id = :id
            ");

            return $stmt->execute([
                'id'             => $id,
                'nombre'         => $rol->nombre ?: $rolExistente['nombre'],
                'token_duracion' => $rol->duracionToken !== null
                    ? $rol->duracionToken
                    : $rolExistente['duracion_token']
            ]);

        } catch (PDOException $e) {
            error_log("Error PDO: " . $e->getMessage());
            return false;
        }
    }

    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM public.roles WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // --- ROLES_PANELES ---

    public function obtenerPanelesPorRol(int $idRol): array {
        $sql = "SELECT rp.id, rp.id_rol, rp.id_panel, p.nombre as panel_nombre 
                FROM public.roles_paneles rp
                JOIN public.paneles p ON rp.id_panel = p.id
                WHERE rp.id_rol = :id_rol";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id_rol' => $idRol]);
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => (new RolPanel($row))->toArray(), $rows);
    }

    public function asignarPanel(int $idRol, int $idPanel): bool {
        try {
            $sql = "INSERT INTO public.roles_paneles (id_rol, id_panel) VALUES (:id_rol, :id_panel)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute(['id_rol' => $idRol, 'id_panel' => $idPanel]);
        } catch (PDOException $e) {
            error_log("Error PDO: " . $e->getMessage());
            return false;
        }
    }

    public function desasignarPanel(int $idRol, int $idPanel): bool {
        $sql = "DELETE FROM public.roles_paneles WHERE id_rol = :id_rol AND id_panel = :id_panel";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id_rol' => $idRol, 'id_panel' => $idPanel]);
        return $stmt->rowCount() > 0;
    }

    // --- ROLES_MODULOS ---

    public function obtenerModulosPorRol(int $idRol): array {
        $sql = "SELECT rm.id, rm.id_rol, rm.id_modulo, rm.leer, rm.escribir, rm.editar, m.nombre as modulo_nombre 
                FROM public.roles_modulos rm
                JOIN public.modulos m ON rm.id_modulo = m.id
                WHERE rm.id_rol = :id_rol";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id_rol' => $idRol]);
        $rows = $stmt->fetchAll();
        return array_map(fn($row) => (new RolModulo($row))->toArray(), $rows);
    }

    public function asignarModulo(int $idRol, array $data): bool {
        $rel = new RolModulo($data);
        $rel->idRol = $idRol;

        if (!$rel->idModulo) return false;

        try {
            $sql = "INSERT INTO public.roles_modulos (id_rol, id_modulo, leer, escribir, editar) 
                    VALUES (:id_rol, :id_modulo, :leer, :escribir, :editar)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id_rol'    => $rel->idRol,
                'id_modulo' => $rel->idModulo,
                'leer'      => $rel->leer ? 'true' : 'false',
                'escribir'  => $rel->escribir ? 'true' : 'false',
                'editar'    => $rel->editar ? 'true' : 'false'
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO: " . $e->getMessage());
            return false;
        }
    }

    public function actualizarPermisosModulo(int $idRol, int $idModulo, array $data): bool {
        $rel = new RolModulo($data);

        try {
            $sql = "UPDATE public.roles_modulos 
                    SET leer = :leer, escribir = :escribir, editar = :editar 
                    WHERE id_rol = :id_rol AND id_modulo = :id_modulo";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id_rol'    => $idRol,
                'id_modulo' => $idModulo,
                'leer'      => $rel->leer ? 'true' : 'false',
                'escribir'  => $rel->escribir ? 'true' : 'false',
                'editar'    => $rel->editar ? 'true' : 'false'
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO: " . $e->getMessage());
            return false;
        }
    }

    // --- ROLES_USUARIOS ---

    public function asignarUsuario(int $idRol, int $idUsuario): bool {
        try {
            $sql = "INSERT INTO public.roles_usuarios (id_rol, id_usuario) VALUES (:id_rol, :id_usuario)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute(['id_rol' => $idRol, 'id_usuario' => $idUsuario]);
        } catch (PDOException $e) {
            error_log("Error PDO: " . $e->getMessage());
            return false;
        }
    }

    public function desasignarUsuario(int $idRol, int $idUsuario): bool {
        $sql = "DELETE FROM public.roles_usuarios WHERE id_rol = :id_rol AND id_usuario = :id_usuario";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id_rol' => $idRol, 'id_usuario' => $idUsuario]);
        return $stmt->rowCount() > 0;
    }
}