<?php

require_once __DIR__ . '/../services/usuario_services.php';

class UsuarioController {
    private UsuarioService $usuarioService;

    public function __construct() {
        $this->usuarioService = new UsuarioService();
    }

    public function listar(): void {
        $usuarios = $this->usuarioService->obtenerTodos();
        echo json_encode($usuarios);
    }

    public function obtenerPorId(int $id): void {
        $usuario = $this->usuarioService->obtenerPorId($id);

        if ($usuario) {
            echo json_encode($usuario);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado."]);
        }
    }

    public function crear(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $exito = $this->usuarioService->crear($input);

        if ($exito) {
            http_response_code(201);
            echo json_encode(["message" => "Usuario creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el usuario. Verifique los datos enviados."]);
        }
    }

    public function actualizar(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $exito = $this->usuarioService->actualizar($id, $input);

        if ($exito) {
            echo json_encode(["message" => "Usuario actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el usuario. Verifique el ID o los datos enviados."]);
        }
    }

    public function eliminar(int $id): void {
        $exito = $this->usuarioService->eliminar($id);

        if ($exito) {
            echo json_encode(["message" => "Usuario eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Usuario no encontrado o ya eliminado."]);
        }
    }
}