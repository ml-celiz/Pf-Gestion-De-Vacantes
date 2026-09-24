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
    // EMAIL YA REGISTRADO
    // =====================================================

    /**
     * El email identifica al usuario en el login, así que no puede repetirse.
     * `$exceptoId` permite que un usuario conserve su propio email al editarse.
     */
    public function existeEmail(
        string $email,
        ?int $exceptoId = null
    ): bool {

        $sql = "
            SELECT 1
            FROM public.usuarios
            WHERE LOWER(email) = LOWER(:email)
                AND fecha_baja IS NULL
        ";

        $params = ['email' => trim($email)];

        if ($exceptoId !== null) {
            $sql .= " AND id <> :id";
            $params['id'] = $exceptoId;
        }

        $stmt = $this->db->prepare($sql . " LIMIT 1");
        $stmt->execute($params);

        return $stmt->fetchColumn() !== false;
    }


    // =====================================================
    // REGISTRO PÚBLICO
    // =====================================================

    /**
     * Alta de un usuario que se registra por su cuenta desde el login.
     *
     * A diferencia de `crear`, el rol NO se recibe: siempre se asigna
     * `pos` (postulante). Si el rol se tomara del cuerpo del pedido,
     * cualquiera podría registrarse como admin.
     *
     * Devuelve el id creado; ante un dato inválido lanza RuntimeException
     * cuyo código es el HTTP status a responder.
     */
    public function registrar(array $data): int
    {
        $email = trim($data['email'] ?? '');

        $rawPassword =
            $data['contrasena']
            ?? $data['contraseña']
            ?? '';

        $nombre   = trim($data['nombre'] ?? '');
        $apellido = trim($data['apellido'] ?? '');

        if (
            $email === '' ||
            !filter_var($email, FILTER_VALIDATE_EMAIL)
        ) {
            throw new RuntimeException(
                "Ingrese un correo electrónico válido.",
                400
            );
        }

        if ($nombre === '' || $apellido === '') {
            throw new RuntimeException(
                "El nombre y el apellido son obligatorios.",
                400
            );
        }

        if (strlen($rawPassword) < 8) {
            throw new RuntimeException(
                "La contraseña debe tener al menos 8 caracteres.",
                400
            );
        }

        if ($this->existeEmail($email)) {
            throw new RuntimeException(
                "Ya existe una cuenta registrada con ese correo electrónico.",
                409
            );
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO public.usuarios
                    (email, nombre, apellido, contrasena, dni, telefono, fecha_alta)
                VALUES
                    (:email, :nombre, :apellido, :contrasena, :dni, :telefono, NOW())
                RETURNING id
            ");

            $stmt->execute([
                'email'      => $email,
                'nombre'     => $nombre,
                'apellido'   => $apellido,
                'contrasena' => password_hash($rawPassword, PASSWORD_BCRYPT),
                'dni'        => isset($data['dni']) && $data['dni'] !== ''
                    ? (int)$data['dni']
                    : null,
                'telefono'   => trim($data['telefono'] ?? '') ?: null
            ]);

            $id = (int)$stmt->fetchColumn();

            // Rol fijo: postulante
            $stmt = $this->db->prepare("
                INSERT INTO public.roles_usuarios (id_rol, id_usuario)
                SELECT r.id, :id_usuario
                FROM public.roles r
                WHERE LOWER(r.nombre) = 'pos'
                LIMIT 1
            ");

            $stmt->execute(['id_usuario' => $id]);

            if ($stmt->rowCount() === 0) {
                throw new RuntimeException(
                    "No se pudo asignar el rol de postulante.",
                    500
                );
            }

            $this->db->commit();

            return $id;

        } catch (PDOException $e) {

            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            error_log("Error PDO al registrar usuario: " . $e->getMessage());

            throw new RuntimeException(
                "No se pudo completar el registro.",
                400
            );

        } catch (RuntimeException $e) {

            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
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

        // El email identifica al usuario en el login
        if ($this->existeEmail($email)) {
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
        // EMAIL
        // ---------------------------------------------

        // No puede quedar con el email de otra cuenta activa
        if (
            !empty($usuario->email) &&
            $this->existeEmail($usuario->email, $id)
        ) {
            return false;
        }


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
    // CONTRASEÑA ACTUAL
    // =====================================================

    public function verificarContrasena(int $id, string $contrasena): bool
    {
        $stmt = $this->db->prepare("
            SELECT contrasena
            FROM public.usuarios
            WHERE id = :id
                AND fecha_baja IS NULL
        ");

        $stmt->execute(['id' => $id]);

        $hash = $stmt->fetchColumn();

        return $hash !== false && password_verify($contrasena, $hash);
    }


    // =====================================================
    // CV
    // El PDF se guarda en backend/uploads/cvs/ y en la base
    // solo la ruta relativa (usuarios.cv_path), por ejemplo
    // 'uploads/cvs/cv_15_a8f32c91.pdf'.
    // =====================================================

    public const CV_DIR = 'uploads/cvs';
    public const CV_MAX_BYTES = 5 * 1024 * 1024;   // 5 MB

    /**
     * Ruta absoluta del CV del usuario, o null si no cargó ninguno
     * (o si el archivo ya no está en el disco).
     */
    public function obtenerRutaCv(int $id): ?string
    {
        $stmt = $this->db->prepare("
            SELECT cv_path
            FROM public.usuarios
            WHERE id = :id
                AND fecha_baja IS NULL
        ");

        $stmt->execute(['id' => $id]);

        $cvPath = $stmt->fetchColumn();

        return $cvPath ? $this->rutaAbsolutaCv($cvPath) : null;
    }

    /**
     * Guarda (o reemplaza) el CV del usuario. `$archivo` es la entrada
     * de $_FILES. Ante un archivo inválido lanza RuntimeException cuyo
     * código es el HTTP status a responder.
     */
    public function guardarCv(int $id, ?array $archivo): void
    {
        if (!$archivo || ($archivo['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            throw new RuntimeException("Seleccione un archivo PDF.", 400);
        }

        if (in_array($archivo['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)
            || $archivo['size'] > self::CV_MAX_BYTES) {
            throw new RuntimeException("El CV no puede superar los 5 MB.", 413);
        }

        if ($archivo['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($archivo['tmp_name'])) {
            throw new RuntimeException("No se pudo recibir el archivo.", 400);
        }

        if ($archivo['size'] === 0) {
            throw new RuntimeException("El archivo está vacío.", 400);
        }

        // Que realmente sea un PDF: tipo detectado por el contenido
        // (no el que informa el navegador) y la firma "%PDF-" al inicio
        $tipo = (new finfo(FILEINFO_MIME_TYPE))->file($archivo['tmp_name']);
        $firma = file_get_contents($archivo['tmp_name'], false, null, 0, 5);

        if ($tipo !== 'application/pdf' || $firma !== '%PDF-') {
            throw new RuntimeException("El archivo debe ser un PDF válido.", 415);
        }

        $cvAnterior = $this->obtenerRutaCv($id);

        $directorio = __DIR__ . '/../' . self::CV_DIR;

        if (!is_dir($directorio) && !mkdir($directorio, 0755, true)) {
            throw new RuntimeException("No se pudo guardar el CV.", 500);
        }

        // Nombre único: nunca se usa el nombre que mandó el usuario
        $nombre = sprintf('cv_%d_%s.pdf', $id, bin2hex(random_bytes(4)));
        $cvPath = self::CV_DIR . '/' . $nombre;
        $destino = $directorio . '/' . $nombre;

        if (!move_uploaded_file($archivo['tmp_name'], $destino)) {
            throw new RuntimeException("No se pudo guardar el CV.", 500);
        }

        try {
            $stmt = $this->db->prepare("
                UPDATE public.usuarios
                SET cv_path = :cv_path,
                    fecha_actualizacion = NOW()
                WHERE id = :id
                    AND fecha_baja IS NULL
            ");

            $stmt->execute(['cv_path' => $cvPath, 'id' => $id]);

            if ($stmt->rowCount() === 0) {
                throw new RuntimeException("Usuario no encontrado.", 404);
            }
        } catch (Throwable $e) {
            // Sin registro en la base el archivo nuevo no sirve
            unlink($destino);

            if ($e instanceof RuntimeException) throw $e;

            error_log("Error PDO al guardar CV: " . $e->getMessage());
            throw new RuntimeException("No se pudo guardar el CV.", 500);
        }

        // Reemplazo: el archivo anterior ya no se usa
        if ($cvAnterior && is_file($cvAnterior)) {
            unlink($cvAnterior);
        }
    }

    /**
     * Borra el CV del usuario (archivo y ruta en la base).
     * Devuelve false si no tenía uno cargado.
     */
    public function eliminarCv(int $id): bool
    {
        $rutaCv = $this->obtenerRutaCv($id);

        $stmt = $this->db->prepare("
            UPDATE public.usuarios
            SET cv_path = NULL,
                fecha_actualizacion = NOW()
            WHERE id = :id
                AND fecha_baja IS NULL
                AND cv_path IS NOT NULL
        ");

        $stmt->execute(['id' => $id]);

        if ($stmt->rowCount() === 0) {
            return false;
        }

        if ($rutaCv && is_file($rutaCv)) {
            unlink($rutaCv);
        }

        return true;
    }

    /**
     * Convierte la ruta guardada en la base en una ruta absoluta,
     * verificando que quede dentro de uploads/cvs (así un valor
     * manipulado no puede apuntar a otro archivo del servidor).
     */
    private function rutaAbsolutaCv(string $cvPath): ?string
    {
        $directorio = realpath(__DIR__ . '/../' . self::CV_DIR);
        $ruta = realpath(__DIR__ . '/../' . $cvPath);

        if (!$directorio || !$ruta || !str_starts_with($ruta, $directorio . DIRECTORY_SEPARATOR)) {
            return null;
        }

        return $ruta;
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