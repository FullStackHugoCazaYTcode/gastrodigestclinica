<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\Cita;

/**
 * OtpController — Validación del código OTP (PENDIENTE_OTP → RESERVADA_WEB).
 */
final class OtpController
{
    public function validar(): void
    {
        $d = Request::json();
        $errores = Validator::faltantes($d, ['id_cita', 'codigo']);
        if (!empty($errores)) {
            Response::error('Datos inválidos.', 400, $errores);
        }
        if (!preg_match('/^[0-9]{4}$/', (string) $d['codigo'])) {
            Response::error('El código OTP debe tener 4 dígitos.', 400);
        }

        $resultado = (new Cita())->validarOtp((int) $d['id_cita'], (string) $d['codigo']);

        match ($resultado) {
            'OK'              => Response::success(['estado' => 'RESERVADA_WEB'], 'Cita validada por OTP.'),
            'INCORRECTO'      => Response::error('Código incorrecto.', 401),
            'EXPIRADO'        => Response::error('El código OTP expiró. Realice la reserva nuevamente.', 409),
            'BLOQUEADO'       => Response::error('Demasiados intentos fallidos. Reserva bloqueada.', 403),
            'ESTADO_INVALIDO' => Response::error('La cita no está pendiente de validación OTP.', 409),
            default           => Response::error('Cita no encontrada.', 404),
        };
    }
}
