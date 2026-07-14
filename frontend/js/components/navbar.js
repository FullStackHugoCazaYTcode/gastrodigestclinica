// =====================================================================
//  navbar.js — Cabecera del sitio.
//  #site-topbar: barra utilitaria (contacto/horario) que se desplaza.
//  #site-nav: navbar fija con mega-menú en cada sección (patrón Clínica
//  Internacional), teléfono, portal y CTA pill "Agendar cita".
// =====================================================================
import { icon } from "../ui.js";
import { brandHTML } from "./logo.js";

// Cada entrada: { label, href, panel: { items:[[icon,titulo,desc,href,blank]],
// aside:{ title, links:[[icon,label,href,blank]] } } }
const NAV = [
  {
    label: "Especialidades",
    href: "/servicios",
    ver: "Ver especialidades",
    panel: {
      items: [
        ["stethoscope", "Consulta gastroenterológica", "Evaluación integral de tu salud digestiva.", "/servicios"],
        ["activity", "Endoscopía digestiva alta", "Diagnóstico de esófago y estómago, con sedación.", "/servicios"],
        ["search", "Colonoscopía", "Prevención y detección temprana del colon.", "/servicios"],
        ["droplet", "Pruebas de laboratorio", "Resultados confiables, disponibles en tu portal.", "/servicios"],
      ],
      aside: {
        title: "Accesos rápidos",
        links: [
          ["users", "Staff médico", "/medicos", false],
          ["user", "Portal del paciente", "/portal", true],
          ["mapPin", "Cómo llegar", "/contacto", false],
        ],
      },
    },
  },
  {
    label: "Servicios",
    href: "/servicios",
    ver: "Ver todos los servicios",
    panel: {
      items: [
        ["calendarCheck", "Reserva en línea", "Agenda tu cita en minutos, sin llamadas ni filas.", "/portal", true],
        ["message", "Confirmación por WhatsApp", "Recibe la confirmación de tu cita al instante.", "/contacto"],
        ["file", "Resultados en tu portal", "Recetas e informes clínicos disponibles 24/7.", "/portal", true],
        ["shieldCheck", "Preparación de exámenes", "Guía paso a paso para tu endoscopía o colonoscopía.", "/servicios"],
      ],
      aside: {
        title: "También ofrecemos",
        links: [
          ["heart", "Chequeos preventivos", "/servicios", false],
          ["clock", "Horarios de atención", "/contacto", false],
          ["calendar", "Agendar una cita", "/portal", true],
        ],
      },
    },
  },
  {
    label: "Nosotros",
    href: "/nosotros",
    ver: "Conócenos",
    panel: {
      items: [
        ["heart", "Quiénes somos", "Una clínica dedicada a la salud digestiva en Huánuco.", "/nosotros"],
        ["sparkles", "Misión y visión", "Diagnóstico claro, tecnología y trato humano.", "/nosotros"],
        ["mapPin", "Nuestra sede", "Pasaje 14 de Agosto 150, en el corazón de Huánuco.", "/contacto"],
        ["award", "Certificaciones", "Médicos colegiados (CMP) y equipos modernos.", "/medicos"],
      ],
      aside: {
        title: "Confianza",
        links: [
          ["users", "Conoce al equipo", "/medicos", false],
          ["star", "Testimonios", "/nosotros", false],
          ["shieldCheck", "Datos protegidos · Ley 29733", "/nosotros", false],
        ],
      },
    },
  },
  {
    label: "Médicos",
    href: "/medicos",
    ver: "Ver todo el equipo",
    panel: {
      items: [
        ["users", "Conoce al equipo", "Especialistas colegiados con amplia trayectoria.", "/medicos"],
        ["stethoscope", "Agenda por médico", "Elige a tu especialista de confianza.", "/portal", true],
        ["search", "Agenda por especialidad", "Encuentra al médico según tu necesidad.", "/portal", true],
        ["award", "Colegiatura CMP", "Todos nuestros médicos están debidamente colegiados.", "/medicos"],
      ],
      aside: {
        title: "Reserva",
        links: [
          ["calendar", "Agendar una cita", "/portal", true],
          ["user", "Portal del paciente", "/portal", true],
        ],
      },
    },
  },
  {
    label: "Contacto",
    href: "/contacto",
    ver: "Ir a contacto",
    panel: {
      items: [
        ["mapPin", "Ubicación", "Pasaje 14 de Agosto 150, Huánuco.", "/contacto"],
        ["phone", "Teléfono / WhatsApp", "+51 974 492 948", "tel:+51974492948"],
        ["clock", "Horarios", "Lun – Sáb · 8:00 a. m. – 6:00 p. m.", "/contacto"],
        ["mail", "Correo", "hr177153@gmail.com", "mailto:hr177153@gmail.com"],
      ],
      aside: {
        title: "Ayuda",
        links: [
          ["mapPin", "Cómo llegar", "/contacto", false],
          ["message", "Libro de reclamaciones", "/contacto", false],
        ],
      },
    },
  },
];

// href SPA (/) → data-link · blank → nueva pestaña · tel:/mailto: → normal
function linkAttrs(href, blank) {
  if (blank) return `href="${href}" target="_blank" rel="noopener"`;
  if (href.startsWith("/")) return `href="${href}" data-link`;
  return `href="${href}"`;
}

function panelHTML(entry) {
  const { items, aside } = entry.panel;
  const itemsHTML = items.map(([ic, t, d, href, blank]) => `
    <a class="nav-dd__item" ${linkAttrs(href, blank)}>
      <span class="nav-dd__icon">${icon(ic, 20)}</span>
      <span><strong>${t}</strong><small>${d}</small></span>
    </a>`).join("");
  const asideHTML = aside ? `
    <div class="nav-dd__aside">
      <span class="nav-dd__aside-title">${aside.title}</span>
      ${aside.links.map(([ic, label, href, blank]) => `
        <a ${linkAttrs(href, blank)}>${icon(ic, 16)} ${label}</a>`).join("")}
    </div>` : "";
  return `
    <div class="nav-dd__panel" hidden>
      <div class="nav-dd__head">
        <a ${linkAttrs(entry.href, false)}>${entry.ver} ${icon("arrowRight", 15)}</a>
      </div>
      <div class="nav-dd__grid">${itemsHTML}</div>
      ${asideHTML}
    </div>`;
}

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
          ${NAV.map((entry, i) => `
            <li class="nav-dd">
              <button class="nav-dd__btn" aria-expanded="false" aria-controls="dd-${i}">
                ${entry.label} ${icon("chevronDown", 16)}
              </button>
              ${panelHTML(entry).replace('class="nav-dd__panel"', `class="nav-dd__panel" id="dd-${i}"`)}
            </li>`).join("")}
        </ul>

        <div class="navbar__cta">
          <a class="navbar__phone" href="tel:+51974492948">${icon("phone", 16)} <span>974 492 948</span></a>
          <a class="navbar__portal" href="/portal" target="_blank" rel="noopener" aria-label="Portal del paciente" title="Portal del paciente">${icon("user", 19)}</a>
          <a class="btn btn--cta btn--pill" href="/portal" target="_blank" rel="noopener">${icon("calendar", 18)} Agendar cita</a>
        </div>
      </nav>
    </div>`;

  wireNavbar(nav);
}

function wireNavbar(nav) {
  const toggle = nav.querySelector(".navbar__toggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // ---- Mega-menús (uno abierto a la vez) ----
  const dds = [...nav.querySelectorAll(".nav-dd")];
  const isDesktop = () => window.innerWidth > 1120;

  const setOpen = (dd, open) => {
    const btn = dd.querySelector(".nav-dd__btn");
    const panel = dd.querySelector(".nav-dd__panel");
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    btn.classList.toggle("is-open", open);
    if (open && isDesktop()) positionPanel(dd, panel);
    else panel.style.left = "";
  };
  const closeAll = (except) => dds.forEach((dd) => { if (dd !== except) setOpen(dd, false); });

  dds.forEach((dd) => {
    const btn = dd.querySelector(".nav-dd__btn");
    const panel = dd.querySelector(".nav-dd__panel");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = panel.hidden;
      closeAll(dd);
      setOpen(dd, willOpen);
    });
  });

  document.addEventListener("click", (e) => { if (!e.target.closest(".nav-dd")) closeAll(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const open = dds.find((dd) => !dd.querySelector(".nav-dd__panel").hidden);
      if (open) { setOpen(open, false); open.querySelector(".nav-dd__btn").focus(); }
    }
  });

  // Cierra todo (menú móvil + mega-menús) al navegar.
  nav.querySelector(".navbar__menu").addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      closeAll();
    }
  });

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Alinea el panel bajo su botón y lo empuja a la izquierda si se sale del viewport.
function positionPanel(dd, panel) {
  panel.style.left = "0";
  const rect = panel.getBoundingClientRect();
  const overflow = rect.right - (window.innerWidth - 16);
  if (overflow > 0) panel.style.left = `${-Math.ceil(overflow)}px`;
}

function renderTopbar() {
  const bar = document.getElementById("site-topbar");
  if (!bar) return;
  bar.className = "topbar";
  bar.innerHTML = `
    <div class="container topbar__inner">
      <div class="topbar__info">
        <span>${icon("mapPin", 14)} Pasaje 14 de Agosto 150, Huánuco</span>
        <span>${icon("clock", 14)} Lun – Sáb · 8:00 a. m. – 6:00 p. m.</span>
      </div>
      <div class="topbar__links">
        <a href="tel:+51974492948">${icon("phone", 14)} +51 974 492 948</a>
        <a href="/portal" target="_blank" rel="noopener">${icon("user", 14)} Portal del paciente</a>
      </div>
    </div>`;
}
