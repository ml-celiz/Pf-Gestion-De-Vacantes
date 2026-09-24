<?php

require_once __DIR__ . '/../controllers/usuario_controller.php';
require_once __DIR__ . '/../services/auth_services.php';

/*
* Todas las rutas de usuarios exigen sesión.
* Administrar cuentas ajenas es exclusivo de `admin`; sobre la propia
* cuenta (pantalla "Mi perfil") cada usuario puede leer, editar y darse
* de baja. El alta pública se hace por POST /api/auth/registro.
*/
function handleUsuarioRoutes(string $method, array $uriParts): void {
    $controller = new UsuarioController();
    $id = isset($uriParts[2]) && is_numeric($uriParts[2]) ? (int)$uriParts[2] : null;

    $sesion = verificarAutenticacion();

    // --- CV: /api/usuarios/{id}/cv ---
    if ($id !== null && ($uriParts[3] ?? null) === 'cv') {

        // GET: descargar. El dueño, admin, ra y el jefe de cátedra
        // de una vacante a la que se postuló (ver exigirAccesoCv)
        if ($method === 'GET') {
            exigirAccesoCv($sesion, $id);
            $controller->descargarCv($id);
            return;
        }

        // POST / DELETE: solo el propio usuario, y solo postulantes
        if ($method === 'POST' || $method === 'DELETE') {
            if ((int)$sesion['id_usuario'] !== $id) {
                http_response_code(403);
                echo json_encode(["message" => "Solo podés modificar tu propio CV."]);
                return;
            }

            exigirRol($sesion, ['pos']);

            $method === 'POST'
                ? $controller->subirCv($id)
                : $controller->eliminarCv($id);
            return;
        }

        respondMethodNotAllowed();
        return;
    }

    // GET /api/usuarios
    if ($method === 'GET' && $id === null) {
        exigirRol($sesion, ['admin']);
        $controller->listar();
        return;
    }

    // GET /api/usuarios/{id}
    if ($method === 'GET' && $id !== null) {
        exigirSelfOAdmin($sesion, $id);
        $controller->obtenerPorId($id);
        return;
    }

    // POST /api/usuarios
    if ($method === 'POST' && $id === null) {
        exigirRol($sesion, ['admin']);
        $controller->crear();
        return;
    }

    // PUT /api/usuarios/{id}
    if ($method === 'PUT' && $id !== null) {
        exigirSelfOAdmin($sesion, $id);
        $controller->actualizar($id, (int)$sesion['id_usuario'] === $id);
        return;
    }

    // DELETE /api/usuarios/{id}
    if ($method === 'DELETE' && $id !== null) {
        exigirSelfOAdmin($sesion, $id);
        $controller->eliminar($id);
        return;
    }

    http_response_code(405);
    echo json_encode(["message" => "Método no permitido para esta ruta."]);
}