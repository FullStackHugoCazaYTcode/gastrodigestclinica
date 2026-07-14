-- =====================================================================
--  GASTRODIGEST · Perfil público del médico (foto + info de confianza)
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Ejecutar UNA vez sobre la base existente.
--  Agrega a Medicos: foto (ruta /img/medicos/... o URL), sub-especialidad,
--  años de experiencia, formación y biografía. Se editan desde el panel
--  del admin (Médicos → Perfil) y se muestran en las tarjetas y en /medicos.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

ALTER TABLE `Medicos`
  ADD COLUMN `foto`              VARCHAR(255)     NULL AFTER `especialidad`,
  ADD COLUMN `sub_especialidad`  VARCHAR(120)     NULL AFTER `foto`,
  ADD COLUMN `anios_experiencia` SMALLINT UNSIGNED NULL AFTER `sub_especialidad`,
  ADD COLUMN `formacion`         VARCHAR(255)     NULL AFTER `anios_experiencia`,
  ADD COLUMN `bio`               VARCHAR(800)     NULL AFTER `formacion`;
