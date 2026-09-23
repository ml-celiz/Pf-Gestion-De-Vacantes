<?php

class Vacante {

    public ?int $id;
    public string $titulo;
    public string $descripcion;
    public mixed $requisitos;
    public ?string $inicio;
    public ?string $fin;

    public ?int $idEstado;
    public ?int $idCatedra;
    public ?int $idUsuario;

    public ?string $estadoNombre;
    public ?string $catedraNombre;


    public function __construct(array $data = []) {

        $this->id =
            isset($data['id'])
                ? (int)$data['id']
                : null;

        $this->titulo =
            $data['titulo'] ?? '';

        $this->descripcion =
            $data['descripcion'] ?? '';

        $this->requisitos =
            $data['requisitos'] ?? null;

        $this->inicio =
            $data['inicio'] ?? null;

        $this->fin =
            $data['fin'] ?? null;

        $this->idEstado =
            isset($data['id_estado'])
                ? (int)$data['id_estado']
                : null;

        $this->idCatedra =
            isset($data['id_catedra'])
                ? (int)$data['id_catedra']
                : null;

        $this->idUsuario =
            isset($data['id_usuario'])
                ? (int)$data['id_usuario']
                : null;

        $this->estadoNombre =
            $data['estado_nombre'] ?? null;

        $this->catedraNombre =
            $data['catedra_nombre'] ?? null;
    }


    public function toArray(): array {

        return [

            'id' =>
                $this->id,

            'titulo' =>
                $this->titulo,

            'descripcion' =>
                $this->descripcion,

            'requisitos' =>
                is_string($this->requisitos)
                    ? json_decode(
                        $this->requisitos,
                        true
                    )
                    : $this->requisitos,

            'inicio' =>
                $this->inicio,

            'fin' =>
                $this->fin,

            'id_estado' =>
                $this->idEstado,

            'estado' =>
                $this->estadoNombre,

            'id_catedra' =>
                $this->idCatedra,

            'catedra' =>
                $this->catedraNombre,

            'id_usuario' =>
                $this->idUsuario
        ];
    }
}