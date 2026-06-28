<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Medico — Profesionales. estado_activo habilita la reserva online.
 */
final class Medico extends BaseModel
{
    /** Médicos que admiten reservas online. */
    public function activos(): array
    {
        $stmt = $this->run(
            'SELECT id_medico, cmp, nombres, apellidos, especialidad
             FROM Medicos WHERE estado_activo = 1 ORDER BY apellidos, nombres'
        );
        return $stmt->fetchAll();
    }

    public function porId(int $id): ?array
    {
        $stmt = $this->run('SELECT * FROM Medicos WHERE id_medico = ? LIMIT 1', [$id]);
        return $stmt->fetch() ?: null;
    }

    public function estaActivo(int $id): bool
    {
        $stmt = $this->run(
            'SELECT 1 FROM Medicos WHERE id_medico = ? AND estado_activo = 1 LIMIT 1',
            [$id]
        );
        return $stmt->fetchColumn() !== false;
    }
}
