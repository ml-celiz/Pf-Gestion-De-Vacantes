<?php

class SolicitudVacante {
    public ?int $id;
    public ?string $fechaPostulacion;
    public string $cv;
    public ?int $idEstado;
    public ?int $idVacante;
    public ?int $idUsuario;

    public function __construct(array $data = []) {
        $this->id               = isset($data['id']) ? (int)$data['id'] : null;
        $this->fechaPostulacion = $data['fecha_postulacion'] ?? null;
        $this->cv               = $data['cv'] ?? '';
        $this->idEstado         = isset($data['id_estado']) ? (int)$data['id_estado'] : null;
        $this->idVacante        = isset($data['id_vacante']) ? (int)$data['id_vacante'] : null;
        $this->idUsuario        = isset($data['id_usuario']) ? (int)$data['id_usuario'] : null;
    }

    public function toArray(): array {
        return [
            'id'                => $this->id,
            'fecha_postulacion' => $this->fechaPostulacion,
            'cv'                => $this->cv,
            'id_estado'         => $this->idEstado,
            'id_vacante'        => $this->idVacante,
            'id_usuario'        => $this->idUsuario
        ];
    }
}