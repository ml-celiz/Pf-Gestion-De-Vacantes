<?php

require_once __DIR__ . '/../services/rol_services.php';

/*
* CONTROLADOR DE ROLES
* Recibe los pedidos de /api/roles (y de sus paneles, módulos y usuarios),
* llama a RolService y responde en JSON.
* Los permisos (módulo `roles`) ya se verificaron en routes/rol_routes.php.
*/
class RolController {
    private RolService $rolService;

    public function __construct() {
        $this->rolService = new RolService();
    }

    // --- ROL ---

    // GET /api/roles
    public function listar(): void {
        echo json_encode($this->rolService->obtenerTodos());
    }

    // POST /api/roles  { nombre, token_duracion }
    public function crear(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $id = $this->rolService->crear($input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($id !== false) {
            http_response_code(201);
            echo json_encode([
                "message" => "Rol creado exitosamente.",
                "id"      => $id
            ]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el rol."]);
        }
    }

    // PUT /api/roles/{id}  { nombre, token_duracion }
    public function actualizar(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        try {
            $exito = $this->rolService->actualizar($id, $input);
        } catch (RuntimeException $e) {
            responderError($e);
            return;
        }

        if ($exito) {
            echo json_encode(["message" => "Rol actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el rol."]);
        }
    }

    // DELETE /api/roles/{id}
    public function eliminar(int $id): void {
        if ($this->rolService->eliminar($id)) {
            echo json_encode(["message" => "Rol eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Rol no encontrado."]);
        }
    }

    // --- ASOCIACIONES: PANELES ---

    // GET /api/roles/{id}/paneles
    public function listarPaneles(int $idRol): void {
        echo json_encode($this->rolService->obtenerPanelesPorRol($idRol));
    }

    // POST /api/roles/{id}/paneles  { id_panel }
    public function asignarPanel(int $idRol): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $idPanel = $input['id_panel'] ?? null;

        if ($idPanel && $this->rolService->asignarPanel($idRol, (int)$idPanel)) {
            http_response_code(201);
            echo json_encode(["message" => "Panel asignado al rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al asignar panel."]);
        }
    }

    // DELETE /api/roles/{id}/paneles/{idPanel}
    public function desasignarPanel(int $idRol, int $idPanel): void {
        if ($this->rolService->desasignarPanel($idRol, $idPanel)) {
            echo json_encode(["message" => "Panel desasignado del rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al desasignar panel."]);
        }
    }

    // --- ASOCIACIONES: MÓDULOS ---

    // GET /api/roles/{id}/modulos
    public function listarModulos(int $idRol): void {
        echo json_encode($this->rolService->obtenerModulosPorRol($idRol));
    }

    // POST /api/roles/{id}/modulos  { id_modulo, leer, escribir, editar }
    public function asignarModulo(int $idRol): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if ($this->rolService->asignarModulo($idRol, $input)) {
            http_response_code(201);
            echo json_encode(["message" => "Módulo asignado al rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al asignar módulo."]);
        }
    }

    // PUT /api/roles/{id}/modulos/{idModulo}  { leer, escribir, editar }
    public function actualizarModulo(int $idRol, int $idModulo): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        if ($this->rolService->actualizarPermisosModulo($idRol, $idModulo, $input)) {
            echo json_encode(["message" => "Permisos del módulo actualizados."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al actualizar permisos."]);
        }
    }

    // --- ASOCIACIONES: USUARIOS ---

    // POST /api/roles/{id}/usuarios  { id_usuario }
    public function asignarUsuario(int $idRol): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $idUsuario = $input['id_usuario'] ?? null;

        if ($idUsuario && $this->rolService->asignarUsuario($idRol, (int)$idUsuario)) {
            http_response_code(201);
            echo json_encode(["message" => "Usuario asignado al rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al asignar usuario."]);
        }
    }

    // DELETE /api/roles/{id}/usuarios/{idUsuario}
    public function desasignarUsuario(int $idRol, int $idUsuario): void {
        if ($this->rolService->desasignarUsuario($idRol, $idUsuario)) {
            echo json_encode(["message" => "Usuario desasignado del rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al desasignar usuario."]);
        }
    }
}
