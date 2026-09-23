<?php

class Catedra {

    public ?int $id;
    public string $nombre;

    public int $idDepartamento;
    public int $idUsuario;

    public ?string $departamentoNombre;
    public ?string $usuarioNombre;


    public function __construct(array $data = []) {

        $this->id =
            isset($data['id'])
                ? (int)$data['id']
                : null;

        $this->nombre =
            $data['nombre'] ?? '';

        $this->idDepartamento =
            isset($data['id_departamento'])
                ? (int)$data['id_departamento']
                : 0;

        $this->idUsuario =
            isset($data['id_usuario'])
                ? (int)$data['id_usuario']
                : 0;

        $this->departamentoNombre =
            $data['departamento_nombre'] ?? null;

        $this->usuarioNombre =
            $data['usuario_nombre'] ?? null;
    }


    public function toArray(): array {

        return [

            'id' =>
                $this->id,

            'nombre' =>
                $this->nombre,

            'id_departamento' =>
                $this->idDepartamento,

            'departamento' =>
                $this->departamentoNombre,

            'id_usuario' =>
                $this->idUsuario,

            'usuario_nombre' =>
                $this->usuarioNombre
        ];
    }
}