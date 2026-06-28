<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Response — Envelope único para todas las respuestas de la API.
 *
 * Formato de contrato (Sección 4.G del prompt maestro):
 *   { "success": bool, "message": string, "data": mixed, "errors": mixed }
 *
 * Cada método termina la ejecución (exit) para garantizar una sola respuesta.
 */
final class Response
{
    public static function json(bool $success, string $message, mixed $data, mixed $errors, int $code): never
    {
        if (!headers_sent()) {
            http_response_code($code);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode([
            'success' => $success,
            'message' => $message,
            'data'    => $data,
            'errors'  => $errors,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function success(mixed $data = null, string $message = 'Operación exitosa', int $code = 200): never
    {
        self::json(true, $message, $data, null, $code);
    }

    public static function created(mixed $data = null, string $message = 'Recurso creado correctamente'): never
    {
        self::json(true, $message, $data, null, 201);
    }

    public static function error(string $message, int $code = 400, mixed $errors = null): never
    {
        self::json(false, $message, null, $errors, $code);
    }
}
