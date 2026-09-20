<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Usuario.php';

class UsuarioService
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getConnection();
    }


    // =====================================================
    // OBTENER TODOS
    // =====================================================

    public function obtenerTodos(): array
    {
        $sql = "
            SELECT
                u.id,
                u.email,
                u.nombre,
                u.apellido,
                u.dni,
                u.telefono,
                u.fecha_alta,
                u.fecha_actualizacion,
                u.fecha_baja,

                COALESCE(
                    STRING_AGG(
                        DISTINCT r.nombre,
                        ', '
                        ORDER BY r.nombre
                    ),
                    'Sin rol'
                ) AS rol,

                COUNT(DISTINCT s.id) AS cantidad_sesiones

            FROM public.usuarios u

            LEFT JOIN public.roles_usuarios ru
                ON ru.id_usuario = u.id

            LEFT JOIN public.roles r
                ON r.id = ru.id_rol

            LEFT JOIN public.sesiones s
                ON s.id_usuario = u.id

            WHERE u.fecha_baja IS NULL

            GROUP BY
                u.id,
                u.email,
                u.nombre,
                u.apellido,
                u.dni,
                u.telefono,
                u.fecha_alta,
                u.fecha_actualizacion,
                u.fecha_baja

            ORDER BY
                u.apellido,
                u.nombre
        ";

        $stmt = $this->db->query($sql);

        $rows = $stmt->fetchAll();

        return array_map(
            fn($row) => (new UsuarioModel($row))->toArray(),
            $rows
        );
    }


    // =====================================================
    // OBTENER POR ID
    // =====================================================

    public function obtenerPorId(int $id): ?array
    {
        $sql = "
            SELECT *
            FROM public.usuarios
            WHERE id = :id
                AND fecha_baja IS NULL
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);

        $row = $stmt->fetch();

        return $row
            ? (new UsuarioModel($row))->toArray()
            : null;
    }


    // =====================================================
    // CREAR
    // =====================================================

    public function crear(array $data): int|false
    {
        $rawPassword =
            $data['contrasena']
            ?? $data['contraseña']
            ?? null;

        $email =
            $data['email']
            ?? null;

        if (empty($email) || empty($rawPassword)) {
            return false;
        }

        $usuario = new UsuarioModel($data);

        $hash = password_hash(
            $rawPassword,
            PASSWORD_BCRYPT
        );

        try {

            $sql = "
                INSERT INTO public.usuarios
                    (
                        email,
                        nombre,
                        apellido,
                        contrasena,
                        dni,
                        telefono,
                        fecha_alta
                    )
                VALUES
                    (
                        :email,
                        :nombre,
                        :apellido,
                        :contrasena,
                        :dni,
                        :telefono,
                        NOW()
                    )
                RETURNING id
            ";

            $stmt = $this->db->prepare($sql);

            $stmt->execute([
                'email'      => $usuario->email,
                'nombre'     => $usuario->nombre,
                'apellido'   => $usuario->apellido,
                'contrasena' => $hash,
                'dni'        => $usuario->dni,
                'telefono'   => $usuario->telefono
            ]);

            $id = $stmt->fetchColumn();

            return $id !== false
                ? (int)$id
                : false;

        } catch (PDOException $e) {

            error_log(
                "Error PDO al crear usuario: "
                . $e->getMessage()
            );

            return false;
        }
    }


    // =====================================================
    // ACTUALIZAR
    // =====================================================

    public function actualizar(
        int $id,
        array $data
    ): bool {

        // ---------------------------------------------
        // Verificar que exista
        // ---------------------------------------------

        $usuarioExistente =
            $this->obtenerPorId($id);

        if (!$usuarioExistente) {
            return false;
        }


        // ---------------------------------------------
        // Crear modelo con los datos recibidos
        // ---------------------------------------------

        $usuario =
            new UsuarioModel($data);


        // ---------------------------------------------
        // CONTRASEÑA
        // ---------------------------------------------

        $rawPassword =
            $data['contrasena']
            ?? $data['contraseña']
            ?? null;


        if (!empty($rawPassword)) {

            // Se cambió la contraseña
            $hash = password_hash(
                $rawPassword,
                PASSWORD_BCRYPT
            );

        } else {

            // Mantener contraseña actual
            $sqlPass = "
                SELECT contrasena
                FROM public.usuarios
                WHERE id = :id
            ";

            $stmtPass =
                $this->db->prepare($sqlPass);

            $stmtPass->execute([
                'id' => $id
            ]);

            $hash =
                $stmtPass->fetchColumn();
        }


        // ---------------------------------------------
        // ACTUALIZAR
        // ---------------------------------------------

        try {

            $sql = "
                UPDATE public.usuarios

                SET
                    email = :email,
                    nombre = :nombre,
                    apellido = :apellido,
                    contrasena = :contrasena,
                    dni = :dni,
                    telefono = :telefono,
                    fecha_actualizacion = NOW()

                WHERE id = :id
                    AND fecha_baja IS NULL
            ";

            $stmt =
                $this->db->prepare($sql);

            return $stmt->execute([

                'id' =>
                    $id,

                'email' =>
                    $usuario->email
                    ?: $usuarioExistente['email'],

                'nombre' =>
                    $usuario->nombre,

                'apellido' =>
                    $usuario->apellido,

                'contrasena' =>
                    $hash,

                'dni' =>
                    $usuario->dni,

                'telefono' =>
                    $usuario->telefono
            ]);

        } catch (PDOException $e) {

            error_log(
                "Error PDO al actualizar usuario: "
                . $e->getMessage()
            );

            return false;
        }
    }


    // =====================================================
    // ELIMINAR
    // =====================================================

    public function eliminar(int $id): bool
    {
        $sql = "
            UPDATE public.usuarios

            SET fecha_baja = NOW()

            WHERE id = :id
                AND fecha_baja IS NULL
        ";

        $stmt =
            $this->db->prepare($sql);

        $stmt->execute([
            'id' => $id
        ]);

        return $stmt->rowCount() > 0;
    }
}