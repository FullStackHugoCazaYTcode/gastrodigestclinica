<?php
declare(strict_types=1);

namespace App\Core;

use RuntimeException;

/**
 * Security — Utilidades de seguridad: sesión, CSRF, OTP, UUID y sanitización.
 */
final class Security
{
    public static function startSession(): void
    {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
    }

    /** Token CSRF por sesión (se genera una vez y se reutiliza). */
    public static function csrfToken(): string
    {
        self::startSession();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    public static function verifyCsrf(?string $token): bool
    {
        self::startSession();
        $stored = $_SESSION['csrf_token'] ?? '';
        return $stored !== '' && is_string($token) && hash_equals($stored, $token);
    }

    /** Código OTP numérico de 4 dígitos (con ceros a la izquierda). */
    public static function otpCode(): string
    {
        return str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /** El OTP se almacena hasheado; n8n recibe el código en claro vía POST. */
    public static function hashOtp(string $code): string
    {
        return hash('sha256', $code);
    }

    /** UUID v4 para tokens de reprogramación. */
    public static function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
        $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }

    public static function sanitize(string $value): string
    {
        return htmlspecialchars(trim($value), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}
