<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Departamento.php';
require_once __DIR__ . '/../models/Catedra.php';

class InstitucionalService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // --- DEPARTAMENTOS ---

    public function obtenerTodosDepartamentos(): array {
        $stmt = $this->db->query("SELECT * FROM public.departamentos ORDER BY id ASC");
        return array_map(fn($row) => (new Departamento($row))->toArray(), $stmt->fetchAll());
    }

    public function obtenerDepartamentoPorId(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM public.departamentos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? (new Departamento($row))->toArray() : null;
    }

    public function crearDepartamento(array $data): bool {
        $dept = new Departamento($data);
        if (empty($dept->nombre)) return false;

        try {
            $stmt = $this->db->prepare("INSERT INTO public.departamentos (nombre) VALUES (:nombre)");
            return $stmt->execute(['nombre' => $dept->nombre]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear departamento: " . $e->getMessage());
            return false;
        }
    }

    public function actualizarDepartamento(int $id, array $data): bool {
        $existente = $this->obtenerDepartamentoPorId($id);
        if (!$existente) return false;

        $dept = new Departamento($data);
        try {
            $stmt = $this->db->prepare("UPDATE public.departamentos SET nombre = :nombre WHERE id = :id");
            return $stmt->execute([
                'id'     => $id,
                'nombre' => $dept->nombre ?: $existente['nombre']
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar departamento: " . $e->getMessage());
            return false;
        }
    }

    public function eliminarDepartamento(int $id): bool {

        try {

            $stmt = $this->db->prepare(
                "DELETE FROM public.departamentos
                WHERE id = :id"
            );

            $stmt->execute([
                'id' => $id
            ]);

            return $stmt->rowCount() > 0;

        } catch (PDOException $e) {

            error_log(
                "Error PDO al eliminar departamento: "
                . $e->getMessage()
            );

            return false;
        }
    }

    // --- CÁTEDRAS ---

    public function obtenerTodasCatedras(): array {

        $sql = "SELECT
                    c.id,
                    c.nombre,
                    c.id_departamento,
                    c.id_usuario,

                    d.nombre AS departamento_nombre,

                    CONCAT_WS(
                        ' ',
                        u.nombre,
                        u.apellido
                    ) AS usuario_nombre

                FROM public.catedras c

                JOIN public.departamentos d
                    ON c.id_departamento = d.id

                JOIN public.usuarios u
                    ON c.id_usuario = u.id

                ORDER BY c.id ASC";


        $stmt =
            $this->db->query($sql);


        return array_map(
            fn($row) =>
                (new Catedra($row))->toArray(),
            $stmt->fetchAll(PDO::FETCH_ASSOC)
        );
    }

    public function obtenerCatedraPorId(int $id): ?array {

        $sql = "SELECT
                    c.id,
                    c.nombre,
                    c.id_departamento,
                    c.id_usuario,

                    d.nombre AS departamento_nombre,

                    CONCAT_WS(
                        ' ',
                        u.nombre,
                        u.apellido
                    ) AS usuario_nombre

                FROM public.catedras c

                JOIN public.departamentos d
                    ON c.id_departamento = d.id

                JOIN public.usuarios u
                    ON c.id_usuario = u.id

                WHERE c.id = :id";


        $stmt =
            $this->db->prepare($sql);


        $stmt->execute([
            'id' => $id
        ]);


        $row =
            $stmt->fetch(PDO::FETCH_ASSOC);


        return $row
            ? (new Catedra($row))->toArray()
            : null;
    }

    public function crearCatedra(array $data): bool {

        $catedra = new Catedra($data);

        if (
            empty($catedra->nombre) ||
            !$catedra->idDepartamento ||
            !$catedra->idUsuario
        ) {
            return false;
        }

        // El usuario asignado a una cátedra debe tener rol jfc
        if (!$this->usuarioTieneRolJfc($catedra->idUsuario)) {
            return false;
        }

        try {

            $sql = "INSERT INTO public.catedras
                        (
                            nombre,
                            id_departamento,
                            id_usuario
                        )
                    VALUES
                        (
                            :nombre,
                            :id_departamento,
                            :id_usuario
                        )";

            $stmt = $this->db->prepare($sql);

            return $stmt->execute([
                'nombre' =>
                    $catedra->nombre,

                'id_departamento' =>
                    $catedra->idDepartamento,

                'id_usuario' =>
                    $catedra->idUsuario
            ]);

        } catch (PDOException $e) {

            error_log(
                "Error PDO al crear cátedra: "
                . $e->getMessage()
            );

            return false;
        }
    }

    public function actualizarCatedra(int $id, array $data): bool {

        $existente = $this->obtenerCatedraPorId($id);

        if (!$existente) {
            return false;
        }

        $catedra = new Catedra($data);

        $idDepartamento =
            $catedra->idDepartamento
                ?: $existente['id_departamento'];

        $idUsuario =
            $catedra->idUsuario
                ?: $existente['id_usuario'];

        $nombre =
            $catedra->nombre
                ?: $existente['nombre'];

        // El usuario asignado debe tener rol jfc
        if (!$this->usuarioTieneRolJfc($idUsuario)) {
            return false;
        }

        try {

            $sql = "UPDATE public.catedras
                    SET
                        nombre = :nombre,
                        id_departamento = :id_departamento,
                        id_usuario = :id_usuario
                    WHERE id = :id";

            $stmt = $this->db->prepare($sql);

            return $stmt->execute([

                'id' =>
                    $id,

                'nombre' =>
                    $nombre,

                'id_departamento' =>
                    $idDepartamento,

                'id_usuario' =>
                    $idUsuario
            ]);

        } catch (PDOException $e) {

            error_log(
                "Error PDO al actualizar cátedra: "
                . $e->getMessage()
            );

            return false;
        }
    }

    public function eliminarCatedra(int $id): bool {

        try {

            $stmt = $this->db->prepare(
                "DELETE FROM public.catedras
                WHERE id = :id"
            );

            $stmt->execute([
                'id' => $id
            ]);

            return $stmt->rowCount() > 0;

        } catch (PDOException $e) {

            error_log(
                "Error PDO al eliminar cátedra: "
                . $e->getMessage()
            );

            return false;
        }
    }

    // ----- HELPERS -----

    public function obtenerUsuariosJfc(): array {

        $sql = "SELECT
                    u.id,
                    u.nombre,
                    u.apellido,
                    u.email
                FROM public.usuarios u
                JOIN public.roles_usuarios ru
                    ON ru.id_usuario = u.id
                JOIN public.roles r
                    ON r.id = ru.id_rol
                WHERE LOWER(r.nombre) = 'jfc'
                AND u.fecha_baja IS NULL
                ORDER BY u.apellido ASC, u.nombre ASC";

        $stmt = $this->db->query($sql);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function usuarioTieneRolJfc(int $idUsuario): bool {

        $sql = "SELECT EXISTS (
                    SELECT 1
                    FROM public.usuarios u
                    JOIN public.roles_usuarios ru
                        ON ru.id_usuario = u.id
                    JOIN public.roles r
                        ON r.id = ru.id_rol
                    WHERE u.id = :id_usuario
                    AND u.fecha_baja IS NULL
                    AND LOWER(r.nombre) = 'jfc'
                )";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            ':id_usuario' => $idUsuario
        ]);

        return (bool)$stmt->fetchColumn();
    }
}