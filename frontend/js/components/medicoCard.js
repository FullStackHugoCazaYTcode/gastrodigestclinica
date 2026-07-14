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
  const titulo = esc(m.titulo || "Dr(a).");
  const nombre = `${esc(m.nombres)} ${esc(m.apellidos)}`;
  const cole = m.titulo === "Lic." ? "CEP" : "CMP";
  const foto = m.foto
    ? `<img src="${esc(m.foto)}" alt="${titulo} ${nombre}" loading="lazy" />`
    : `<span class="medico-card__ini" aria-hidden="true">${esc(ini)}</span>`;

  const esp = m.sub_especialidad ? `${esc(m.especialidad)} · ${esc(m.sub_especialidad)}` : esc(m.especialidad);
  const bio = m.bio && String(m.bio).trim() ? esc(m.bio) : bioFor(m.especialidad);
  const exp = m.anios_experiencia
    ? `<p class="medico-card__cmp">${icon("clock", 14)} ${esc(String(m.anios_experiencia))} años de experiencia</p>`
    : "";
  const formacion = m.formacion && String(m.formacion).trim()
    ? `<p class="medico-card__cmp">${icon("award", 14)} ${esc(m.formacion)}</p>`
    : "";

  const puedeReservar = Number(m.reservable ?? 1) === 1;
  const cta = puedeReservar
    ? `<a class="btn btn--ghost btn--sm" href="/portal" target="_blank" rel="noopener">Reservar <span class="visually-hidden">cita con ${titulo} ${nombre}</span>${icon("arrowRight", 16)}</a>`
    : `<p class="medico-card__nota">${icon("stethoscope", 14)} Atiende por derivación del equipo</p>`;

  return `<article class="medico-card" data-reveal>
    <div class="medico-card__photo">${foto}</div>
    <div class="medico-card__body">
      <h3>${titulo} ${nombre}</h3>
      <p class="medico-card__esp">${esp}</p>
      <p class="medico-card__cmp">${icon("award", 14)} ${cole} ${esc(m.cmp)}</p>
      ${exp}
      ${formacion}
      <p class="medico-card__bio">${bio}</p>
      ${cta}
    </div>
  </article>`;
}
