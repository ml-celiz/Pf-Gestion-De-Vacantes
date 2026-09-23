<?php

class SolicitudVacante {

    public ?int $id;
    public ?string $fechaPostulacion;
    public string $cv;
    public ?int $idEstado;
    public ?int $idVacante;
    public ?int $idUsuario;

    // DATOS RELACIONADOS - ESTADO / VACANTE
    public ?string $estadoNombre;
    public ?string $vacanteTitulo;

    // DATOS RELACIONADOS - USUARIO
    public ?string $usuarioNombre;
    public ?string $usuarioApellido;
    public ?string $usuarioEmail;
    public ?string $usuarioDni;
    public ?string $usuarioTelefono;

    public function __construct(array $data = []) {

        $this->id =
            isset($data['id'])
                ? (int)$data['id']
                : null;

        $this->fechaPostulacion =
            $data['fecha_postulacion']
                ?? null;

        $this->cv =
            $data['cv']
                ?? '';

        $this->idEstado =
            isset($data['id_estado'])
                ? (int)$data['id_estado']
                : null;

        $this->idVacante =
            isset($data['id_vacante'])
                ? (int)$data['id_vacante']
                : null;

        $this->idUsuario =
            isset($data['id_usuario'])
                ? (int)$data['id_usuario']
                : null;

        $this->estadoNombre =
            $data['estado_nombre']
                ?? null;

        $this->vacanteTitulo =
            $data['vacante_titulo']
                ?? null;


        // DATOS DEL USUARIO

        $this->usuarioNombre =
            $data['usuario_nombre']
                ?? null;

        $this->usuarioApellido =
            $data['usuario_apellido']
                ?? null;

        $this->usuarioEmail =
            $data['usuario_email']
                ?? null;

        $this->usuarioDni =
            $data['usuario_dni']
                ?? null;

        $this->usuarioTelefono =
            $data['usuario_telefono']
                ?? null;
    }

    public function toArray(): array {

        return [

            // SOLICITUD
            'id' =>
                $this->id,

            'fecha_postulacion' =>
                $this->fechaPostulacion,

            'cv' =>
                $this->cv,

            'id_estado' =>
                $this->idEstado,

            'estado_nombre' =>
                $this->estadoNombre,

            'id_vacante' =>
                $this->idVacante,

            'vacante_titulo' =>
                $this->vacanteTitulo,

            'id_usuario' =>
                $this->idUsuario,


            // USUARIO
            'usuario_nombre' =>
                $this->usuarioNombre,

            'usuario_apellido' =>
                $this->usuarioApellido,

            'usuario_email' =>
                $this->usuarioEmail,

            'usuario_dni' =>
                $this->usuarioDni,

            'usuario_telefono' =>
                $this->usuarioTelefono
        ];
    }
}