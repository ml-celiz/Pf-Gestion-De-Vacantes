<?php

$host     = "localhost";
$port     = "5432";
$db       = "postgres";
$user     = "postgres";
$password = "123";

try {
    $dsn = "pgsql:host=$host;port=$port;dbname=$db";
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    echo "Conexión a PostgreSQL realizada con éxito mediante PDO.";
} catch (PDOException $e) {
    echo "Error de conexión: " . $e->getMessage();
}

// http://localhost/Pf-Gestion-De-Vacantes/connection.php