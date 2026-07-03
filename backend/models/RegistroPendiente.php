<?php
declare(strict_types=1);

namespace App\Models;

/**
 * RegistroPendiente — Buffer del wizard de registro hasta verificar el OTP.
 * Mantiene `Pacientes` limpio: el paciente solo se crea cuando el código
 * enviado por correo (Brevo) fue confirmado.
 */
final class RegistroPendiente extends BaseModel
{
    /**
     * Inserta (o reemplaza) el registro pendiente de un documento.
     * @param array<string,mixed> $d
     */
    public function crear(array $d): void
    {
        // Un documento solo puede tener un registro en curso.
        $this->run(
            'DELETE FROM Registros_Pendientes WHERE tipo_documento = ? AND numero_documento = ?',
            [$d['tipo_documento'], $d['numero_documento']]
        );

        $this->run(
            'INSERT INTO Registros_Pendientes
                (token, tipo_documento, numero_documento, fecha_emision_dni,
                 nombres, apellidos, fecha_nacimiento, sexo, telefono, correo,
                 password_hash, departamento, provincia, distrito, direccion,
                 consentimiento_datos, otp_hash, otp_expira_en)
             VALUES
                (:token, :tipo, :num, :femi, :nom, :ape, :fnac, :sexo, :tel, :correo,
                 :hash, :dep, :prov, :dist, :dir, :cons, :otp, :exp)',
            [
                ':token'  => $d['token'],
                ':tipo'   => $d['tipo_documento'],
                ':num'    => $d['numero_documento'],
                ':femi'   => $d['fecha_emision_dni'] ?? null,
                ':nom'    => $d['nombres'],
                ':ape'    => $d['apellidos'],
                ':fnac'   => $d['fecha_nacimiento'],
                ':sexo'   => $d['sexo'] ?? 'X',
                ':tel'    => $d['telefono'],
                ':correo' => $d['correo'],
                ':hash'   => $d['password_hash'],
                ':dep'    => $d['departamento'] ?? null,
                ':prov'   => $d['provincia'] ?? null,
                ':dist'   => $d['distrito'] ?? null,
                ':dir'    => $d['direccion'] ?? null,
                ':cons'   => !empty($d['consentimiento_datos']) ? 1 : 0,
                ':otp'    => $d['otp_hash'],
                ':exp'    => $d['otp_expira_en'],
            ]
        );
    }

    public function porToken(string $token): ?array
    {
        $stmt = $this->run('SELECT * FROM Registros_Pendientes WHERE token = ? LIMIT 1', [$token]);
        return $stmt->fetch() ?: null;
    }

    /** Renueva el código OTP (reenviar) y reinicia los intentos. */
    public function actualizarOtp(string $token, string $otpHash, string $expira): void
    {
        $this->run(
            'UPDATE Registros_Pendientes
                SET otp_hash = ?, otp_expira_en = ?, otp_intentos = 0
              WHERE token = ?',
            [$otpHash, $expira, $token]
        );
    }

    public function registrarIntentoFallido(string $token): void
    {
        $this->run(
            'UPDATE Registros_Pendientes SET otp_intentos = otp_intentos + 1 WHERE token = ?',
            [$token]
        );
    }

    public function marcarVerificado(string $token): void
    {
        $this->run('UPDATE Registros_Pendientes SET verificado = 1 WHERE token = ?', [$token]);
    }

    public function eliminar(string $token): void
    {
        $this->run('DELETE FROM Registros_Pendientes WHERE token = ?', [$token]);
    }
}
