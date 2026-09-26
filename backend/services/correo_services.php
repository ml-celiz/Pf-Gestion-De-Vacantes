<?php

require_once __DIR__ . '/../utils/Mailer.php';

/*
* Correos automáticos del sistema (bienvenida y recuperación de contraseña).
* Si el envío no está configurado lanza RuntimeException: quien llama decide
* si eso corta la operación o solo se registra en el log.
*/
class CorreoService {
    private Mailer $mailer;

    public function __construct() {
        $this->mailer = new Mailer();
    }

    // URL pública del frontend (backend/.env → APP_URL), sin la barra final
    public static function urlApp(): string {
        return rtrim($_ENV['APP_URL'] ?? 'http://localhost:5500', '/');
    }

    public function enviarBienvenida(string $email, string $nombre): void {
        $e = fn($valor) => htmlspecialchars((string)$valor, ENT_QUOTES, 'UTF-8');
        $url = self::urlApp();

        $this->mailer->enviar(
            $email,
            'Bienvenido/a a Gestión de Vacantes - UTN FRRO',
            $this->plantilla(
                '¡Tu cuenta fue creada!',
                "<p>Hola {$e($nombre)},</p>
                 <p>Tu cuenta en el sistema de <strong>Gestión de Vacantes</strong> de la
                    UTN Facultad Regional Rosario se creó correctamente con el correo
                    <strong>{$e($email)}</strong>.</p>
                 <p>Ya podés ingresar, cargar tu CV y postularte a las vacantes abiertas.</p>
                 {$this->boton($url, 'Ingresar al sistema')}"
            )
        );
    }

    public function enviarRecuperacion(string $email, string $nombre, string $link, int $minutos): void {
        $e = fn($valor) => htmlspecialchars((string)$valor, ENT_QUOTES, 'UTF-8');

        $this->mailer->enviar(
            $email,
            'Restablecer contraseña - Gestión de Vacantes UTN FRRO',
            $this->plantilla(
                'Restablecer tu contraseña',
                "<p>Hola {$e($nombre)},</p>
                 <p>Recibimos un pedido para restablecer la contraseña de tu cuenta.
                    Para elegir una nueva, hacé clic en el botón:</p>
                 {$this->boton($link, 'Restablecer contraseña')}
                 <p>El enlace vence en {$minutos} minutos y se puede usar una sola vez.</p>
                 <p style=\"font-size: 12px; color: #555;\">Si el botón no funciona, copiá este enlace en tu navegador:<br>
                    <span style=\"word-break: break-all;\">{$e($link)}</span></p>
                 <p>Si no pediste este cambio, ignorá este correo: tu contraseña sigue siendo la misma.</p>"
            )
        );
    }

    private function boton(string $url, string $texto): string {
        $url = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');

        return "<p style=\"margin: 24px 0;\">
                    <a href=\"{$url}\" style=\"background: #1a4d8f; color: #ffffff; padding: 12px 22px;
                       border-radius: 6px; text-decoration: none; font-weight: bold;\">{$texto}</a>
                </p>";
    }

    private function plantilla(string $titulo, string $contenido): string {
        return "
            <div style=\"font-family: Arial, sans-serif; color: #222; max-width: 600px;\">
                <h2 style=\"color: #1a4d8f;\">{$titulo}</h2>
                {$contenido}
                <hr style=\"border: none; border-top: 1px solid #ddd; margin: 24px 0;\">
                <p style=\"color: #777; font-size: 12px;\">
                    Gestión de Vacantes - UTN Facultad Regional Rosario.<br>
                    Este es un mensaje automático, por favor no respondas a este correo.
                </p>
            </div>";
    }
}
