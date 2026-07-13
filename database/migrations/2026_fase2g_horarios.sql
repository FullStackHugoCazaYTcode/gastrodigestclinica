-- =====================================================================
--  GASTRODIGEST · Disponibilidad real por médico
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Ejecutar UNA vez sobre la base existente.
--  · Horarios_Medico: horario semanal recurrente por médico (día + rango).
--  · Bloqueos_Medico: ausencias por fecha (vacaciones, feriados, congresos).
--    hora_inicio/hora_fin NULL = bloqueo de día completo.
--  dia_semana sigue el formato de PHP date('N'): 1=Lunes … 7=Domingo.
--  Al final: semilla de horario por defecto (Lun–Sáb 08:00–18:00) para los
--  médicos existentes, para que la reserva funcione desde el minuto uno.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

CREATE TABLE IF NOT EXISTS `Horarios_Medico` (
  `id_horario`  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_medico`   INT UNSIGNED NOT NULL,
  `dia_semana`  TINYINT UNSIGNED NOT NULL COMMENT '1=Lun … 7=Dom (PHP date N)',
  `hora_inicio` TIME NOT NULL,
  `hora_fin`    TIME NOT NULL,
  `activo`      TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_horario`),
  KEY `idx_horario_medico_dia` (`id_medico`, `dia_semana`),
  CONSTRAINT `fk_horario_medico` FOREIGN KEY (`id_medico`) REFERENCES `Medicos`(`id_medico`) ON DELETE CASCADE,
  CONSTRAINT `chk_horario_rango` CHECK (`hora_fin` > `hora_inicio`),
  CONSTRAINT `chk_horario_dia` CHECK (`dia_semana` BETWEEN 1 AND 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Bloqueos_Medico` (
  `id_bloqueo`  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_medico`   INT UNSIGNED NOT NULL,
  `fecha`       DATE NOT NULL,
  `hora_inicio` TIME NULL COMMENT 'NULL = día completo',
  `hora_fin`    TIME NULL,
  `motivo`      VARCHAR(160) NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_bloqueo`),
  KEY `idx_bloqueo_medico_fecha` (`id_medico`, `fecha`),
  CONSTRAINT `fk_bloqueo_medico` FOREIGN KEY (`id_medico`) REFERENCES `Medicos`(`id_medico`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Semilla: Lun–Sáb 08:00–18:00 para todos los médicos actuales (solo si no tienen horario).
INSERT INTO `Horarios_Medico` (`id_medico`, `dia_semana`, `hora_inicio`, `hora_fin`)
SELECT m.`id_medico`, d.`dia`, '08:00:00', '18:00:00'
FROM `Medicos` m
CROSS JOIN (
  SELECT 1 AS dia UNION ALL SELECT 2 UNION ALL SELECT 3
  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d
WHERE NOT EXISTS (
  SELECT 1 FROM `Horarios_Medico` h WHERE h.`id_medico` = m.`id_medico`
);
