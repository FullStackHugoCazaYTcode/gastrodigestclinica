// =====================================================================
//  footer.js — Pie de página persistente.
// =====================================================================
import { icon } from "../ui.js";
import { brandHTML } from "./logo.js";

const LINKS = [
  ["/", "Inicio"],
  ["/servicios", "Servicios"],
  ["/nosotros", "Nosotros"],
  ["/medicos", "Médicos"],
  ["/contacto", "Contacto"],
];

const RAZON_SOCIAL = "GastroDigest Clínica de Gastroenterología S.A.C.";
const RUC = "20601234567";

const REDES = [
  ["facebook", "Facebook", "https://facebook.com/gastrodigest"],
  ["instagram", "Instagram", "https://instagram.com/gastrodigest"],
  ["whatsapp", "WhatsApp", "https://wa.me/51962000000"],
];

export function renderFooter() {
  const f = document.getElementById("site-footer");
  f.className = "footer";
  f.innerHTML = `
    <div class="container footer__grid">
      <div class="footer__brand">
        <a class="brand" href="/" data-link aria-label="GastroDigest inicio">
          ${brandHTML({ size: 42, sub: "Clínica de Gastroenterología", variant: "light" })}
        </a>
        <p class="footer__tag">Cuidamos tu salud digestiva con tecnología, calidez y especialistas de confianza.</p>
        <div class="footer__social">
          ${REDES.map(([ic, label, href]) => `<a href="${href}" target="_blank" rel="noopener" aria-label="${label}">${icon(ic, 18)}</a>`).join("")}
        </div>
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
        <a class="btn btn--cta btn--block" href="/reservar" target="_blank" rel="noopener">${icon("calendar", 18)} Reservar cita</a>
        <a class="btn btn--ghost btn--block" href="/portal" target="_blank" rel="noopener">${icon("user", 18)} Portal del paciente</a>
        <a class="footer__book" href="/libro-reclamaciones" data-link>
          <span class="footer__book-ico">${icon("book", 20)}</span>
          <span><strong>Libro de Reclamaciones</strong><small>Defensa del consumidor</small></span>
        </a>
      </div>
    </div>
    <div class="footer__bottom">
      <div class="container">
        <span>© <span id="year"></span> ${RAZON_SOCIAL} · RUC ${RUC}</span>
        <span class="footer__bottom-links">
          <a href="/privacidad" data-link>${icon("shieldCheck", 14)} Política de Privacidad</a>
          <a href="/libro-reclamaciones" data-link>${icon("book", 14)} Reclamaciones</a>
          <a href="/medico" target="_blank" rel="noopener">Médicos</a>
          <a href="/admin" target="_blank" rel="noopener">Admin</a>
        </span>
      </div>
    </div>`;
  const y = f.querySelector("#year");
  if (y) y.textContent = String(new Date().getFullYear());
}
