<?php

/*
* VALIDACIONES DE DATOS DE ENTRADA
* Cada función devuelve el mensaje de error a mostrar, o null si el valor
* es válido. Son las mismas reglas que aplica el frontend
* (frontend/services/validaciones.js): el backend las repite porque
* cualquiera puede llamar a la API sin pasar por la pantalla.
*/

// Contraseña: 8 a 72 caracteres (72 es el límite de bcrypt), con al menos
// una mayúscula, una minúscula, un número y un carácter especial
function validarContrasena(string $contrasena): ?string {
    if (strlen($contrasena) < 8) {
        return "La contraseña debe tener al menos 8 caracteres.";
    }

    if (strlen($contrasena) > 72) {
        return "La contraseña puede tener como máximo 72 caracteres.";
    }

    if (!preg_match('/[A-ZÁÉÍÓÚÑ]/u', $contrasena)) {
        return "La contraseña debe tener al menos una letra mayúscula.";
    }

    if (!preg_match('/[a-záéíóúñ]/u', $contrasena)) {
        return "La contraseña debe tener al menos una letra minúscula.";
    }

    if (!preg_match('/\d/', $contrasena)) {
        return "La contraseña debe tener al menos un número.";
    }

    if (!preg_match('/[^A-Za-z0-9ÁÉÍÓÚÑáéíóúñ\s]/u', $contrasena)) {
        return "La contraseña debe tener al menos un carácter especial (por ejemplo: ! @ # $ % & *).";
    }

    return null;
}

// Email: obligatorio, con formato válido y hasta 50 caracteres
function validarEmail(string $email): ?string {
    $email = trim($email);

    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return "Ingresá un correo electrónico válido.";
    }

    if (mb_strlen($email) > 50) {
        return "El correo electrónico puede tener como máximo 50 caracteres.";
    }

    return null;
}

// Nombre o apellido: obligatorio, hasta 50 caracteres, solo letras,
// espacios, apóstrofos y guiones
function validarNombre(string $valor, string $campo): ?string {
    $valor = trim($valor);

    if ($valor === '') {
        return "El $campo es obligatorio.";
    }

    if (mb_strlen($valor) > 50) {
        return "El $campo puede tener como máximo 50 caracteres.";
    }

    if (!preg_match("/^[\p{L}\s'-]+$/u", $valor)) {
        return "El $campo solo puede contener letras.";
    }

    return null;
}

// DNI: 7 u 8 dígitos. Vacío es válido salvo que sea obligatorio
function validarDni(mixed $dni, bool $obligatorio = false): ?string {
    $dni = trim((string)($dni ?? ''));

    if ($dni === '') {
        return $obligatorio ? "El DNI es obligatorio." : null;
    }

    if (!preg_match('/^\d{7,8}$/', $dni)) {
        return "El DNI debe tener 7 u 8 números, sin puntos.";
    }

    return null;
}

// Teléfono (opcional): de 6 a 20 caracteres entre números, espacios, +, - y paréntesis
function validarTelefono(mixed $telefono): ?string {
    $telefono = trim((string)($telefono ?? ''));

    if ($telefono === '') {
        return null;
    }

    if (!preg_match('/^[\d\s()+-]{6,20}$/', $telefono)) {
        return "El teléfono solo puede contener números, espacios, +, - y paréntesis (6 a 20 caracteres).";
    }

    return null;
}

// Nombre de un registro simple (rol, módulo, panel, departamento, cátedra)
function validarTextoObligatorio(mixed $valor, string $campo, int $maximo = 50): ?string {
    $valor = trim((string)($valor ?? ''));

    if ($valor === '') {
        return "El campo $campo es obligatorio.";
    }

    if (mb_strlen($valor) > $maximo) {
        return "El campo $campo puede tener como máximo $maximo caracteres.";
    }

    return null;
}
