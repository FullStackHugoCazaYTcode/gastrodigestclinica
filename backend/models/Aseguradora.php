<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Aseguradora — Catálogo de aseguradoras/IAFAS para la validación SITEDS.
 */
final class Aseguradora extends BaseModel
{
    public function activas(): array
    {
        $stmt = $this->run(
            'SELECT id_aseguradora, nombre FROM Aseguradoras
             WHERE estado_activo = 1 ORDER BY id_aseguradora'
        );
        return $stmt->fetchAll();
    }
}
