<?php
declare(strict_types=1);

namespace App\Models;

/**
 * Administrador — Cuentas de administración/dueño del sistema.
 */
final class Administrador extends BaseModel
{
    public function credencialPorCorreo(string $correo): ?array
    {
        $stmt = $this->run(
            'SELECT id_admin, nombres, correo, password_hash
             FROM Administradores WHERE correo = ? AND estado_activo = 1 LIMIT 1',
            [$correo]
        );
        return $stmt->fetch() ?: null;
    }

    public function porId(int $id): ?array
    {
        $stmt = $this->run(
            'SELECT id_admin, nombres, correo FROM Administradores WHERE id_admin = ? LIMIT 1',
            [$id]
        );
        return $stmt->fetch() ?: null;
    }
}
