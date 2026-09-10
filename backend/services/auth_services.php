<?php

require_once __DIR__ . '/../models/Sesion.php';

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