-- =====================================================================
--  GastroDigest · Seed de demostración del PORTAL DEL PACIENTE
--  Crea un paciente con contraseña y 4 documentos clínicos de ejemplo.
--  Re-ejecutable (idempotente).
--
--  CREDENCIALES DE ACCESO AL PORTAL:
--    Tipo de documento : DNI
--    N.° de documento  : 12345678
--    Contraseña        : Paciente2026
-- =====================================================================
USE `gastrodigest`;

-- Paciente demo (password_hash = bcrypt de 'Paciente2026')
INSERT INTO `Pacientes`
  (`tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `fecha_nacimiento`,
   `sexo`, `telefono`, `correo`, `consentimiento_datos`, `fecha_consentimiento`, `password_hash`)
VALUES
  ('DNI', '12345678', 'Maria Elena', 'Garcia Torres', '1992-04-15',
   'F', '51987654321', 'hr177153@gmail.com', 1, NOW(),
   '$2b$10$DGQ7g03deM1./5aOYEigY.N/k17xRPY3tHMhjqGb/Ctsct9BA63KG')
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `correo`        = VALUES(`correo`);

-- id del paciente demo
SET @pid = (SELECT `id_paciente` FROM `Pacientes`
            WHERE `tipo_documento` = 'DNI' AND `numero_documento` = '12345678');

-- Limpia documentos previos del demo (para re-ejecución limpia)
DELETE FROM `Documentos_Clinicos` WHERE `id_paciente` = @pid;

-- 4 documentos de ejemplo (uno por cada tipo público permitido)
INSERT INTO `Documentos_Clinicos`
  (`id_paciente`, `id_medico`, `tipo_documento`, `titulo`, `descripcion`, `ruta_archivo`, `fecha_emision`)
VALUES
  (@pid, 1, 'RECETA_MEDICA',         'Receta - Omeprazol 20mg',   'Tomar 1 capsula en ayunas durante 14 dias.',                    '/docs/receta-001.pdf',       '2026-06-20'),
  (@pid, 3, 'INFORME_ENDOSCOPIA',    'Endoscopia digestiva alta', 'Gastritis cronica leve. Test de Helicobacter pylori negativo.', '/docs/endoscopia-001.pdf',   '2026-06-18'),
  (@pid, 2, 'RESULTADO_LABORATORIO', 'Perfil hepatico completo',  'Valores dentro de los rangos normales.',                        '/docs/laboratorio-001.pdf',  '2026-06-15'),
  (@pid, 3, 'INFORME_COLONOSCOPIA',  'Colonoscopia',              'Mucosa colonica normal, sin polipos ni lesiones.',              '/docs/colonoscopia-001.pdf', '2026-05-30');

-- Verificacion
SELECT `id_paciente`, `nombres`, `apellidos`, (`password_hash` IS NOT NULL) AS `tiene_password`
FROM `Pacientes` WHERE `id_paciente` = @pid;
SELECT `tipo_documento`, `titulo`, `fecha_emision`
FROM `Documentos_Clinicos` WHERE `id_paciente` = @pid;
