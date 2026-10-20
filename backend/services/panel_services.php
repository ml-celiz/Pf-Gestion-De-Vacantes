<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Panel.php';
require_once __DIR__ . '/../utils/validaciones.php';

/*
* SERVICIO DE PANELES
* ABM de la tabla `paneles`. Un panel es una pantalla del frontend
* (vacantes, postulaciones, roles...); cada rol ve los paneles que tiene
* asignados en roles_paneles.
*/
class PanelService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    // Todos los paneles, ordenados por id
    public function obtenerTodos(): array {
        $stmt = $this->db->query("SELECT * FROM public.paneles ORDER BY id ASC");

        return array_map(fn($row) => (new Panel($row))->toArray(), $stmt->fetchAll());
    }

    // Un panel por id (null si no existe)
    public function obtenerPorId(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM public.paneles WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? (new Panel($row))->toArray() : null;
    }

    // Alta. Lanza RuntimeException si el nombre no es válido
    public function crear(array $data): bool {
        $panel = new Panel($data);

        $this->validarNombre($panel->nombre);

        try {
            $stmt = $this->db->prepare("INSERT INTO public.paneles (nombre) VALUES (:nombre)");
            return $stmt->execute(['nombre' => trim($panel->nombre)]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear panel: " . $e->getMessage());
            return false;
        }
    }

    // Modificación del nombre. Devuelve false si el panel no existe
    public function actualizar(int $id, array $data): bool {
        if (!$this->obtenerPorId($id)) {
            return false;
        }

        $panel = new Panel($data);

        $this->validarNombre($panel->nombre);

        try {
            $stmt = $this->db->prepare("UPDATE public.paneles SET nombre = :nombre WHERE id = :id");
            return $stmt->execute([
                'id'     => $id,
                'nombre' => trim($panel->nombre)
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar panel: " . $e->getMessage());
            return false;
        }
    }

    // Baja física. Devuelve false si no existía
    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM public.paneles WHERE id = :id");
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
