<?php

require_once __DIR__ . '/../services/rol_services.php';

class RolController {
    private RolService $rolService;

    public function __construct() {
        $this->rolService = new RolService();
    }

    // --- ROL ---

    public function listar(): void {
        echo json_encode($this->rolService->obtenerTodos());
    }

    public function obtenerPorId(int $id): void {
        $rol = $this->rolService->obtenerPorId($id);
        if ($rol) {
            echo json_encode($rol);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Rol no encontrado."]);
        }
    }

    public function crear(): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->rolService->crear($input)) {
            http_response_code(201);
            echo json_encode(["message" => "Rol creado exitosamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo crear el rol."]);
        }
    }

    public function actualizar(int $id): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->rolService->actualizar($id, $input)) {
            echo json_encode(["message" => "Rol actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el rol."]);
        }
    }

    public function eliminar(int $id): void {
        if ($this->rolService->eliminar($id)) {
            echo json_encode(["message" => "Rol eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Rol no encontrado."]);
        }
    }

    // --- ASOCIACIONES: PANELES ---

    public function listarPaneles(int $idRol): void {
        echo json_encode($this->rolService->obtenerPanelesPorRol($idRol));
    }

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

    public function desasignarPanel(int $idRol, int $idPanel): void {
        if ($this->rolService->desasignarPanel($idRol, $idPanel)) {
            echo json_encode(["message" => "Panel desasignado del rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al desasignar panel."]);
        }
    }

    // --- ASOCIACIONES: MÓDULOS ---

    public function listarModulos(int $idRol): void {
        echo json_encode($this->rolService->obtenerModulosPorRol($idRol));
    }

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

    public function actualizarModulo(int $idRol, int $idModulo): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        if ($this->rolService->actualizarPermisosModulo($idRol, $idModulo, $input)) {
            echo json_encode(["message" => "Permisos del módulo actualizados."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al actualizar permisos."]);
        }
    }

    public function desasignarModulo(int $idRol, int $idModulo): void {
        if ($this->rolService->desasignarModulo($idRol, $idModulo)) {
            echo json_encode(["message" => "Módulo desasignado del rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al desasignar módulo."]);
        }
    }

    // --- ASOCIACIONES: USUARIOS ---

    public function listarUsuarios(int $idRol): void {
        echo json_encode($this->rolService->obtenerUsuariosPorRol($idRol));
    }

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

    public function desasignarUsuario(int $idRol, int $idUsuario): void {
        if ($this->rolService->desasignarUsuario($idRol, $idUsuario)) {
            echo json_encode(["message" => "Usuario desasignado del rol."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Error al desasignar usuario."]);
        }
    }
}