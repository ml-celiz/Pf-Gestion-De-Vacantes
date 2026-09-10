<?php

require_once __DIR__ . '/../services/modulo_services.php';

class ModuloController {
    private ModuloService $moduloService;

    public function __construct() {
        $this->moduloService = new ModuloService();
    }

    public function listar(): void {
        $modulos = $this->moduloService->obtenerTodos();
        echo json_encode($modulos);
    }

    public function obtenerPorId(int $id): void {
        $modulo = $this->moduloService->obtenerPorId($id);

        if ($modulo) {
            echo json_encode($modulo);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Módulo no encontrado."]);
        }
    }

    public function crear(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $exito = $this->moduloService->crear($input);

        if ($exito) {
            http_response_code(201);
            echo json_encode(["message" => "Módulo creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el módulo. Verifique los datos enviados."]);
        }
    }

    public function actualizar(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $exito = $this->moduloService->actualizar($id, $input);

        if ($exito) {
            echo json_encode(["message" => "Módulo actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el módulo. Verifique el ID o los datos enviados."]);
        }
    }

    public function eliminar(int $id): void {
        $exito = $this->moduloService->eliminar($id);

        if ($exito) {
            echo json_encode(["message" => "Módulo eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Módulo no encontrado."]);
        }
    }
}