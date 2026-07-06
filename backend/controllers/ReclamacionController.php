<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\Reclamacion;

/**
 * ReclamacionController — Registro público del Libro de Reclamaciones.
 */
final class ReclamacionController
{
    private const TIPOS = ['RECLAMO', 'QUEJA'];
    private const BIENES = ['PRODUCTO', 'SERVICIO'];

    public function registrar(): void
    {
        $d = Request::json();
        $req = ['tipo', 'nombres', 'tipo_documento', 'numero_documento', 'correo', 'detalle', 'pedido'];
        if (!empty($errores = Validator::faltantes($d, $req))) {
            Response::error('Completa los campos obligatorios.', 400, $errores);
        }

        $campos = [];
        if (!in_array($d['tipo'], self::TIPOS, true)) {
            $campos['tipo'] = 'Selecciona reclamo o queja.';
        }
        if ($msg = Validator::documento((string) $d['tipo_documento'], trim((string) $d['numero_documento']))) {
            $campos['numero_documento'] = $msg;
        }
        if (!Validator::email(trim((string) $d['correo']))) {
            $campos['correo'] = 'Correo electrónico inválido.';
        }
        if (mb_strlen(trim((string) $d['detalle'])) < 10) {
            $campos['detalle'] = 'Describe el detalle (mínimo 10 caracteres).';
        }
        if (mb_strlen(trim((string) $d['pedido'])) < 5) {
            $campos['pedido'] = 'Indica tu pedido.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        $tipoBien = in_array($d['tipo_bien'] ?? 'SERVICIO', self::BIENES, true) ? $d['tipo_bien'] : 'SERVICIO';
        $monto = isset($d['monto']) && is_numeric(str_replace(',', '.', (string) $d['monto']))
            ? (float) str_replace(',', '.', (string) $d['monto'])
            : null;

        $numeroHoja = (new Reclamacion())->crear([
            'tipo'             => $d['tipo'],
            'nombres'          => trim((string) $d['nombres']),
            'tipo_documento'   => $d['tipo_documento'],
            'numero_documento' => trim((string) $d['numero_documento']),
            'telefono'         => isset($d['telefono']) ? preg_replace('/\D+/', '', (string) $d['telefono']) : null,
            'correo'           => trim((string) $d['correo']),
            'domicilio'        => isset($d['domicilio']) ? trim((string) $d['domicilio']) : null,
            'tipo_bien'        => $tipoBien,
            'descripcion_bien' => isset($d['descripcion_bien']) ? trim((string) $d['descripcion_bien']) : null,
            'monto_reclamado'  => $monto,
            'detalle'          => trim((string) $d['detalle']),
            'pedido'           => trim((string) $d['pedido']),
        ]);

        Response::created(['numero_hoja' => $numeroHoja], 'Reclamación registrada correctamente.');
    }
}
