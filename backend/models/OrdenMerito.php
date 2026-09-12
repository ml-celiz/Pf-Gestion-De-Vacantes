<?php

class OrdenMerito {
    public ?int $id;
    public int $puntaje;
    public int $posicion;
    public ?string $observaciones;
    public ?string $fechaPublicacion;
    public ?int $idSolicitud;

    public function __construct(array $data = []) {
        $this->id               = isset($data['id']) ? (int)$data['id'] : null;
        $this->puntaje          = isset($data['puntaje']) ? (int)$data['puntaje'] : 0;
        $this->posicion         = isset($data['posicion']) ? (int)$data['posicion'] : 0;
        $this->observaciones    = $data['observaciones'] ?? null;
        $this->fechaPublicacion = $data['fecha_publicacion'] ?? null;
        $this->idSolicitud      = isset($data['id_solicitud']) ? (int)$data['id_solicitud'] : null;
    }

    public function toArray(): array {
        return [
            'id'                => $this->id,
            'puntaje'           => $this->puntaje,
            'posicion'          => $this->posicion,
            'observaciones'     => $this->observaciones,
            'fecha_publicacion' => $this->fechaPublicacion,
            'id_solicitud'      => $this->idSolicitud
        ];
    }
}