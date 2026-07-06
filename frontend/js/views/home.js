// =====================================================================
//  views/home.js — Página de inicio (landing) de GastroDigest.
// =====================================================================
import { mountFull, icon } from "../ui.js";
import { auroraHTML } from "../components/aurora.js";
import { trustStripHTML } from "../components/trustStrip.js";
import { revealOnScroll, countUp, motionReady } from "../motion.js";
import { medicoCard } from "../components/medicoCard.js";
import { api } from "../api.js";

const SERVICIOS = [
  ["stethoscope", "Consulta gastroenterológica", "Evaluación integral de tu salud digestiva con especialistas."],
  ["activity", "Endoscopía digestiva alta", "Diagnóstico preciso de esófago y estómago, con sedación."],
  ["search", "Colonoscopía", "Detección temprana y prevención de enfermedades del colon."],
  ["droplet", "Pruebas de laboratorio", "Resultados confiables, disponibles en tu portal."],
];

const STATS = [
  ["15", "+", "Años de experiencia"],
  ["8000", "+", "Pacientes atendidos"],
  ["4", "", "Especialistas"],
  ["98", "%", "Satisfacción"],
];

const TESTIMONIOS = [
  ["Carla Mendoza", "Colonoscopía preventiva · marzo 2026", "Reservé en minutos y me llegó el código al instante. La atención fue excelente.", 5],
  ["Jorge Palacios", "Consulta + endoscopía · febrero 2026", "Por fin una clínica con todo en línea: mis resultados estaban en el portal el mismo día.", 5],
  ["Lucía Rojas", "Endoscopía digestiva alta · enero 2026", "El proceso fue muy claro y profesional. Me sentí en buenas manos.", 5],
];

export function renderHome() {
  mountFull(`
    <!-- HERO con acciones rápidas -->
    <section class="home-hero">
      ${auroraHTML()}
      <div class="container home-hero__centered">
        <span class="eyebrow eyebrow--center">${icon("stethoscope", 16)} Gastroenterología en Huánuco</span>
        <h1 class="home-hero__title">Diagnóstico digestivo claro, en manos expertas</h1>
        <p class="home-hero__lead">Endoscopía, colonoscopía y consulta especializada. Reserva en línea, confirma por WhatsApp y consulta tus resultados en tu portal seguro.</p>
        <p class="quick__greet">Hola, ¿qué necesitas hacer hoy?</p>
        <div class="quick-actions">
          <a class="quick-card" href="/reservar" target="_blank" rel="noopener">
            <span class="quick-card__icon">${icon("calendarCheck", 24)}</span>
            <span class="quick-card__title">Agendar una cita</span>
          </a>
          <a class="quick-card" href="/portal" target="_blank" rel="noopener">
            <span class="quick-card__icon">${icon("file", 24)}</span>
            <span class="quick-card__title">Ver mis resultados</span>
          </a>
          <a class="quick-card" href="/medicos" data-link>
            <span class="quick-card__icon">${icon("users", 24)}</span>
            <span class="quick-card__title">Buscar un médico</span>
          </a>
          <a class="quick-card" href="/servicios" data-link>
            <span class="quick-card__icon">${icon("stethoscope", 24)}</span>
            <span class="quick-card__title">Conocer especialidades</span>
          </a>
          <a class="quick-card" href="/contacto" data-link>
            <span class="quick-card__icon">${icon("mapPin", 24)}</span>
            <span class="quick-card__title">Cómo llegar</span>
          </a>
        </div>
      </div>
    </section>

    ${trustStripHTML()}

    <!-- STATS -->
    <section class="section stats-section" aria-label="Cifras de la clínica">
      <div class="container stats">
        ${STATS.map(([n, suf, label]) => `
          <div class="stat" data-reveal>
            <div class="stat__num"><span data-count="${n}">0</span>${suf}</div>
            <div class="stat__label">${label}</div>
          </div>`).join("")}
      </div>
    </section>

    <!-- SERVICIOS (bento) -->
    <section class="section">
      <div class="container">
        <div class="section-head" data-reveal>
          <div>
            <span class="eyebrow">${icon("sparkles", 16)} Lo que ofrecemos</span>
            <h2 class="section-head__title">Servicios especializados</h2>
          </div>
          <p class="section-head__lead">Tecnología y experiencia para el cuidado completo de tu sistema digestivo, en un solo lugar.</p>
        </div>
        <div class="bento">
          <article class="bento__hero" data-reveal>
            <span class="bento__hero-icon">${icon("activity", 30)}</span>
            <h3>Endoscopía digestiva alta</h3>
            <p>Diagnóstico preciso de esófago, estómago y duodeno, con sedación y equipos de alta definición. Resultados el mismo día en tu portal.</p>
            <a class="btn btn--pill bento__hero-cta" href="/reservar" target="_blank" rel="noopener">${icon("calendar", 18)} Agendar</a>
          </article>
          ${SERVICIOS.filter(([, t]) => !t.includes("Endoscopía")).map(([ic, t, d]) => `
            <article class="feature-card" data-reveal>
              <span class="feature-card__icon">${icon(ic, 24)}</span>
              <h3>${t}</h3>
              <p>${d}</p>
            </article>`).join("")}
        </div>
        <div class="section__action">
          <a class="btn btn--ghost" href="/servicios" data-link>Ver todos los servicios ${icon("arrowRight", 18)}</a>
        </div>
      </div>
    </section>

    <!-- MEDICOS -->
    <section class="section section--alt">
      <div class="container">
        <span class="eyebrow eyebrow--center">${icon("users", 16)} Nuestro equipo</span>
        <h2 class="section__title">Especialistas que te atienden</h2>
        <p class="section__lead">Profesionales colegiados con amplia trayectoria en gastroenterología.</p>
        <div class="doc-grid" id="home-medicos">
          ${'<div class="skeleton" style="height:190px;border-radius:var(--radius)"></div>'.repeat(3)}
        </div>
        <div class="section__action">
          <a class="btn btn--ghost" href="/medicos" data-link>Conoce al equipo ${icon("arrowRight", 18)}</a>
        </div>
      </div>
    </section>

    <!-- TESTIMONIOS -->
    <section class="section">
      <div class="container">
        <span class="eyebrow eyebrow--center">${icon("heart", 16)} Pacientes felices</span>
        <h2 class="section__title">Lo que dicen de nosotros</h2>
        <div class="testimonials">
          ${TESTIMONIOS.map(([name, contexto, text, stars]) => `
            <figure class="testimonial" data-reveal>
              <div class="testimonial__stars" aria-label="${stars} de 5 estrellas">${icon("star", 16).repeat(stars)}</div>
              <blockquote>"${text}"</blockquote>
              <figcaption><strong>${name}</strong><span>${contexto}</span></figcaption>
            </figure>`).join("")}
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="cta-band" data-reveal>
      <div class="container cta-band__inner">
        <div>
          <h2>¿Listo para cuidar tu salud digestiva?</h2>
          <p>Agenda tu cita hoy y recibe la confirmación al instante.</p>
        </div>
        <a class="btn btn--cta btn--lg" href="/reservar" target="_blank" rel="noopener">${icon("calendar")} Reservar mi cita</a>
      </div>
    </section>
  `);

  // Post-montaje: animaciones (tras cargar GSAP) + datos en vivo.
  motionReady.then(() => {
    document.querySelectorAll("[data-count]").forEach((el) => countUp(el));
    revealOnScroll();
  });
  cargarMedicos();
}

async function cargarMedicos() {
  const grid = document.getElementById("home-medicos");
  if (!grid) return;
  const res = await api.get("/api/medicos");
  if (res.success && Array.isArray(res.data) && res.data.length) {
    grid.innerHTML = res.data.slice(0, 3).map(medicoCard).join("");
    motionReady.then(() => revealOnScroll(grid));
  } else {
    grid.innerHTML = `<div class="state" style="grid-column:1/-1">
      <div class="state__icon state__icon--info">${icon("users", 28)}</div>
      <p class="text-muted">Nuestro equipo te espera. Agenda tu cita y elige especialista.</p>
      <a class="btn btn--cta" href="/reservar" target="_blank" rel="noopener">${icon("calendar")} Reservar cita</a>
    </div>`;
  }
}
