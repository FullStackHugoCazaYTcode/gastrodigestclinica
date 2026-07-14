-- =====================================================================
--  GASTRODIGEST · Título profesional + marca "reservable" del médico
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Ejecutar UNA vez sobre la base existente.
--  · titulo: cómo se muestra el profesional (Dra., Dr., Lic.).
--  · reservable: 1 = aparece en la reserva online; 0 = solo se muestra en
--    el equipo (p. ej. enfermería o cirugía por derivación).
--  IMPORTANTE: correr ANTES el 2026_fase2h_medico_perfil.sql (foto/bio…).
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

ALTER TABLE `Medicos`
  ADD COLUMN `titulo`     VARCHAR(8) NOT NULL DEFAULT 'Dr(a).' AFTER `apellidos`,
  ADD COLUMN `reservable` TINYINT(1) NOT NULL DEFAULT 1 AFTER `estado_activo`;
