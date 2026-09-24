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

    public function crear(): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $id = $this->usuarioService->crear($input);

        if ($id !== false) {

            http_response_code(201);

            echo json_encode([
                "message" => "Usuario creado exitosamente.",
                "id" => $id
            ]);

        } else {

            http_response_code(400);

            echo json_encode([
                "message" => "No se pudo crear el usuario. Verifique los datos enviados."
            ]);
        }
    }

    /*
    * `$esPropio`: el usuario edita su propia cuenta (Mi perfil). En ese
    * caso, para cambiar la contraseña tiene que confirmar la actual.
    */
    public function actualizar(int $id, bool $esPropio = false): void {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $nuevaContrasena = $input['contrasena'] ?? $input['contraseña'] ?? '';

        if ($esPropio && $nuevaContrasena !== '') {
            $actual = (string)($input['contrasena_actual'] ?? '');

            if ($actual === '') {
                http_response_code(400);
                echo json_encode(["message" => "Ingresá tu contraseña actual para cambiarla."]);
                return;
            }

            if (!$this->usuarioService->verificarContrasena($id, $actual)) {
                http_response_code(400);
                echo json_encode(["message" => "La contraseña actual es incorrecta."]);
                return;
            }
        }
        $exito = $this->usuarioService->actualizar($id, $input);

        if ($exito) {
            echo json_encode(["message" => "Usuario actualizado correctamente."]);
        } else {
            http_response_code(400);
            echo json_encode(["message" => "No se pudo actualizar el usuario. Verifique el ID o los datos enviados."]);
        }
    }

    // --- CV ---

    // POST /api/usuarios/{id}/cv  (multipart/form-data, campo "cv")
    public function subirCv(int $id): void {
        try {
            $this->usuarioService->guardarCv($id, $_FILES['cv'] ?? null);
            echo json_encode(["message" => "CV guardado correctamente."]);
        } catch (RuntimeException $e) {
            http_response_code($e->getCode() ?: 400);
            echo json_encode(["message" => $e->getMessage()]);
        }
    }

    // GET /api/usuarios/{id}/cv  -> descarga del PDF
    public function descargarCv(int $id): void {
        $ruta = $this->usuarioService->obtenerRutaCv($id);

        if (!$ruta) {
            http_response_code(404);
            echo json_encode(["message" => "El usuario no tiene un CV cargado."]);
            return;
        }

        $usuario = $this->usuarioService->obtenerPorId($id);

        // Nombre del archivo descargado: CV_Apellido_Nombre.pdf (solo ASCII)
        $nombre = trim(($usuario['apellido'] ?? '') . '_' . ($usuario['nombre'] ?? ''), '_');
        $nombre = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $nombre) ?: '';
        $nombre = preg_replace('/[^A-Za-z0-9_-]+/', '_', $nombre);
        $nombreArchivo = 'CV' . ($nombre !== '' ? '_' . $nombre : '') . '.pdf';

        // Reemplaza el Content-Type JSON que fija main.php
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="' . $nombreArchivo . '"');
        header('Content-Length: ' . filesize($ruta));
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: private, no-store');

        readfile($ruta);
    }

    // DELETE /api/usuarios/{id}/cv
    public function eliminarCv(int $id): void {
        if ($this->usuarioService->eliminarCv($id)) {
            echo json_encode(["message" => "CV eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No hay un CV cargado para eliminar."]);
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