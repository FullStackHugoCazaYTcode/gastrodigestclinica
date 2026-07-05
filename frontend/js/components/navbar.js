// =====================================================================
//  navbar.js — Cabecera del sitio.
//  #site-topbar: barra utilitaria (contacto/horario) que se desplaza.
//  #site-nav: navbar fija con menú desplegable de Especialidades
//  (patrón Clínica Internacional), teléfono, portal y CTA pill.
// =====================================================================
import { icon } from "../ui.js";
import { brandHTML } from "./logo.js";

const ESPECIALIDADES = [
  ["stethoscope", "Consulta gastroenterológica", "Evaluación integral de tu salud digestiva."],
  ["activity", "Endoscopía digestiva alta", "Diagnóstico de esófago y estómago, con sedación."],
  ["search", "Colonoscopía", "Prevención y detección temprana del colon."],
  ["droplet", "Pruebas de laboratorio", "Resultados confiables en tu portal."],
];

export function renderNavbar() {
  renderTopbar();

  const nav = document.getElementById("site-nav");
  nav.className = "navbar";
  nav.innerHTML = `
    <div class="container navbar__inner">
      <a class="brand" href="/" data-link aria-label="GastroDigest inicio">
        ${brandHTML({ size: 42 })}
      </a>

      <button class="navbar__toggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="navbar-menu">${icon("menu", 24)}</button>

      <nav class="navbar__menu" id="navbar-menu" aria-label="Navegación principal">
        <ul class="nav-links">
          <li class="nav-dd">
            <button class="nav-dd__btn" id="dd-esp-btn" aria-expanded="false" aria-controls="dd-esp">
              Especialidades ${icon("chevronDown", 16)}
            </button>
            <div class="nav-dd__panel" id="dd-esp" hidden>
              <div class="nav-dd__grid">
                ${ESPECIALIDADES.map(([ic, t, d]) => `
                  <a class="nav-dd__item" href="/servicios" data-link>
                    <span class="nav-dd__icon">${icon(ic, 20)}</span>
                    <span><strong>${t}</strong><small>${d}</small></span>
                  </a>`).join("")}
              </div>
              <div class="nav-dd__aside">
                <span class="nav-dd__aside-title">Accesos</span>
                <a href="/medicos" data-link>${icon("users", 16)} Staff médico</a>
                <a href="/portal" target="_blank" rel="noopener">${icon("user", 16)} Portal del paciente</a>
                <a href="/contacto" data-link>${icon("mapPin", 16)} Cómo llegar</a>
              </div>
            </div>
          </li>
          <li><a href="/servicios" data-link>Servicios</a></li>
          <li><a href="/nosotros" data-link>Nosotros</a></li>
          <li><a href="/medicos" data-link>Médicos</a></li>
          <li><a href="/contacto" data-link>Contacto</a></li>
        </ul>

        <div class="navbar__cta">
          <a class="navbar__phone" href="tel:+51962000000">${icon("phone", 16)} <span>962 000 000</span></a>
          <a class="navbar__portal" href="/portal" target="_blank" rel="noopener" aria-label="Portal del paciente" title="Portal del paciente">${icon("user", 19)}</a>
          <a class="btn btn--cta btn--pill" href="/reservar" data-link>${icon("calendar", 18)} Agendar cita</a>
        </div>
      </nav>
    </div>`;

  // ---- Menú móvil ----
  const toggle = nav.querySelector(".navbar__toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // ---- Desplegable de Especialidades ----
  const ddBtn = nav.querySelector("#dd-esp-btn");
  const ddPanel = nav.querySelector("#dd-esp");
  const setDd = (open) => {
    ddPanel.hidden = !open;
    ddBtn.setAttribute("aria-expanded", String(open));
    ddBtn.classList.toggle("is-open", open);
  };
  ddBtn.addEventListener("click", (e) => { e.stopPropagation(); setDd(ddPanel.hidden); });
  document.addEventListener("click", (e) => {
    if (!ddPanel.hidden && !e.target.closest(".nav-dd")) setDd(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !ddPanel.hidden) { setDd(false); ddBtn.focus(); }
  });

  // Cierra todo al navegar (móvil + desplegable).
  nav.querySelector(".navbar__menu").addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      setDd(false);
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
