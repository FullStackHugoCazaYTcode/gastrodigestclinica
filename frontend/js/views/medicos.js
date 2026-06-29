// =====================================================================
//  views/medicos.js — Equipo médico (datos en vivo desde /api/medicos).
// =====================================================================
import { api } from "../api.js";
import { mountFull, icon } from "../ui.js";
import { revealOnScroll } from "../motion.js";
import { auroraHTML } from "../components/aurora.js";

export async function renderMedicos() {
  mountFull(`
    <section class="page-hero">
      ${auroraHTML()}
      <div class="container page-hero__inner">
        <span class="eyebrow eyebrow--center">${icon("users", 16)} Nuestro equipo</span>
        <h1>Especialistas que te atienden</h1>
        <p class="section__lead">Profesionales colegiados con amplia trayectoria en gastroenterología.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="doc-grid" id="medicos-grid">
          ${'<div class="skeleton" style="height:200px;border-radius:var(--radius)"></div>'.repeat(3)}
        </div>
      </div>
    </section>
  `);

  const grid = document.getElementById("medicos-grid");
  const res = await api.get("/api/medicos");
  if (res.success && Array.isArray(res.data) && res.data.length) {
    grid.innerHTML = res.data.map(medicoCard).join("");
  } else {
    grid.innerHTML = `<div class="state" style="grid-column:1/-1">
      <div class="state__icon state__icon--info">${icon("users", 28)}</div>
      <h3>No pudimos cargar el equipo ahora</h3>
      <p class="text-muted">Inténtalo de nuevo en unos minutos o agenda tu cita directamente.</p>
      <a class="btn btn--cta" href="/reservar" data-link>${icon("calendar")} Reservar cita</a>
    </div>`;
  }
  revealOnScroll();
}

function medicoCard(m) {
  const ini = ((m.nombres?.[0] || "") + (m.apellidos?.[0] || "")).toUpperCase();
  return `<article class="medico-card" data-reveal>
    <div class="medico-card__avatar">${ini}</div>
    <h3>Dr(a). ${m.nombres} ${m.apellidos}</h3>
    <p class="medico-card__esp">${m.especialidad}</p>
    <p class="medico-card__cmp">CMP ${m.cmp}</p>
    <a class="btn btn--ghost btn--sm" href="/reservar" data-link>Reservar ${icon("arrowRight", 16)}</a>
  </article>`;
}
