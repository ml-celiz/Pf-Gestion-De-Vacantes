<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Departamento.php';
require_once __DIR__ . '/../models/Catedra.php';
require_once __DIR__ . '/../utils/validaciones.php';

/*
* SERVICIO INSTITUCIONAL
* ABM de departamentos y cátedras. Cada cátedra pertenece a un departamento
* y tiene un jefe de cátedra (usuario con rol `jfc`).
* Ante un dato inválido se lanza RuntimeException (mensaje + HTTP status).
*/
class InstitucionalService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // =====================================================
    // DEPARTAMENTOS
    // =====================================================

    // Todos los departamentos, ordenados por id
    public function obtenerTodosDepartamentos(): array {
        $stmt = $this->db->query("SELECT * FROM public.departamentos ORDER BY id ASC");
        return array_map(fn($row) => (new Departamento($row))->toArray(), $stmt->fetchAll());
    }

    // Un departamento por id (null si no existe)
    public function obtenerDepartamentoPorId(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM public.departamentos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ? (new Departamento($row))->toArray() : null;
    }

    // Alta de un departamento { nombre }
    public function crearDepartamento(array $data): bool {
        $dept = new Departamento($data);

        $this->validarTexto($dept->nombre, 'nombre');

        try {
            $stmt = $this->db->prepare("INSERT INTO public.departamentos (nombre) VALUES (:nombre)");
            return $stmt->execute(['nombre' => trim($dept->nombre)]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear departamento: " . $e->getMessage());
            return false;
        }
    }

    // Modificación del nombre de un departamento
    public function actualizarDepartamento(int $id, array $data): bool {
        if (!$this->obtenerDepartamentoPorId($id)) return false;

        $dept = new Departamento($data);

        $this->validarTexto($dept->nombre, 'nombre');

        try {
            $stmt = $this->db->prepare("UPDATE public.departamentos SET nombre = :nombre WHERE id = :id");
            return $stmt->execute([
                'id'     => $id,
                'nombre' => trim($dept->nombre)
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar departamento: " . $e->getMessage());
            return false;
        }
    }

    // Baja física (falla si tiene cátedras asociadas)
    public function eliminarDepartamento(int $id): bool {
        try {
            $stmt = $this->db->prepare("DELETE FROM public.departamentos WHERE id = :id");
            $stmt->execute(['id' => $id]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error PDO al eliminar departamento: " . $e->getMessage());
            return false;
        }
    }

    // =====================================================
    // CÁTEDRAS
    // =====================================================

    // Consulta base: cátedra con el nombre de su departamento y de su jefe
    private const SQL_CATEDRAS = "
        SELECT
            c.id,
            c.nombre,
            c.id_departamento,
            c.id_usuario,
            d.nombre AS departamento_nombre,
            CONCAT_WS(' ', u.nombre, u.apellido) AS usuario_nombre
        FROM public.catedras c
        JOIN public.departamentos d ON c.id_departamento = d.id
        JOIN public.usuarios u ON c.id_usuario = u.id";

    // Todas las cátedras, ordenadas por id
    public function obtenerTodasCatedras(): array {
        $stmt = $this->db->query(self::SQL_CATEDRAS . " ORDER BY c.id ASC");

        return array_map(fn($row) => (new Catedra($row))->toArray(), $stmt->fetchAll());
    }

    // Una cátedra por id (null si no existe)
    public function obtenerCatedraPorId(int $id): ?array {
        $stmt = $this->db->prepare(self::SQL_CATEDRAS . " WHERE c.id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? (new Catedra($row))->toArray() : null;
    }

    // Alta de una cátedra { nombre, id_departamento, id_usuario }
    public function crearCatedra(array $data): bool {
        $catedra = new Catedra($data);

        $this->validarCatedra($catedra->nombre, $catedra->idDepartamento, $catedra->idUsuario);

        try {
            $stmt = $this->db->prepare("
                INSERT INTO public.catedras (nombre, id_departamento, id_usuario)
                VALUES (:nombre, :id_departamento, :id_usuario)
            ");

            return $stmt->execute([
                'nombre'          => trim($catedra->nombre),
                'id_departamento' => $catedra->idDepartamento,
                'id_usuario'      => $catedra->idUsuario
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear cátedra: " . $e->getMessage());
            return false;
        }
    }

    // Modificación de una cátedra (los campos que no llegan se conservan)
    public function actualizarCatedra(int $id, array $data): bool {
        $existente = $this->obtenerCatedraPorId($id);

        if (!$existente) {
            return false;
        }

        $catedra = new Catedra($data);

        $nombre         = $catedra->nombre ?: $existente['nombre'];
        $idDepartamento = $catedra->idDepartamento ?: (int)$existente['id_departamento'];
        $idUsuario      = $catedra->idUsuario ?: (int)$existente['id_usuario'];

        $this->validarCatedra($nombre, $idDepartamento, $idUsuario);

        try {
            $stmt = $this->db->prepare("
                UPDATE public.catedras
                SET
                    nombre = :nombre,
                    id_departamento = :id_departamento,
                    id_usuario = :id_usuario
                WHERE id = :id
            ");

            return $stmt->execute([
                'id'              => $id,
                'nombre'          => trim($nombre),
                'id_departamento' => $idDepartamento,
                'id_usuario'      => $idUsuario
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar cátedra: " . $e->getMessage());
            return false;
        }
    }

    // Baja física (falla si tiene vacantes asociadas)
    public function eliminarCatedra(int $id): bool {
        try {
            $stmt = $this->db->prepare("DELETE FROM public.catedras WHERE id = :id");
            $stmt->execute(['id' => $id]);

            return $stmt->rowCount() > 0;
        } catch (PDOException $e) {
            error_log("Error PDO al eliminar cátedra: " . $e->getMessage());
            return false;
        }
    }

    // =====================================================
    // JEFES DE CÁTEDRA
    // =====================================================

    // Usuarios activos con rol jfc (para elegir el jefe de una cátedra)
    public function obtenerUsuariosJfc(): array {
        $stmt = $this->db->query("
            SELECT u.id, u.nombre, u.apellido, u.email
            FROM public.usuarios u
            JOIN public.roles_usuarios ru ON ru.id_usuario = u.id
            JOIN public.roles r ON r.id = ru.id_rol
            WHERE LOWER(r.nombre) = 'jfc'
              AND u.fecha_baja IS NULL
            ORDER BY u.apellido ASC, u.nombre ASC
        ");

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ¿El usuario está activo y tiene rol jfc?
    private function usuarioTieneRolJfc(int $idUsuario): bool {
        $stmt = $this->db->prepare("
            SELECT EXISTS (
                SELECT 1
                FROM public.usuarios u
                JOIN public.roles_usuarios ru ON ru.id_usuario = u.id
                JOIN public.roles r ON r.id = ru.id_rol
                WHERE u.id = :id_usuario
                  AND u.fecha_baja IS NULL
                  AND LOWER(r.nombre) = 'jfc'
            )
        ");

        $stmt->execute(['id_usuario' => $idUsuario]);

        return (bool)$stmt->fetchColumn();
    }

    // =====================================================
    // VALIDACIONES
    // =====================================================

    // Texto obligatorio de hasta 50 caracteres
    private function validarTexto(string $valor, string $campo): void {
        $error = validarTextoObligatorio($valor, $campo);

        if ($error !== null) {
            throw new RuntimeException($error, 400);
        }
    }

    // Nombre válido, departamento elegido y jefe con rol jfc
    private function validarCatedra(string $nombre, int $idDepartamento, int $idUsuario): void {
        $this->validarTexto($nombre, 'nombre');

        if (!$idDepartamento || !$this->obtenerDepartamentoPorId($idDepartamento)) {
            throw new RuntimeException("Seleccioná un departamento válido.", 400);
        }

        if (!$idUsuario || !$this->usuarioTieneRolJfc($idUsuario)) {
            throw new RuntimeException("El jefe de cátedra debe ser un usuario activo con rol jfc.", 400);
        }
    }
}
