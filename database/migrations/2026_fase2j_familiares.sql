-- =====================================================================
--  GASTRODIGEST · Familiares/dependientes a cargo de un paciente titular
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Ejecutar UNA vez sobre la base existente.
--  `id_apoderado` (FK a Apoderados) es para MENORES con representante legal
--  (Ley 29414). Para "Mis familiares" del portal (un paciente que gestiona a
--  sus dependientes) usamos una autorreferencia distinta: id_titular → Pacientes.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

ALTER TABLE `Pacientes`
  ADD COLUMN `id_titular` INT UNSIGNED NULL
    COMMENT 'Paciente titular a cargo (Mis familiares del portal)' AFTER `id_apoderado`,
  ADD KEY `idx_paciente_titular` (`id_titular`),
  ADD CONSTRAINT `fk_paciente_titular`
    FOREIGN KEY (`id_titular`) REFERENCES `Pacientes` (`id_paciente`)
    ON DELETE SET NULL ON UPDATE CASCADE;
