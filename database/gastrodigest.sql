-- =====================================================================
--  GASTRODIGEST · Sistema de Información Front-Office
--  ENTREGABLE 1 — Script DDL (Data Definition Language)
-- ---------------------------------------------------------------------
--  Motor          : MySQL 8.x · InnoDB · utf8mb4
--  Patrón conexión: PDO Singleton (db.php) — Prepared Statements
--  Marco legal    : Ley N° 29733 (Protección de Datos Personales)
--                   Ley N° 29414 (Consentimiento de menores / apoderado)
--  Importable en  : MySQL Workbench  →  Railway (un solo clic)
--  Escuela Prof.  : Ingeniería de Sistemas (I.S.) — Huánuco, Perú · 2026
-- ---------------------------------------------------------------------
--  Orden de creación (respeta dependencias de claves foráneas):
--    1. Apoderados            5. Citas
--    2. Aseguradoras          6. Documentos_Clinicos
--    3. Medicos               7. Bitacora_Estados_Cita
--    4. Pacientes             + Vistas, Evento y Datos semilla
-- =====================================================================

-- ----- Entorno de sesión seguro y determinista ----------------------
SET NAMES utf8mb4;
SET @OLD_SQL_MODE = @@SQL_MODE;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ENGINE_SUBSTITUTION';
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- ----- Base de datos ------------------------------------------------
CREATE DATABASE IF NOT EXISTS `gastrodigest`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE `gastrodigest`;

-- Idempotencia controlada (re-importable sin residuos).
DROP TABLE IF EXISTS `Bitacora_Estados_Cita`;
DROP TABLE IF EXISTS `Documentos_Clinicos`;
DROP TABLE IF EXISTS `Citas`;
DROP TABLE IF EXISTS `Pacientes`;
DROP TABLE IF EXISTS `Medicos`;
DROP TABLE IF EXISTS `Aseguradoras`;
DROP TABLE IF EXISTS `Apoderados`;

-- =====================================================================
-- 1) APODERADOS
--    Ley N° 29414: representante legal de pacientes menores de 18.
--    ON DELETE RESTRICT preserva la cadena de consentimientos.
-- =====================================================================
CREATE TABLE `Apoderados` (
  `id_apoderado`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dni`                 CHAR(8)      NOT NULL COMMENT 'DNI peruano: 8 dígitos',
  `nombres`             VARCHAR(120) NOT NULL,
  `relacion_parentesco` ENUM('PADRE','MADRE','TUTOR_LEGAL','ABUELO','OTRO') NOT NULL,
  `telefono`            VARCHAR(15)  NOT NULL COMMENT 'Formato E.164 sin +, ej. 51987654321',
  `correo`              VARCHAR(150) NOT NULL,
  `created_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_apoderado`),
  UNIQUE KEY `uq_apoderado_dni` (`dni`),
  CONSTRAINT `chk_apoderado_dni`     CHECK (REGEXP_LIKE(`dni`, '^[0-9]{8}$')),
  CONSTRAINT `chk_apoderado_correo`  CHECK (`correo` LIKE '%_@_%._%'),
  CONSTRAINT `chk_apoderado_tel`     CHECK (REGEXP_LIKE(`telefono`, '^[0-9]{9,15}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Representantes legales de pacientes menores (Ley 29414)';

-- =====================================================================
-- 2) ASEGURADORAS
--    Catálogo para validación de elegibilidad vía SITEDS / SUSALUD.
-- =====================================================================
CREATE TABLE `Aseguradoras` (
  `id_aseguradora` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre`         VARCHAR(120) NOT NULL,
  `codigo_susalud` VARCHAR(20)  NULL COMMENT 'Código IAFAS / SUSALUD',
  `estado_activo`  BOOLEAN      NOT NULL DEFAULT TRUE,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_aseguradora`),
  UNIQUE KEY `uq_aseguradora_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Catálogo de aseguradoras / IAFAS para validación SITEDS';

-- =====================================================================
-- 3) MEDICOS
--    estado_activo controla si admite reservas online.
-- =====================================================================
CREATE TABLE `Medicos` (
  `id_medico`     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cmp`           VARCHAR(10)  NOT NULL COMMENT 'Colegio Médico del Perú (CMP)',
  `nombres`       VARCHAR(120) NOT NULL,
  `apellidos`     VARCHAR(120) NOT NULL,
  `especialidad`  VARCHAR(120) NOT NULL DEFAULT 'Gastroenterología',
  `correo`        VARCHAR(150) NOT NULL,
  `telefono`      VARCHAR(15)  NULL,
  `estado_activo` BOOLEAN      NOT NULL DEFAULT TRUE COMMENT 'TRUE = admite reservas online',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_medico`),
  UNIQUE KEY `uq_medico_cmp` (`cmp`),
  UNIQUE KEY `uq_medico_correo` (`correo`),
  KEY `idx_medico_activo` (`estado_activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Profesionales médicos. estado_activo habilita reserva online';

-- =====================================================================
-- 4) PACIENTES
--    tipo_documento ENUM('DNI','CE','PAS') con validación por formato.
--    id_apoderado obligatorio si edad < 18 (se ENFORCE en capa PHP,
--    porque la edad es relativa a CURRENT_DATE — no admisible en CHECK).
--    Ley 29733: consentimiento explícito de tratamiento de datos.
-- =====================================================================
CREATE TABLE `Pacientes` (
  `id_paciente`        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tipo_documento`     ENUM('DNI','CE','PAS') NOT NULL,
  `numero_documento`   VARCHAR(20)  NOT NULL,
  `nombres`            VARCHAR(120) NOT NULL,
  `apellidos`          VARCHAR(120) NOT NULL,
  `fecha_nacimiento`   DATE         NOT NULL,
  `sexo`               ENUM('M','F','X') NOT NULL DEFAULT 'X',
  `telefono`           VARCHAR(15)  NOT NULL COMMENT 'E.164 sin +',
  `correo`             VARCHAR(150) NOT NULL,
  `id_apoderado`       INT UNSIGNED NULL COMMENT 'NOT NULL en runtime si edad < 18',
  `password_hash`      VARCHAR(255) NULL COMMENT 'Portal privado (password_hash/Argon2id). NULL si no activó portal',
  `consentimiento_datos`     BOOLEAN  NOT NULL DEFAULT FALSE COMMENT 'Ley 29733',
  `fecha_consentimiento`     DATETIME NULL,
  `created_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_paciente`),
  UNIQUE KEY `uq_paciente_documento` (`tipo_documento`, `numero_documento`),
  KEY `idx_paciente_apoderado` (`id_apoderado`),
  KEY `idx_paciente_correo` (`correo`),
  CONSTRAINT `fk_paciente_apoderado`
    FOREIGN KEY (`id_apoderado`) REFERENCES `Apoderados` (`id_apoderado`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  -- Validación de formato por tipo de documento (defensa en profundidad).
  CONSTRAINT `chk_paciente_documento` CHECK (
    (`tipo_documento` = 'DNI' AND REGEXP_LIKE(`numero_documento`, '^[0-9]{8}$')) OR
    (`tipo_documento` = 'CE'  AND REGEXP_LIKE(`numero_documento`, '^[A-Za-z0-9]{9}$')) OR
    (`tipo_documento` = 'PAS' AND CHAR_LENGTH(`numero_documento`) BETWEEN 6 AND 20)
  ),
  CONSTRAINT `chk_paciente_correo` CHECK (`correo` LIKE '%_@_%._%'),
  CONSTRAINT `chk_paciente_tel`    CHECK (REGEXP_LIKE(`telefono`, '^[0-9]{9,15}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Pacientes. Documento validado por tipo; apoderado para menores';

-- =====================================================================
-- 5) CITAS  —  núcleo transaccional
--    · Máquina de estados en estado_actual (8 estados ENUM).
--    · Bloqueo de horario anti-colisión: índice UNIQUE sobre la columna
--      generada slot_reserva (NULL en estados terminales → libera cupo).
--    · OTP almacenado como HASH (n8n recibe el código en claro vía POST).
--    · Token de reprogramación (UUID) emitido por n8n (opción "2").
--    · Estado de validación SITEDS para contingencia (timeout > 10s).
-- =====================================================================
CREATE TABLE `Citas` (
  `id_cita`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_paciente`         INT UNSIGNED NOT NULL,
  `id_medico`           INT UNSIGNED NOT NULL,
  `id_aseguradora`      INT UNSIGNED NULL,
  `numero_afiliado`     VARCHAR(30)  NULL COMMENT 'Nº de afiliación / póliza para SITEDS',
  `fecha_hora`          DATETIME     NOT NULL COMMENT 'Inicio del horario reservado',
  `motivo`              VARCHAR(255) NULL,
  `estado_actual`       ENUM(
                          'PENDIENTE_OTP',
                          'RESERVADA_WEB',
                          'CONFIRMADA_WSP',
                          'CONFIRMADA_RECEPCION',
                          'ATENCION_CONDICIONADA',
                          'NO_ASISTIO',
                          'CANCELADA_PACIENTE',
                          'ATENDIDA'
                        ) NOT NULL DEFAULT 'PENDIENTE_OTP',

  -- ---- OTP (TTL 5 min) ----
  `codigo_otp_hash`     CHAR(64)  NULL COMMENT 'SHA-256 del código de 4 dígitos',
  `otp_expira_en`       DATETIME  NULL COMMENT 'created_at + 5 min',
  `otp_intentos`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Anti-troll: límite de reintentos',

  -- ---- Reprogramación (UUID emitido por n8n) ----
  `token_reprogramacion`        CHAR(36) NULL,
  `token_reprog_expira_en`      DATETIME NULL,

  -- ---- Validación SITEDS / SUSALUD ----
  `estado_siteds`       ENUM('NO_VALIDADO','EN_PROCESO','VALIDADO','TIMEOUT','RECHAZADO')
                        NOT NULL DEFAULT 'NO_VALIDADO',
  `siteds_intentos`     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `siteds_ultima_consulta` DATETIME NULL,

  -- ---- Marcas de tiempo del ciclo de vida ----
  `fecha_confirmacion_wsp` DATETIME NULL,
  `fecha_atencion`         DATETIME NULL,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- ---- Columna generada para bloqueo de horario ----
  -- Estados terminales liberan el cupo (slot_reserva = NULL no colisiona
  -- en un índice UNIQUE). Estados vivos garantizan unicidad del horario.
  `slot_reserva` VARCHAR(80)
    GENERATED ALWAYS AS (
      CASE
        WHEN `estado_actual` IN ('CANCELADA_PACIENTE','NO_ASISTIO') THEN NULL
        ELSE CONCAT(`id_medico`, '#', `fecha_hora`)
      END
    ) VIRTUAL,

  PRIMARY KEY (`id_cita`),
  UNIQUE KEY `uq_slot_reserva` (`slot_reserva`),
  UNIQUE KEY `uq_token_reprog` (`token_reprogramacion`),
  KEY `idx_cita_paciente` (`id_paciente`),
  KEY `idx_cita_medico` (`id_medico`),
  KEY `idx_cita_aseguradora` (`id_aseguradora`),
  KEY `idx_cita_estado` (`estado_actual`),
  KEY `idx_cita_fecha` (`fecha_hora`),
  KEY `idx_cita_otp_expira` (`otp_expira_en`) COMMENT 'Barrido de PENDIENTE_OTP vencidos',
  CONSTRAINT `fk_cita_paciente`
    FOREIGN KEY (`id_paciente`) REFERENCES `Pacientes` (`id_paciente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_cita_medico`
    FOREIGN KEY (`id_medico`) REFERENCES `Medicos` (`id_medico`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_cita_aseguradora`
    FOREIGN KEY (`id_aseguradora`) REFERENCES `Aseguradoras` (`id_aseguradora`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_cita_otp_intentos` CHECK (`otp_intentos` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Citas: máquina de estados + OTP + SITEDS + bloqueo de horario';

-- =====================================================================
-- 6) DOCUMENTOS_CLINICOS  —  Portal privado del paciente
--    ENUM restringido a documentos de vista pública.
--    Las "notas de evolución" quedan PROHIBIDAS por diseño de esquema.
-- =====================================================================
CREATE TABLE `Documentos_Clinicos` (
  `id_documento`   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_paciente`    INT UNSIGNED NOT NULL,
  `id_medico`      INT UNSIGNED NULL COMMENT 'Profesional emisor',
  `id_cita`        INT UNSIGNED NULL COMMENT 'Cita asociada (opcional)',
  `tipo_documento` ENUM(
                     'RECETA_MEDICA',
                     'INFORME_ENDOSCOPIA',
                     'INFORME_COLONOSCOPIA',
                     'RESULTADO_LABORATORIO'
                   ) NOT NULL,
  `titulo`         VARCHAR(150) NOT NULL,
  `descripcion`    VARCHAR(500) NULL,
  `ruta_archivo`   VARCHAR(255) NOT NULL COMMENT 'Ruta/URL del PDF resguardado (no público directo)',
  `fecha_emision`  DATE NOT NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_documento`),
  KEY `idx_doc_paciente` (`id_paciente`),
  KEY `idx_doc_tipo` (`tipo_documento`),
  KEY `idx_doc_medico` (`id_medico`),
  CONSTRAINT `fk_doc_paciente`
    FOREIGN KEY (`id_paciente`) REFERENCES `Pacientes` (`id_paciente`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_doc_medico`
    FOREIGN KEY (`id_medico`) REFERENCES `Medicos` (`id_medico`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_doc_cita`
    FOREIGN KEY (`id_cita`) REFERENCES `Citas` (`id_cita`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Documentos visibles en portal. Notas de evolución prohibidas';

-- =====================================================================
-- 7) BITACORA_ESTADOS_CITA  —  trazabilidad de transiciones
--    Auditoría inmutable de la máquina de estados (sector salud).
--    CASCADE: si una cita temporal (PENDIENTE_OTP vencida) se purga,
--    su rastro temporal se elimina con ella. Las citas con valor legal
--    nunca se borran (transitan a CANCELADA/ATENDIDA), preservando todo.
-- =====================================================================
CREATE TABLE `Bitacora_Estados_Cita` (
  `id_bitacora`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cita`         INT UNSIGNED NOT NULL,
  `estado_anterior` ENUM(
                      'PENDIENTE_OTP','RESERVADA_WEB','CONFIRMADA_WSP',
                      'CONFIRMADA_RECEPCION','ATENCION_CONDICIONADA',
                      'NO_ASISTIO','CANCELADA_PACIENTE','ATENDIDA'
                    ) NULL,
  `estado_nuevo`    ENUM(
                      'PENDIENTE_OTP','RESERVADA_WEB','CONFIRMADA_WSP',
                      'CONFIRMADA_RECEPCION','ATENCION_CONDICIONADA',
                      'NO_ASISTIO','CANCELADA_PACIENTE','ATENDIDA'
                    ) NOT NULL,
  `origen`          ENUM('WEB','WHATSAPP','RECEPCION','SISTEMA','SITEDS') NOT NULL,
  `detalle`         VARCHAR(255) NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_bitacora`),
  KEY `idx_bitacora_cita` (`id_cita`),
  KEY `idx_bitacora_fecha` (`created_at`),
  CONSTRAINT `fk_bitacora_cita`
    FOREIGN KEY (`id_cita`) REFERENCES `Citas` (`id_cita`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Auditoría de transiciones de la máquina de estados de Citas';

-- =====================================================================
--  VISTAS
-- =====================================================================

-- Portal privado: documentos del paciente con nombre del emisor.
-- La autorización por id_paciente se aplica SIEMPRE en la consulta PHP
-- (WHERE id_paciente = :id_sesion); esta vista solo facilita el JOIN.
CREATE OR REPLACE VIEW `vw_documentos_portal` AS
SELECT
  d.`id_documento`,
  d.`id_paciente`,
  d.`tipo_documento`,
  d.`titulo`,
  d.`descripcion`,
  d.`fecha_emision`,
  CONCAT(m.`nombres`, ' ', m.`apellidos`) AS `medico_emisor`,
  m.`especialidad`,
  d.`created_at`
FROM `Documentos_Clinicos` d
LEFT JOIN `Medicos` m ON m.`id_medico` = d.`id_medico`;

-- Agenda operativa: citas vivas (no terminales) para dashboard de recepción.
CREATE OR REPLACE VIEW `vw_agenda_activa` AS
SELECT
  c.`id_cita`,
  c.`fecha_hora`,
  c.`estado_actual`,
  c.`estado_siteds`,
  CONCAT(p.`nombres`, ' ', p.`apellidos`)  AS `paciente`,
  p.`tipo_documento`, p.`numero_documento`,
  CONCAT(m.`nombres`, ' ', m.`apellidos`)  AS `medico`,
  a.`nombre`                               AS `aseguradora`
FROM `Citas` c
JOIN `Pacientes` p     ON p.`id_paciente` = c.`id_paciente`
JOIN `Medicos`   m     ON m.`id_medico`   = c.`id_medico`
LEFT JOIN `Aseguradoras` a ON a.`id_aseguradora` = c.`id_aseguradora`
WHERE c.`estado_actual` NOT IN ('CANCELADA_PACIENTE','NO_ASISTIO','ATENDIDA');

-- =====================================================================
--  EVENTO (opcional) — barrido de OTP vencidos y liberación de cupo.
--  Requiere: SET GLOBAL event_scheduler = ON;  (privilegio EVENT).
--  En Railway, si el scheduler no está disponible, n8n (cron) o un
--  cron de la app ejecutan el mismo DELETE cada minuto.
-- =====================================================================
DROP EVENT IF EXISTS `ev_limpiar_otp_expirado`;
-- Sentencia única en el DO: no requiere DELIMITER ni BEGIN/END (importación portable).
CREATE EVENT IF NOT EXISTS `ev_limpiar_otp_expirado`
  ON SCHEDULE EVERY 1 MINUTE
  COMMENT 'Elimina citas PENDIENTE_OTP vencidas y libera el horario'
  DO
    DELETE FROM `Citas`
    WHERE `estado_actual` = 'PENDIENTE_OTP'
      AND `otp_expira_en` IS NOT NULL
      AND `otp_expira_en` < NOW();

-- =====================================================================
--  DATOS SEMILLA (prototipo funcional)
-- =====================================================================
INSERT INTO `Aseguradoras` (`nombre`, `codigo_susalud`, `estado_activo`) VALUES
  ('Particular (sin seguro)', NULL,        TRUE),
  ('EsSalud',                 '20131257750', TRUE),
  ('Rímac Seguros',           'IAFAS-001',  TRUE),
  ('Pacífico Seguros',        'IAFAS-002',  TRUE),
  ('La Positiva Sanitas',     'IAFAS-003',  TRUE);

INSERT INTO `Medicos` (`cmp`, `nombres`, `apellidos`, `especialidad`, `correo`, `telefono`, `estado_activo`) VALUES
  ('CMP12345', 'Ricardo',  'Salazar Vega',   'Gastroenterología',           'rsalazar@gastrodigest.pe', '51987100001', TRUE),
  ('CMP23456', 'Lucía',    'Mendoza Ríos',   'Gastroenterología',           'lmendoza@gastrodigest.pe', '51987100002', TRUE),
  ('CMP34567', 'Andrés',   'Quispe Flores',  'Endoscopía Digestiva',        'aquispe@gastrodigest.pe',  '51987100003', TRUE),
  ('CMP45678', 'Patricia', 'Huamán León',    'Hepatología',                 'phuaman@gastrodigest.pe',  '51987100004', FALSE);

-- =====================================================================
--  Restaurar entorno de sesión
-- =====================================================================
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
SET SQL_MODE = @OLD_SQL_MODE;

-- =====================================================================
--  FIN — ENTREGABLE 1
-- =====================================================================
