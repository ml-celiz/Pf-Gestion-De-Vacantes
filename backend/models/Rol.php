<?php

class Rol {
    public ?int $id;
    public string $nombre;
    public ?int $duracionToken;

    public function __construct(array $data = []) {
        $this->id = isset($data['id'])
            ? (int)$data['id']
            : null;

        $this->nombre = $data['nombre'] ?? '';

        $this->duracionToken = isset($data['token_duracion'])
            ? (int)$data['token_duracion']
            : null;
    }

    public function toArray(): array {
        return [
            'id'             => $this->id,
            'nombre'         => $this->nombre,
            'duracion_token' => $this->duracionToken
        ];
    }
}

class RolPanel {
    public ?int $id;
    public int $idRol;
    public int $idPanel;
    public ?string $panelNombre;

    public function __construct(array $data = []) {
        $this->id          = isset($data['id']) ? (int)$data['id'] : null;
        $this->idRol       = isset($data['id_rol']) ? (int)$data['id_rol'] : 0;
        $this->idPanel     = isset($data['id_panel']) ? (int)$data['id_panel'] : 0;
        $this->panelNombre = $data['panel_nombre'] ?? null;
    }

    public function toArray(): array {
        return [
            'id'           => $this->id,
            'id_rol'       => $this->idRol,
            'id_panel'     => $this->idPanel,
            'panel_nombre' => $this->panelNombre
        ];
    }
}

class RolModulo {
    public ?int $id;
    public int $idRol;
    public int $idModulo;
    public bool $leer;
    public bool $escribir;
    public bool $editar;
    public ?string $moduloNombre;

    public function __construct(array $data = []) {
        $this->id           = isset($data['id']) ? (int)$data['id'] : null;
        $this->idRol        = isset($data['id_rol']) ? (int)$data['id_rol'] : 0;
        $this->idModulo     = isset($data['id_modulo']) ? (int)$data['id_modulo'] : 0;
        $this->leer         = filter_var($data['leer'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->escribir     = filter_var($data['escribir'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->editar       = filter_var($data['editar'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $this->moduloNombre = $data['modulo_nombre'] ?? null;
    }

    public function toArray(): array {
        return [
            'id'            => $this->id,
            'id_rol'        => $this->idRol,
            'id_modulo'     => $this->idModulo,
            'leer'          => $this->leer,
            'escribir'      => $this->escribir,
            'editar'        => $this->editar,
            'modulo_nombre' => $this->moduloNombre
        ];
    }
}

class RolUsuario {
    public ?int $id;
    public int $idRol;
    public int $idUsuario;
    public ?string $usuario;
    public ?string $email;

    public function __construct(array $data = []) {
        $this->id        = isset($data['id']) ? (int)$data['id'] : null;
        $this->idRol     = isset($data['id_rol']) ? (int)$data['id_rol'] : 0;
        $this->idUsuario = isset($data['id_usuario']) ? (int)$data['id_usuario'] : 0;
        $this->usuario   = $data['usuario'] ?? null;
        $this->email     = $data['email'] ?? null;
    }

    public function toArray(): array {
        return [
            'id'         => $this->id,
            'id_rol'     => $this->idRol,
            'id_usuario' => $this->idUsuario,
            'usuario'    => $this->usuario,
            'email'      => $this->email
        ];
    }
}