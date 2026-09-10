/*
1. Recepción: El usuario envía email y contrasenea.
2. Validación: Se busca al usuario por email y se verifica la contraseña guardada (usando password_verify() de PHP).
3. Consulta de Rol/Permisos: No necesitas pedirle al cliente qué rol tiene. Al autenticar, haces un JOIN con roles_usuarios, roles_paneles y roles_modulos para obtener de inmediato sus accesos activos.
4. Generación de Token: Creas un token criptográficamente seguro (ej. bin2hex(random_bytes(32))).
5. Registro de Sesión: Guardas la sesión en la base de datos:

SQL
INSERT INTO public.sesiones (token, fecha_login, activo, id_usuario) 
VALUES ($1, NOW(), true, $2);

6. Respuesta: Devuelves el token al cliente junto con el perfil y sus permisos.
*/

<?php

require_once __DIR__ . '/../models/usuario_model.php';
require_once __DIR__ . '/../models/Sesion.php';

class AuthController {
    
    public function login(): void {
        $data = json_decode(file_get_contents("php://input"), true);
        
        $email = $data['email'] ?? '';
        $password = $data['contrasenea'] ?? '';

        $usuarioModel = new UsuarioModel();
        $usuario = $usuarioModel->obtenerPorEmail($email);

        if (!$usuario || !password_verify($password, $usuario['contrasenea'])) {
            http_response_code(401);
            echo json_encode(["message" => "Credenciales inválidas."]);
            return;
        }

        $token = bin2hex(random_bytes(32));

        $sesionModel = new SesionModel();
        $sesionModel->crearSesion($usuario['id'], $token);

        $roles = $usuarioModel->obtenerRolesYPermisos($usuario['id']);

        http_response_code(200);
        echo json_encode([
            "message" => "Login exitoso",
            "token" => $token,
            "usuario" => [
                "id" => $usuario['id'],
                "nombre" => $usuario['nombre'],
                "email" => $usuario['email'],
                "roles" => $roles
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