-- =====================================================================
--  GASTRODIGEST · Recuperación de contraseña del paciente
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Ejecutar UNA vez sobre la base existente.
--  Guarda un código de recuperación (hasheado) con vencimiento e intentos.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

CREATE TABLE IF NOT EXISTS `Recuperaciones` (
  `id_recuperacion` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_paciente`     INT UNSIGNED NOT NULL,
  `codigo_hash`     CHAR(64)     NOT NULL COMMENT 'SHA-256 del código de 6 dígitos',
  `expira_en`       DATETIME     NOT NULL,
  `intentos`        TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `usado`           TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_recuperacion`),
  KEY `idx_recup_paciente` (`id_paciente`),
  CONSTRAINT `fk_recup_paciente` FOREIGN KEY (`id_paciente`)
    REFERENCES `Pacientes` (`id_paciente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
