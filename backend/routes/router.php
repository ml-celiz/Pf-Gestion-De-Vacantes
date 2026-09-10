<?php

require_once __DIR__ . '/auth_routes.php';
require_once __DIR__ . '/institucional_routes.php';
require_once __DIR__ . '/modulo_routes.php';
require_once __DIR__ . '/panel_routes.php';
require_once __DIR__ . '/rol_routes.php';
require_once __DIR__ . '/usuario_routes.php';
// require_once __DIR__ . '/vacantes_routes.php';

function routeRequest(): void {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $method = $_SERVER['REQUEST_METHOD'];

    $uri = trim($uri, '/');
    $parts = explode('/', $uri);

    $apiIndex = array_search('api', $parts);

    if ($apiIndex === false) {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint no encontrado"]);
        return;
    }

    $resource = $parts[$apiIndex + 1] ?? null;
    $routeParams = array_slice($parts, $apiIndex);

    switch ($resource) {
        case 'auth': 
            handleAuthRoutes($method, $routeParams);
            break;

        case 'usuarios':
            handleUsuarioRoutes($method, $routeParams);
            break;
        
        case 'paneles':
                    handlePanelRoutes($method, $routeParams);
                    break;

        case 'modulos':
            handleModuloRoutes($method, $routeParams);
            break;

        case 'roles':
            handleRolRoutes($method, $routeParams);
            break;

        case 'institucional':
                    handleInstitucionalRoutes($method, $routeParams);
                    break;

        default:
            http_response_code(404);
            echo json_encode(["message" => "Recurso no encontrado"]);
            break;
    }
}