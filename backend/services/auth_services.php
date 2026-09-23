<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../models/Sesion.php';

/* Busca un usuario por email en la BD y retorna el objeto UsuarioModel */
function obtenerUsuarioPorEmail(string $email): ?UsuarioModel {
    $db = Database::getConnection();
    
    $sql = "SELECT id, email, nombre, apellido, contrasena, dni, telefono 
            FROM public.usuarios 
            WHERE email = :email AND fecha_baja IS NULL 
            LIMIT 1";

    $stmt = $db->prepare($sql);
    $stmt->execute([':email' => $email]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    return $data ? new UsuarioModel($data) : null;
}

/* Obtiene los roles asociados a un usuario */
function obtenerRolesUsuario(int $idUsuario): array {
    $db = Database::getConnection();

    $sql = "SELECT r.nombre AS rol
            FROM public.roles_usuarios ru
            JOIN public.roles r ON ru.id_rol = r.id
            WHERE ru.id_usuario = :id_usuario";

    $stmt = $db->prepare($sql);
    $stmt->execute([':id_usuario' => $idUsuario]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/* Indica si el usuario tiene al menos uno de los roles indicados (sin distinguir mayúsculas) */
function usuarioTieneAlgunRol(int $idUsuario, array $rolesPermitidos): bool {
    $rolesPermitidos = array_map('strtolower', $rolesPermitidos);

    foreach (obtenerRolesUsuario($idUsuario) as $fila) {
        if (in_array(strtolower(trim($fila['rol'] ?? '')), $rolesPermitidos, true)) {
            return true;
        }
    }

    return false;
}

/* Corta la petición con 403 si el usuario de la sesión no tiene ninguno de los roles */
function exigirRol(array $sesion, array $rolesPermitidos): void {
    $idUsuario = isset($sesion['id_usuario']) ? (int)$sesion['id_usuario'] : 0;

    if (!$idUsuario || !usuarioTieneAlgunRol($idUsuario, $rolesPermitidos)) {
        http_response_code(403);
        echo json_encode(["message" => "No tiene permisos para realizar esta acción."]);
        exit;
    }
}

/* Middleware para proteger rutas usando Bearer Token */
function verificarAutenticacion(): array {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? null;

    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(["message" => "Token de sesión no proporcionado o formato inválido."]);
        exit;
    }

    $token = str_replace('Bearer ', '', $authHeader);

    $sesionModel = new SesionModel();
    $sesion = $sesionModel->obtenerSesionActiva($token);

    if (!$sesion) {
        http_response_code(401);
        echo json_encode(["message" => "Sesión inválida, inactiva o expirada."]);
        exit;
    }

    return $sesion;
}

function obtenerDuracionTokenUsuario(int $idUsuario): int {

    $db = Database::getConnection();

    $sql = "SELECT MAX(r.token_duracion)
            FROM public.roles_usuarios ru
            JOIN public.roles r
                ON ru.id_rol = r.id
            WHERE ru.id_usuario = :id_usuario";

    $stmt = $db->prepare($sql);

    $stmt->execute([
        ':id_usuario' => $idUsuario
    ]);

    $duracion = $stmt->fetchColumn();

    // Si por alguna razón el usuario no tiene rol,
    // se utiliza 60 minutos como valor por defecto.
    return $duracion !== false
        ? (int)$duracion
        : 60;
}