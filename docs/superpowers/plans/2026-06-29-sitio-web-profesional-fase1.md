# Sitio web profesional GastroDigest (Fase 1) — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la SPA vanilla actual en un sitio web profesional, animado y multipágina para la Clínica GastroDigest, integrando la reserva/OTP/portal existentes.

**Architecture:** Se mantiene la SPA vanilla (módulos ES + router History API). Se añade una capa de motion (GSAP + ScrollTrigger + Lenis por CDN) y componentes reutilizables (navbar, footer, aurora, faq, trustStrip). El landing pasa a `/` y la reserva a `/reservar`. La sección de médicos consume `/api/medicos` en vivo.

**Tech Stack:** HTML5, CSS3 (design tokens existentes), JavaScript Vanilla (ES modules), GSAP 3 + ScrollTrigger, Lenis (smooth scroll), Tabler/Lucide SVG icons (inline), deploy en Vercel.

## Global Constraints

- Stack vanilla — NO frameworks (sin React/Vue). Reusar lo existente.
- Animaciones solo con propiedades compositor-friendly (`transform`, `opacity`); respetar `prefers-reduced-motion`.
- Sin emojis como iconos: usar SVG inline (Heroicons/Lucide), como ya hace `js/ui.js`.
- Sin `alert()`/`confirm()` nativos; feedback inline/toast (ya existe en `ui.js`).
- Paleta y tokens existentes (`css/tokens.css`): primario `#1A6B9A`, secundario `#2EAD8E`, CTA `#F97316`, fondo `#F8FAFC`, texto `#1E293B`, tipografía Inter.
- Responsive en 375 / 768 / 1024 / 1440 px; contraste WCAG AA.
- Cada vista monta en `#app`; navbar/footer persisten fuera de `#app`.
- API base: el frontend ya resuelve `API_BASE_URL` en `js/api.js`. No hardcodear URLs.
- Usar la skill `ui-ux-pro-max` al construir cada página para afinar jerarquía, espaciado y componentes.
- Datos demo editables: Clínica "GastroDigest", Huánuco-Perú, tel +51 962 000 000, Lun–Sáb 8:00–18:00, Jr. Dos de Mayo 1234.

---

## Mapa de archivos

**Nuevos**
- `frontend/js/motion.js` — init GSAP/Lenis + utilidades `reveal()`, `parallax()`, `countUp()`, `prefersReducedMotion()`.
- `frontend/js/components/navbar.js` — navbar persistente (links + CTAs, estado scroll, móvil).
- `frontend/js/components/footer.js` — footer persistente.
- `frontend/js/components/aurora.js` — fondo aurora reutilizable.
- `frontend/js/components/faq.js` — acordeón FAQ accesible + JSON-LD.
- `frontend/js/components/trustStrip.js` — franja de instituciones (grises).
- `frontend/js/views/home.js`, `servicios.js`, `nosotros.js`, `medicos.js`, `contacto.js`.
- `frontend/css/marketing.css` — estilos de las páginas de marketing.
- `frontend/css/motion.css` — clases de motion (estado inicial de reveals, aurora, reduced-motion).

**Modificados**
- `frontend/index.html` — cargar GSAP/Lenis por CDN; contenedores de navbar/footer; meta SEO.
- `frontend/js/app.js` — registrar rutas nuevas; mover reserva a `/reservar`; montar navbar/footer + motion.
- `frontend/js/views/reserva.js` — CTAs de éxito apuntan a `/` y `/portal` (ya lo hacen) y se monta en `/reservar`.

---

## Task 1: Capa de motion + fondo aurora

**Files:**
- Create: `frontend/js/motion.js`, `frontend/js/components/aurora.js`, `frontend/css/motion.css`
- Modify: `frontend/index.html` (cargar GSAP/Lenis + motion.css), `frontend/js/app.js` (init motion)

**Interfaces:**
- Produces: `initMotion()`, `revealOnScroll(selector)`, `countUp(el, to)`, `prefersReducedMotion()` desde `motion.js`; `auroraHTML()` (string) desde `aurora.js`.

- [ ] **Step 1: Cargar librerías y CSS en `index.html`**

En `<head>`, tras los CSS existentes:
```html
<link rel="stylesheet" href="css/motion.css" />
<link rel="stylesheet" href="css/marketing.css" />
```
Antes de `</body>`, antes de `app.js`:
```html
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/lenis/1.1.13/lenis.min.js"></script>
```

- [ ] **Step 2: Escribir `js/motion.js`**

```js
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let lenis = null;

export function initMotion() {
  if (prefersReducedMotion()) return;
  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  if (window.gsap && window.ScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
  }
}

export function revealOnScroll(root = document) {
  if (prefersReducedMotion() || !window.gsap) return;
  root.querySelectorAll('[data-reveal]').forEach((el) => {
    window.gsap.fromTo(el,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  window.ScrollTrigger.refresh();
}

export function countUp(el) {
  const to = Number(el.dataset.count || 0);
  if (prefersReducedMotion() || !window.gsap) { el.textContent = to.toLocaleString('es-PE'); return; }
  const obj = { v: 0 };
  window.gsap.to(obj, { v: to, duration: 1.6, ease: 'power2.out',
    scrollTrigger: { trigger: el, start: 'top 90%' },
    onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString('es-PE'); } });
}
```

- [ ] **Step 3: Escribir `js/components/aurora.js`**

```js
// Fondo decorativo con 3 manchas suaves que flotan (solo transform/opacity).
export function auroraHTML() {
  return `<div class="aurora" aria-hidden="true">
    <span class="aurora__blob aurora__blob--1"></span>
    <span class="aurora__blob aurora__blob--2"></span>
    <span class="aurora__blob aurora__blob--3"></span>
  </div>`;
}
```

- [ ] **Step 4: Escribir `css/motion.css`**

```css
[data-reveal] { will-change: transform, opacity; }
.aurora { position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
.aurora__blob { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.5; }
.aurora__blob--1 { width: 460px; height: 460px; background: #1A6B9A; top: -120px; left: -80px; animation: float1 18s ease-in-out infinite; }
.aurora__blob--2 { width: 380px; height: 380px; background: #2EAD8E; top: 40px; right: -100px; animation: float2 22s ease-in-out infinite; }
.aurora__blob--3 { width: 320px; height: 320px; background: #7FC9E8; bottom: -140px; left: 30%; animation: float3 20s ease-in-out infinite; }
@keyframes float1 { 50% { transform: translate(40px, 60px) scale(1.1); } }
@keyframes float2 { 50% { transform: translate(-50px, 30px) scale(1.05); } }
@keyframes float3 { 50% { transform: translate(30px, -40px) scale(1.08); } }
@media (prefers-reduced-motion: reduce) {
  .aurora__blob { animation: none; }
  [data-reveal] { opacity: 1 !important; transform: none !important; }
}
```

- [ ] **Step 5: Inicializar motion en `app.js`**

En `app.js`, importar y llamar tras `startRouter()`:
```js
import { initMotion } from './motion.js';
initMotion();
```

- [ ] **Step 6: Verificar en preview**

Run: `preview_start` (config `frontend`) → `preview_screenshot`. Insertar temporalmente `auroraHTML()` en `#app` para ver las manchas. Verificar `preview_console_logs` sin errores. Quitar el insert temporal.
Expected: fondo con manchas suaves; sin errores de consola.

- [ ] **Step 7: Commit**

```bash
git add frontend/js/motion.js frontend/js/components/aurora.js frontend/css/motion.css frontend/index.html frontend/js/app.js
git commit -m "feat(web): capa de motion (GSAP/Lenis) + fondo aurora"
```

---

## Task 2: Navbar y footer persistentes

**Files:**
- Create: `frontend/js/components/navbar.js`, `frontend/js/components/footer.js`, `frontend/css/marketing.css` (inicio)
- Modify: `frontend/index.html` (contenedores `#site-nav`, `#site-footer`), `frontend/js/app.js` (montar)

**Interfaces:**
- Consumes: `icon()` de `js/ui.js`.
- Produces: `renderNavbar()`, `renderFooter()` que rellenan sus contenedores y enganchan el estado de scroll y el menú móvil.

- [ ] **Step 1: Estructura en `index.html`**

Reemplazar el `<header class="navbar">…</header>` actual por `<header id="site-nav"></header>` y añadir `<footer id="site-footer"></footer>` antes de los roots de toast/modal.

- [ ] **Step 2: `navbar.js`**

Genera: marca "I.S." + GastroDigest; links a `/`, `/servicios`, `/nosotros`, `/medicos`, `/contacto`; CTAs `Portal` (ghost, `/portal`) y `Reservar cita` (CTA, `/reservar`). Toggle móvil. Añade clase `is-scrolled` al pasar 40px de scroll (navbar sólida). Todos los enlaces internos llevan `data-link`. Marca `is-active` según `location.pathname`.

```js
import { icon } from '../ui.js';
const LINKS = [
  ['/', 'Inicio'], ['/servicios', 'Servicios'], ['/nosotros', 'Nosotros'],
  ['/medicos', 'Médicos'], ['/contacto', 'Contacto'],
];
export function renderNavbar() {
  const nav = document.getElementById('site-nav');
  nav.className = 'navbar';
  nav.innerHTML = `
    <div class="container navbar__inner">
      <a class="brand" href="/" data-link aria-label="GastroDigest inicio">
        <span class="brand__logo" aria-hidden="true">I.S.</span>
        <span class="brand__text"><span class="brand__name">GastroDigest</span>
        <span class="brand__sub">Clínica Gastroenterológica</span></span>
      </a>
      <button class="navbar__toggle" aria-label="Menú" aria-expanded="false">${icon('menu', 22)}</button>
      <nav class="navbar__menu" aria-label="Principal">
        <ul class="nav-links">
          ${LINKS.map(([h, t]) => `<li><a href="${h}" data-link>${t}</a></li>`).join('')}
        </ul>
        <div class="navbar__cta">
          <a class="btn btn--ghost btn--sm" href="/portal" data-link>${icon('user',18)} Portal</a>
          <a class="btn btn--cta btn--sm" href="/reservar" data-link>${icon('calendar',18)} Reservar cita</a>
        </div>
      </nav>
    </div>`;
  const toggle = nav.querySelector('.navbar__toggle');
  const menu = nav.querySelector('.navbar__menu');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) nav.classList.remove('is-open'); });
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}
export function setActiveLink() {
  document.querySelectorAll('#site-nav .nav-links a').forEach((a) => {
    a.classList.toggle('is-active', a.getAttribute('href') === location.pathname);
  });
}
```
Añadir `menu: '<path d="M4 6h16M4 12h16M4 18h16"/>'` a `ICON_PATHS` en `ui.js` si no existe (ya existe `menu-2` style; usar `menu`).

- [ ] **Step 3: `footer.js`**

Footer con: columna de marca + tagline; columna de enlaces (mismas rutas); columna de contacto (dirección, tel, horario demo); franja legal (© año, Ley 29733, I.S.). Usar `icon()` para tel/ubicación/reloj.

- [ ] **Step 4: Montar en `app.js`**

```js
import { renderNavbar, setActiveLink } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
renderNavbar(); renderFooter();
```
En `router.js`, tras resolver la ruta, llamar `setActiveLink()` (o exponer hook). Quitar el `nav-links` viejo que `app.js` inyectaba.

- [ ] **Step 5: Estilos navbar/footer en `marketing.css`**

Estilos para `.navbar` (sticky, fondo translúcido → `.is-scrolled` sólido con sombra suave), `.navbar__menu` (desktop horizontal; móvil desplegable con `.is-open`), `.btn--sm`, `.footer` (grid 3-4 columnas → 1 col en móvil). Reusar tokens. Usar `ui-ux-pro-max` para pulir.

- [ ] **Step 6: Verificar en preview**

Run: `preview_start` → `preview_screenshot` (desktop) y `preview_resize` 375 → `preview_screenshot`. Verificar navbar sticky cambia con scroll (`preview_eval` scroll), menú móvil abre/cierra, footer visible. `preview_console_logs` limpio.
Expected: navbar y footer correctos en desktop y móvil.

- [ ] **Step 7: Commit**

```bash
git add frontend/js/components/navbar.js frontend/js/components/footer.js frontend/css/marketing.css frontend/index.html frontend/js/app.js frontend/js/router.js frontend/js/ui.js
git commit -m "feat(web): navbar y footer persistentes con estado scroll y menú móvil"
```

---

## Task 3: Integración de rutas (reserva → /reservar, nuevas rutas)

**Files:**
- Modify: `frontend/js/app.js` (rutas), `frontend/js/views/reserva.js` (CTAs), `frontend/js/router.js` (active link hook)
- Create: stubs mínimos de `home.js`, `servicios.js`, `nosotros.js`, `medicos.js`, `contacto.js` (cada uno exporta `renderX()` que monta un placeholder con título — se completan en tareas siguientes)

**Interfaces:**
- Consumes: `mount()` de `ui.js`, `route()/startRouter()` de `router.js`.
- Produces: rutas `/`, `/servicios`, `/nosotros`, `/medicos`, `/contacto`, `/reservar` registradas.

- [ ] **Step 1: Crear stubs de vistas**

Cada archivo (ej. `views/home.js`):
```js
import { mount } from '../ui.js';
export function renderHome() { mount(`<section class="section"><div class="container"><h1>Inicio (en construcción)</h1></div></section>`); }
```
Análogo para `renderServicios`, `renderNosotros`, `renderMedicos`, `renderContacto`.

- [ ] **Step 2: Registrar rutas en `app.js`**

```js
import { renderHome } from './views/home.js';
import { renderServicios } from './views/servicios.js';
import { renderNosotros } from './views/nosotros.js';
import { renderMedicos } from './views/medicos.js';
import { renderContacto } from './views/contacto.js';
import { renderReserva } from './views/reserva.js';
// ...
route('/', renderHome);
route('/servicios', renderServicios);
route('/nosotros', renderNosotros);
route('/medicos', renderMedicos);
route('/contacto', renderContacto);
route('/reservar', renderReserva);
route('/portal', renderPortal);
route('/reprogramar/:token', renderReprogramar);
```

- [ ] **Step 3: Ajustar CTAs de la reserva**

En `views/reserva.js`, el botón de éxito "Reservar otra cita" debe apuntar a `/reservar` (no `/`). Verificar que el resto de enlaces siguen válidos.

- [ ] **Step 4: Hook de active link en el router**

En `router.js`, tras invocar el handler de la ruta, llamar a `setActiveLink()` (importado de navbar) — o emitir un evento que `app.js` escuche.

- [ ] **Step 5: Verificar navegación en preview**

Run: `preview_start` → `preview_eval` para navegar (`history.pushState` + click en `data-link`) por cada ruta → `preview_snapshot`/`preview_screenshot`. Confirmar que `/reservar` muestra el formulario de reserva real y `/portal` el login.
Expected: las 7 rutas cargan; reserva/portal funcionan; sin errores.

- [ ] **Step 6: Commit**

```bash
git add frontend/js/app.js frontend/js/router.js frontend/js/views/
git commit -m "feat(web): integrar rutas (landing en /, reserva en /reservar) + stubs de páginas"
```

---

## Task 4: Página de Inicio (landing)

**Files:**
- Modify: `frontend/js/views/home.js`, `frontend/css/marketing.css`
- Create: `frontend/js/components/trustStrip.js`

**Interfaces:**
- Consumes: `auroraHTML()`, `revealOnScroll()`, `countUp()`, `icon()`, `api`, `trustStripHTML()`.

- [ ] **Step 1: `trustStrip.js`**

```js
const INSTITUCIONES = ['Sociedad Peruana de Gastroenterología', 'Colegio Médico del Perú',
  'UNMSM', 'UPCH', 'EsSalud'];
export function trustStripHTML() {
  return `<section class="trust"><div class="container">
    <p class="trust__label">Respaldo y formación de nuestro equipo</p>
    <div class="trust__logos">
      ${INSTITUCIONES.map((n) => `<span class="trust__logo">${n}</span>`).join('')}
    </div></div></section>`;
}
```
(Logos placeholder en grises; reemplazables por imágenes reales luego.)

- [ ] **Step 2: Construir `home.js` con secciones**

`renderHome()` monta, en orden: (1) hero con `auroraHTML()`, eyebrow, H1 ("Tu salud digestiva en manos expertas"), subtítulo, CTAs `/reservar` + `/portal`, tarjeta flotante de "próximas citas"/ilustración; (2) `trustStripHTML()`; (3) franja de stats con `data-count` (ej. +15 años, +8000 pacientes, 4 especialistas, 98% satisfacción); (4) servicios destacados (3-4 tarjetas con icono, enlazan a `/servicios`); (5) médicos destacados (fetch `/api/medicos`, primeras 3 tarjetas, enlazan a `/medicos`); (6) testimonios (3 citas demo); (7) CTA final ("Reserva tu cita hoy"). Marcar secciones con `data-reveal`. Tras montar, llamar `revealOnScroll()` y `countUp()` sobre los `[data-count]`. Copiar textos demo reales (gastroenterología).

- [ ] **Step 3: Estilos del landing en `marketing.css`**

Hero (grid 2 col → 1 col móvil, posición relativa para aurora detrás), `.trust` (logos grises con `filter: grayscale(1); opacity:.6` → hover realza), `.stats` (grid 4 → 2 móvil), tarjetas de servicio/médico/testimonio (radius 12px, sombra suave, hover elevar), CTA final. Usar `ui-ux-pro-max` para jerarquía/espaciado.

- [ ] **Step 4: Verificar en preview**

Run: `preview_start` → `preview_screenshot` desktop + `preview_resize` 768/375 → screenshots. `preview_eval` scroll para confirmar reveals/stats. Verificar médicos cargan (3 tarjetas) o degradan si la API no responde. `preview_console_logs` limpio.
Expected: landing completo, animado, responsive, médicos en vivo.

- [ ] **Step 5: Commit**

```bash
git add frontend/js/views/home.js frontend/js/components/trustStrip.js frontend/css/marketing.css
git commit -m "feat(web): página de inicio (hero animado, trust strip, stats, servicios, médicos, testimonios)"
```

---

## Task 5: Página de Servicios + FAQ animado + SEO JSON-LD

**Files:**
- Modify: `frontend/js/views/servicios.js`, `frontend/css/marketing.css`
- Create: `frontend/js/components/faq.js`

**Interfaces:**
- Consumes: `revealOnScroll()`, `icon()`, `faqHTML()`, `injectFaqJsonLd()`.

- [ ] **Step 1: `faq.js` (acordeón + JSON-LD)**

```js
import { icon } from '../ui.js';
export const FAQ = [
  ['¿Qué preparación necesito para una colonoscopía?', 'Dieta baja en residuos 3 días antes y la solución de limpieza indicada la noche previa. Te entregamos instrucciones detalladas al reservar.'],
  ['¿La endoscopía duele? ¿Incluye sedación?', 'Es un procedimiento breve y se realiza con sedación, por lo que no sentirás molestias. Requiere ayuno de 8 horas.'],
  ['¿Atienden emergencias gastroenterológicas?', 'Brindamos orientación y derivación. Para urgencias graves acude al servicio de emergencia más cercano.'],
  ['¿Trabajan con seguros?', 'Atendemos pacientes particulares y con seguro (EsSalud, EPS). La elegibilidad se valida al momento de reservar.'],
  ['¿Necesito ayuno antes de mi consulta?', 'Para una consulta regular no es necesario. Para procedimientos sí; te lo indicamos al agendar.'],
  ['¿Cómo recibo mis resultados?', 'Tus informes y recetas quedan disponibles en tu Portal del Paciente, de forma segura.'],
];
export function faqHTML() {
  return `<section class="section faq" data-reveal><div class="container">
    <h2 class="section__title">Preguntas frecuentes</h2>
    <div class="faq__list">
      ${FAQ.map(([q, a], i) => `
        <div class="faq__item">
          <button class="faq__q" aria-expanded="false" aria-controls="faq-${i}">
            <span>${q}</span>${icon('chevron-down', 20)}
          </button>
          <div class="faq__a" id="faq-${i}"><p>${a}</p></div>
        </div>`).join('')}
    </div></div></section>`;
}
export function wireFaq(root = document) {
  root.querySelectorAll('.faq__q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq__item');
      const open = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
}
export function injectFaqJsonLd() {
  const data = { '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q,
      acceptedAnswer: { '@type': 'Answer', text: a } })) };
  let s = document.getElementById('faq-jsonld');
  if (!s) { s = document.createElement('script'); s.id = 'faq-jsonld'; s.type = 'application/ld+json'; document.head.appendChild(s); }
  s.textContent = JSON.stringify(data);
}
```
Acordeón animado por CSS: `.faq__a { display:grid; grid-template-rows:0fr; transition:grid-template-rows .3s ease; } .faq__item.is-open .faq__a { grid-template-rows:1fr; }` (mismo patrón que el apoderado en `reserva.js`).

- [ ] **Step 2: `servicios.js`**

`renderServicios()` monta: hero pequeño con `auroraHTML()`; bento grid de servicios (Consulta gastroenterológica, Endoscopía digestiva alta, Colonoscopía, Pruebas de laboratorio, Control y seguimiento, Test de Helicobacter) cada uno con icono SVG, título, descripción demo; luego `faqHTML()`. Tras montar: `wireFaq()`, `revealOnScroll()`, `injectFaqJsonLd()`.

- [ ] **Step 3: Estilos bento + FAQ en `marketing.css`**

Bento grid (`grid-template-columns: repeat(6,1fr)` con spans variados → 1 col móvil), tarjetas con hover; `.faq__item` (borde, `.faq__q` botón full-width con chevron que rota `.is-open` → `rotate(180deg)`), `.faq__a` con el patrón grid-rows.

- [ ] **Step 4: Verificar en preview**

Run: `preview_start` → navegar a `/servicios` → `preview_screenshot`. `preview_click` en una pregunta del FAQ → `preview_screenshot` (abierta). `preview_eval` para confirmar `#faq-jsonld` existe en `<head>`. Responsive 375. Consola limpia.
Expected: bento + FAQ animado funcionando; JSON-LD inyectado.

- [ ] **Step 5: Commit**

```bash
git add frontend/js/views/servicios.js frontend/js/components/faq.js frontend/css/marketing.css
git commit -m "feat(web): página de servicios (bento) + FAQ animado + SEO FAQPage JSON-LD"
```

---

## Task 6: Página Nosotros

**Files:**
- Modify: `frontend/js/views/nosotros.js`, `frontend/css/marketing.css`

**Interfaces:**
- Consumes: `auroraHTML()`, `revealOnScroll()`, `countUp()`, `icon()`.

- [ ] **Step 1: `nosotros.js`**

`renderNosotros()` monta: hero ("Sobre GastroDigest"); bloque historia/misión (texto demo + imagen/ilustración); "Por qué elegirnos" (4 tarjetas con icono: tecnología, especialistas, atención humana, resultados digitales); valores; mini-stats (reusar `countUp`). Secciones `data-reveal`. Tras montar `revealOnScroll()` + `countUp()`.

- [ ] **Step 2: Estilos en `marketing.css`** — bloques alternados imagen/texto (grid 2col → 1col), tarjetas de valores.

- [ ] **Step 3: Verificar en preview** — navegar a `/nosotros`, screenshots desktop/móvil, reveals al scroll, consola limpia.

- [ ] **Step 4: Commit**

```bash
git add frontend/js/views/nosotros.js frontend/css/marketing.css
git commit -m "feat(web): página Nosotros (historia, por qué elegirnos, valores)"
```

---

## Task 7: Página de Médicos (integración API)

**Files:**
- Modify: `frontend/js/views/medicos.js`, `frontend/css/marketing.css`

**Interfaces:**
- Consumes: `api.get('/api/medicos')`, `revealOnScroll()`, `icon()`.

- [ ] **Step 1: `medicos.js` con estados carga/éxito/error**

`renderMedicos()`: monta hero + grid con skeletons; hace `await api.get('/api/medicos')`; si `success`, renderiza tarjetas (iniciales/avatar, "Dr(a). nombres apellidos", especialidad, CMP, botón "Reservar con" → `/reservar`); si falla, muestra estado amable + CTA a `/reservar`. Tras render, `revealOnScroll()`.

```js
import { api } from '../api.js';
import { mount, icon, toast } from '../ui.js';
import { revealOnScroll } from '../motion.js';
import { auroraHTML } from '../components/aurora.js';
export async function renderMedicos() {
  mount(`<section class="hero hero--sm">${auroraHTML()}<div class="container">
    <span class="eyebrow">${icon('stethoscope',16)} Equipo</span>
    <h1>Nuestros especialistas</h1></div></section>
    <section class="section"><div class="container">
      <div class="doc-grid" id="medicos-grid">${'<div class="skeleton" style="height:180px"></div>'.repeat(3)}</div>
    </div></section>`);
  const grid = document.getElementById('medicos-grid');
  const res = await api.get('/api/medicos');
  if (res.success && Array.isArray(res.data) && res.data.length) {
    grid.innerHTML = res.data.map(medicoCard).join('');
  } else {
    grid.innerHTML = `<div class="state"><div class="state__icon state__icon--info">${icon('user',32)}</div>
      <h3>No pudimos cargar el equipo ahora</h3>
      <a class="btn btn--cta" href="/reservar" data-link>Reservar cita</a></div>`;
  }
  revealOnScroll();
}
function medicoCard(m) {
  const ini = (m.nombres?.[0]||'') + (m.apellidos?.[0]||'');
  return `<article class="medico-card" data-reveal>
    <div class="medico-card__avatar">${ini}</div>
    <h3>Dr(a). ${m.nombres} ${m.apellidos}</h3>
    <p class="medico-card__esp">${m.especialidad}</p>
    <p class="medico-card__cmp">CMP ${m.cmp}</p>
    <a class="btn btn--ghost btn--sm" href="/reservar" data-link>Reservar con</a>
  </article>`;
}
```

- [ ] **Step 2: Estilos `.doc-grid`/`.medico-card`** en `marketing.css` (avatar círculo con iniciales, hover elevar).

- [ ] **Step 3: Verificar en preview** — navegar a `/medicos`; confirmar 3+ tarjetas reales desde la API (backend prod) o skeleton→estado error si offline; responsive; consola limpia.

- [ ] **Step 4: Commit**

```bash
git add frontend/js/views/medicos.js frontend/css/marketing.css
git commit -m "feat(web): página de médicos con integración en vivo a /api/medicos"
```

---

## Task 8: Página de Contacto

**Files:**
- Modify: `frontend/js/views/contacto.js`, `frontend/css/marketing.css`

**Interfaces:**
- Consumes: `auroraHTML()`, `revealOnScroll()`, `icon()`.

- [ ] **Step 1: `contacto.js`**

`renderContacto()`: hero pequeño; grid 2col: (izq) datos de contacto (dirección demo, teléfono, correo, horario Lun–Sáb 8–18) con iconos + tarjeta de CTA "Reservar cita"; (der) mapa embebido de Google Maps (iframe de Huánuco) o ilustración si se prefiere sin terceros. Secciones `data-reveal`; `revealOnScroll()`.

- [ ] **Step 2: Estilos** del bloque de contacto en `marketing.css`.

- [ ] **Step 3: Verificar en preview** — navegar a `/contacto`; screenshots; responsive; consola limpia.

- [ ] **Step 4: Commit**

```bash
git add frontend/js/views/contacto.js frontend/css/marketing.css
git commit -m "feat(web): página de contacto (datos, horario, mapa, CTA)"
```

---

## Task 9: SEO, pase final de accesibilidad/responsive y deploy

**Files:**
- Modify: `frontend/index.html` (meta SEO/OG), CSS varios (ajustes responsive), cualquier vista que requiera fix.

- [ ] **Step 1: Meta tags SEO en `index.html`**

```html
<meta name="description" content="Clínica Gastroenterológica GastroDigest en Huánuco. Reserva tu cita en línea con especialistas en endoscopía y colonoscopía." />
<meta property="og:title" content="GastroDigest · Clínica Gastroenterológica" />
<meta property="og:description" content="Atención digestiva experta en Huánuco. Reserva en línea." />
<meta property="og:type" content="website" />
<meta name="robots" content="index,follow" />
```

- [ ] **Step 2: Pase de accesibilidad/responsive**

Recorrer cada página en 375/768/1024/1440 con `preview_resize` + `preview_screenshot`. Verificar: sin overflow horizontal, foco visible, `aria-*` en navbar/faq, contraste. Activar `prefers-reduced-motion` (`preview_eval` emulando) y confirmar que el contenido queda estático y legible.

- [ ] **Step 3: Verificación funcional integrada**

Confirmar que reserva (en `/reservar`) crea cita y abre el modal OTP, y que el portal (`/portal`) inicia sesión con DNI 12345678 / Paciente2026 y lista documentos — todo desde el sitio nuevo.

- [ ] **Step 4: Commit y deploy**

```bash
git add frontend/
git commit -m "feat(web): SEO meta/OG + pase final responsive y accesibilidad"
git push origin main
```
Verificar el deploy en Vercel y abrir la URL de producción; `preview`/curl de humo a `/` y `/servicios`.

- [ ] **Step 5: Verificación en producción**

Abrir `https://gastrodigestclinica.vercel.app` y recorrer las páginas; confirmar médicos en vivo y FAQ. Capturas finales para la presentación.

---

## Notas de ejecución

- Usar `ui-ux-pro-max` al construir cada página (Tasks 4–8) para elevar la calidad visual.
- Tras cada cambio de vista, re-ejecutar `revealOnScroll()` y `ScrollTrigger.refresh()` para que los reveals enganchen en contenido recién montado.
- Mantener `prefers-reduced-motion` funcionando en cada componente con animación.
