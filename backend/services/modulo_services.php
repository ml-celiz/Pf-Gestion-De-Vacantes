<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Modulo.php';
require_once __DIR__ . '/../utils/validaciones.php';

/*
* SERVICIO DE MÓDULOS
* ABM de la tabla `modulos`. Un módulo es un recurso del sistema (vacantes,
* usuarios, roles...) sobre el que cada rol tiene permisos de leer,
* escribir y editar (tabla roles_modulos).
*/
class ModuloService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // Todos los módulos, ordenados por id
    public function obtenerTodos(): array {
        $stmt = $this->db->query("SELECT * FROM public.modulos ORDER BY id ASC");

        return array_map(fn($row) => (new Modulo($row))->toArray(), $stmt->fetchAll());
    }

    // Un módulo por id (null si no existe)
    public function obtenerPorId(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM public.modulos WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? (new Modulo($row))->toArray() : null;
    }

    // Alta. Lanza RuntimeException si el nombre no es válido
    public function crear(array $data): bool {
        $modulo = new Modulo($data);

        $this->validarNombre($modulo->nombre);

        try {
            $stmt = $this->db->prepare("INSERT INTO public.modulos (nombre) VALUES (:nombre)");
            return $stmt->execute(['nombre' => trim($modulo->nombre)]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear módulo: " . $e->getMessage());
            return false;
        }
    }

    // Modificación del nombre. Devuelve false si el módulo no existe
    public function actualizar(int $id, array $data): bool {
        if (!$this->obtenerPorId($id)) {
            return false;
        }

        $modulo = new Modulo($data);

        $this->validarNombre($modulo->nombre);

        try {
            $stmt = $this->db->prepare("UPDATE public.modulos SET nombre = :nombre WHERE id = :id");
            return $stmt->execute([
                'id'     => $id,
                'nombre' => trim($modulo->nombre)
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar módulo: " . $e->getMessage());
            return false;
        }
    }

    // Baja física. Devuelve false si no existía
    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM public.modulos WHERE id = :id");
        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }

    private function validarNombre(string $nombre): void {
        $error = validarTextoObligatorio($nombre, 'nombre');

        if ($error !== null) {
            throw new RuntimeException($error, 400);
        }
    }
}
