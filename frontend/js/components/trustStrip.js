// =====================================================================
//  trustStrip.js — Franja de hechos verificables (no logos genéricos).
//  Señales de confianza reales y comprobables para el paciente.
// =====================================================================
import { icon } from "../ui.js";

const HECHOS = [
  ["award", "Médicos colegiados", "Todos con CMP vigente"],
  ["file", "Resultados en tu portal", "Disponibles 24/7"],
  ["message", "Confirmación por WhatsApp", "Al instante"],
  ["shieldCheck", "Datos protegidos", "Conforme a la Ley N.° 29733"],
];

export function trustStripHTML() {
  return `<section class="facts" data-reveal aria-label="Por qué confiar en GastroDigest">
    <div class="container facts__grid">
      ${HECHOS.map(([ic, t, d]) => `
        <div class="fact">
          <span class="fact__icon">${icon(ic, 22)}</span>
          <div class="fact__body"><strong>${t}</strong><small>${d}</small></div>
        </div>`).join("")}
    </div>
  </section>`;
}
