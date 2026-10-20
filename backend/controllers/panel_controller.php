<?php

require_once __DIR__ . '/../services/panel_services.php';

/*
* CONTROLADOR DE PANELES
* Recibe los pedidos de /api/paneles, llama a PanelService y responde en JSON.
* Los permisos (módulo `roles`) ya se verificaron en routes/panel_routes.php.
*/
class PanelController {
    private PanelService $panelService;

    public function __construct() {
        $this->panelService = new PanelService();
    }

    // GET /api/paneles
    public function listar(): void {
        echo json_encode($this->panelService->obtenerTodos());
    }

    // POST /api/paneles  { nombre }
    public function crear(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->panelService->crear($input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            http_response_code(201);
            echo json_encode(["message" => "Panel creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el panel. Verifique los datos enviados."]);
        }
    }

    // PUT /api/paneles/{id}  { nombre }
    public function actualizar(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->panelService->actualizar($id, $input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            echo json_encode(["message" => "Panel actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el panel. Verifique el ID o los datos enviados."]);
        }
    }

    // DELETE /api/paneles/{id}
    public function eliminar(int $id): void {
        if ($this->panelService->eliminar($id)) {
            echo json_encode(["message" => "Panel eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Panel no encontrado."]);
        }
    }
}
