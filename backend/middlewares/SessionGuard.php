<?php
declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Response;
use App\Core\Security;

/**
 * SessionGuard — Autenticación y autorización del portal del paciente.
 * Expira la sesión tras 30 minutos de inactividad.
 */
final class SessionGuard
{
    private const TIMEOUT_SEGUNDOS = 1800; // 30 minutos

    /** Devuelve el id_paciente autenticado o corta la ejecución con 401. */
    public static function requirePaciente(): int
    {
        Security::startSession();
        $idPaciente = $_SESSION['id_paciente'] ?? null;
        $last       = (int) ($_SESSION['last_activity'] ?? 0);

        if ($idPaciente === null) {
            Response::error('No autenticado. Inicie sesión en el portal.', 401);
        }
        if ((time() - $last) > self::TIMEOUT_SEGUNDOS) {
            self::destroy();
            Response::error('Sesión expirada. Inicie sesión nuevamente.', 401);
        }
        $_SESSION['last_activity'] = time();
        return (int) $idPaciente;
    }

    public static function login(int $idPaciente): void
    {
        Security::startSession();
        session_regenerate_id(true); // previene fijación de sesión
        $_SESSION['id_paciente']   = $idPaciente;
        $_SESSION['last_activity'] = time();
    }

    /** Devuelve el id_medico autenticado o corta la ejecución con 401. */
    public static function requireMedico(): int
    {
        Security::startSession();
        $idMedico = $_SESSION['id_medico'] ?? null;
        $last     = (int) ($_SESSION['med_last'] ?? 0);

        if ($idMedico === null) {
            Response::error('No autenticado. Inicie sesión como médico.', 401);
        }
        if ((time() - $last) > self::TIMEOUT_SEGUNDOS) {
            self::destroy();
            Response::error('Sesión expirada. Inicie sesión nuevamente.', 401);
        }
        $_SESSION['med_last'] = time();
        return (int) $idMedico;
    }

    public static function loginMedico(int $idMedico): void
    {
        Security::startSession();
        session_regenerate_id(true);
        $_SESSION['id_medico'] = $idMedico;
        $_SESSION['med_last']  = time();
    }

    public static function destroy(): void
    {
        Security::startSession();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }
}
