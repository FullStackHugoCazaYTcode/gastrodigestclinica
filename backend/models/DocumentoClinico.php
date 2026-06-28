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
}
