// =====================================================================
//  chatbot.js — Asistente flotante guiado por botones.
//  Responde dudas frecuentes y, si no resuelve, deriva a WhatsApp.
//  Solo visible en el sitio de marketing (se oculta en portal-mode).
// =====================================================================
import { icon, esc } from "../ui.js";

// ⚠️ CAMBIAR por el número real de WhatsApp (formato internacional sin +).
const WHATSAPP = "51962000000";
const WA_MSG = "Hola, tengo una consulta sobre GastroDigest.";

// href SPA (/) → data-link · blank → nueva pestaña
function linkAttrs(href, blank) {
  return blank ? `href="${href}" target="_blank" rel="noopener"` : `href="${href}" data-link`;
}

// FAQ: cada tema tiene respuesta + acciones opcionales [label, href, nuevaPestaña]
const FAQ = {
  reservar: {
    q: "¿Cómo reservo una cita?",
    a: "Muy fácil: pulsa <strong>Agendar cita</strong>, elige presencial o virtual, tu médico o especialidad, y el horario. Validamos con un código y ¡listo!",
    actions: [["Agendar cita", "/portal", true]],
  },
  resultados: {
    q: "¿Dónde veo mis resultados?",
    a: "En tu <strong>Portal del Paciente</strong>: recetas, informes y resultados de laboratorio, disponibles 24/7.",
    actions: [["Ir al portal", "/portal", true]],
  },
  especialidades: {
    q: "¿Qué especialidades atienden?",
    a: "Somos especialistas en gastroenterología: consulta, <strong>endoscopía digestiva alta</strong>, <strong>colonoscopía</strong> y pruebas de laboratorio.",
    actions: [["Ver servicios", "/servicios", false]],
  },
  horarios: {
    q: "Horarios y ubicación",
    a: "Estamos en <strong>Jr. Dos de Mayo 1234, Huánuco</strong>. Atendemos de <strong>Lunes a Sábado, 8:00 a. m. – 6:00 p. m.</strong>",
    actions: [["Cómo llegar", "/contacto", false]],
  },
  cuenta: {
    q: "¿Necesito una cuenta para reservar?",
    a: "Sí. Crear tu cuenta toma menos de 2 minutos y te permite llevar el control de tus citas y resultados.",
    actions: [["Crear una cuenta", "/registro", true]],
  },
};

const MENU = [
  ["reservar", "¿Cómo reservo una cita?"],
  ["resultados", "¿Dónde veo mis resultados?"],
  ["especialidades", "¿Qué especialidades atienden?"],
  ["horarios", "Horarios y ubicación"],
  ["cuenta", "¿Necesito una cuenta?"],
  ["whatsapp", "💬 Hablar por WhatsApp"],
];

let iniciado = false;

export function renderChatbot() {
  if (document.getElementById("chat-root")) return;
  const root = document.createElement("div");
  root.id = "chat-root";
  root.innerHTML = `
    <button class="chat-fab" id="chat-fab" aria-label="Abrir asistente virtual" aria-expanded="false">
      ${icon("message", 26)}
    </button>
    <section class="chat-panel" id="chat-panel" role="dialog" aria-label="Asistente virtual" hidden>
      <header class="chat-head">
        <span class="chat-head__avatar">${icon("stethoscope", 20)}</span>
        <div class="chat-head__title">
          <strong>Asistente GastroDigest</strong>
          <small>En línea · te ayuda al instante</small>
        </div>
        <button class="chat-head__close" id="chat-close" aria-label="Cerrar">${icon("x", 20)}</button>
      </header>
      <div class="chat-body" id="chat-body"></div>
      <footer class="chat-foot">
        <a class="chat-wa" href="${waLink()}" target="_blank" rel="noopener">${icon("whatsapp", 18)} Escríbenos por WhatsApp</a>
      </footer>
    </section>`;
  document.body.appendChild(root);

  const fab = root.querySelector("#chat-fab");
  const panel = root.querySelector("#chat-panel");
  const toggle = (open) => {
    const show = open ?? panel.hidden;
    panel.hidden = !show;
    fab.setAttribute("aria-expanded", String(show));
    fab.classList.toggle("is-open", show);
    if (show && !iniciado) { iniciado = true; saludar(); }
  };
  fab.addEventListener("click", () => toggle());
  root.querySelector("#chat-close").addEventListener("click", () => toggle(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panel.hidden) toggle(false); });

  // Delegación: quick-replies del cuerpo
  root.querySelector("#chat-body").addEventListener("click", (e) => {
    const btn = e.target.closest(".chat-qr__btn");
    if (btn) handle(btn.dataset.key);
  });
}

function waLink() {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(WA_MSG)}`;
}

const body = () => document.getElementById("chat-body");
const scroll = () => { const b = body(); if (b) b.scrollTop = b.scrollHeight; };

function botMsg(html) {
  body().insertAdjacentHTML("beforeend", `<div class="chat-msg chat-msg--bot">${html}</div>`);
  scroll();
}
function userMsg(text) {
  body().insertAdjacentHTML("beforeend", `<div class="chat-msg chat-msg--user">${esc(text)}</div>`);
  scroll();
}
function showQuick(items) {
  body().querySelector(".chat-qr")?.remove();
  const html = items.map(([key, label]) => `<button class="chat-qr__btn" data-key="${key}">${esc(label)}</button>`).join("");
  body().insertAdjacentHTML("beforeend", `<div class="chat-qr">${html}</div>`);
  scroll();
}

function saludar() {
  botMsg("¡Hola! 👋 Soy el asistente de <strong>GastroDigest</strong>. ¿En qué te ayudo hoy?");
  showQuick(MENU);
}

function handle(key) {
  if (key === "whatsapp") {
    userMsg("Quiero hablar por WhatsApp");
    botMsg(`Con gusto. Escríbenos y te responderemos tus dudas. 💬`);
    body().insertAdjacentHTML("beforeend", `<div class="chat-actions"><a class="chat-action chat-action--wa" href="${waLink()}" target="_blank" rel="noopener">${icon("whatsapp", 16)} Abrir WhatsApp</a></div>`);
    showQuick([["menu", "← Volver al menú"]]);
    scroll();
    return;
  }
  if (key === "menu") { showQuick(MENU); return; }

  const item = FAQ[key];
  if (!item) return;
  userMsg(item.q);
  const acciones = (item.actions || [])
    .map(([label, href, blank]) => `<a class="chat-action" ${linkAttrs(href, blank)}>${label} ${icon("arrowRight", 14)}</a>`)
    .join("");
  botMsg(`${item.a}${acciones ? `<div class="chat-actions">${acciones}</div>` : ""}`);
  showQuick(MENU);
}
