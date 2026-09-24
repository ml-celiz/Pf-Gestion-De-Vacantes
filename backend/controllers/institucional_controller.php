<?php

require_once __DIR__ . '/../services/institucional_services.php';

class InstitucionalController {
    private InstitucionalService $service;

    public function __construct() {
        $this->service = new InstitucionalService();
    }

    // --- DEPARTAMENTOS ---

    public function listarDepartamentos(): void {
        echo json_encode($this->service->obtenerTodosDepartamentos());
    }

    public function crearDepartamento(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->crearDepartamento($input)) {
            http_response_code(201);
            echo json_encode(["message" => "Departamento creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el departamento."]);
        }
    }

    public function actualizarDepartamento(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->actualizarDepartamento($id, $input)) {
            echo json_encode(["message" => "Departamento actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el departamento."]);
        }
    }

    public function eliminarDepartamento(int $id): void {
        if ($this->service->eliminarDepartamento($id)) {
            echo json_encode(["message" => "Departamento eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Departamento no encontrado."]);
        }
    }

    // --- CÁTEDRAS ---

    public function listarCatedras(): void {
        echo json_encode($this->service->obtenerTodasCatedras());
    }

    public function crearCatedra(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->crearCatedra($input)) {
            http_response_code(201);
            echo json_encode(["message" => "Cátedra creada exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear la cátedra. Verifique las claves foráneas."]);
        }
    }

    public function actualizarCatedra(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->service->actualizarCatedra($id, $input)) {
            echo json_encode(["message" => "Cátedra actualizada correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar la cátedra."]);
        }
    }

    public function eliminarCatedra(int $id): void {
        if ($this->service->eliminarCatedra($id)) {
            echo json_encode(["message" => "Cátedra eliminada correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Cátedra no encontrada."]);
        }
    }

    // --- JEFES DE CATEDRA ---
    public function listarUsuariosJfc(): void {

        echo json_encode(
            $this->service->obtenerUsuariosJfc()
        );
    }
}