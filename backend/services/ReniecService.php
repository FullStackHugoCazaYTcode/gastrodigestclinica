<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Env;

/**
 * ReniecService — Consulta de DNI en RENIEC a través de un proveedor externo
 * (decolecta / apis.net.pe / apiperu, etc.). El token se mantiene en el
 * servidor (variables de entorno), nunca en el frontend.
 *
 * Configuración (Railway → variables del backend):
 *   RENIEC_API_URL    p. ej. https://api.decolecta.com/v1/reniec/dni
 *   RENIEC_API_TOKEN  el token del proveedor
 *
 * El parseo tolera distintos formatos de respuesta (nombres / first_name, etc.).
 */
final class ReniecService
{
    /**
     * @return array{nombres:string,apellido_paterno:string,apellido_materno:string,fecha_nacimiento:?string}|null
     */
    public static function consultarDni(string $dni): ?array
    {
        $base  = Env::get('RENIEC_API_URL');
        $token = Env::get('RENIEC_API_TOKEN');
        if ($base === null || $token === null) {
            error_log('[reniec] RENIEC_API_URL/RENIEC_API_TOKEN no configurados; consulta omitida.');
            return null;
        }

        $sep = str_contains($base, '?') ? '&' : '?';
        $url = rtrim($base) . $sep . 'numero=' . urlencode($dni);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $token,
                'Accept: application/json',
                'Referer: https://gastrodigestclinica.vercel.app',
            ],
        ]);
        $resp   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err    = curl_error($ch);
        curl_close($ch);

        if ($resp === false || $status >= 400) {
            error_log("[reniec] consulta DNI {$dni} falló (HTTP {$status}): {$err}");
            return null;
        }

        $json = json_decode((string) $resp, true);
        if (!is_array($json)) {
            return null;
        }
        // Algunos proveedores envuelven la respuesta en 'data'.
        $d = isset($json['data']) && is_array($json['data']) ? $json['data'] : $json;

        $nombres = $d['nombres'] ?? $d['first_name'] ?? $d['name'] ?? null;
        $apePat  = $d['apellidoPaterno'] ?? $d['apellido_paterno'] ?? $d['first_last_name'] ?? null;
        $apeMat  = $d['apellidoMaterno'] ?? $d['apellido_materno'] ?? $d['second_last_name'] ?? null;
        $fnac    = $d['fechaNacimiento'] ?? $d['fecha_nacimiento'] ?? $d['date_of_birth'] ?? null;

        if ($nombres === null && $apePat === null && $apeMat === null) {
            return null;
        }

        return [
            'nombres'          => trim((string) $nombres),
            'apellido_paterno' => trim((string) $apePat),
            'apellido_materno' => trim((string) $apeMat),
            'fecha_nacimiento' => $fnac !== null ? trim((string) $fnac) : null,
        ];
    }
}
