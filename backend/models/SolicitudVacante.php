<?php

class SolicitudVacante {

    public ?int $id;
    public ?string $fechaPostulacion;
    public string $cv;
    public ?int $idEstado;
    public ?int $idVacante;
    public ?int $idUsuario;

    // DATOS RELACIONADOS
    public ?string $estadoNombre;
    public ?string $vacanteTitulo;

    public function __construct(array $data = []) {

        $this->id = isset($data['id']) ? (int)$data['id']: null;
        $this->fechaPostulacion = $data['fecha_postulacion'] ?? null;
        $this->cv = $data['cv'] ?? '';
        $this->idEstado = isset($data['id_estado']) ? (int)$data['id_estado'] : null;
        $this->idVacante = isset($data['id_vacante']) ? (int)$data['id_vacante'] : null;
        $this->idUsuario = isset($data['id_usuario']) ? (int)$data['id_usuario'] : null;
        $this->estadoNombre = $data['estado_nombre'] ?? null;
        $this->vacanteTitulo = $data['vacante_titulo'] ?? null;
    }

    public function toArray(): array {

        return [
            'id' => $this->id,
            'fecha_postulacion' => $this->fechaPostulacion,
            'cv' => $this->cv,
            'id_estado' => $this->idEstado,
            'estado_nombre' => $this->estadoNombre,
            'id_vacante' => $this->idVacante,
            'vacante_titulo' => $this->vacanteTitulo,
            'id_usuario' => $this->idUsuario
        ];
    }
}