<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Apoderado — Representante legal de pacientes menores (Ley N° 29414).
 */
final class Apoderado extends BaseModel
{
    public function buscarPorDni(string $dni): ?array
    {
        $stmt = $this->run(
            'SELECT * FROM Apoderados WHERE dni = ? LIMIT 1',
            [$dni]
        );
        return $stmt->fetch() ?: null;
    }

    /** @param array<string,mixed> $d */
    public function crear(array $d): int
    {
        $this->run(
            'INSERT INTO Apoderados (dni, nombres, relacion_parentesco, telefono, correo)
             VALUES (:dni, :nombres, :rel, :tel, :correo)',
            [
                ':dni'     => $d['dni'],
                ':nombres' => $d['nombres'],
                ':rel'     => $d['relacion_parentesco'],
                ':tel'     => $d['telefono'],
                ':correo'  => $d['correo'],
            ]
        );
        return (int) $this->db->lastInsertId();
    }
}
