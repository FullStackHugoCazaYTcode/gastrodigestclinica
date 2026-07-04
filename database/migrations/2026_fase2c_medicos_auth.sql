-- =====================================================================
--  GASTRODIGEST · FASE 2C — Login del médico (área profesional)
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Agrega la contraseña de acceso a los médicos y
--  provisiona una clave demo para los profesionales activos.
--  Ejecutar UNA vez sobre la base existente en Railway / Workbench.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

-- 1) Columna de contraseña (bcrypt) para el login del médico.
ALTER TABLE `Medicos`
  ADD COLUMN `password_hash` VARCHAR(255) NULL COMMENT 'Login del médico (password_hash/bcrypt)' AFTER `telefono`;

-- 2) Clave demo para los médicos activos.
--    Usuario: su correo (ej. rsalazar@gastrodigest.pe) · Contraseña: Medico2026
UPDATE `Medicos`
   SET `password_hash` = '$2b$10$aXJeUPpzTZz/hdFL.a.6GOGWzIUVZj2vicA2mp83OudFOJ8RTEvIO'
 WHERE `cmp` IN ('CMP12345', 'CMP23456', 'CMP34567');

-- =====================================================================
--  FIN — FASE 2C
-- =====================================================================
