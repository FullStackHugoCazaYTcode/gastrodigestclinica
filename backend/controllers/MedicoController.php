<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\HorarioMedico;
use App\Models\Medico;

/**
 * MedicoController — Listado de médicos y su disponibilidad para reserva online.
 */
final class MedicoController
{
    public function listar(): void
    {
        $medicos = (new Medico())->activos();
        Response::success($medicos, 'Médicos disponibles para reserva.');
    }

    /** GET /api/medicos/{id}/disponibilidad?fecha=AAAA-MM-DD — cupos libres. */
    public function disponibilidad(array $params): void
    {
        $fecha = (string) Request::query('fecha', '');
        if (!Validator::fechaValida($fecha)) {
            Response::error('Fecha inválida.', 400, ['fecha' => 'Usa el formato AAAA-MM-DD.']);
        }
        $slots = (new HorarioMedico())->slotsDisponibles((int) $params['id'], $fecha);
        Response::success(['fecha' => $fecha, 'slots' => $slots], 'Disponibilidad del médico.');
    }
}
