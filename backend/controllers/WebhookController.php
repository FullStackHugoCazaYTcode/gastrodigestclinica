<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Env;
use App\Core\Request;
use App\Core\Response;
use App\Core\Security;
use App\Core\Validator;
use App\Middlewares\WebhookGuard;
use App\Models\Cita;

/**
 * WebhookController — Endpoints que reciben los webhooks de n8n.
 *
 * Flujo interactivo de WhatsApp:
 *   "1" → CONFIRMADA_WSP   "2" → genera token de reprogramación
 *   "3" → CANCELADA_PACIENTE
 */
final class WebhookController
{
    /** PATCH /api/citas/webhook-wsp — confirma o cancela según respuesta del paciente. */
    public function whatsapp(): void
    {
        WebhookGuard::verify();
        $d = Request::json();
        $errores = Validator::faltantes($d, ['id_cita', 'estado']);
        if (!empty($errores)) {
            Response::error('Datos inválidos.', 400, $errores);
        }

        $estado = (string) $d['estado'];
        if (!in_array($estado, ['CONFIRMADA_WSP', 'CANCELADA_PACIENTE'], true)) {
            Response::error('Estado no permitido por el webhook de WhatsApp.', 400);
        }

        $resultado = (new Cita())->transicionar(
            (int) $d['id_cita'],
            $estado,
            'WHATSAPP',
            $d['detalle'] ?? 'Respuesta del paciente vía WhatsApp.'
        );

        match ($resultado) {
            'OK'                      => Response::success(['estado' => $estado], 'Estado actualizado.'),
            'TRANSICION_NO_PERMITIDA' => Response::error('Transición de estado no permitida.', 409),
            default                   => Response::error('Cita no encontrada.', 404),
        };
    }

    /** POST /api/citas/reprogramacion — registra el token UUID (opción "2"). */
    public function registrarReprogramacion(): void
    {
        WebhookGuard::verify();
        $d = Request::json();
        if (empty($d['id_cita'])) {
            Response::error('El campo id_cita es obligatorio.', 400);
        }

        $token = !empty($d['token']) ? (string) $d['token'] : Security::uuid();
        $res   = (new Cita())->registrarTokenReprogramacion((int) $d['id_cita'], $token);
        if ($res !== 'OK') {
            Response::error('La cita no admite reprogramación en su estado actual.', 409);
        }

        // El link lo abre el paciente → debe apuntar al frontend (Vercel).
        $base = (string) (Env::get('APP_FRONTEND_URL') ?? Env::get('APP_URL', ''));
        Response::success([
            'token' => $token,
            'link'  => rtrim($base, '/') . '/reprogramar/' . $token,
        ], 'Token de reprogramación generado.');
    }
}
