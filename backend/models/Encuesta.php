<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Encuesta — Satisfacción post-atención (NPS).
 *
 * Se crea (PENDIENTE) al marcar una cita como ATENDIDA; el paciente la
 * responde por un enlace con token. Las respuestas con puntaje alto +
 * consentimiento, una vez aprobadas por el admin, se publican como
 * testimonios reales en el sitio.
 */
final class Encuesta extends BaseModel
{
    /** Crea la encuesta para una cita. Idempotente (única por cita). */
    public function crearParaCita(int $idCita, int $idPaciente, string $token): bool
    {
        $stmt = $this->run(
            'INSERT IGNORE INTO Encuestas (id_cita, id_paciente, token) VALUES (?, ?, ?)',
            [$idCita, $idPaciente, $token]
        );
        return $stmt->rowCount() > 0;
    }

    /** Datos de la encuesta por token (con médico/especialidad de la cita). */
    public function porToken(string $token): ?array
    {
        $stmt = $this->run(
            "SELECT e.id_encuesta, e.token, e.estado, e.puntaje, c.fecha_hora,
                    CONCAT(m.nombres, ' ', m.apellidos) AS medico, m.especialidad
             FROM Encuestas e
             JOIN Citas   c ON c.id_cita   = e.id_cita
             JOIN Medicos m ON m.id_medico = c.id_medico
             WHERE e.token = ? LIMIT 1",
            [$token]
        );
        return $stmt->fetch() ?: null;
    }

    /**
     * Registra la respuesta del paciente (una sola vez).
     * @return string OK|NO_EXISTE|YA_RESPONDIDA
     */
    public function registrarRespuesta(string $token, int $puntaje, ?string $comentario, bool $autoriza): string
    {
        $enc = $this->porToken($token);
        if ($enc === null) {
            return 'NO_EXISTE';
        }
        if ($enc['estado'] === 'RESPONDIDA') {
            return 'YA_RESPONDIDA';
        }
        $this->run(
            "UPDATE Encuestas
             SET estado = 'RESPONDIDA', puntaje = :p, comentario = :c,
                 autoriza_publicar = :a, respondida_at = NOW()
             WHERE token = :t AND estado = 'PENDIENTE'",
            [':p' => $puntaje, ':c' => $comentario, ':a' => $autoriza ? 1 : 0, ':t' => $token]
        );
        return 'OK';
    }

    /** Encuestas respondidas (con paciente/especialidad) para moderación del admin. */
    public function paraModeracion(int $limite = 60): array
    {
        $limite = max(1, min(200, $limite));
        return $this->run(
            "SELECT e.id_encuesta, e.puntaje, e.comentario, e.autoriza_publicar,
                    e.aprobado, e.respondida_at,
                    CONCAT(p.nombres, ' ', p.apellidos) AS paciente, m.especialidad
             FROM Encuestas e
             JOIN Pacientes p ON p.id_paciente = e.id_paciente
             JOIN Citas     c ON c.id_cita     = e.id_cita
             JOIN Medicos   m ON m.id_medico   = c.id_medico
             WHERE e.estado = 'RESPONDIDA'
             ORDER BY e.respondida_at DESC
             LIMIT {$limite}"
        )->fetchAll();
    }

    /** Aprueba u oculta un testimonio (moderación del admin). */
    public function moderar(int $idEncuesta, bool $aprobado): void
    {
        $this->run(
            'UPDATE Encuestas SET aprobado = :a WHERE id_encuesta = :id',
            [':a' => $aprobado ? 1 : 0, ':id' => $idEncuesta]
        );
    }

    /** Testimonios publicables: puntaje alto + consentimiento + aprobados. */
    public function testimonios(int $limite = 6): array
    {
        $limite = max(1, min(20, $limite));
        return $this->run(
            "SELECT e.puntaje, e.comentario, e.respondida_at,
                    CONCAT(p.nombres, ' ', LEFT(p.apellidos, 1), '.') AS autor,
                    m.especialidad
             FROM Encuestas e
             JOIN Pacientes p ON p.id_paciente = e.id_paciente
             JOIN Citas     c ON c.id_cita     = e.id_cita
             JOIN Medicos   m ON m.id_medico   = c.id_medico
             WHERE e.estado = 'RESPONDIDA' AND e.aprobado = 1
               AND e.autoriza_publicar = 1 AND e.puntaje >= 4
               AND e.comentario IS NOT NULL AND CHAR_LENGTH(TRIM(e.comentario)) > 0
             ORDER BY e.respondida_at DESC
             LIMIT {$limite}"
        )->fetchAll();
    }
}
