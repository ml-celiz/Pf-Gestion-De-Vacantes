<?php

/**
 * Cliente SMTP mínimo (sin dependencias) para enviar correos HTML.
 *
 * Se configura con variables de backend/.env:
 *   MAIL_HOST        smtp.gmail.com
 *   MAIL_PORT        587 (tls) o 465 (ssl)
 *   MAIL_ENCRYPTION  tls | ssl | none
 *   MAIL_USER        cuenta con la que se autentica
 *   MAIL_PASS        contraseña (en Gmail, una "contraseña de aplicación")
 *   MAIL_FROM        remitente (por defecto MAIL_USER)
 *   MAIL_FROM_NAME   nombre visible del remitente
 *
 * Si MAIL_HOST no está configurado, enviar() lanza RuntimeException.
 */
class Mailer {
    private string $host;
    private int $port;
    private string $encryption;
    private string $user;
    private string $pass;
    private string $from;
    private string $fromName;

    /** @var resource|null */
    private $socket = null;

    public function __construct() {
        $this->host       = $_ENV['MAIL_HOST'] ?? '';
        $this->port       = (int)($_ENV['MAIL_PORT'] ?? 587);
        $this->encryption = strtolower($_ENV['MAIL_ENCRYPTION'] ?? 'tls');
        $this->user       = $_ENV['MAIL_USER'] ?? '';
        $this->pass       = $_ENV['MAIL_PASS'] ?? '';
        $this->from       = $_ENV['MAIL_FROM'] ?? $this->user;
        $this->fromName   = $_ENV['MAIL_FROM_NAME'] ?? 'Gestión de Vacantes';
    }

    public function estaConfigurado(): bool {
        return $this->host !== '' && $this->from !== '';
    }

    public function enviar(string $para, string $asunto, string $html): void {
        if (!$this->estaConfigurado()) {
            throw new RuntimeException("El envío de correos no está configurado (MAIL_HOST / MAIL_FROM).");
        }

        try {
            $this->conectar();

            $this->comando("MAIL FROM:<{$this->from}>", [250]);
            $this->comando("RCPT TO:<{$para}>", [250, 251]);
            $this->comando("DATA", [354]);
            $this->comando($this->armarMensaje($para, $asunto, $html) . "\r\n.", [250]);
            $this->comando("QUIT", [221]);
        } finally {
            if (is_resource($this->socket)) {
                fclose($this->socket);
            }
            $this->socket = null;
        }
    }

    private function conectar(): void {
        $esquema = $this->encryption === 'ssl' ? 'ssl://' : 'tcp://';

        $this->socket = @stream_socket_client(
            $esquema . $this->host . ':' . $this->port,
            $errno,
            $errstr,
            15
        );

        if (!$this->socket) {
            throw new RuntimeException("No se pudo conectar al servidor SMTP: $errstr ($errno)");
        }

        stream_set_timeout($this->socket, 15);

        $this->leerRespuesta([220]);
        $this->comando("EHLO " . $this->nombreHost(), [250]);

        if ($this->encryption === 'tls') {
            $this->comando("STARTTLS", [220]);

            if (!stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException("No se pudo iniciar TLS con el servidor SMTP.");
            }

            $this->comando("EHLO " . $this->nombreHost(), [250]);
        }

        if ($this->user !== '') {
            $this->comando("AUTH LOGIN", [334]);
            $this->comando(base64_encode($this->user), [334]);
            $this->comando(base64_encode($this->pass), [235]);
        }
    }

    private function armarMensaje(string $para, string $asunto, string $html): string {
        $cabeceras = [
            'Date: ' . date('r'),
            'From: ' . $this->codificar($this->fromName) . " <{$this->from}>",
            "To: <{$para}>",
            'Subject: ' . $this->codificar($asunto),
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
        ];

        $cuerpo = rtrim(chunk_split(base64_encode($html), 76, "\r\n"));

        return implode("\r\n", $cabeceras) . "\r\n\r\n" . $cuerpo;
    }

    // Cabeceras con acentos (RFC 2047)
    private function codificar(string $texto): string {
        return '=?UTF-8?B?' . base64_encode($texto) . '?=';
    }

    private function nombreHost(): string {
        return gethostname() ?: 'localhost';
    }

    private function comando(string $linea, array $codigosEsperados): string {
        fwrite($this->socket, $linea . "\r\n");
        return $this->leerRespuesta($codigosEsperados);
    }

    private function leerRespuesta(array $codigosEsperados): string {
        $respuesta = '';

        // Las respuestas multilínea usan "250-..." y terminan con "250 ..."
        while (($linea = fgets($this->socket, 515)) !== false) {
            $respuesta .= $linea;
            if (strlen($linea) < 4 || $linea[3] === ' ') {
                break;
            }
        }

        $codigo = (int)substr($respuesta, 0, 3);

        if (!in_array($codigo, $codigosEsperados, true)) {
            throw new RuntimeException("Respuesta SMTP inesperada: " . trim($respuesta));
        }

        return $respuesta;
    }
}
