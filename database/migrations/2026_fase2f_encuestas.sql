-- =====================================================================
--  GASTRODIGEST · Encuestas de satisfacción (NPS) → testimonios
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Ejecutar UNA vez sobre la base existente.
--  Al marcar una cita como ATENDIDA se crea una encuesta (PENDIENTE) con
--  un token; el paciente la responde por un enlace. Las respuestas con
--  puntaje alto + consentimiento, una vez aprobadas por el admin, se
--  publican como testimonios reales en el sitio.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

CREATE TABLE IF NOT EXISTS `Encuestas` (
  `id_encuesta`       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cita`           INT UNSIGNED NOT NULL,
  `id_paciente`       INT UNSIGNED NOT NULL,
  `token`             CHAR(36)     NOT NULL COMMENT 'UUID del enlace de la encuesta',
  `estado`            ENUM('PENDIENTE','RESPONDIDA') NOT NULL DEFAULT 'PENDIENTE',
  `puntaje`           TINYINT UNSIGNED NULL COMMENT '1 a 5 estrellas',
  `comentario`        VARCHAR(500) NULL,
  `autoriza_publicar` TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Consentimiento del paciente',
  `aprobado`          TINYINT(1)   NOT NULL DEFAULT 0 COMMENT 'Moderación del admin',
  `created_at`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `respondida_at`     TIMESTAMP    NULL,
  PRIMARY KEY (`id_encuesta`),
  UNIQUE KEY `uq_encuesta_token` (`token`),
  UNIQUE KEY `uq_encuesta_cita`  (`id_cita`),
  KEY `idx_encuesta_publicable` (`aprobado`, `autoriza_publicar`, `puntaje`),
  CONSTRAINT `fk_encuesta_cita`     FOREIGN KEY (`id_cita`)     REFERENCES `Citas`(`id_cita`)         ON DELETE CASCADE,
  CONSTRAINT `fk_encuesta_paciente` FOREIGN KEY (`id_paciente`) REFERENCES `Pacientes`(`id_paciente`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
