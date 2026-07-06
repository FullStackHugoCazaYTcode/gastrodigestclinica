-- =====================================================================
--  GASTRODIGEST · Libro de Reclamaciones (Ley N.° 29571 · INDECOPI)
-- ---------------------------------------------------------------------
--  Migración ADITIVA. Ejecutar UNA vez sobre la base existente.
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

CREATE TABLE IF NOT EXISTS `Libro_Reclamaciones` (
  `id_reclamacion`   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `numero_hoja`      VARCHAR(24)  NOT NULL COMMENT 'Hoja de Reclamación (código)',
  `tipo`             ENUM('RECLAMO','QUEJA') NOT NULL,
  -- Consumidor
  `nombres`          VARCHAR(150) NOT NULL,
  `tipo_documento`   ENUM('DNI','CE','PAS') NOT NULL,
  `numero_documento` VARCHAR(20)  NOT NULL,
  `telefono`         VARCHAR(15)  NULL,
  `correo`           VARCHAR(150) NOT NULL,
  `domicilio`        VARCHAR(200) NULL,
  -- Bien contratado
  `tipo_bien`        ENUM('PRODUCTO','SERVICIO') NOT NULL DEFAULT 'SERVICIO',
  `descripcion_bien` VARCHAR(300) NULL,
  `monto_reclamado`  DECIMAL(10,2) NULL,
  -- Detalle
  `detalle`          TEXT NOT NULL,
  `pedido`           TEXT NOT NULL,
  `estado`           ENUM('PENDIENTE','ATENDIDO') NOT NULL DEFAULT 'PENDIENTE',
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_reclamacion`),
  UNIQUE KEY `uq_reclamo_hoja` (`numero_hoja`),
  KEY `idx_reclamo_estado` (`estado`),
  KEY `idx_reclamo_fecha` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Libro de Reclamaciones (Ley 29571 / INDECOPI)';

-- =====================================================================
--  FIN
-- =====================================================================
