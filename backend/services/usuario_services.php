<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Usuario.php';

class UsuarioService {
    private PDO $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function obtenerTodos(): array {
        $sql = "SELECT * FROM public.usuarios WHERE fecha_baja IS NULL";
        $stmt = $this->db->query($sql);
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => (new Usuario($row))->toArray(), $rows);
    }

    public function obtenerPorId(int $id): ?array {
        $sql = "SELECT * FROM public.usuarios WHERE id = :id AND fecha_baja IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? (new Usuario($row))->toArray() : null;
    }

    public function crear(array $data): bool {
        $rawPassword = $data['contrasena'] ?? $data['contraseña'] ?? null;
        $email = $data['email'] ?? null;

        if (empty($email) || empty($rawPassword)) {
            return false;
        }

        $usuario = new Usuario($data);
        $hash = password_hash($rawPassword, PASSWORD_BCRYPT);

        try {
            $sql = "INSERT INTO public.usuarios (email, nombre, apellido, contrasena, dni, telefono, fecha_alta) 
                    VALUES (:email, :nombre, :apellido, :contrasena, :dni, :telefono, NOW())";
            
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'email'      => $usuario->email,
                'nombre'     => $usuario->nombre,
                'apellido'   => $usuario->apellido,
                'contrasena' => $hash,
                'dni'        => $usuario->dni,
                'telefono'   => $usuario->telefono
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al crear usuario: " . $e->getMessage());
            return false;
        }
    }

    public function actualizar(int $id, array $data): bool {
        $usuarioExistente = $this->obtenerPorId($id);
        if (!$usuarioExistente) {
            return false;
        }

        $usuario = new Usuario($data);
        $rawPassword = $data['contrasena'] ?? $data['contraseña'] ?? null;

        // Si envían contraseña nueva, se le hace hash; si no, se mantiene la actual
        if (!empty($rawPassword)) {
            $hash = password_hash($rawPassword, PASSWORD_BCRYPT);
        } else {
            $sqlPass = "SELECT contrasena FROM public.usuarios WHERE id = :id";
            $stmtPass = $this->db->prepare($sqlPass);
            $stmtPass->execute(['id' => $id]);
            $hash = $stmtPass->fetchColumn();
        }

        try {
            $sql = "UPDATE public.usuarios 
                    SET email = :email,
                        nombre = :nombre,
                        apellido = :apellido,
                        contrasena = :contrasena,
                        dni = :dni,
                        telefono = :telefono,
                        fecha_actualizacion = NOW()
                    WHERE id = :id AND fecha_baja IS NULL";

            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'id'         => $id,
                'email'      => $usuario->email ?: $usuarioExistente['email'],
                'nombre'     => $usuario->nombre,
                'apellido'   => $usuario->apellido,
                'contrasena' => $hash,
                'dni'        => $usuario->dni,
                'telefono'   => $usuario->telefono
            ]);
        } catch (PDOException $e) {
            error_log("Error PDO al actualizar usuario: " . $e->getMessage());
            return false;
        }
    }

    public function eliminar(int $id): bool {
        // Se actualiza la fecha_baja
        $sql = "UPDATE public.usuarios SET fecha_baja = NOW() WHERE id = :id AND fecha_baja IS NULL";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }
}