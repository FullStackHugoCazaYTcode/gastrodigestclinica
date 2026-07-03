-- =====================================================================
--  GASTRODIGEST · FASE 2A — Cuentas de paciente (registro robusto)
--  Inspirado en el portal de Clínica Internacional (wizard 4 pasos + OTP).
-- ---------------------------------------------------------------------
--  Migración ADITIVA sobre gastrodigest.sql (Entregable 1).
--  NO borra datos: solo agrega columnas/tablas. Ejecutar UNA vez sobre
--  la base existente en Railway / Workbench.
--  Motor: MySQL 8.x · InnoDB · utf8mb4
-- =====================================================================

SET NAMES utf8mb4;
USE `gastrodigest`;

-- =====================================================================
-- 1) PACIENTES — dirección + fecha de emisión del DNI
--    (los datos de identidad/dirección del wizard de registro)
-- =====================================================================
ALTER TABLE `Pacientes`
  ADD COLUMN `fecha_emision_dni` DATE         NULL COMMENT 'Fase 2A: fecha de emisión del documento' AFTER `numero_documento`,
  ADD COLUMN `departamento`      VARCHAR(60)  NULL AFTER `correo`,
  ADD COLUMN `provincia`         VARCHAR(60)  NULL AFTER `departamento`,
  ADD COLUMN `distrito`          VARCHAR(60)  NULL AFTER `provincia`,
  ADD COLUMN `direccion`         VARCHAR(160) NULL AFTER `distrito`;

-- =====================================================================
-- 2) REGISTROS_PENDIENTES — buffer del wizard hasta verificar el OTP
--    Mantiene `Pacientes` limpio: solo se inserta el paciente cuando el
--    código de verificación (email/Brevo) fue confirmado. Un evento/cron
--    puede purgar las filas vencidas (otp_expira_en < NOW()).
-- =====================================================================
CREATE TABLE IF NOT EXISTS `Registros_Pendientes` (
  `id_registro`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token`              CHAR(36)     NOT NULL COMMENT 'UUID del registro en curso',
  `tipo_documento`     ENUM('DNI','CE','PAS') NOT NULL,
  `numero_documento`   VARCHAR(20)  NOT NULL,
  `fecha_emision_dni`  DATE         NULL,
  `nombres`            VARCHAR(120) NOT NULL,
  `apellidos`          VARCHAR(120) NOT NULL,
  `fecha_nacimiento`   DATE         NOT NULL,
  `sexo`               ENUM('M','F','X') NOT NULL DEFAULT 'X',
  `telefono`           VARCHAR(15)  NOT NULL COMMENT 'Celular, dígitos (E.164 sin +)',
  `correo`             VARCHAR(150) NOT NULL,
  `password_hash`      VARCHAR(255) NOT NULL COMMENT 'Ya hasheado (password_hash) al iniciar',
  `departamento`       VARCHAR(60)  NULL,
  `provincia`          VARCHAR(60)  NULL,
  `distrito`           VARCHAR(60)  NULL,
  `direccion`          VARCHAR(160) NULL,
  `consentimiento_datos` BOOLEAN    NOT NULL DEFAULT FALSE COMMENT 'Ley 29733',
  -- ---- OTP de verificación (email/Brevo) ----
  `otp_hash`           CHAR(64)     NOT NULL COMMENT 'SHA-256 del código de 5 dígitos',
  `otp_expira_en`      DATETIME     NOT NULL,
  `otp_intentos`       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `verificado`         BOOLEAN      NOT NULL DEFAULT FALSE,
  `created_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_registro`),
  UNIQUE KEY `uq_registro_token` (`token`),
  KEY `idx_registro_doc` (`tipo_documento`, `numero_documento`),
  KEY `idx_registro_expira` (`otp_expira_en`),
  CONSTRAINT `chk_registro_otp_intentos` CHECK (`otp_intentos` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registros de paciente en curso (wizard) pendientes de verificación OTP';

-- =====================================================================
-- 3) INTERESES — catálogo de temas de interés (paso 4 del wizard)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `Intereses` (
  `id_interes` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `codigo`     VARCHAR(30)  NOT NULL,
  `nombre`     VARCHAR(60)  NOT NULL,
  `icono`      VARCHAR(30)  NULL COMMENT 'Nombre del icono en el frontend',
  `estado_activo` BOOLEAN   NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id_interes`),
  UNIQUE KEY `uq_interes_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de temas de interés del paciente';

INSERT INTO `Intereses` (`codigo`, `nombre`, `icono`) VALUES
  ('campanias',  'Campañas',          'sparkles'),
  ('paquetes',   'Paquetes',          'star'),
  ('mujer',      'Mujer',             'heart'),
  ('infante',    'Infante',           'users'),
  ('adulto_mayor','Adulto mayor',     'shieldCheck'),
  ('familia',    'Familia',           'users'),
  ('nutricion',  'Nutrición',         'droplet'),
  ('tecnologia', 'Tecnología médica', 'activity')
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`), `icono` = VALUES(`icono`);

-- =====================================================================
-- 4) PACIENTE_INTERESES — relación M:N paciente ⇄ intereses
-- =====================================================================
CREATE TABLE IF NOT EXISTS `Paciente_Intereses` (
  `id_paciente` INT UNSIGNED NOT NULL,
  `id_interes`  INT UNSIGNED NOT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_paciente`, `id_interes`),
  KEY `idx_pi_interes` (`id_interes`),
  CONSTRAINT `fk_pi_paciente`
    FOREIGN KEY (`id_paciente`) REFERENCES `Pacientes` (`id_paciente`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pi_interes`
    FOREIGN KEY (`id_interes`) REFERENCES `Intereses` (`id_interes`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Temas de interés elegidos por cada paciente (M:N)';

-- =====================================================================
--  FIN — FASE 2A
-- =====================================================================
