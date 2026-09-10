<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Modulo.php';

class ModuloService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function obtenerTodos(): array {
        $sql = "SELECT * FROM public.modulos ORDER BY id ASC";
        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => (new Modulo($row))->toArray(), $rows);
    }

    public function obtenerPorId(int $id): ?array {
        $sql = "SELECT * FROM public.modulos WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? (new Modulo($row))->toArray() : null;
    }

    public function crear(array $data): bool {
        $modulo = new Modulo($data);

        if (empty($modulo->nombre)) {
            return false;
        }

        try {
            $sql = "INSERT INTO public.modulos (nombre) VALUES (:nombre)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute(['nombre' => $modulo->nombre]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear módulo: " . $e->getMessage());
            return false;
        }
    }

    public function actualizar(int $id, array $data): bool {
        $moduloExistente = $this->obtenerPorId($id);
        if (!$moduloExistente) {
            return false;
        }

        $modulo = new Modulo($data);

        try {
            $sql = "UPDATE public.modulos SET nombre = :nombre WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id'     => $id,
                'nombre' => $modulo->nombre ?: $moduloExistente['nombre']
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar módulo: " . $e->getMessage());
            return false;
        }
    }

    public function eliminar(int $id): bool {
        $sql = "DELETE FROM public.modulos WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }
}