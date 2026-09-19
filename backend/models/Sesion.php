<?php

require_once __DIR__ . '/../config/database.php';

class SesionModel {

    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function crearSesion(
        int $idUsuario,
        string $token,
        int $tokenDuracion
    ): bool {

        $sql = "INSERT INTO public.sesiones (
                    token,
                    fecha_login,
                    fecha_expiracion,
                    activo,
                    id_usuario
                )
                VALUES (
                    :token,
                    NOW(),
                    NOW() + (:token_duracion * INTERVAL '1 minute'),
                    true,
                    :id_usuario
                )";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            ':token' => $token,
            ':token_duracion' => $tokenDuracion,
            ':id_usuario' => $idUsuario
        ]);
    }

    public function obtenerSesionActiva(string $token): ?array {

        $sql = "SELECT
                    s.id,
                    s.token,
                    s.fecha_login,
                    s.fecha_expiracion,
                    s.id_usuario,
                    u.email,
                    u.nombre,
                    u.apellido
                FROM public.sesiones s
                JOIN public.usuarios u
                    ON s.id_usuario = u.id
                WHERE s.token = :token
                  AND s.activo = true
                  AND s.fecha_expiracion > NOW()
                  AND u.fecha_baja IS NULL
                LIMIT 1";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            ':token' => $token
        ]);

        $resultado = $stmt->fetch(PDO::FETCH_ASSOC);

        return $resultado ?: null;
    }

    public function cerrarSesion(string $token): bool {

        $sql = "UPDATE public.sesiones
                SET
                    activo = false,
                    fecha_logout = NOW()
                WHERE token = :token
                  AND activo = true";

        $stmt = $this->db->prepare($sql);

        return $stmt->execute([
            ':token' => $token
        ]);
    }
}