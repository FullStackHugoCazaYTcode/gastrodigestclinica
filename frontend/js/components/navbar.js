// =====================================================================
//  navbar.js — Barra de navegación persistente.
//  Transparente sobre el hero → sólida al hacer scroll. Menú móvil.
// =====================================================================
import { icon } from "../ui.js";

const LINKS = [
  ["/", "Inicio"],
  ["/servicios", "Servicios"],
  ["/nosotros", "Nosotros"],
  ["/medicos", "Médicos"],
  ["/contacto", "Contacto"],
];

export function renderNavbar() {
  const nav = document.getElementById("site-nav");
  nav.className = "navbar";
  nav.innerHTML = `
    <div class="container navbar__inner">
      <a class="brand" href="/" data-link aria-label="GastroDigest inicio">
        <span class="brand__logo" aria-hidden="true">I.S.</span>
        <span class="brand__text">
          <span class="brand__name">GastroDigest</span>
          <span class="brand__sub">Clínica Gastroenterológica</span>
        </span>
      </a>
      <button class="navbar__toggle" aria-label="Abrir menú" aria-expanded="false">${icon("menu", 24)}</button>
      <nav class="navbar__menu" aria-label="Navegación principal">
        <ul class="nav-links">
          ${LINKS.map(([h, t]) => `<li><a href="${h}" data-link>${t}</a></li>`).join("")}
        </ul>
        <div class="navbar__cta">
          <a class="btn btn--ghost btn--sm" href="/portal" data-link>${icon("user", 18)} Portal</a>
          <a class="btn btn--cta btn--sm" href="/reservar" data-link>${icon("calendar", 18)} Reservar cita</a>
        </div>
      </nav>
    </div>`;

  const toggle = nav.querySelector(".navbar__toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelector(".navbar__menu").addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
