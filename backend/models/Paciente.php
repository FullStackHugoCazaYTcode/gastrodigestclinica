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

    /** Listado de pacientes para el panel de administración. */
    public function todos(): array
    {
        return $this->run(
            "SELECT id_paciente, CONCAT(nombres, ' ', apellidos) AS nombre,
                    tipo_documento, numero_documento, correo, telefono, created_at
             FROM Pacientes ORDER BY created_at DESC"
        )->fetchAll();
    }

    public function total(): int
    {
        return (int) $this->run('SELECT COUNT(*) FROM Pacientes')->fetchColumn();
    }

    /** Familiares (dependientes) a cargo de un paciente titular. */
    public function familiaresDe(int $idTitular): array
    {
        return $this->run(
            'SELECT id_paciente, nombres, apellidos, tipo_documento, numero_documento,
                    fecha_nacimiento, sexo
             FROM Pacientes WHERE id_titular = ? ORDER BY nombres, apellidos',
            [$idTitular]
        )->fetchAll();
    }

    /** ¿El paciente es un familiar/dependiente a cargo del titular? */
    public function esFamiliarDe(int $idPaciente, int $idTitular): bool
    {
        $stmt = $this->run(
            'SELECT 1 FROM Pacientes WHERE id_paciente = ? AND id_titular = ? LIMIT 1',
            [$idPaciente, $idTitular]
        );
        return $stmt->fetchColumn() !== false;
    }

    /**
     * Crea un familiar/dependiente enlazado al titular (sin contraseña: no
     * inicia sesión). Hereda el contacto del titular para los avisos.
     * @param array<string,mixed> $d
     */
    public function crearFamiliar(array $d, int $idTitular): int
    {
        $this->run(
            'INSERT INTO Pacientes
                (tipo_documento, numero_documento, nombres, apellidos, fecha_nacimiento,
                 sexo, telefono, correo, id_titular, consentimiento_datos, fecha_consentimiento)
             VALUES
                (:tipo, :num, :nom, :ape, :fnac, :sexo, :tel, :correo, :tit, 1, :fcons)',
            [
                ':tipo'   => $d['tipo_documento'],
                ':num'    => $d['numero_documento'],
                ':nom'    => $d['nombres'],
                ':ape'    => $d['apellidos'],
                ':fnac'   => $d['fecha_nacimiento'],
                ':sexo'   => $d['sexo'] ?? 'X',
                ':tel'    => $d['telefono'],
                ':correo' => $d['correo'],
                ':tit'    => $idTitular,
                ':fcons'  => date('Y-m-d H:i:s'),
            ]
        );
        return (int) $this->db->lastInsertId();
    }

    /** Pacientes registrados desde una fecha (para el digest diario). */
    public function nuevosDesde(string $fecha): int
    {
        return (int) $this->run(
            'SELECT COUNT(*) FROM Pacientes WHERE created_at >= ?',
            [$fecha . ' 00:00:00']
        )->fetchColumn();
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

    public function existePorDocumento(string $tipo, string $numero): bool
    {
        $stmt = $this->run(
            'SELECT 1 FROM Pacientes WHERE tipo_documento = ? AND numero_documento = ? LIMIT 1',
            [$tipo, $numero]
        );
        return (bool) $stmt->fetchColumn();
    }

    public function correoExiste(string $correo): bool
    {
        $stmt = $this->run('SELECT 1 FROM Pacientes WHERE correo = ? LIMIT 1', [$correo]);
        return (bool) $stmt->fetchColumn();
    }

    /** Actualiza los datos de contacto editables desde el portal. */
    public function actualizarContacto(int $id, array $d): void
    {
        $this->run(
            'UPDATE Pacientes SET telefono = :tel, correo = :correo, direccion = :dir
             WHERE id_paciente = :id',
            [':tel' => $d['telefono'], ':correo' => $d['correo'], ':dir' => $d['direccion'], ':id' => $id]
        );
    }

    /**
     * Crea una cuenta de paciente verificada (registro del portal, Fase 2A):
     * incluye contraseña, dirección y consentimiento de datos (Ley 29733).
     * @param array<string,mixed> $d
     */
    public function crearCuenta(array $d): int
    {
        $this->run(
            'INSERT INTO Pacientes
                (tipo_documento, numero_documento, fecha_emision_dni, nombres, apellidos,
                 fecha_nacimiento, sexo, telefono, correo, departamento, provincia, distrito,
                 direccion, password_hash, consentimiento_datos, fecha_consentimiento)
             VALUES
                (:tipo, :num, :femi, :nom, :ape, :fnac, :sexo, :tel, :correo, :dep, :prov,
                 :dist, :dir, :hash, 1, :fcons)',
            [
                ':tipo'   => $d['tipo_documento'],
                ':num'    => $d['numero_documento'],
                ':femi'   => $d['fecha_emision_dni'] ?? null,
                ':nom'    => $d['nombres'],
                ':ape'    => $d['apellidos'],
                ':fnac'   => $d['fecha_nacimiento'],
                ':sexo'   => $d['sexo'] ?? 'X',
                ':tel'    => $d['telefono'],
                ':correo' => $d['correo'],
                ':dep'    => $d['departamento'] ?? null,
                ':prov'   => $d['provincia'] ?? null,
                ':dist'   => $d['distrito'] ?? null,
                ':dir'    => $d['direccion'] ?? null,
                ':hash'   => $d['password_hash'],
                ':fcons'  => date('Y-m-d H:i:s'),
            ]
        );
        return (int) $this->db->lastInsertId();
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
