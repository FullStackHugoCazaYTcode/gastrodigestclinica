// =====================================================================
//  aurora.js — Fondo decorativo "aurora": manchas suaves que flotan.
//  Solo anima transform/opacity (compositor-friendly). Reutilizable.
// =====================================================================
export function auroraHTML() {
  return `<div class="aurora" aria-hidden="true">
    <span class="aurora__blob aurora__blob--1"></span>
    <span class="aurora__blob aurora__blob--2"></span>
    <span class="aurora__blob aurora__blob--3"></span>
  </div>`;
}
