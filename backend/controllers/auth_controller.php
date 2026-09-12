<?php

require_once __DIR__ . '/../services/auth_services.php';
require_once __DIR__ . '/../models/Sesion.php';

class AuthController {
    
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

        // 3. Generar token y registrar sesión
        $token = bin2hex(random_bytes(32));
        $sesionModel = new SesionModel();
        $sesionModel->crearSesion($usuario->id, $token);

        // 4. Obtener roles desde el servicio
        $roles = obtenerRolesUsuario($usuario->id);

        // 5. Responder
        http_response_code(200);
        echo json_encode([
            "message" => "Login exitoso",
            "token" => $token,
            "usuario" => [
                "id"     => $usuario->id,
                "nombre" => $usuario->nombre,
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