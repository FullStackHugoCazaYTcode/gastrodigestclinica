<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Paciente — Entidad de pacientes. Documento validado por tipo; apoderado
 * obligatorio (en capa de aplicación) cuando la edad es menor a 18.
 */
final class Paciente extends BaseModel
{
    public function buscarPorDocumento(string $tipo, string $numero): ?array
    {
        $stmt = $this->run(
            'SELECT * FROM Pacientes WHERE tipo_documento = ? AND numero_documento = ? LIMIT 1',
            [$tipo, $numero]
        );
        return $stmt->fetch() ?: null;
    }

    public function porId(int $id): ?array
    {
        $stmt = $this->run('SELECT * FROM Pacientes WHERE id_paciente = ? LIMIT 1', [$id]);
        return $stmt->fetch() ?: null;
    }

    /** Datos mínimos para login del portal privado. */
    public function credencialPorDocumento(string $tipo, string $numero): ?array
    {
        $stmt = $this->run(
            'SELECT id_paciente, nombres, apellidos, password_hash
             FROM Pacientes WHERE tipo_documento = ? AND numero_documento = ? LIMIT 1',
            [$tipo, $numero]
        );
        return $stmt->fetch() ?: null;
    }

    /** @param array<string,mixed> $d */
    public function crear(array $d): int
    {
        $consiente = !empty($d['consentimiento_datos']);
        $this->run(
            'INSERT INTO Pacientes
                (tipo_documento, numero_documento, nombres, apellidos, fecha_nacimiento,
                 sexo, telefono, correo, id_apoderado, consentimiento_datos, fecha_consentimiento)
             VALUES
                (:tipo, :num, :nom, :ape, :fnac, :sexo, :tel, :correo, :apo, :cons, :fcons)',
            [
                ':tipo'   => $d['tipo_documento'],
                ':num'    => $d['numero_documento'],
                ':nom'    => $d['nombres'],
                ':ape'    => $d['apellidos'],
                ':fnac'   => $d['fecha_nacimiento'],
                ':sexo'   => $d['sexo'] ?? 'X',
                ':tel'    => $d['telefono'],
                ':correo' => $d['correo'],
                ':apo'    => $d['id_apoderado'] ?? null,
                ':cons'   => $consiente ? 1 : 0,
                ':fcons'  => $consiente ? date('Y-m-d H:i:s') : null,
            ]
        );
        return (int) $this->db->lastInsertId();
    }
}
