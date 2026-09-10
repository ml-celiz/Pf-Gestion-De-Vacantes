<?php

require_once __DIR__ . '/../services/panel_services.php';

class PanelController {
    private PanelService $panelService;

    public function __construct() {
        $this->panelService = new PanelService();
    }

    public function listar(): void {
        $paneles = $this->panelService->obtenerTodos();
        echo json_encode($paneles);
    }

    public function obtenerPorId(int $id): void {
        $panel = $this->panelService->obtenerPorId($id);

        if ($panel) {
            echo json_encode($panel);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Panel no encontrado."]);
        }
    }

    public function crear(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $exito = $this->panelService->crear($input);

        if ($exito) {
            http_response_code(201);
            echo json_encode(["message" => "Panel creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el panel. Verifique los datos enviados."]);
        }
    }

    public function actualizar(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $exito = $this->panelService->actualizar($id, $input);

        if ($exito) {
            echo json_encode(["message" => "Panel actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el panel. Verifique el ID o los datos enviados."]);
        }
    }

    public function eliminar(int $id): void {
        $exito = $this->panelService->eliminar($id);

        if ($exito) {
            echo json_encode(["message" => "Panel eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Panel no encontrado."]);
        }
    }
}