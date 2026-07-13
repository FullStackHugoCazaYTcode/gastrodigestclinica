<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Middlewares\SessionGuard;
use App\Models\Cita;
use App\Models\Medico;
use App\Models\Paciente;
use App\Services\N8nClient;
use RuntimeException;

/**
 * CitaController — Reserva de citas y reprogramación pública (vía token).
 */
final class CitaController
{
    public function reservar(): void
    {
        // Solo un paciente autenticado puede reservar (para sí o para un familiar).
        $idSesion = SessionGuard::requirePaciente();

        $d = Request::json();
        $errores = Validator::faltantes($d, ['id_paciente', 'id_medico', 'fecha_hora']);
        if (!empty($d['fecha_hora']) && !Validator::fechaValida((string) $d['fecha_hora'], 'Y-m-d H:i:s')) {
            $errores['fecha_hora'] = 'Formato esperado: YYYY-MM-DD HH:MM:SS.';
        }
        if (!empty($errores)) {
            Response::error('Datos inválidos.', 400, $errores);
        }

        $idPaciente = (int) $d['id_paciente'];
        $modeloPaciente = new Paciente();
        // Autorización: el titular solo puede reservar para sí o para un familiar a su cargo.
        if ($idPaciente !== $idSesion && !$modeloPaciente->esFamiliarDe($idPaciente, $idSesion)) {
            Response::error('No puedes reservar para este paciente.', 403);
        }

        if (!(new Medico())->estaActivo((int) $d['id_medico'])) {
            Response::error('El médico seleccionado no admite reservas online.', 409);
        }
        $paciente = $modeloPaciente->porId($idPaciente);
        if ($paciente === null) {
            Response::error('Paciente no encontrado.', 404);
        }

        try {
            $resultado = (new Cita())->reservar(
                (int) $d['id_paciente'],
                (int) $d['id_medico'],
                (string) $d['fecha_hora'],
                $d['motivo'] ?? null,
                isset($d['id_aseguradora']) ? (int) $d['id_aseguradora'] : null,
                $d['numero_afiliado'] ?? null
            );
        } catch (RuntimeException $e) {
            if ($e->getMessage() === 'CONFLICTO_HORARIO') {
                Response::error('El horario seleccionado ya no está disponible.', 409);
            }
            throw $e;
        }

        // Emite el OTP a n8n (WhatsApp; fallback SMTP). No revela el código.
        $enviado = N8nClient::enviarOtp(
            (string) $paciente['telefono'],
            $resultado['codigo'],
            (string) $paciente['correo']
        );

        Response::created([
            'id_cita'      => $resultado['id_cita'],
            'estado'       => 'PENDIENTE_OTP',
            'otp_enviado'  => $enviado,
            'ttl_segundos' => 300,
        ], 'Reserva creada. Ingrese el código OTP que recibirá por WhatsApp/correo.');
    }

    /** GET público: resuelve un token de reprogramación. */
    public function obtenerPorToken(array $params): void
    {
        $cita = (new Cita())->porToken((string) $params['token']);
        if ($cita === null) {
            Response::error('Enlace de reprogramación inválido o expirado.', 404);
        }
        Response::success([
            'id_cita'           => (int) $cita['id_cita'],
            'id_medico'         => (int) $cita['id_medico'],
            'fecha_hora_actual' => $cita['fecha_hora'],
            'estado'            => $cita['estado_actual'],
        ], 'Cita encontrada.');
    }

    /** PATCH público: aplica la reprogramación. */
    public function reprogramar(array $params): void
    {
        $d = Request::json();
        if (empty($d['nueva_fecha_hora']) || !Validator::fechaValida((string) $d['nueva_fecha_hora'], 'Y-m-d H:i:s')) {
            Response::error('Nueva fecha/hora inválida (YYYY-MM-DD HH:MM:SS).', 400);
        }

        $resultado = (new Cita())->reprogramar((string) $params['token'], (string) $d['nueva_fecha_hora']);
        match ($resultado) {
            'OK'                => Response::success(null, 'Cita reprogramada correctamente.'),
            'CONFLICTO_HORARIO' => Response::error('El nuevo horario ya está ocupado.', 409),
            default             => Response::error('Enlace de reprogramación inválido o expirado.', 404),
        };
    }
}
