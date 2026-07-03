<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Security;
use App\Core\Validator;
use App\Middlewares\SessionGuard;
use App\Models\Cita;
use App\Models\DocumentoClinico;
use App\Models\Paciente;

/**
 * PortalController — Portal privado del paciente: login, logout y documentos.
 * Autorización estricta: el id_paciente de sesión debe coincidir con el recurso.
 */
final class PortalController
{
    public function login(): void
    {
        $d = Request::json();
        $errores = Validator::faltantes($d, ['tipo_documento', 'numero_documento', 'password']);
        if (!empty($errores)) {
            Response::error('Credenciales incompletas.', 400, $errores);
        }

        $cred = (new Paciente())->credencialPorDocumento(
            (string) $d['tipo_documento'],
            (string) $d['numero_documento']
        );

        // Mensaje genérico para no revelar si el documento existe.
        if ($cred === null
            || empty($cred['password_hash'])
            || !password_verify((string) $d['password'], (string) $cred['password_hash'])
        ) {
            Response::error('Documento o contraseña incorrectos.', 401);
        }

        SessionGuard::login((int) $cred['id_paciente']);
        Response::success([
            'paciente'   => trim($cred['nombres'] . ' ' . $cred['apellidos']),
            'csrf_token' => Security::csrfToken(),
        ], 'Sesión iniciada.');
    }

    public function logout(): void
    {
        SessionGuard::destroy();
        Response::success(null, 'Sesión cerrada.');
    }

    /** Devuelve el paciente autenticado (o 401). Usado para gatear /reservar. */
    public function sesion(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $p = (new Paciente())->porId($idPaciente);
        if ($p === null) {
            SessionGuard::destroy();
            Response::error('Sesión inválida.', 401);
        }
        Response::success([
            'id_paciente'      => (int) $p['id_paciente'],
            'nombres'          => $p['nombres'],
            'apellidos'        => $p['apellidos'],
            'tipo_documento'   => $p['tipo_documento'],
            'numero_documento' => $p['numero_documento'],
            'correo'           => $p['correo'],
            'telefono'         => $p['telefono'],
            'fecha_nacimiento' => $p['fecha_nacimiento'],
            'sexo'             => $p['sexo'],
        ], 'Sesión activa.');
    }

    public function documentos(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $docs = (new DocumentoClinico())->porPaciente($idPaciente);
        Response::success($docs, 'Documentos del paciente.');
    }

    public function citas(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $citas = (new Cita())->porPaciente($idPaciente);
        Response::success($citas, 'Citas del paciente.');
    }

    public function documento(array $params): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $doc = (new DocumentoClinico())->porIdYPaciente((int) $params['id'], $idPaciente);
        if ($doc === null) {
            // 403: existe pero no es del paciente, o no existe (no se distingue).
            Response::error('Documento no encontrado o no autorizado.', 403);
        }
        Response::success($doc, 'Documento.');
    }
}
