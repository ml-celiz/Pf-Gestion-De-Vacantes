<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Panel.php';

class PanelService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function obtenerTodos(): array {
        $sql = "SELECT * FROM public.paneles ORDER BY id ASC";
        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => (new Panel($row))->toArray(), $rows);
    }

    public function obtenerPorId(int $id): ?array {
        $sql = "SELECT * FROM public.paneles WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? (new Panel($row))->toArray() : null;
    }

    public function crear(array $data): bool {
        $panel = new Panel($data);

        if (empty($panel->nombre)) {
            return false;
        }

        try {
            $sql = "INSERT INTO public.paneles (nombre) VALUES (:nombre)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute(['nombre' => $panel->nombre]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear panel: " . $e->getMessage());
            return false;
        }
    }

    public function actualizar(int $id, array $data): bool {
        $panelExistente = $this->obtenerPorId($id);
        if (!$panelExistente) {
            return false;
        }

        $panel = new Panel($data);

        try {
            $sql = "UPDATE public.paneles SET nombre = :nombre WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id'     => $id,
                'nombre' => $panel->nombre ?: $panelExistente['nombre']
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar panel: " . $e->getMessage());
            return false;
        }
    }

    public function eliminar(int $id): bool {
        $sql = "DELETE FROM public.paneles WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }
}