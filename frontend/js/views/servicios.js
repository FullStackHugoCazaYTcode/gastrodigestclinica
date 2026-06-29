// =====================================================================
//  views/servicios.js — Servicios (bento) + FAQ animado + SEO JSON-LD.
// =====================================================================
import { mountFull, icon } from "../ui.js";
import { auroraHTML } from "../components/aurora.js";
import { revealOnScroll } from "../motion.js";
import { faqHTML, wireFaq, injectFaqJsonLd } from "../components/faq.js";

const SERVICIOS = [
  ["stethoscope", "Consulta gastroenterológica", "Evaluación integral de tu salud digestiva: diagnóstico, tratamiento y plan de seguimiento personalizado."],
  ["activity", "Endoscopía digestiva alta", "Estudio del esófago, estómago y duodeno con sedación, para diagnósticos precisos y oportunos."],
  ["search", "Colonoscopía", "Exploración del colon para detección temprana de pólipos y prevención del cáncer colorrectal."],
  ["droplet", "Pruebas de laboratorio", "Análisis clínicos confiables con resultados disponibles en tu portal del paciente."],
  ["refresh", "Control y seguimiento", "Acompañamiento continuo de enfermedades digestivas crónicas, con citas y recordatorios."],
  ["shieldCheck", "Test de Helicobacter pylori", "Detección de la bacteria asociada a gastritis y úlceras, con tratamiento dirigido."],
];

export function renderServicios() {
  mountFull(`
    <section class="page-hero">
      ${auroraHTML()}
      <div class="container page-hero__inner">
        <span class="eyebrow eyebrow--center">${icon("sparkles", 16)} Especialidades</span>
        <h1>Servicios de gastroenterología</h1>
        <p class="section__lead">Diagnóstico y tratamiento integral con tecnología y especialistas de confianza.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="features features--3">
          ${SERVICIOS.map(([ic, t, d]) => `
            <article class="feature-card" data-reveal>
              <span class="feature-card__icon">${icon(ic, 24)}</span>
              <h3>${t}</h3>
              <p>${d}</p>
            </article>`).join("")}
        </div>
        <div class="section__action">
          <a class="btn btn--cta btn--lg" href="/reservar" data-link>${icon("calendar")} Reservar una cita</a>
        </div>
      </div>
    </section>

    ${faqHTML()}
  `);

  wireFaq();
  injectFaqJsonLd();
  revealOnScroll();
}
