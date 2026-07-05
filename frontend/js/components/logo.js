// =====================================================================
//  logo.js — Marca GastroDigest en SVG vectorial.
//  Emblema: anillo abierto + hoja (bienestar) + G (Fraunces) + trazo
//  "líquido" (guiño al estómago del logo oficial). Wordmark a dos tonos.
//  variant "light" para fondos oscuros (footer).
// =====================================================================

export function logoMark(size = 44, variant = "default") {
  const c = variant === "light"
    ? { ring: "#FFFFFF", leaf: "#7FC0B0", g: "#FFFFFF", liquid: "#7FC0B0" }
    : { ring: "#0E4B42", leaf: "#2E7D6C", g: "#0E4B42", liquid: "#2E7D6C" };
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <path d="M23.5 3.6 A20.4 20.4 0 1 1 5.9 13.8" stroke="${c.ring}" stroke-width="3" stroke-linecap="round"/>
    <path d="M12.6 4.9 C 8.6 6.3 6.6 9.3 6.8 13 C 10.9 12.4 13.1 9.6 12.6 4.9 Z" fill="${c.leaf}"/>
    <text x="24" y="32.5" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="600" font-size="27" fill="${c.g}">G</text>
    <path d="M16 36.5 Q 24 40.5 32 36.5" stroke="${c.liquid}" stroke-width="2.6" stroke-linecap="round"/>
  </svg>`;
}

/** Marca completa: emblema + GASTRO/DIGEST a dos tonos + subtítulo. */
export function brandHTML({ size = 44, sub = "Clínica de Gastroenterología", variant = "default" } = {}) {
  return `
    <span class="brand__mark" aria-hidden="true">${logoMark(size, variant)}</span>
    <span class="brand__text">
      <span class="brand__name">Gastro<span class="brand__name-alt">Digest</span></span>
      ${sub ? `<span class="brand__sub">${sub}</span>` : ""}
    </span>`;
}
