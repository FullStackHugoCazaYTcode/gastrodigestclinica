<?php
declare(strict_types=1);

namespace App\Models;

/**
 * DocumentoClinico — Documentos del portal privado del paciente.
 * Solo expone los 4 tipos públicos; las notas de evolución no existen
 * a nivel de esquema (ENUM restringido).
 */
final class DocumentoClinico extends BaseModel
{
    /** Lista de documentos del paciente (usa la vista del portal). */
    public function porPaciente(int $idPaciente): array
    {
        $stmt = $this->run(
            'SELECT id_documento, tipo_documento, titulo, descripcion, fecha_emision,
                    medico_emisor, especialidad
             FROM vw_documentos_portal
             WHERE id_paciente = ?
             ORDER BY fecha_emision DESC',
            [$idPaciente]
        );
        return $stmt->fetchAll();
    }

    /**
     * Obtiene un documento SOLO si pertenece al paciente (previene IDOR).
     */
    public function porIdYPaciente(int $idDocumento, int $idPaciente): ?array
    {
        $stmt = $this->run(
            'SELECT * FROM Documentos_Clinicos
             WHERE id_documento = ? AND id_paciente = ? LIMIT 1',
            [$idDocumento, $idPaciente]
        );
        return $stmt->fetch() ?: null;
    }

    /**
     * Emite un documento clínico (área médica). Devuelve el id creado.
     * @param array<string,mixed> $d
     */
    public function crear(array $d): int
    {
        $this->run(
            'INSERT INTO Documentos_Clinicos
                (id_paciente, id_medico, id_cita, tipo_documento, titulo, descripcion, ruta_archivo, fecha_emision)
             VALUES (:p, :m, :c, :tipo, :tit, :desc, :ruta, :fecha)',
            [
                ':p'     => $d['id_paciente'],
                ':m'     => $d['id_medico'],
                ':c'     => $d['id_cita'] ?? null,
                ':tipo'  => $d['tipo_documento'],
                ':tit'   => $d['titulo'],
                ':desc'  => $d['descripcion'] ?? null,
                ':ruta'  => $d['ruta_archivo'] ?? 'documento-digital',
                ':fecha' => $d['fecha_emision'],
            ]
        );
        return (int) $this->db->lastInsertId();
    }
}
