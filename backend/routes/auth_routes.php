<?php

require_once __DIR__ . '/../controllers/auth_controller.php';
require_once __DIR__ . '/../services/auth_services.php';

function handleAuthRoutes(string $method, array $routeParams): void {
    $authController = new AuthController();
    $action = $routeParams[2] ?? null;

    if ($method === 'POST' && $action === 'login') {
        $authController->login();
        return;
    }

    if ($method === 'POST' && $action === 'logout') {
        $sesionActual = verificarAutenticacion(); 
        $authController->logout();
        return;
    }

    if ($method === 'GET' && $action === 'me') {
        $sesionActual = verificarAutenticacion();
        
        // Asumiendo que $sesionActual contiene 'id_usuario' o 'id'
        $userId = $sesionActual['id_usuario'] ?? $sesionActual['id'] ?? null;

        http_response_code(200);
        echo json_encode([
            "usuario" => [
                "id" => $userId,
                "email" => $sesionActual['email'] ?? null,
                "nombre" => $sesionActual['nombre'] ?? null,
                "roles" => obtenerRolesUsuario((int)$userId)
            ]
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode(["message" => "Método o subruta no disponible en auth."]);
}