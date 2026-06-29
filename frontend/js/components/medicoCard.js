// =====================================================================
//  medicoCard.js — Tarjeta de médico (compartida por inicio y /medicos).
//  Escapa los datos de la API (anti-XSS) y da contexto accesible al CTA.
// =====================================================================
import { icon, esc } from "../ui.js";

export function medicoCard(m) {
  const ini = ((m.nombres?.[0] || "") + (m.apellidos?.[0] || "")).toUpperCase();
  const nombre = `${esc(m.nombres)} ${esc(m.apellidos)}`;
  return `<article class="medico-card" data-reveal>
    <div class="medico-card__avatar">${esc(ini)}</div>
    <h3>Dr(a). ${nombre}</h3>
    <p class="medico-card__esp">${esc(m.especialidad)}</p>
    <p class="medico-card__cmp">CMP ${esc(m.cmp)}</p>
    <a class="btn btn--ghost btn--sm" href="/reservar" data-link>Reservar <span class="visually-hidden">cita con Dr(a). ${nombre}</span>${icon("arrowRight", 16)}</a>
  </article>`;
}
