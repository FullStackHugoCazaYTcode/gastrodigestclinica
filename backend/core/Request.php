<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Request — Acceso uniforme a los datos de la petición HTTP entrante.
 */
final class Request
{
    /** Método HTTP, con soporte de override por header (algunos clientes no envían PATCH). */
    public static function method(): string
    {
        $method   = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '';
        return $override !== '' ? strtoupper($override) : $method;
    }

    /** Ruta normalizada, sin query string, con un único slash inicial. */
    public static function path(): string
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
        return '/' . trim((string) $uri, '/');
    }

    /** Cuerpo JSON decodificado como arreglo asociativo. */
    public static function json(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || $raw === '') {
            return [];
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return isset($_SERVER[$key]) ? (string) $_SERVER[$key] : null;
    }

    public static function query(string $key, ?string $default = null): ?string
    {
        return isset($_GET[$key]) ? (string) $_GET[$key] : $default;
    }
}
