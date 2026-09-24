<?php

class UsuarioModel {

    public ?int $id;
    public string $email;
    public ?string $nombre;
    public ?string $apellido;
    public string $contrasena;
    public ?int $dni;
    public ?string $telefono;
    public ?string $fecha_alta;
    public ?string $fecha_actualizacion;
    public ?string $fecha_baja;
    public ?string $rol;
    public int $cantidad_sesiones;

    // Solo si tiene CV cargado: la ruta del archivo no sale del servidor
    public bool $tiene_cv;

    public function __construct(array $data = []) {

        $this->id = isset($data['id']) ? (int)$data['id'] : null;
        $this->email = $data['email'] ?? '';
        $this->nombre = $data['nombre'] ?? null;
        $this->apellido = $data['apellido'] ?? null;
        $this->contrasena = $data['contrasena'] ?? $data['contraseña'] ?? '';
        $this->dni = isset($data['dni']) ? (int)$data['dni'] : null;
        $this->telefono = $data['telefono'] ?? null;
        $this->fecha_alta = $data['fecha_alta'] ?? null;
        $this->fecha_actualizacion = $data['fecha_actualizacion'] ?? null;
        $this->fecha_baja = $data['fecha_baja'] ?? null;
        $this->rol = $data['rol'] ?? null;
        $this->cantidad_sesiones = isset($data['cantidad_sesiones']) ? (int)$data['cantidad_sesiones']: 0;
        $this->tiene_cv = !empty($data['cv_path']);
    }


    public function toArray(): array {
        return [

            'id' => $this->id,
            'email' => $this->email,
            'nombre' => $this->nombre,
            'apellido' => $this->apellido,
            'dni' => $this->dni,
            'telefono' => $this->telefono,
            'fecha_alta' => $this->fecha_alta,
            'fecha_actualizacion' => $this->fecha_actualizacion,
            'fecha_baja' => $this->fecha_baja,
            'rol' => $this->rol,
            'cantidad_sesiones' => $this->cantidad_sesiones,
            'tiene_cv' => $this->tiene_cv
        ];
    }
}