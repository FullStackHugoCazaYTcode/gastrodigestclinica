-- =====================================================================
--  GASTRODIGEST · FASE 2D — Administrador / dueño
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Crea la tabla de administradores y siembra un
--  admin demo. Ejecutar UNA vez sobre la base existente.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

CREATE TABLE IF NOT EXISTS `Administradores` (
  `id_admin`      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombres`       VARCHAR(120) NOT NULL,
  `correo`        VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt (password_hash)',
  `estado_activo` BOOLEAN      NOT NULL DEFAULT TRUE,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_admin`),
  UNIQUE KEY `uq_admin_correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Administradores / dueños del sistema';

-- Admin demo · Usuario: admin@gastrodigest.pe · Contraseña: Admin2026
INSERT INTO `Administradores` (`nombres`, `correo`, `password_hash`) VALUES
  ('Administrador GastroDigest', 'admin@gastrodigest.pe',
   '$2b$10$U1o6yxnBR.tns5M6aAQnjO9Ui.P89cI4phT7WXJNuX4WTZ77m4msO')
ON DUPLICATE KEY UPDATE `nombres` = VALUES(`nombres`);

-- =====================================================================
--  FIN — FASE 2D
-- =====================================================================
