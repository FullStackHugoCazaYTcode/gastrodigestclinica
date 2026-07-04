// =====================================================================
//  footer.js — Pie de página persistente.
// =====================================================================
import { icon } from "../ui.js";

const LINKS = [
  ["/", "Inicio"],
  ["/servicios", "Servicios"],
  ["/nosotros", "Nosotros"],
  ["/medicos", "Médicos"],
  ["/contacto", "Contacto"],
];

export function renderFooter() {
  const f = document.getElementById("site-footer");
  f.className = "footer";
  f.innerHTML = `
    <div class="container footer__grid">
      <div class="footer__brand">
        <a class="brand" href="/" data-link aria-label="GastroDigest inicio">
          <span class="brand__logo" aria-hidden="true">I.S.</span>
          <span class="brand__text">
            <span class="brand__name">GastroDigest</span>
            <span class="brand__sub">Clínica Gastroenterológica</span>
          </span>
        </a>
        <p class="footer__tag">Cuidamos tu salud digestiva con tecnología, calidez y especialistas de confianza.</p>
      </div>
      <nav class="footer__col" aria-label="Enlaces del sitio">
        <h3 class="footer__title">Navegación</h3>
        <ul>${LINKS.map(([h, t]) => `<li><a href="${h}" data-link>${t}</a></li>`).join("")}</ul>
      </nav>
      <div class="footer__col">
        <h3 class="footer__title">Contacto</h3>
        <ul class="footer__contact">
          <li>${icon("mapPin", 16)} Jr. Dos de Mayo 1234, Huánuco</li>
          <li>${icon("phone", 16)} +51 962 000 000</li>
          <li>${icon("mail", 16)} citas@gastrodigest.pe</li>
          <li>${icon("clock", 16)} Lun – Sáb · 8:00 a 18:00</li>
        </ul>
      </div>
      <div class="footer__col footer__cta">
        <h3 class="footer__title">¿Listo para tu cita?</h3>
        <a class="btn btn--cta btn--block" href="/reservar" data-link>${icon("calendar", 18)} Reservar cita</a>
        <a class="btn btn--ghost btn--block" href="/portal" target="_blank" rel="noopener">${icon("user", 18)} Portal del paciente</a>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container">
        <span>© <span id="year"></span> GastroDigest · Huánuco, Perú</span>
        <span class="footer__bottom-links">
          <a href="/medico" target="_blank" rel="noopener">${icon("stethoscope", 14)} Acceso médicos</a>
          <span>Ley N.° 29733 · Escuela Profesional de Ingeniería de Sistemas (I.S.)</span>
        </span>
      </div>
    </div>`;
  const y = f.querySelector("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}
