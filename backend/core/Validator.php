<?php
declare(strict_types=1);

namespace App\Core;

use DateTime;

/**
 * Validator — Validación de entradas en el límite del sistema.
 *
 * Defensa en profundidad: el frontend valida en tiempo real, la BD tiene
 * CHECK constraints, y esta capa valida en el servidor (nunca confiar en
 * datos externos).
 */
final class Validator
{
    /** Valida el número según el tipo de documento. Devuelve el error o null. */
    public static function documento(string $tipo, string $numero): ?string
    {
        return match ($tipo) {
            'DNI' => preg_match('/^[0-9]{8}$/', $numero)
                ? null : 'El DNI debe tener exactamente 8 dígitos.',
            'CE'  => preg_match('/^[A-Za-z0-9]{9}$/', $numero)
                ? null : 'El Carné de Extranjería debe tener 9 caracteres alfanuméricos.',
            'PAS' => (strlen($numero) >= 6 && strlen($numero) <= 20)
                ? null : 'El Pasaporte debe tener entre 6 y 20 caracteres.',
            default => 'Tipo de documento inválido (use DNI, CE o PAS).',
        };
    }

    /** Edad en años cumplidos a partir de la fecha de nacimiento (YYYY-MM-DD). -1 si inválida. */
    public static function edad(string $fechaNacimiento): int
    {
        $nac = DateTime::createFromFormat('Y-m-d', $fechaNacimiento);
        if ($nac === false) {
            return -1;
        }
        return (int) $nac->diff(new DateTime('today'))->y;
    }

    /** Regla legal (Ley 29414): menor de 18 → requiere apoderado. */
    public static function esMenor(string $fechaNacimiento): bool
    {
        $edad = self::edad($fechaNacimiento);
        return $edad >= 0 && $edad < 18;
    }

    public static function email(string $email): bool
    {
        return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
    }

    public static function telefono(string $tel): bool
    {
        return (bool) preg_match('/^[0-9]{9,15}$/', $tel);
    }

    public static function fechaValida(string $fecha, string $formato = 'Y-m-d'): bool
    {
        $d = DateTime::createFromFormat($formato, $fecha);
        return $d !== false && $d->format($formato) === $fecha;
    }

    /**
     * Devuelve un mapa de campos faltantes (campo => mensaje).
     * @param array<string,mixed> $data
     * @param array<int,string> $required
     * @return array<string,string>
     */
    public static function faltantes(array $data, array $required): array
    {
        $missing = [];
        foreach ($required as $field) {
            if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
                $missing[$field] = "El campo '{$field}' es obligatorio.";
            }
        }
        return $missing;
    }
}
