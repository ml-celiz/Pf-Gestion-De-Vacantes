<?php

require_once __DIR__ . '/../services/modulo_services.php';

/*
* CONTROLADOR DE MÓDULOS
* Recibe los pedidos de /api/modulos, llama a ModuloService y responde en JSON.
* Los permisos (módulo `roles`) ya se verificaron en routes/modulo_routes.php.
*/
class ModuloController {
    private ModuloService $moduloService;

    public function __construct() {
        $this->moduloService = new ModuloService();
    }

    // GET /api/modulos
    public function listar(): void {
        echo json_encode($this->moduloService->obtenerTodos());
    }

    // POST /api/modulos  { nombre }
    public function crear(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->moduloService->crear($input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            http_response_code(201);
            echo json_encode(["message" => "Módulo creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el módulo. Verifique los datos enviados."]);
        }
    }

    // PUT /api/modulos/{id}  { nombre }
    public function actualizar(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->moduloService->actualizar($id, $input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            echo json_encode(["message" => "Módulo actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el módulo. Verifique el ID o los datos enviados."]);
        }
    }

    // DELETE /api/modulos/{id}
    public function eliminar(int $id): void {
        if ($this->moduloService->eliminar($id)) {
            echo json_encode(["message" => "Módulo eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Módulo no encontrado."]);
        }
    }
}
