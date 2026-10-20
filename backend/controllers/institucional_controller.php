<?php

require_once __DIR__ . '/../services/institucional_services.php';

/*
* CONTROLADOR INSTITUCIONAL
* Recibe los pedidos de /api/institucional (departamentos, cátedras y
* jefes de cátedra), llama a InstitucionalService y responde en JSON.
* Los permisos ya se verificaron en routes/institucional_routes.php.
*/
class InstitucionalController {
    private InstitucionalService $service;

    public function __construct() {
        $this->service = new InstitucionalService();
    }

    // --- DEPARTAMENTOS ---

    // GET /api/institucional/departamentos
    public function listarDepartamentos(): void {
        echo json_encode($this->service->obtenerTodosDepartamentos());
    }

    // POST /api/institucional/departamentos  { nombre }
    public function crearDepartamento(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->service->crearDepartamento($input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            http_response_code(201);
            echo json_encode(["message" => "Departamento creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el departamento."]);
        }
    }

    // PUT /api/institucional/departamentos/{id}  { nombre }
    public function actualizarDepartamento(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->service->actualizarDepartamento($id, $input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            echo json_encode(["message" => "Departamento actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el departamento."]);
        }
    }

    // DELETE /api/institucional/departamentos/{id}
    public function eliminarDepartamento(int $id): void {
        if ($this->service->eliminarDepartamento($id)) {
            echo json_encode(["message" => "Departamento eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Departamento no encontrado."]);
        }
    }

    // --- CÁTEDRAS ---

    // GET /api/institucional/catedras
    public function listarCatedras(): void {
        echo json_encode($this->service->obtenerTodasCatedras());
    }

    // POST /api/institucional/catedras  { nombre, id_departamento, id_usuario }
    public function crearCatedra(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->service->crearCatedra($input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            http_response_code(201);
            echo json_encode(["message" => "Cátedra creada exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear la cátedra."]);
        }
    }

    // PUT /api/institucional/catedras/{id}  { nombre, id_departamento, id_usuario }
    public function actualizarCatedra(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->service->actualizarCatedra($id, $input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            echo json_encode(["message" => "Cátedra actualizada correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar la cátedra."]);
        }
    }

    // DELETE /api/institucional/catedras/{id}
    public function eliminarCatedra(int $id): void {
        if ($this->service->eliminarCatedra($id)) {
            echo json_encode(["message" => "Cátedra eliminada correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Cátedra no encontrada."]);
        }
    }

    // --- JEFES DE CÁTEDRA ---

    // GET /api/institucional/usuarios-jfc
    public function listarUsuariosJfc(): void {
        echo json_encode($this->service->obtenerUsuariosJfc());
    }
}
