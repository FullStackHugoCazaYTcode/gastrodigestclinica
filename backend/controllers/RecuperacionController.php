<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Security;
use App\Core\Validator;
use App\Models\Paciente;
use App\Models\Recuperacion;
use App\Services\N8nClient;

/**
 * RecuperacionController — "¿Olvidaste tu contraseña?" del portal del paciente.
 *
 * Seguridad: la solicitud SIEMPRE responde igual, exista o no el documento
 * (evita enumerar cuentas). El código va hasheado a BD y vence en minutos.
 */
final class RecuperacionController
{
    private const CODIGO_LARGO = 6;

    /** POST /api/portal/recuperar/solicitar — envía el código al correo. */
    public function solicitar(): void
    {
        $d      = Request::json();
        $tipo   = (string) ($d['tipo_documento'] ?? '');
        $numero = trim((string) ($d['numero_documento'] ?? ''));

        // Respuesta genérica: no revela si el documento está registrado.
        $generico = 'Si el documento está registrado, enviamos un código a tu correo.';

        if (Validator::documento($tipo, $numero) !== null) {
            Response::success(null, $generico);
        }

        $paciente = (new Paciente())->buscarPorDocumento($tipo, $numero);
        // Sin cuenta de portal (password_hash vacío) tampoco se envía nada.
        if ($paciente === null || empty($paciente['password_hash'])) {
            Response::success(null, $generico);
        }

        $codigo = str_pad((string) random_int(0, 999999), self::CODIGO_LARGO, '0', STR_PAD_LEFT);
        (new Recuperacion())->crear((int) $paciente['id_paciente'], Security::hashOtp($codigo));

        N8nClient::enviarRecuperacion([
            'correo'   => (string) $paciente['correo'],
            'paciente' => trim(($paciente['nombres'] ?? '') . ' ' . ($paciente['apellidos'] ?? '')),
            'codigo'   => $codigo,
        ]);

        Response::success(null, $generico);
    }

    /** POST /api/portal/recuperar/cambiar — valida el código y cambia la contraseña. */
    public function cambiar(): void
    {
        $d        = Request::json();
        $tipo     = (string) ($d['tipo_documento'] ?? '');
        $numero   = trim((string) ($d['numero_documento'] ?? ''));
        $codigo   = trim((string) ($d['codigo'] ?? ''));
        $password = (string) ($d['password'] ?? '');

        $campos = [];
        if (Validator::documento($tipo, $numero) !== null) {
            $campos['numero_documento'] = 'Documento inválido.';
        }
        if (!preg_match('/^[0-9]{' . self::CODIGO_LARGO . '}$/', $codigo)) {
            $campos['codigo'] = 'El código es de ' . self::CODIGO_LARGO . ' dígitos.';
        }
        if (strlen($password) < 8) {
            $campos['password'] = 'La contraseña debe tener al menos 8 caracteres.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        $paciente = (new Paciente())->buscarPorDocumento($tipo, $numero);
        if ($paciente === null) {
            Response::error('Código incorrecto o vencido.', 400);
        }

        $res = (new Recuperacion())->validar((int) $paciente['id_paciente'], Security::hashOtp($codigo));
        match ($res) {
            'OK'        => $this->finalizar((int) $paciente['id_paciente'], $password),
            'EXPIRADO'  => Response::error('El código venció. Solicita uno nuevo.', 410),
            'BLOQUEADO' => Response::error('Demasiados intentos. Solicita un código nuevo.', 429),
            default     => Response::error('Código incorrecto.', 400),
        };
    }

    private function finalizar(int $idPaciente, string $password): never
    {
        (new Paciente())->actualizarPassword($idPaciente, password_hash($password, PASSWORD_DEFAULT));
        Response::success(null, 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.');
    }
}
