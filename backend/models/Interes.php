<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Interes — Catálogo de temas de interés y su relación M:N con pacientes.
 */
final class Interes extends BaseModel
{
    /** Catálogo activo para el paso 4 del wizard. */
    public function activos(): array
    {
        return $this->run(
            'SELECT id_interes, codigo, nombre, icono
               FROM Intereses WHERE estado_activo = 1 ORDER BY id_interes'
        )->fetchAll();
    }

    /**
     * IDs internos a partir de una lista de códigos (filtra inválidos).
     * @param array<int,string> $codigos
     * @return array<int,int>
     */
    public function idsPorCodigos(array $codigos): array
    {
        $codigos = array_values(array_filter(array_map('strval', $codigos)));
        if ($codigos === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($codigos), '?'));
        $rows = $this->run(
            "SELECT id_interes FROM Intereses WHERE codigo IN ($placeholders)",
            $codigos
        )->fetchAll();
        return array_map(static fn($r) => (int) $r['id_interes'], $rows);
    }

    /**
     * Asocia una lista de intereses a un paciente.
     * @param array<int,int> $idsInteres
     */
    public function asignar(int $idPaciente, array $idsInteres): void
    {
        foreach ($idsInteres as $idInteres) {
            $this->run(
                'INSERT IGNORE INTO Paciente_Intereses (id_paciente, id_interes) VALUES (?, ?)',
                [$idPaciente, (int) $idInteres]
            );
        }
    }
}
