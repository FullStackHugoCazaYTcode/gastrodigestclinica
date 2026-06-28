<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Response;
use App\Models\Medico;

/**
 * MedicoController — Listado de médicos disponibles para reserva online.
 */
final class MedicoController
{
    public function listar(): void
    {
        $medicos = (new Medico())->activos();
        Response::success($medicos, 'Médicos disponibles para reserva.');
    }
}
