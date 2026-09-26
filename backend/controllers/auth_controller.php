<?php

require_once __DIR__ . '/../services/auth_services.php';
require_once __DIR__ . '/../services/usuario_services.php';
require_once __DIR__ . '/../models/Sesion.php';
require_once __DIR__ . '/../services/correo_services.php';
require_once __DIR__ . '/../services/recuperacion_services.php';

class AuthController {

    /*
    * Registro público: cualquiera puede crear su cuenta desde el login.
    * El rol lo fija el servicio (siempre `pos`), nunca el cuerpo del pedido.
    */
    public function registro(): void {

        $input = json_decode(file_get_contents("php://input"), true) ?? [];

        $service = new UsuarioService();

        try {

            $id = $service->registrar($input);

        } catch (RuntimeException $e) {

            http_response_code($e->getCode() ?: 400);
            echo json_encode(["message" => $e->getMessage()]);
            return;
        }

        // Correo de bienvenida: si falla, la cuenta igual queda creada
        try {
            (new CorreoService())->enviarBienvenida(
                trim($input['email'] ?? ''),
                trim($input['nombre'] ?? '')
            );
        } catch (Throwable $e) {
            error_log("No se pudo enviar el correo de bienvenida (usuario $id): " . $e->getMessage());
        }

        http_response_code(201);
        echo json_encode([
            "message" => "Cuenta creada correctamente. Ya podés iniciar sesión.",
            "id"      => $id
        ]);
    }

    // POST /api/auth/recuperar  { email }
    public function solicitarRecuperacion(): void {
        $input = json_decode(file_get_contents("php://input"), true) ?? [];

        try {
            (new RecuperacionService())->solicitar((string)($input['email'] ?? ''));
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 400);
            echo json_encode(["message" => $e->getMessage()]);
            return;
        }

        // Mismo mensaje exista o no la cuenta
        echo json_encode([
            "message" => "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña. Revisá tu bandeja de entrada (y la carpeta de spam)."
        ]);
    }

    // POST /api/auth/restablecer  { token, contrasena }
    public function restablecerContrasena(): void {
        $input = json_decode(file_get_contents("php://input"), true) ?? [];

        try {
            (new RecuperacionService())->restablecer(
                (string)($input['token'] ?? ''),
                (string)($input['contrasena'] ?? '')
            );
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 400);
            echo json_encode(["message" => $e->getMessage()]);
            return;
        }

        echo json_encode([
            "message" => "¡Listo! Tu contraseña fue actualizada. Ya podés iniciar sesión."
        ]);
    }


    public function login(): void {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $email = $data['email'] ?? '';
        $password = $data['contrasenea'] ?? $data['contrasena'] ?? '';

        // 1. Obtener la entidad UsuarioModel desde el servicio
        $usuario = obtenerUsuarioPorEmail($email);

        // 2. Validar contraseña contra la propiedad de la entidad
        if (!$usuario || !password_verify($password, $usuario->contrasena)) {
            http_response_code(401);
            echo json_encode(["message" => "Credenciales inválidas."]);
            return;
        }

        // 3. Generar token
        $token = bin2hex(random_bytes(32));

        // 4. Obtener roles del usuario
        $roles = obtenerRolesUsuario($usuario->id);

        // 5. Obtener duración del token según el rol
        $tokenDuracion = obtenerDuracionTokenUsuario($usuario->id);

        // 6. Registrar sesión con su duración
        $sesionModel = new SesionModel();

        $sesionModel->crearSesion(
            $usuario->id,
            $token,
            $tokenDuracion
        );

        // 7. Responder
        http_response_code(200);
        echo json_encode([
            "message" => "Login exitoso",
            "token" => $token,
            "usuario" => [
                "id"     => $usuario->id,
                "nombre" => $usuario->nombre,
                "apellido" => $usuario->apellido,
                "email"  => $usuario->email,
                "roles"  => $roles
            ]
        ]);
    }

    public function logout(): void {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        $token = str_replace('Bearer ', '', $authHeader);

        if ($token) {
            $sesionModel = new SesionModel();
            $sesionModel->cerrarSesion($token);
        }

        http_response_code(200);
        echo json_encode(["message" => "Sesión cerrada correctamente."]);
    }
}