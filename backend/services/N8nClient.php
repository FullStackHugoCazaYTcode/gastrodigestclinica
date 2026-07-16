<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Env;

/**
 * N8nClient — Cliente HTTP hacia el orquestador n8n.
 *
 * PHP emite eventos (OTP, recordatorios) y n8n los entrega vía WhatsApp Cloud
 * API (con fallback SMTP si Meta falla, gestionado dentro del flujo n8n).
 * La autenticación del webhook se firma con un secreto compartido.
 */
final class N8nClient
{
    /** Emite el código OTP. El campo 'correo' habilita el fallback SMTP en n8n. */
    public static function enviarOtp(string $telefono, string $codigo, string $correo = ''): bool
    {
        return self::post('/webhook/otp', [
            'telefono' => $telefono,
            'codigo'   => $codigo,
            'correo'   => $correo,
        ]);
    }

    /** Emite un recordatorio interactivo (1: Confirmar, 2: Reprogramar, 3: Cancelar). */
    public static function enviarRecordatorio(array $payload): bool
    {
        return self::post('/webhook/recordatorio', $payload);
    }

    /** Avisa al paciente que un documento clínico ya está disponible en su portal. */
    public static function notificarDocumento(array $payload): bool
    {
        return self::post('/webhook/documento-listo', $payload);
    }

    /** Alerta inmediata al equipo cuando ingresa una reclamación (INDECOPI). */
    public static function alertaReclamacion(array $payload): bool
    {
        return self::post('/webhook/reclamacion', $payload);
    }

    /** Envía al paciente la encuesta de satisfacción tras ser atendido. */
    public static function enviarEncuesta(array $payload): bool
    {
        return self::post('/webhook/encuesta', $payload);
    }

    /** Envía el código para recuperar la contraseña del portal. */
    public static function enviarRecuperacion(array $payload): bool
    {
        return self::post('/webhook/recuperacion', $payload);
    }

    /**
     * POST JSON firmado al webhook de n8n. Devuelve false (sin lanzar) ante
     * fallos de red para no bloquear la transacción principal; el error queda
     * en el log para reintento/observabilidad.
     */
    private static function post(string $ruta, array $payload): bool
    {
        $base = Env::get('N8N_WEBHOOK_BASE_URL');
        if ($base === null) {
            error_log('[n8n] N8N_WEBHOOK_BASE_URL no configurado; evento omitido: ' . $ruta);
            return false;
        }

        $headers = ['Content-Type: application/json'];
        $secret  = Env::get('N8N_WEBHOOK_SECRET');
        if ($secret !== null) {
            $headers[] = 'X-Webhook-Secret: ' . $secret;
        }

        $ch = curl_init(rtrim($base, '/') . $ruta);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_CONNECTTIMEOUT => 4,
        ]);
        $response = curl_exec($ch);
        $status   = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($response === false || $status >= 400) {
            error_log("[n8n] POST {$ruta} falló (HTTP {$status}): {$error}");
            return false;
        }
        return true;
    }
}
