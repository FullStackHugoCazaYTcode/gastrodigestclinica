<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\ReniecService;

/**
 * ReniecController — Autocompletado de datos por DNI (consulta RENIEC).
 * Usado en el wizard de registro; el token vive en el backend (ReniecService).
 */
final class ReniecController
{
    /** GET /api/reniec/dni?numero=XXXXXXXX */
    public function dni(): void
    {
        $numero = preg_replace('/\D+/', '', (string) Request::query('numero', ''));
        if (!preg_match('/^\d{8}$/', (string) $numero)) {
            Response::error('DNI inválido. Debe tener 8 dígitos.', 400, ['numero' => 'Ingresa un DNI de 8 dígitos.']);
        }

        $data = ReniecService::consultarDni((string) $numero);
        if ($data === null) {
            Response::error('No se pudo consultar el DNI en RENIEC en este momento.', 502);
        }
        Response::success($data, 'Datos encontrados en RENIEC.');
    }
}
