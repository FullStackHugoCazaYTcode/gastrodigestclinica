<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Response;
use App\Models\Aseguradora;

/**
 * AseguradoraController — Lista de aseguradoras activas para el formulario de reserva.
 */
final class AseguradoraController
{
    public function listar(): void
    {
        Response::success((new Aseguradora())->activas(), 'Aseguradoras disponibles.');
    }
}
