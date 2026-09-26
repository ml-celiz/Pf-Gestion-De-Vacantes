<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/correo_services.php';

/*
* RECUPERACIÓN DE CONTRASEÑA
*   1. solicitar(email): si la cuenta existe, envía un link con un token de
*      un solo uso que vence en MINUTOS_VIGENCIA. En la base solo se guarda
*      el hash del token.
*   2. restablecer(token, contraseña): valida el token, cambia la contraseña
*      y cierra las sesiones abiertas de ese usuario.
*/
class RecuperacionService {
    public const MINUTOS_VIGENCIA = 60;

    // No se manda otro correo si ya se pidió uno hace menos de esto
    private const SEGUNDOS_ENTRE_PEDIDOS = 60;

    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    /*
    * No informa si el email existe o no (así no se puede averiguar quién
    * tiene cuenta): el controlador responde siempre el mismo mensaje.
    */
    public function solicitar(string $email): void {
        $email = trim($email);

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new RuntimeException("Ingresá un correo electrónico válido.", 400);
        }

        $stmt = $this->db->prepare(
            "SELECT id, email, nombre FROM public.usuarios
             WHERE LOWER(email) = LOWER(:email) AND fecha_baja IS NULL
             LIMIT 1"
        );
        $stmt->execute(['email' => $email]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            return;
        }

        $stmt = $this->db->prepare(
            "SELECT 1 FROM public.recuperaciones_contrasena
             WHERE id_usuario = :id AND fecha_uso IS NULL
               AND fecha_alta > NOW() - (:segundos * INTERVAL '1 second')
             LIMIT 1"
        );
        $stmt->execute(['id' => $usuario['id'], 'segundos' => self::SEGUNDOS_ENTRE_PEDIDOS]);

        if ($stmt->fetchColumn() !== false) {
            return;
        }

        $token = bin2hex(random_bytes(32));

        $this->db->beginTransaction();

        try {
            // Un link nuevo invalida los anteriores
            $this->db->prepare(
                "UPDATE public.recuperaciones_contrasena SET fecha_uso = NOW()
                 WHERE id_usuario = :id AND fecha_uso IS NULL"
            )->execute(['id' => $usuario['id']]);

            $this->db->prepare(
                "INSERT INTO public.recuperaciones_contrasena (token_hash, fecha_expiracion, id_usuario)
                 VALUES (:hash, NOW() + (:minutos * INTERVAL '1 minute'), :id)"
            )->execute([
                'hash'    => hash('sha256', $token),
                'minutos' => self::MINUTOS_VIGENCIA,
                'id'      => $usuario['id']
            ]);

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        $link = CorreoService::urlApp() . '/?restablecer=' . $token;

        try {
            (new CorreoService())->enviarRecuperacion(
                $usuario['email'],
                $usuario['nombre'] ?? '',
                $link,
                self::MINUTOS_VIGENCIA
            );
        } catch (Throwable $e) {
            error_log("No se pudo enviar el correo de recuperación (usuario {$usuario['id']}): " . $e->getMessage());
            throw new RuntimeException("No se pudo enviar el correo. Intentá nuevamente en unos minutos.", 503);
        }
    }

    public function restablecer(string $token, string $contrasena): void {
        if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
            throw new RuntimeException("El enlace no es válido. Pedí uno nuevo.", 400);
        }

        if (strlen($contrasena) < 8) {
            throw new RuntimeException("La contraseña debe tener al menos 8 caracteres.", 400);
        }

        if (strlen($contrasena) > 72) {
            throw new RuntimeException("La contraseña puede tener como máximo 72 caracteres.", 400);
        }

        $stmt = $this->db->prepare(
            "SELECT r.id, r.id_usuario
             FROM public.recuperaciones_contrasena r
             JOIN public.usuarios u ON u.id = r.id_usuario
             WHERE r.token_hash = :hash
               AND r.fecha_uso IS NULL
               AND r.fecha_expiracion > NOW()
               AND u.fecha_baja IS NULL
             LIMIT 1"
        );
        $stmt->execute(['hash' => hash('sha256', $token)]);
        $pedido = $stmt->fetch();

        if (!$pedido) {
            throw new RuntimeException("El enlace venció o ya fue usado. Pedí uno nuevo.", 400);
        }

        $this->db->beginTransaction();

        try {
            $this->db->prepare(
                "UPDATE public.usuarios
                 SET contrasena = :contrasena, fecha_actualizacion = NOW()
                 WHERE id = :id"
            )->execute([
                'contrasena' => password_hash($contrasena, PASSWORD_BCRYPT),
                'id'         => $pedido['id_usuario']
            ]);

            $this->db->prepare(
                "UPDATE public.recuperaciones_contrasena SET fecha_uso = NOW()
                 WHERE id_usuario = :id AND fecha_uso IS NULL"
            )->execute(['id' => $pedido['id_usuario']]);

            // Con la contraseña nueva, las sesiones abiertas dejan de valer
            $this->db->prepare(
                "UPDATE public.sesiones SET activo = false, fecha_logout = NOW()
                 WHERE id_usuario = :id AND activo = true"
            )->execute(['id' => $pedido['id_usuario']]);

            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
