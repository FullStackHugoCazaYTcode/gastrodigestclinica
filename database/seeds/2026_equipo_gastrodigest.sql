-- =====================================================================
--  GASTRODIGEST · Equipo médico real (perfiles + fotos)
-- ---------------------------------------------------------------------
--  Ejecutar UNA vez, DESPUÉS de:
--    · 2026_fase2h_medico_perfil.sql      (foto, bio, experiencia…)
--    · 2026_fase2i_titulo_reservable.sql  (titulo, reservable)
--
--  Fotos: coloca los 5 archivos en frontend/img/medicos/ con estos nombres:
--    dra-ramirez.jpg · dra-mendoza.jpg · dra-vargas.jpg · lic-rojas.jpg · dra-fernandez.jpg
--
--  Los 3 médicos gastroenterólogos pueden iniciar sesión en el portal médico
--  con su correo y la contraseña temporal: Medico2026  (cámbiala luego).
--  El enfermero y la cirujana NO son reservables online (solo se muestran).
-- =====================================================================
SET NAMES utf8mb4;
USE `gastrodigest`;

-- 1) Dra. Elena Ramírez Villalobos — Directora Médica -------------------
INSERT INTO `Medicos`
  (`cmp`, `nombres`, `apellidos`, `titulo`, `especialidad`, `correo`, `password_hash`,
   `estado_activo`, `reservable`, `foto`, `sub_especialidad`, `formacion`, `bio`)
VALUES
  ('045218', 'Elena', 'Ramírez Villalobos', 'Dra.', 'Gastroenterología',
   'elena.ramirez@gastrodigest.pe', '$2b$10$aXJeUPpzTZz/hdFL.a.6GOGWzIUVZj2vicA2mp83OudFOJ8RTEvIO',
   1, 1, '/img/medicos/dra-ramirez.jpg', 'Endoscopía terapéutica avanzada · Directora Médica',
   'UNHEVAL · Certificaciones en Corea del Sur, Brasil y Argentina',
   'Directora Médica de GastroDigest y jefa del área de endoscopía avanzada. Especialista en endoscopía terapéutica con certificaciones internacionales: disección submucosa endoscópica (National Cancer Center, Seúl), ultrasonografía endoscópica (USP, Brasil), manejo de enfermedad inflamatoria intestinal (Hospital Udaondo, Buenos Aires) y CPRE. Ponente habitual en la Semana Panamericana de las Enfermedades Digestivas.')
ON DUPLICATE KEY UPDATE
  `nombres`=VALUES(`nombres`), `apellidos`=VALUES(`apellidos`), `titulo`=VALUES(`titulo`),
  `especialidad`=VALUES(`especialidad`), `estado_activo`=VALUES(`estado_activo`),
  `reservable`=VALUES(`reservable`), `foto`=VALUES(`foto`),
  `sub_especialidad`=VALUES(`sub_especialidad`), `formacion`=VALUES(`formacion`), `bio`=VALUES(`bio`);

-- 2) Dra. Sofía Mendoza Alarcón — Neurogastroenterología ---------------
INSERT INTO `Medicos`
  (`cmp`, `nombres`, `apellidos`, `titulo`, `especialidad`, `correo`, `password_hash`,
   `estado_activo`, `reservable`, `foto`, `sub_especialidad`, `formacion`, `bio`)
VALUES
  ('052390', 'Sofía', 'Mendoza Alarcón', 'Dra.', 'Gastroenterología',
   'sofia.mendoza@gastrodigest.pe', '$2b$10$aXJeUPpzTZz/hdFL.a.6GOGWzIUVZj2vicA2mp83OudFOJ8RTEvIO',
   1, 1, '/img/medicos/dra-mendoza.jpg', 'Neurogastroenterología y motilidad',
   'UPCH · Certificación internacional en manometría de alta resolución',
   'Especialista en neurogastroenterología y motilidad digestiva; atiende trastornos del movimiento intestinal y reflujo complejo. Cuenta con certificación internacional en manometría esofágica y anorrectal de alta resolución y acreditación en pH-metría de 24 horas.')
ON DUPLICATE KEY UPDATE
  `nombres`=VALUES(`nombres`), `apellidos`=VALUES(`apellidos`), `titulo`=VALUES(`titulo`),
  `especialidad`=VALUES(`especialidad`), `estado_activo`=VALUES(`estado_activo`),
  `reservable`=VALUES(`reservable`), `foto`=VALUES(`foto`),
  `sub_especialidad`=VALUES(`sub_especialidad`), `formacion`=VALUES(`formacion`), `bio`=VALUES(`bio`);

-- 3) Dra. Camila Vargas del Carpio — Hepatología -----------------------
INSERT INTO `Medicos`
  (`cmp`, `nombres`, `apellidos`, `titulo`, `especialidad`, `correo`, `password_hash`,
   `estado_activo`, `reservable`, `foto`, `sub_especialidad`, `formacion`, `bio`)
VALUES
  ('061147', 'Camila', 'Vargas del Carpio', 'Dra.', 'Gastroenterología',
   'camila.vargas@gastrodigest.pe', '$2b$10$aXJeUPpzTZz/hdFL.a.6GOGWzIUVZj2vicA2mp83OudFOJ8RTEvIO',
   1, 1, '/img/medicos/dra-vargas.jpg', 'Hepatología clínica',
   'UNMSM · Elastografía hepática (FibroScan) · MAFLD',
   'Hepatóloga enfocada en el diagnóstico y manejo de las enfermedades del hígado. Certificada en elastografía hepática (FibroScan) y en el manejo de la enfermedad del hígado graso asociada al metabolismo (MAFLD).')
ON DUPLICATE KEY UPDATE
  `nombres`=VALUES(`nombres`), `apellidos`=VALUES(`apellidos`), `titulo`=VALUES(`titulo`),
  `especialidad`=VALUES(`especialidad`), `estado_activo`=VALUES(`estado_activo`),
  `reservable`=VALUES(`reservable`), `foto`=VALUES(`foto`),
  `sub_especialidad`=VALUES(`sub_especialidad`), `formacion`=VALUES(`formacion`), `bio`=VALUES(`bio`);

-- 4) Lic. Mateo Rojas Cárdenas — Enfermería endoscópica (no reservable) -
INSERT INTO `Medicos`
  (`cmp`, `nombres`, `apellidos`, `titulo`, `especialidad`, `correo`, `password_hash`,
   `estado_activo`, `reservable`, `foto`, `sub_especialidad`, `formacion`, `bio`)
VALUES
  ('078455', 'Mateo', 'Rojas Cárdenas', 'Lic.', 'Enfermería endoscópica',
   'mateo.rojas@gastrodigest.pe', NULL,
   1, 0, '/img/medicos/lic-rojas.jpg', 'Cuidados críticos digestivos',
   'USMP · ACLS (American Heart Association)',
   'Licenciado en enfermería especializado en procedimientos endoscópicos y cuidados críticos digestivos; asiste en la sala de procedimientos y sedación. Certificado en asistencia de procedimientos endoscópicos complejos y en Soporte Vital Cardiovascular Avanzado (ACLS, American Heart Association).')
ON DUPLICATE KEY UPDATE
  `nombres`=VALUES(`nombres`), `apellidos`=VALUES(`apellidos`), `titulo`=VALUES(`titulo`),
  `especialidad`=VALUES(`especialidad`), `estado_activo`=VALUES(`estado_activo`),
  `reservable`=VALUES(`reservable`), `foto`=VALUES(`foto`),
  `sub_especialidad`=VALUES(`sub_especialidad`), `formacion`=VALUES(`formacion`), `bio`=VALUES(`bio`);

-- 5) Dra. Lucía Fernández Salazar — Cirugía GI (no reservable) ----------
INSERT INTO `Medicos`
  (`cmp`, `nombres`, `apellidos`, `titulo`, `especialidad`, `correo`, `password_hash`,
   `estado_activo`, `reservable`, `foto`, `sub_especialidad`, `formacion`, `bio`)
VALUES
  ('049802', 'Lucía', 'Fernández Salazar', 'Dra.', 'Cirugía gastrointestinal',
   'lucia.fernandez@gastrodigest.pe', NULL,
   1, 0, '/img/medicos/dra-fernandez.jpg', 'Laparoscopía avanzada',
   'UNMSM · Cirugía mínimamente invasiva y robótica · Fellowship oncológico',
   'Cirujana gastrointestinal especializada en laparoscopía avanzada. Interviene en los casos derivados por el equipo de gastroenterología que requieren tratamiento quirúrgico (resecciones intestinales, colecistectomías). Certificación internacional en cirugía mínimamente invasiva y robótica, y fellowship en cirugía oncológica del tracto digestivo.')
ON DUPLICATE KEY UPDATE
  `nombres`=VALUES(`nombres`), `apellidos`=VALUES(`apellidos`), `titulo`=VALUES(`titulo`),
  `especialidad`=VALUES(`especialidad`), `estado_activo`=VALUES(`estado_activo`),
  `reservable`=VALUES(`reservable`), `foto`=VALUES(`foto`),
  `sub_especialidad`=VALUES(`sub_especialidad`), `formacion`=VALUES(`formacion`), `bio`=VALUES(`bio`);

-- 6) Horario por defecto (Lun–Sáb 08:00–18:00) para los 3 médicos
--    reservables, para que la reserva funcione de inmediato. (Editable luego
--    en Admin → Médicos → Horarios.)
INSERT INTO `Horarios_Medico` (`id_medico`, `dia_semana`, `hora_inicio`, `hora_fin`)
SELECT m.`id_medico`, d.`dia`, '08:00:00', '18:00:00'
FROM `Medicos` m
CROSS JOIN (
  SELECT 1 AS dia UNION ALL SELECT 2 UNION ALL SELECT 3
  UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
) d
WHERE m.`correo` IN (
  'elena.ramirez@gastrodigest.pe', 'sofia.mendoza@gastrodigest.pe', 'camila.vargas@gastrodigest.pe'
) AND NOT EXISTS (
  SELECT 1 FROM `Horarios_Medico` h WHERE h.`id_medico` = m.`id_medico`
);

-- 7) (OPCIONAL) Deja visible SOLO a este equipo: desactiva médicos de
--    prueba anteriores (no los borra, solo los oculta). Comenta estas
--    líneas si quieres conservar visibles a otros médicos existentes.
UPDATE `Medicos` SET `estado_activo` = 0
WHERE `correo` NOT IN (
  'elena.ramirez@gastrodigest.pe', 'sofia.mendoza@gastrodigest.pe',
  'camila.vargas@gastrodigest.pe', 'mateo.rojas@gastrodigest.pe',
  'lucia.fernandez@gastrodigest.pe'
);
