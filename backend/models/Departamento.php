<?php

/*
* Fila de `departamentos`.
*
* MODELO: representa una fila de la base como objeto. El constructor
* recibe el array de la consulta (o del pedido) y toArray() arma la
* respuesta JSON con los nombres de campo que usa el frontend.
*/
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