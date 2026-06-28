<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;

/**
 * Env — Lector de variables de entorno.
 *
 * En desarrollo local lee un archivo .env (raíz del repo). En producción
 * (Railway) las variables ya están inyectadas en el entorno del proceso,
 * por lo que load() simplemente no hace nada si el archivo no existe.
 */
final class Env
{
    public static function load(string $path): void
    {
        if (!is_file($path)) {
            return; // Producción: las variables vienen del entorno (Railway).
        }
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value);
            // Quita comillas envolventes opcionales.
            $value = preg_replace('/^([\'"])(.*)\1$/', '$2', $value) ?? $value;

            if (getenv($key) === false) {
                putenv("{$key}={$value}");
                $_ENV[$key]    = $value;
                $_SERVER[$key] = $value;
            }
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $val = $_ENV[$key] ?? getenv($key);
        if ($val === false || $val === null || $val === '') {
            return $default;
        }
        return (string) $val;
    }

    /** Igual que get(), pero falla si la variable es obligatoria y no existe. */
    public static function mustGet(string $key): string
    {
        $val = self::get($key);
        if ($val === null) {
            throw new RuntimeException("Variable de entorno obligatoria no definida: {$key}");
        }
        return $val;
    }
}
