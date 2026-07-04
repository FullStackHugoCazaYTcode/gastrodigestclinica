<?php
declare(strict_types=1);

namespace App\Models;

use App\Core\Security;
use DateTime;
use PDOException;
use RuntimeException;

/**
 * Cita — Núcleo transaccional del sistema.
 *
 * Implementa:
 *   · Reserva atómica con bloqueo de horario (SELECT ... FOR UPDATE).
 *   · Validación de OTP (TTL 5 min, límite de intentos anti-troll).
 *   · Máquina de estados con whitelist de transiciones permitidas.
 *   · Reprogramación vía token UUID.
 *   · Bitácora de auditoría por cada transición.
 */
final class Cita extends BaseModel
{
    private const OTP_TTL_MIN     = 5;
    private const OTP_MAX_INTENTOS = 5;

    /** Estados desde los que NO se permite ninguna transición (terminales). */
    private const TRANSICIONES = [
        'PENDIENTE_OTP'         => ['RESERVADA_WEB', 'CANCELADA_PACIENTE'],
        'RESERVADA_WEB'         => ['CONFIRMADA_WSP', 'CONFIRMADA_RECEPCION', 'ATENCION_CONDICIONADA', 'CANCELADA_PACIENTE', 'NO_ASISTIO'],
        'CONFIRMADA_WSP'        => ['CONFIRMADA_RECEPCION', 'ATENCION_CONDICIONADA', 'CANCELADA_PACIENTE', 'NO_ASISTIO'],
        'CONFIRMADA_RECEPCION'  => ['ATENCION_CONDICIONADA', 'ATENDIDA', 'NO_ASISTIO'],
        'ATENCION_CONDICIONADA' => ['ATENDIDA', 'NO_ASISTIO'],
        'NO_ASISTIO'            => [],
        'CANCELADA_PACIENTE'    => [],
        'ATENDIDA'              => [],
    ];

    /** Columnas que un controlador puede setear vía $extra (anti SQL-injection en nombres). */
    private const EXTRA_PERMITIDAS = [
        'estado_siteds', 'siteds_intentos', 'siteds_ultima_consulta',
        'token_reprogramacion', 'token_reprog_expira_en',
    ];

    /**
     * Reserva atómica. Bloquea el horario, inserta la cita en PENDIENTE_OTP y
     * devuelve el código OTP en claro para que el controlador lo emita a n8n
     * (en BD solo se guarda el hash).
     *
     * @return array{id_cita:int, codigo:string}
     * @throws RuntimeException 'CONFLICTO_HORARIO' si el cupo ya está tomado.
     */
    public function reservar(
        int $idPaciente,
        int $idMedico,
        string $fechaHora,
        ?string $motivo,
        ?int $idAseguradora,
        ?string $numeroAfiliado
    ): array {
        $this->db->beginTransaction();
        try {
            // Bloqueo anti-colisión sobre el horario del médico.
            $lock = $this->db->prepare(
                "SELECT id_cita FROM Citas
                 WHERE id_medico = :m AND fecha_hora = :f
                   AND estado_actual NOT IN ('CANCELADA_PACIENTE','NO_ASISTIO')
                 FOR UPDATE"
            );
            $lock->execute([':m' => $idMedico, ':f' => $fechaHora]);
            if ($lock->fetch() !== false) {
                $this->db->rollBack();
                throw new RuntimeException('CONFLICTO_HORARIO');
            }

            $codigo = Security::otpCode();
            $expira = (new DateTime('+' . self::OTP_TTL_MIN . ' minutes'))->format('Y-m-d H:i:s');

            $ins = $this->db->prepare(
                "INSERT INTO Citas
                    (id_paciente, id_medico, id_aseguradora, numero_afiliado, fecha_hora,
                     motivo, estado_actual, codigo_otp_hash, otp_expira_en)
                 VALUES (:p, :m, :a, :naf, :f, :mot, 'PENDIENTE_OTP', :hash, :exp)"
            );
            $ins->execute([
                ':p'    => $idPaciente,
                ':m'    => $idMedico,
                ':a'    => $idAseguradora,
                ':naf'  => $numeroAfiliado,
                ':f'    => $fechaHora,
                ':mot'  => $motivo,
                ':hash' => Security::hashOtp($codigo),
                ':exp'  => $expira,
            ]);
            $idCita = (int) $this->db->lastInsertId();

            $this->bitacora($idCita, null, 'PENDIENTE_OTP', 'WEB', 'Reserva creada; OTP emitido.');
            $this->db->commit();

            return ['id_cita' => $idCita, 'codigo' => $codigo];
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            // 23000 = violación del índice UNIQUE de horario (carrera perdida).
            if ($e->getCode() === '23000') {
                throw new RuntimeException('CONFLICTO_HORARIO');
            }
            throw $e;
        }
    }

    /**
     * Valida el OTP. Si es correcto transiciona a RESERVADA_WEB.
     * @return string OK|INCORRECTO|EXPIRADO|BLOQUEADO|ESTADO_INVALIDO|NO_EXISTE
     */
    public function validarOtp(int $idCita, string $codigo): string
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'SELECT estado_actual, codigo_otp_hash, otp_expira_en, otp_intentos
                 FROM Citas WHERE id_cita = ? FOR UPDATE'
            );
            $stmt->execute([$idCita]);
            $cita = $stmt->fetch();

            if ($cita === false)                                  { $this->db->rollBack(); return 'NO_EXISTE'; }
            if ($cita['estado_actual'] !== 'PENDIENTE_OTP')       { $this->db->rollBack(); return 'ESTADO_INVALIDO'; }
            if (strtotime((string) $cita['otp_expira_en']) < time()) { $this->db->rollBack(); return 'EXPIRADO'; }
            if ((int) $cita['otp_intentos'] >= self::OTP_MAX_INTENTOS) { $this->db->rollBack(); return 'BLOQUEADO'; }

            if (!hash_equals((string) $cita['codigo_otp_hash'], Security::hashOtp($codigo))) {
                $this->db->prepare('UPDATE Citas SET otp_intentos = otp_intentos + 1 WHERE id_cita = ?')
                         ->execute([$idCita]);
                $this->db->commit();
                return 'INCORRECTO';
            }

            $this->db->prepare(
                "UPDATE Citas SET estado_actual = 'RESERVADA_WEB',
                 codigo_otp_hash = NULL, otp_expira_en = NULL WHERE id_cita = ?"
            )->execute([$idCita]);
            $this->bitacora($idCita, 'PENDIENTE_OTP', 'RESERVADA_WEB', 'WEB', 'OTP validado correctamente.');
            $this->db->commit();
            return 'OK';
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    /**
     * Transición controlada de estado (valida la máquina de estados).
     * @param array<string,scalar|null> $extra Columnas adicionales a actualizar.
     * @return string OK|TRANSICION_NO_PERMITIDA|NO_EXISTE
     */
    public function transicionar(int $idCita, string $nuevo, string $origen, ?string $detalle = null, array $extra = []): string
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare('SELECT estado_actual FROM Citas WHERE id_cita = ? FOR UPDATE');
            $stmt->execute([$idCita]);
            $row = $stmt->fetch();
            if ($row === false) {
                $this->db->rollBack();
                return 'NO_EXISTE';
            }

            $actual = (string) $row['estado_actual'];
            if (!in_array($nuevo, self::TRANSICIONES[$actual] ?? [], true)) {
                $this->db->rollBack();
                return 'TRANSICION_NO_PERMITIDA';
            }

            $sets   = ['estado_actual = :nuevo'];
            $params = [':nuevo' => $nuevo, ':id' => $idCita];
            if ($nuevo === 'CONFIRMADA_WSP') { $sets[] = 'fecha_confirmacion_wsp = NOW()'; }
            if ($nuevo === 'ATENDIDA')       { $sets[] = 'fecha_atencion = NOW()'; }

            foreach ($extra as $col => $val) {
                if (!in_array($col, self::EXTRA_PERMITIDAS, true)) {
                    continue; // Ignora columnas no permitidas (seguridad).
                }
                $sets[]                = "{$col} = :x_{$col}";
                $params[":x_{$col}"]   = $val;
            }

            $this->db->prepare('UPDATE Citas SET ' . implode(', ', $sets) . ' WHERE id_cita = :id')
                     ->execute($params);
            $this->bitacora($idCita, $actual, $nuevo, $origen, $detalle);
            $this->db->commit();
            return 'OK';
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }

    /** Registra el token de reprogramación (opción "2" de WhatsApp). */
    public function registrarTokenReprogramacion(int $idCita, string $token, int $ttlHoras = 48): string
    {
        $expira = (new DateTime("+{$ttlHoras} hours"))->format('Y-m-d H:i:s');
        $stmt = $this->db->prepare(
            "UPDATE Citas SET token_reprogramacion = :t, token_reprog_expira_en = :e
             WHERE id_cita = :id
               AND estado_actual NOT IN ('ATENDIDA','CANCELADA_PACIENTE','NO_ASISTIO')"
        );
        $stmt->execute([':t' => $token, ':e' => $expira, ':id' => $idCita]);
        return $stmt->rowCount() > 0 ? 'OK' : 'NO_APLICABLE';
    }

    public function porToken(string $token): ?array
    {
        $stmt = $this->run(
            'SELECT * FROM Citas
             WHERE token_reprogramacion = ? AND token_reprog_expira_en > NOW() LIMIT 1',
            [$token]
        );
        return $stmt->fetch() ?: null;
    }

    /**
     * Reprograma una cita a un nuevo horario validando colisión.
     * @return string OK|TOKEN_INVALIDO|CONFLICTO_HORARIO
     */
    public function reprogramar(string $token, string $nuevaFechaHora): string
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                'SELECT id_cita, id_medico, estado_actual FROM Citas
                 WHERE token_reprogramacion = ? AND token_reprog_expira_en > NOW() FOR UPDATE'
            );
            $stmt->execute([$token]);
            $cita = $stmt->fetch();
            if ($cita === false) {
                $this->db->rollBack();
                return 'TOKEN_INVALIDO';
            }

            $lock = $this->db->prepare(
                "SELECT id_cita FROM Citas
                 WHERE id_medico = :m AND fecha_hora = :f
                   AND estado_actual NOT IN ('CANCELADA_PACIENTE','NO_ASISTIO')
                 FOR UPDATE"
            );
            $lock->execute([':m' => $cita['id_medico'], ':f' => $nuevaFechaHora]);
            if ($lock->fetch() !== false) {
                $this->db->rollBack();
                return 'CONFLICTO_HORARIO';
            }

            $this->db->prepare(
                'UPDATE Citas SET fecha_hora = :f, token_reprogramacion = NULL,
                 token_reprog_expira_en = NULL WHERE id_cita = :id'
            )->execute([':f' => $nuevaFechaHora, ':id' => $cita['id_cita']]);

            $this->bitacora(
                (int) $cita['id_cita'],
                (string) $cita['estado_actual'],
                (string) $cita['estado_actual'],
                'WEB',
                'Reprogramación a ' . $nuevaFechaHora
            );
            $this->db->commit();
            return 'OK';
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            if ($e->getCode() === '23000') {
                return 'CONFLICTO_HORARIO';
            }
            throw $e;
        }
    }

    public function porId(int $id): ?array
    {
        $stmt = $this->run('SELECT * FROM Citas WHERE id_cita = ? LIMIT 1', [$id]);
        return $stmt->fetch() ?: null;
    }

    /**
     * Citas del paciente para el portal (con datos del médico).
     * Excluye PENDIENTE_OTP (reservas sin confirmar).
     */
    public function porPaciente(int $idPaciente): array
    {
        return $this->run(
            "SELECT c.id_cita, c.fecha_hora, c.estado_actual, c.motivo,
                    CONCAT(m.nombres, ' ', m.apellidos) AS medico, m.especialidad
             FROM Citas c
             JOIN Medicos m ON m.id_medico = c.id_medico
             WHERE c.id_paciente = ? AND c.estado_actual <> 'PENDIENTE_OTP'
             ORDER BY c.fecha_hora DESC",
            [$idPaciente]
        )->fetchAll();
    }

    /** Agenda del médico: sus citas con el nombre del paciente. */
    public function porMedico(int $idMedico): array
    {
        return $this->run(
            "SELECT c.id_cita, c.fecha_hora, c.estado_actual, c.motivo,
                    c.id_paciente, CONCAT(p.nombres, ' ', p.apellidos) AS paciente,
                    p.tipo_documento, p.numero_documento
             FROM Citas c
             JOIN Pacientes p ON p.id_paciente = c.id_paciente
             WHERE c.id_medico = ? AND c.estado_actual <> 'PENDIENTE_OTP'
             ORDER BY c.fecha_hora DESC",
            [$idMedico]
        )->fetchAll();
    }

    /** Inserta un registro de auditoría. Debe llamarse dentro de la transacción. */
    private function bitacora(int $idCita, ?string $anterior, string $nuevo, string $origen, ?string $detalle): void
    {
        $this->db->prepare(
            'INSERT INTO Bitacora_Estados_Cita (id_cita, estado_anterior, estado_nuevo, origen, detalle)
             VALUES (?, ?, ?, ?, ?)'
        )->execute([$idCita, $anterior, $nuevo, $origen, $detalle]);
    }
}
