<?php

require_once __DIR__ . '/auth_routes.php';
require_once __DIR__ . '/institucional_routes.php';
require_once __DIR__ . '/modulo_routes.php';
require_once __DIR__ . '/panel_routes.php';
require_once __DIR__ . '/rol_routes.php';
require_once __DIR__ . '/usuario_routes.php';
require_once __DIR__ . '/vacantes_routes.php';

/*
* ROUTER PRINCIPAL
* Toma la URL (/api/{recurso}/...) y deriva el pedido al archivo de rutas
* de ese recurso. Cada archivo de rutas decide, según el método HTTP y el
* resto de la URL, qué método del controlador se ejecuta.
*
* Flujo de un pedido: main.php -> router.php -> *_routes.php (sesión y
* permisos) -> *_controller.php (lee el pedido y responde) ->
* *_services.php (lógica y SQL) -> models/ (fila de la base como objeto).
*/
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
    
        case 'vacantes':
            handleVacantesRoutes($method, $routeParams);
            break;

        default:
            http_response_code(404);
            echo json_encode(["message" => "Recurso no encontrado"]);
            break;
    }
}