// =====================================================================
//  views/nosotros.js — Sobre la clínica: historia, misión, valores.
// =====================================================================
import { mountFull, icon } from "../ui.js";
import { auroraHTML } from "../components/aurora.js";
import { revealOnScroll, countUp } from "../motion.js";

const RAZONES = [
  ["sparkles", "Tecnología de punta", "Equipos modernos de endoscopía y diagnóstico para resultados precisos."],
  ["users", "Especialistas colegiados", "Un equipo con amplia trayectoria en gastroenterología."],
  ["heart", "Atención humana", "Te acompañamos con calidez en cada paso de tu tratamiento."],
  ["shieldCheck", "Resultados digitales seguros", "Tus informes en un portal protegido conforme a la Ley 29733."],
];

const STATS = [
  ["15", "+", "Años de experiencia"],
  ["8000", "+", "Pacientes atendidos"],
  ["4", "", "Especialistas"],
  ["98", "%", "Satisfacción"],
];

export function renderNosotros() {
  mountFull(`
    <section class="page-hero">
      ${auroraHTML()}
      <div class="container page-hero__inner">
        <span class="eyebrow eyebrow--center">${icon("heart", 16)} Quiénes somos</span>
        <h1>Sobre GastroDigest</h1>
        <p class="section__lead">Una clínica gastroenterológica que une experiencia médica con tecnología para cuidarte mejor.</p>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div class="split__content" data-reveal>
          <span class="eyebrow">${icon("stethoscope", 16)} Nuestra historia</span>
          <h2>Cuidado digestivo cercano y moderno</h2>
          <p class="text-muted">Nacimos en Huánuco con una misión clara: hacer que la atención gastroenterológica sea accesible, humana y sin fricciones. Por eso digitalizamos la reserva, la confirmación y la entrega de resultados, para que tú solo te concentres en tu salud.</p>
          <p class="text-muted">Hoy acompañamos a miles de pacientes con diagnósticos precisos, tratamientos efectivos y un seguimiento cercano.</p>
        </div>
        <div class="split__visual" data-reveal>
          <div class="mission-card">
            <h3>${icon("sparkles", 18)} Nuestra misión</h3>
            <p>Brindar atención digestiva de excelencia, combinando tecnología, calidez y resultados confiables.</p>
            <h3>${icon("activity", 18)} Nuestra visión</h3>
            <p>Ser la clínica gastroenterológica de referencia en la región, reconocida por su trato humano e innovación.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="container">
        <span class="eyebrow eyebrow--center">${icon("shieldCheck", 16)} Por qué elegirnos</span>
        <h2 class="section__title">Razones para confiar en nosotros</h2>
        <div class="features">
          ${RAZONES.map(([ic, t, d]) => `
            <article class="feature-card" data-reveal>
              <span class="feature-card__icon">${icon(ic, 24)}</span>
              <h3>${t}</h3>
              <p>${d}</p>
            </article>`).join("")}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container stats">
        ${STATS.map(([n, suf, label]) => `
          <div class="stat" data-reveal>
            <div class="stat__num"><span data-count="${n}">0</span>${suf}</div>
            <div class="stat__label">${label}</div>
          </div>`).join("")}
      </div>
    </section>

    <section class="cta-band" data-reveal>
      <div class="container cta-band__inner">
        <div>
          <h2>Conoce a nuestro equipo</h2>
          <p>Especialistas listos para cuidar tu salud digestiva.</p>
        </div>
        <a class="btn btn--cta btn--lg" href="/medicos" data-link>${icon("users")} Ver médicos</a>
      </div>
    </section>
  `);

  document.querySelectorAll("[data-count]").forEach((el) => countUp(el));
  revealOnScroll();
}
