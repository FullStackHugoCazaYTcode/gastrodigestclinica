<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Reclamacion — Libro de Reclamaciones (Ley N.° 29571 / INDECOPI).
 */
final class Reclamacion extends BaseModel
{
    /**
     * Registra una reclamación y devuelve el número de Hoja generado.
     * @param array<string,mixed> $d
     */
    public function crear(array $d): string
    {
        $numeroHoja = 'HR-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));
        $this->run(
            'INSERT INTO Libro_Reclamaciones
                (numero_hoja, tipo, nombres, tipo_documento, numero_documento, telefono, correo,
                 domicilio, tipo_bien, descripcion_bien, monto_reclamado, detalle, pedido)
             VALUES
                (:hoja, :tipo, :nom, :tdoc, :ndoc, :tel, :correo, :dom, :bien, :dbien, :monto, :det, :ped)',
            [
                ':hoja'   => $numeroHoja,
                ':tipo'   => $d['tipo'],
                ':nom'    => $d['nombres'],
                ':tdoc'   => $d['tipo_documento'],
                ':ndoc'   => $d['numero_documento'],
                ':tel'    => $d['telefono'] ?? null,
                ':correo' => $d['correo'],
                ':dom'    => $d['domicilio'] ?? null,
                ':bien'   => $d['tipo_bien'] ?? 'SERVICIO',
                ':dbien'  => $d['descripcion_bien'] ?? null,
                ':monto'  => $d['monto_reclamado'] ?? null,
                ':det'    => $d['detalle'],
                ':ped'    => $d['pedido'],
            ]
        );
        return $numeroHoja;
    }
}
