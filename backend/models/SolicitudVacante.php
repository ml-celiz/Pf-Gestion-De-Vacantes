<?php

class SolicitudVacante {

    public ?int $id;
    public ?string $fechaPostulacion;
    public bool $tieneCv;   // el postulante cargó su CV
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

    // RESULTADO - ORDEN DE MÉRITO (null si todavía no fue evaluada)
    public ?array $ordenMerito;

    public function __construct(array $data = []) {

        $this->id =
            isset($data['id'])
                ? (int)$data['id']
                : null;

        $this->fechaPostulacion =
            $data['fecha_postulacion']
                ?? null;

        $this->tieneCv =
            !empty($data['tiene_cv']);

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


        // ORDEN DE MÉRITO (viene del LEFT JOIN)

        $this->ordenMerito =
            isset($data['orden_merito_id'])
                ? [
                    'id'                => (int)$data['orden_merito_id'],
                    'puntaje'           => isset($data['orden_merito_puntaje'])
                                               ? (int)$data['orden_merito_puntaje']
                                               : null,
                    'posicion'          => isset($data['orden_merito_posicion'])
                                               ? (int)$data['orden_merito_posicion']
                                               : null,
                    'observaciones'     => $data['orden_merito_observaciones'] ?? null,
                    'fecha_publicacion' => $data['orden_merito_fecha_publicacion'] ?? null
                ]
                : null;
    }

    public function toArray(): array {

        return [

            // SOLICITUD
            'id' =>
                $this->id,

            'fecha_postulacion' =>
                $this->fechaPostulacion,

            'tiene_cv' =>
                $this->tieneCv,

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
                $this->usuarioTelefono,


            // RESULTADO
            'orden_merito' =>
                $this->ordenMerito
        ];
    }
}