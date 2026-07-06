// =====================================================================
//  medicoCard.js — Tarjeta de médico (compartida por inicio y /medicos).
//  Área de foto lista para imágenes reales (m.foto); si no hay, muestra
//  las iniciales. Escapa datos de la API (anti-XSS) y da bio por especialidad.
// =====================================================================
import { icon, esc } from "../ui.js";

function bioFor(especialidad) {
  const e = (especialidad || "").toLowerCase();
  if (e.includes("endoscop")) return "Especialista en endoscopía digestiva, con diagnósticos precisos y trato cercano.";
  if (e.includes("hepat")) return "Dedicado al cuidado integral del hígado y el sistema digestivo.";
  return "Especialista en gastroenterología con amplia trayectoria y atención centrada en el paciente.";
}

export function medicoCard(m) {
  const ini = ((m.nombres?.[0] || "") + (m.apellidos?.[0] || "")).toUpperCase();
  const nombre = `${esc(m.nombres)} ${esc(m.apellidos)}`;
  const foto = m.foto
    ? `<img src="${esc(m.foto)}" alt="Dr(a). ${nombre}" loading="lazy" />`
    : `<span class="medico-card__ini" aria-hidden="true">${esc(ini)}</span>`;

  return `<article class="medico-card" data-reveal>
    <div class="medico-card__photo">${foto}</div>
    <div class="medico-card__body">
      <h3>Dr(a). ${nombre}</h3>
      <p class="medico-card__esp">${esc(m.especialidad)}</p>
      <p class="medico-card__cmp">${icon("award", 14)} CMP ${esc(m.cmp)}</p>
      <p class="medico-card__bio">${bioFor(m.especialidad)}</p>
      <a class="btn btn--ghost btn--sm" href="/reservar" target="_blank" rel="noopener">Reservar <span class="visually-hidden">cita con Dr(a). ${nombre}</span>${icon("arrowRight", 16)}</a>
    </div>
  </article>`;
}
