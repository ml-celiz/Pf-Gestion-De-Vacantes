<?php

require_once __DIR__ . '/../controllers/auth_controller.php';
require_once __DIR__ . '/../services/auth_services.php';

/*
* RUTAS DE AUTENTICACIÓN: /api/auth/...
*   POST login | logout | registro | recuperar | restablecer
*   GET  me (usuario de la sesión) | permisos (de la sesión o del invitado)
*/
function handleAuthRoutes(string $method, array $routeParams): void {
    $authController = new AuthController();
    $action = $routeParams[2] ?? null;

    // POST /api/auth/login
    if ($method === 'POST' && $action === 'login') {
        $authController->login();
        return;
    }

    // POST /api/auth/logout (requiere sesión)
    if ($method === 'POST' && $action === 'logout') {
        verificarAutenticacion();
        $authController->logout();
        return;
    }

    // POST /api/auth/registro (pública)
    if ($method === 'POST' && $action === 'registro') {
        $authController->registro();
        return;
    }

    // Recuperación de contraseña (rutas públicas)
    if ($method === 'POST' && $action === 'recuperar') {
        $authController->solicitarRecuperacion();
        return;
    }

    if ($method === 'POST' && $action === 'restablecer') {
        $authController->restablecerContrasena();
        return;
    }

    // GET /api/auth/me: datos frescos del usuario de la sesión (al recargar la página)
    if ($method === 'GET' && $action === 'me') {
        $sesionActual = verificarAutenticacion();

        $userId = $sesionActual['id_usuario'] ?? null;

        http_response_code(200);
        echo json_encode([
            "usuario" => [
                "id" => $userId,
                "email" => $sesionActual['email'] ?? null,
                "nombre" => $sesionActual['nombre'] ?? null,
                "apellido" => $sesionActual['apellido'] ?? null,
                "roles" => obtenerRolesUsuario((int)$userId)
            ],
            "permisos" => obtenerPermisosUsuario((int)$userId)
        ]);
        return;
    }

    // Permisos de quien consulta: los de su sesión o, sin sesión, los del
    // rol invitado (así el modo invitado también se configura desde la base)
    if ($method === 'GET' && $action === 'permisos') {
        $sesion = obtenerSesionOpcional();

        http_response_code(200);
        echo json_encode([
            "permisos" => obtenerPermisosUsuario(
                $sesion ? (int)$sesion['id_usuario'] : null
            )
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode(["message" => "Método o subruta no disponible en auth."]);
}