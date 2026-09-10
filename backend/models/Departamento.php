<?php

class Departamento {
    public ?int $id;
    public string $nombre;

    public function __construct(array $data = []) {
        $this->id     = isset($data['id']) ? (int)$data['id'] : null;
        $this->nombre = $data['nombre'] ?? '';
    }

    public function toArray(): array {
        return [
            'id'     => $this->id,
            'nombre' => $this->nombre
        ];
    }
}