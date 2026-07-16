<?php
declare(strict_types=1);

namespace App\Models;

use DateTime;

/**
 * Recuperacion — Código de recuperación de contraseña del paciente.
 * El código viaja al correo; en BD solo se guarda su hash (SHA-256).
 */
final class Recuperacion extends BaseModel
{
    private const TTL_MIN      = 15;
    private const MAX_INTENTOS = 5;

    /** Crea un código nuevo e invalida los anteriores del paciente. */
    public function crear(int $idPaciente, string $codigoHash): void
    {
        $this->run(
            'UPDATE Recuperaciones SET usado = 1 WHERE id_paciente = ? AND usado = 0',
            [$idPaciente]
        );
        $expira = (new DateTime('+' . self::TTL_MIN . ' minutes'))->format('Y-m-d H:i:s');
        $this->run(
            'INSERT INTO Recuperaciones (id_paciente, codigo_hash, expira_en) VALUES (?, ?, ?)',
            [$idPaciente, $codigoHash, $expira]
        );
    }

    /**
     * Valida el código vigente del paciente. Si acierta, lo marca usado.
     * @return string OK|INCORRECTO|EXPIRADO|BLOQUEADO|NO_EXISTE
     */
    public function validar(int $idPaciente, string $codigoHash): string
    {
        $row = $this->run(
            'SELECT id_recuperacion, codigo_hash, expira_en, intentos
             FROM Recuperaciones WHERE id_paciente = ? AND usado = 0
             ORDER BY id_recuperacion DESC LIMIT 1',
            [$idPaciente]
        )->fetch();

        if ($row === false) {
            return 'NO_EXISTE';
        }
        if ((int) $row['intentos'] >= self::MAX_INTENTOS) {
            return 'BLOQUEADO';
        }
        if (strtotime((string) $row['expira_en']) < time()) {
            return 'EXPIRADO';
        }
        if (!hash_equals((string) $row['codigo_hash'], $codigoHash)) {
            $this->run(
                'UPDATE Recuperaciones SET intentos = intentos + 1 WHERE id_recuperacion = ?',
                [$row['id_recuperacion']]
            );
            return 'INCORRECTO';
        }

        $this->run('UPDATE Recuperaciones SET usado = 1 WHERE id_recuperacion = ?', [$row['id_recuperacion']]);
        return 'OK';
    }

    /** Minutos de vigencia del código (para mostrarlo en la UI). */
    public function ttlMinutos(): int
    {
        return self::TTL_MIN;
    }
}
