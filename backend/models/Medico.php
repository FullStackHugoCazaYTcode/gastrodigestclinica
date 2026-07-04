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

    /** Credencial para el login del área médica (por correo). */
    public function credencialPorCorreo(string $correo): ?array
    {
        $stmt = $this->run(
            'SELECT id_medico, nombres, apellidos, especialidad, password_hash
             FROM Medicos WHERE correo = ? AND estado_activo = 1 LIMIT 1',
            [$correo]
        );
        return $stmt->fetch() ?: null;
    }

    /** Pacientes que tienen (o tuvieron) cita con este médico. */
    public function pacientesConCitas(int $idMedico): array
    {
        return $this->run(
            "SELECT DISTINCT p.id_paciente,
                    CONCAT(p.nombres, ' ', p.apellidos) AS nombre,
                    p.tipo_documento, p.numero_documento
             FROM Citas c
             JOIN Pacientes p ON p.id_paciente = c.id_paciente
             WHERE c.id_medico = ?
             ORDER BY nombre",
            [$idMedico]
        )->fetchAll();
    }

    /** ¿El paciente tiene alguna cita con este médico? (autorización). */
    public function atiendePaciente(int $idMedico, int $idPaciente): bool
    {
        $stmt = $this->run(
            'SELECT 1 FROM Citas WHERE id_medico = ? AND id_paciente = ? LIMIT 1',
            [$idMedico, $idPaciente]
        );
        return $stmt->fetchColumn() !== false;
    }

    // ---- Gestión desde el panel de administración ----

    /** Todos los médicos (activos e inactivos) para el admin. */
    public function todos(): array
    {
        return $this->run(
            'SELECT id_medico, cmp, nombres, apellidos, especialidad, correo, telefono, estado_activo
             FROM Medicos ORDER BY estado_activo DESC, apellidos, nombres'
        )->fetchAll();
    }

    public function cmpExiste(string $cmp): bool
    {
        return $this->run('SELECT 1 FROM Medicos WHERE cmp = ? LIMIT 1', [$cmp])->fetchColumn() !== false;
    }

    public function correoExiste(string $correo): bool
    {
        return $this->run('SELECT 1 FROM Medicos WHERE correo = ? LIMIT 1', [$correo])->fetchColumn() !== false;
    }

    /** @param array<string,mixed> $d */
    public function crear(array $d): int
    {
        $this->run(
            'INSERT INTO Medicos (cmp, nombres, apellidos, especialidad, correo, telefono, password_hash, estado_activo)
             VALUES (:cmp, :nom, :ape, :esp, :correo, :tel, :hash, 1)',
            [
                ':cmp'    => $d['cmp'],
                ':nom'    => $d['nombres'],
                ':ape'    => $d['apellidos'],
                ':esp'    => $d['especialidad'],
                ':correo' => $d['correo'],
                ':tel'    => $d['telefono'] ?? null,
                ':hash'   => $d['password_hash'],
            ]
        );
        return (int) $this->db->lastInsertId();
    }

    public function cambiarEstado(int $id, bool $activo): void
    {
        $this->run('UPDATE Medicos SET estado_activo = ? WHERE id_medico = ?', [$activo ? 1 : 0, $id]);
    }
}
