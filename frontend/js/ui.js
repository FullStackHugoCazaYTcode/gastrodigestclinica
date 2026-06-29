// =====================================================================
//  ui.js — Iconos SVG (Lucide), toasts, feedback inline y helpers DOM.
//  Prohibido: emojis como iconos y alert()/confirm() nativos.
// =====================================================================

// ---- Iconos (paths de Lucide, licencia ISC) ----
const ICON_PATHS = {
  calendar: '<path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
  alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
  warning: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  stethoscope: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
};

/** Devuelve un string SVG del icono indicado. */
export function icon(name, size = 20) {
  const paths = ICON_PATHS[name] || "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true">${paths}</svg>`;
}

// ---- Montaje de vistas ----
const appRoot = () => document.getElementById("app");

// Vistas de "app" (reserva, portal, reprogramar): contenido centrado en un container.
export function mount(html) {
  const root = appRoot();
  root.innerHTML = `<div class="container app-page">${html}</div>`;
  root.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
  return root;
}

// Vistas de marketing: contenido a todo el ancho (cada sección maneja su container).
export function mountFull(html) {
  const root = appRoot();
  root.innerHTML = html;
  root.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
  return root;
}

export function el(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// ---- Toasts ----
const TOAST_ICON = { success: "checkCircle", error: "alert", warning: "warning", info: "info" };

export function toast(message, type = "info", title = "") {
  const root = document.getElementById("toast-root");
  const node = el(`
    <div class="toast toast--${type}" role="status">
      <span class="toast__icon">${icon(TOAST_ICON[type] || "info")}</span>
      <div class="toast__body">
        ${title ? `<div class="toast__title">${title}</div>` : ""}
        <div>${message}</div>
      </div>
    </div>`);
  root.appendChild(node);
  setTimeout(() => {
    node.style.transition = "opacity .3s, transform .3s";
    node.style.opacity = "0";
    node.style.transform = "translateX(20px)";
    setTimeout(() => node.remove(), 320);
  }, 4200);
}

// ---- Feedback inline en formularios ----
export function clearErrors(form) {
  form.querySelectorAll(".field.has-error").forEach((f) => f.classList.remove("has-error"));
}

export function setFieldError(form, name, message) {
  const field = form.querySelector(`[data-field="${name}"]`);
  if (!field) return;
  field.classList.add("has-error");
  const errEl = field.querySelector(".field__error");
  if (errEl) errEl.innerHTML = `${icon("alert", 14)}<span>${message}</span>`;
}

/** Aplica un objeto de errores {campo: mensaje} del backend al formulario. */
export function applyErrors(form, errors) {
  if (!errors || typeof errors !== "object") return;
  Object.entries(errors).forEach(([name, msg]) => setFieldError(form, name, String(msg)));
}

// ---- Estado de carga de un botón ----
export function setLoading(btn, loading, labelWhenIdle) {
  if (loading) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Procesando…`;
  } else {
    btn.disabled = false;
    btn.innerHTML = labelWhenIdle ?? btn.dataset.label ?? btn.innerHTML;
  }
}
