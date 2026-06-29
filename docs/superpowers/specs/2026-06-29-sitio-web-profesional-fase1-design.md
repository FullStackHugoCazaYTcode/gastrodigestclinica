# Diseño — Fase 1: Sitio web profesional GastroDigest

- **Fecha:** 2026-06-29
- **Estado:** Aprobado (diseño) — pendiente de plan de implementación
- **Autor:** Hugo Rojas Sánchez + Claude

---

## 1. Contexto y estado actual

GastroDigest es un sistema clínico front-office ya desplegado en la nube:

- **Frontend:** SPA en JavaScript vanilla (módulos ES, router con History API, CSS con design tokens). Desplegado en Vercel (`gastrodigestclinica.vercel.app`).
- **Backend:** PHP 8 (MVC) en Railway, API REST con envelope `{success, message, data, errors}`.
- **BD:** MySQL 8 en Railway (esquema `gastrodigest`).
- **Mensajería:** n8n + Brevo (OTP por correo) funcionando de extremo a extremo.

Ya funcionan: reserva de cita con OTP, validación de documento/edad/apoderado, y portal del paciente (login + documentos). El router actual sirve la **reserva** en `/`, el portal en `/portal` y la reprogramación en `/reprogramar/{token}`.

## 2. Objetivo

Elevar el frontend a un **sitio web profesional, animado y robusto** para la clínica, que **integre lo ya construido** (reserva, OTP, portal) en una experiencia coherente y atractiva, con el fin de transmitir confianza y atraer pacientes. Es la **Fase 1** de una iniciativa mayor.

## 3. Alcance

### Dentro de la Fase 1
- Sitio de marketing multipágina (inicio, servicios, nosotros, médicos, contacto).
- Capa de motion profesional (GSAP + ScrollTrigger + scroll suave + fondos animados).
- Integración de la reserva/OTP/portal existentes en el nuevo sitio (reubicando la reserva a `/reservar`).
- Sección de médicos conectada en vivo a `/api/medicos`.

### Fuera de la Fase 1 (Fase 2, posterior)
- Área de **Médico** (login por rol + panel: sus citas, validar recepción, marcar atendida, subir documentos).
- Área de **Administrador** (login por rol + panel: gestionar médicos, ver todas las citas, estadísticas).
- Endpoint de formulario de contacto (en Fase 1 el contacto es informativo + CTA).

## 4. Restricciones y decisiones

- **Tiempo:** ~1 semana → priorizar impacto visual y reuso; evitar reescrituras riesgosas.
- **Enfoque técnico (Opción A aprobada):** potenciar el stack vanilla actual con GSAP; **no** migrar a framework. Un solo código, mismo deploy.
- **Dirección visual (aprobada):** *Soft UI médico premium + motion* — paleta clara azul/verde actual, fondos animados suaves, movimiento que genera confianza (no "neón/dark").
- **Contenido:** demo realista generado por Claude (textos de gastroenterología, datos de ejemplo coherentes); médicos desde la BD. Imágenes: ilustraciones/iconos SVG + fotos de stock libres o placeholders.
- **Skill de diseño:** se usará `ui-ux-pro-max` durante la implementación para afinar paleta, jerarquía, tipografía y componentes.

## 5. Arquitectura

SPA vanilla existente, extendida con:

- **Capa de motion** (`js/motion.js`): inicializa GSAP + ScrollTrigger + Lenis (scroll suave), expone utilidades de "reveal al scroll", parallax y contadores. Cargados por CDN (cdnjs/jsdelivr). Punto único de inicialización, idempotente entre cambios de vista.
- **Fondo "aurora"** (`js/components/aurora.js` + `css/`): formas/degradados suaves que flotan, animados solo con `transform`/`opacity`. Reutilizable en hero y separadores.
- **Componentes compartidos:** navbar (sticky, transparente sobre hero → sólida al scroll, con CTAs) y footer, como módulos reutilizables.
- **Accesibilidad/rendimiento:** se respeta `prefers-reduced-motion` (desactiva motion no esencial); animaciones compositor-friendly; imágenes con dimensiones explícitas y `loading="lazy"`; contraste WCAG AA.

## 6. Páginas / rutas

| Ruta | Página | Contenido |
|---|---|---|
| `/` | Inicio (landing) | Hero animado (fondo aurora) + CTAs "Reservar"/"Portal"; propuesta de valor; franja de confianza (stats con contador animado); servicios destacados; médicos en vivo; testimonios; CTA final |
| `/servicios` | Servicios | Especialidades (consulta gastroenterológica, endoscopía digestiva alta, colonoscopía, pruebas de laboratorio, control y seguimiento) en bento grid animado |
| `/nosotros` | Nosotros | Historia, misión/visión, "por qué elegirnos", valores — con revelados al scroll |
| `/medicos` | Equipo médico | Tarjetas de médicos desde `/api/medicos` (nombre, especialidad), con estados de carga/skeleton |
| `/contacto` | Contacto | Ubicación (Huánuco), horarios, teléfono, mapa embebido/ilustración + CTA a reservar |
| `/reservar` | Reserva (existente) | Flujo de reserva + modal OTP (reubicado desde `/`) |
| `/portal` | Portal (existente) | Login + documentos del paciente |
| `/reprogramar/{token}` | Reprogramación (existente) | Sin cambios |

**Integración clave:** `/` deja de ser la reserva y pasa a ser el landing; la reserva se mueve a `/reservar`. Se actualizan router, navbar y los enlaces internos (`data-link`) que apuntaban a la reserva.

## 7. Identidad visual

Extiende los tokens existentes (`css/tokens.css`): primario `#1A6B9A`, secundario `#2EAD8E`, CTA `#F97316`, fondo `#F8FAFC`, texto `#1E293B`, tipografía Inter. Se añaden tokens de motion (ya hay easings/durations) y de fondo aurora. Navbar y footer con identidad "I.S." (Ingeniería de Sistemas). Datos demo por defecto (editables):

- **Clínica:** GastroDigest — Clínica Gastroenterológica
- **Ciudad:** Huánuco, Perú
- **Teléfono / WhatsApp:** +51 962 000 000 (demo)
- **Horario:** Lun–Sáb, 8:00–18:00
- **Dirección:** Jr. Dos de Mayo 1234, Huánuco (demo)

## 8. Motion (detalle)

- Scroll suave global (Lenis).
- Hero: fondo aurora en movimiento; titular revelado por palabras (stagger); flotación sutil de tarjetas/ilustración.
- Secciones: aparición (fade + slide-up) al entrar en viewport (ScrollTrigger).
- Parallax suave en elementos de fondo.
- Contadores animados en la franja de stats.
- Microinteracciones en tarjetas y botones (hover/focus/active).
- `prefers-reduced-motion`: se desactivan revelados/parallax/aurora; el contenido permanece estático y legible.

## 9. Flujo de datos / integración

- **Médicos:** `GET /api/medicos` (en vivo) en `/medicos` y en la sección destacada del inicio.
- **Reserva/OTP/Portal:** sin cambios funcionales; siguen llamando al backend existente.
- **Contacto:** sin endpoint nuevo; muestra info + CTA "Reservar cita".

## 10. Manejo de errores

- Carga de médicos: estado de carga (skeleton) → si falla la API, mensaje amable y CTA a reservar (no romper la página).
- Motion: si GSAP/Lenis no cargan (CDN caído), el sitio degrada a estático y sigue navegable (carga condicional + try/catch).
- Rutas desconocidas: redirección a `/` (comportamiento actual del router).

## 11. Estructura de archivos

**Nuevos**
- `frontend/js/views/home.js`, `servicios.js`, `nosotros.js`, `medicos.js`, `contacto.js`
- `frontend/js/motion.js` (GSAP/Lenis + utilidades reveal/parallax/counter)
- `frontend/js/components/navbar.js`, `footer.js`, `aurora.js`
- `frontend/css/marketing.css`, `motion.css`

**Modificados**
- `frontend/index.html` (cargar GSAP/Lenis por CDN; montar navbar/footer)
- `frontend/js/app.js` (registrar nuevas rutas; reserva → `/reservar`)
- `frontend/js/router.js` (si requiere ajustes para layout persistente)
- `frontend/js/views/reserva.js` (enlaces/CTA de éxito apuntan a rutas nuevas)

## 12. Verificación

- Levantar preview local (`.claude/launch.json`, `npx serve`) y capturar el render en 375 / 768 / 1024 / 1440 px.
- Revisar consola sin errores; validar `prefers-reduced-motion`.
- Confirmar que reserva/OTP/portal siguen funcionando tras la reubicación de rutas.
- Deploy en Vercel por push a `main`.

## 13. Criterios de éxito

- Sitio multipágina navegable, animado y coherente con la identidad médica.
- Reserva, OTP y portal accesibles e integrados desde el nuevo sitio.
- Médicos cargando en vivo desde la API.
- Sin errores de consola; responsive en los 4 breakpoints; `prefers-reduced-motion` respetado.
- Desplegado en Vercel.
