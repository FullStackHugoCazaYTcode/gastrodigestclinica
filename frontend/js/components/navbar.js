// =====================================================================
//  navbar.js — Cabecera del sitio.
//  #site-topbar: barra utilitaria (contacto/horario) que se desplaza.
//  #site-nav: navbar fija (transparente sobre el hero → sólida al scroll).
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
  renderTopbar();

  const nav = document.getElementById("site-nav");
  nav.className = "navbar";
  nav.innerHTML = `
    <div class="container navbar__inner">
      <a class="brand" href="/" data-link aria-label="GastroDigest inicio">
        <span class="brand__logo" aria-hidden="true">G</span>
        <span class="brand__text">
          <span class="brand__name">GastroDigest</span>
          <span class="brand__sub">Clínica Gastroenterológica</span>
        </span>
      </a>
      <button class="navbar__toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navbar-menu">${icon("menu", 24)}</button>
      <nav class="navbar__menu" id="navbar-menu" aria-label="Navegación principal">
        <ul class="nav-links">
          ${LINKS.map(([h, t]) => `<li><a href="${h}" data-link>${t}</a></li>`).join("")}
        </ul>
        <div class="navbar__cta">
          <a class="btn btn--ghost btn--sm" href="/portal" target="_blank" rel="noopener">${icon("user", 18)} Portal</a>
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

function renderTopbar() {
  const bar = document.getElementById("site-topbar");
  if (!bar) return;
  bar.className = "topbar";
  bar.innerHTML = `
    <div class="container topbar__inner">
      <div class="topbar__info">
        <span>${icon("mapPin", 14)} Jr. Dos de Mayo 1234, Huánuco</span>
        <span>${icon("clock", 14)} Lun – Sáb · 8:00 a. m. – 6:00 p. m.</span>
      </div>
      <div class="topbar__links">
        <a href="tel:+51962000000">${icon("phone", 14)} +51 962 000 000</a>
        <a href="/portal" target="_blank" rel="noopener">${icon("user", 14)} Portal del paciente</a>
      </div>
    </div>`;
}
