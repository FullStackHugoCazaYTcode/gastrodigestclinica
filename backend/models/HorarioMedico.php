<?php
declare(strict_types=1);

namespace App\Models;

/**
 * HorarioMedico — Disponibilidad real por médico.
 *
 * Combina el horario semanal recurrente (Horarios_Medico), las ausencias por
 * fecha (Bloqueos_Medico) y las citas ya tomadas para calcular los cupos
 * libres de un médico en una fecha concreta.
 */
final class HorarioMedico extends BaseModel
{
    private const SLOT_MIN = 30;

    /**
     * Cupos "HH:MM" disponibles de un médico en una fecha (AAAA-MM-DD).
     * @return array<int,string>
     */
    public function slotsDisponibles(int $idMedico, string $fecha): array
    {
        // Bloqueos del día (vacaciones/feriados). Uno de día completo cancela todo.
        $bloqueos = $this->run(
            'SELECT hora_inicio, hora_fin FROM Bloqueos_Medico WHERE id_medico = ? AND fecha = ?',
            [$idMedico, $fecha]
        )->fetchAll();
        foreach ($bloqueos as $b) {
            if ($b['hora_inicio'] === null) {
                return [];
            }
        }

        $dia = (int) date('N', strtotime($fecha)); // 1=Lun … 7=Dom
        $bloques = $this->run(
            'SELECT hora_inicio, hora_fin FROM Horarios_Medico
             WHERE id_medico = ? AND dia_semana = ? AND activo = 1
             ORDER BY hora_inicio',
            [$idMedico, $dia]
        )->fetchAll();
        if (!$bloques) {
            return [];
        }

        // Horas ya reservadas (activas) del día.
        $tomadas = [];
        foreach ($this->run(
            "SELECT TIME_FORMAT(fecha_hora, '%H:%i') AS hhmm FROM Citas
             WHERE id_medico = ? AND DATE(fecha_hora) = ?
               AND estado_actual NOT IN ('CANCELADA_PACIENTE','NO_ASISTIO')",
            [$idMedico, $fecha]
        )->fetchAll() as $r) {
            $tomadas[$r['hhmm']] = true;
        }

        // Rangos de bloqueo parcial (en minutos).
        $rangos = [];
        foreach ($bloqueos as $b) {
            $rangos[] = [$this->min($b['hora_inicio']), $this->min($b['hora_fin'])];
        }

        // Si la fecha es hoy, no ofrecer cupos que ya pasaron.
        $ahora = ($fecha === date('Y-m-d')) ? ((int) date('G') * 60 + (int) date('i')) : -1;

        $slots = [];
        foreach ($bloques as $blk) {
            $ini = $this->min($blk['hora_inicio']);
            $fin = $this->min($blk['hora_fin']);
            for ($m = $ini; $m + self::SLOT_MIN <= $fin; $m += self::SLOT_MIN) {
                if ($m <= $ahora) {
                    continue;
                }
                $hhmm = sprintf('%02d:%02d', intdiv($m, 60), $m % 60);
                if (isset($tomadas[$hhmm])) {
                    continue;
                }
                foreach ($rangos as [$bi, $bf]) {
                    if ($m >= $bi && $m < $bf) {
                        continue 2;
                    }
                }
                $slots[$hhmm] = true;
            }
        }
        $lista = array_keys($slots);
        sort($lista);
        return $lista;
    }

    /** Horario semanal del médico (para el panel del admin). */
    public function horariosDe(int $idMedico): array
    {
        return $this->run(
            'SELECT id_horario, dia_semana, hora_inicio, hora_fin, activo
             FROM Horarios_Medico WHERE id_medico = ?
             ORDER BY dia_semana, hora_inicio',
            [$idMedico]
        )->fetchAll();
    }

    /** Bloqueos futuros del médico (desde hoy). */
    public function bloqueosDe(int $idMedico): array
    {
        return $this->run(
            'SELECT id_bloqueo, fecha, hora_inicio, hora_fin, motivo
             FROM Bloqueos_Medico WHERE id_medico = ? AND fecha >= CURDATE()
             ORDER BY fecha, hora_inicio',
            [$idMedico]
        )->fetchAll();
    }

    public function agregarHorario(int $idMedico, int $dia, string $inicio, string $fin): int
    {
        $this->run(
            'INSERT INTO Horarios_Medico (id_medico, dia_semana, hora_inicio, hora_fin)
             VALUES (?, ?, ?, ?)',
            [$idMedico, $dia, $inicio, $fin]
        );
        return (int) $this->db->lastInsertId();
    }

    public function eliminarHorario(int $idHorario, int $idMedico): bool
    {
        $stmt = $this->run(
            'DELETE FROM Horarios_Medico WHERE id_horario = ? AND id_medico = ?',
            [$idHorario, $idMedico]
        );
        return $stmt->rowCount() > 0;
    }

    public function agregarBloqueo(int $idMedico, string $fecha, ?string $inicio, ?string $fin, ?string $motivo): int
    {
        $this->run(
            'INSERT INTO Bloqueos_Medico (id_medico, fecha, hora_inicio, hora_fin, motivo)
             VALUES (?, ?, ?, ?, ?)',
            [$idMedico, $fecha, $inicio, $fin, $motivo]
        );
        return (int) $this->db->lastInsertId();
    }

    public function eliminarBloqueo(int $idBloqueo, int $idMedico): bool
    {
        $stmt = $this->run(
            'DELETE FROM Bloqueos_Medico WHERE id_bloqueo = ? AND id_medico = ?',
            [$idBloqueo, $idMedico]
        );
        return $stmt->rowCount() > 0;
    }

    /** "HH:MM(:SS)" → minutos del día. NULL → 0. */
    private function min(?string $time): int
    {
        if ($time === null || $time === '') {
            return 0;
        }
        $parts = explode(':', $time);
        return ((int) $parts[0]) * 60 + ((int) ($parts[1] ?? 0));
    }
}
