<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Encuesta;

/**
 * EncuestaController — Encuesta de satisfacción (NPS) pública, respondida
 * por el paciente mediante un enlace con token; y testimonios publicables.
 */
final class EncuestaController
{
    /** GET /api/encuestas/{token} — datos para pintar la encuesta. */
    public function mostrar(array $params): void
    {
        $enc = (new Encuesta())->porToken((string) $params['token']);
        if ($enc === null) {
            Response::error('La encuesta no existe o el enlace no es válido.', 404);
        }
        Response::success([
            'estado'       => $enc['estado'],
            'respondida'   => $enc['estado'] === 'RESPONDIDA',
            'medico'       => $enc['medico'],
            'especialidad' => $enc['especialidad'],
            'fecha_hora'   => $enc['fecha_hora'],
        ], 'Encuesta.');
    }

    /** POST /api/encuestas/{token} — registra la respuesta del paciente. */
    public function responder(array $params): void
    {
        $d = Request::json();
        $puntaje = (int) ($d['puntaje'] ?? 0);
        if ($puntaje < 1 || $puntaje > 5) {
            Response::error('Selecciona una calificación de 1 a 5 estrellas.', 400, ['puntaje' => 'Puntaje inválido.']);
        }

        $comentario = isset($d['comentario']) ? mb_substr(trim((string) $d['comentario']), 0, 500) : '';
        $comentario = $comentario === '' ? null : $comentario;
        $autoriza = !empty($d['autoriza_publicar']);

        $res = (new Encuesta())->registrarRespuesta((string) $params['token'], $puntaje, $comentario, $autoriza);
        match ($res) {
            'OK'            => Response::success(['puntaje' => $puntaje], '¡Gracias por tu opinión!'),
            'YA_RESPONDIDA' => Response::error('Esta encuesta ya fue respondida. ¡Gracias!', 409),
            default         => Response::error('La encuesta no existe o el enlace no es válido.', 404),
        };
    }

    /** GET /api/testimonios — testimonios reales publicables (para el home). */
    public function testimonios(): void
    {
        Response::success((new Encuesta())->testimonios(6), 'Testimonios.');
    }
}
