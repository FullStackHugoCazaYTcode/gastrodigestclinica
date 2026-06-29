// =====================================================================
//  trustStrip.js — Franja de instituciones de respaldo (escala de grises).
//  Placeholder tipográfico; reemplazable por logos reales.
// =====================================================================
const INSTITUCIONES = [
  "Sociedad Peruana de Gastroenterología",
  "Colegio Médico del Perú",
  "UNMSM",
  "UPCH",
  "EsSalud",
];

export function trustStripHTML() {
  return `<section class="trust" data-reveal>
    <div class="container">
      <p class="trust__label">Respaldo y formación de nuestro equipo</p>
      <div class="trust__logos">
        ${INSTITUCIONES.map((n) => `<span class="trust__logo">${n}</span>`).join("")}
      </div>
    </div>
  </section>`;
}
