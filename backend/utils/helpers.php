<?php

function respondMethodNotAllowed(): void {
    http_response_code(405);
    echo json_encode(["message" => "Método no permitido."]);
}