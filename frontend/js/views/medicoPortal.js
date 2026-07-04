// =====================================================================
//  views/medicoPortal.js — Área privada del médico (app-shell).
//   Login → dashboard: Agenda, Pacientes, Emitir documento (que aparece
//   en el portal del paciente). Reutiliza el estilo del portal (portal-mode).
// =====================================================================
import { api } from "../api.js";
import {
  mount, mountFull, icon, esc, toast, clearErrors, setFieldError, applyErrors, setLoading,
} from "../ui.js";
import { navigate } from "../router.js";

const NAV = [
  ["agenda", "Mi agenda", "calendarCheck"],
  ["pacientes", "Pacientes", "users"],
  ["emitir", "Emitir documento", "file"],
];

const ESTADO = {
  RESERVADA_WEB: ["Reservada", "reservada"],
  CONFIRMADA_WSP: ["Confirmada", "confirmada"],
  CONFIRMADA_RECEPCION: ["Confirmada", "confirmada"],
  ATENCION_CONDICIONADA: ["Condicionada", "pendiente"],
  ATENDIDA: ["Atendida", "atendida"],
  NO_ASISTIO: ["No asistió", "cancelada"],
  CANCELADA_PACIENTE: ["Cancelada", "cancelada"],
};

const TIPO_DOC = {
  RECETA_MEDICA: "Receta médica",
  RESULTADO_LABORATORIO: "Resultado de laboratorio",
  INFORME_ENDOSCOPIA: "Informe de endoscopía",
  INFORME_COLONOSCOPIA: "Informe de colonoscopía",
};

let sesion = null;
let pacientesCache = [];
let preseleccion = null; // { id_paciente, nombre } al emitir desde la agenda

export async function renderMedicoPortal() {
  document.body.classList.add("portal-mode");
  mount(`<div class="card"><div class="skeleton" style="height:120px"></div></div>`);
  const ses = await api.get("/api/medico/sesion");
  if (ses.success) renderDashboard(ses.data);
  else renderLogin();
}

// ---------------------------------------------------------------------
//  Login
// ---------------------------------------------------------------------
function renderLogin() {
  mount(`
    <section class="portal-split" aria-labelledby="medico-title">
      <aside class="portal-split__promo portal-split__promo--medico">
        <div class="portal-split__promo-inner">
          <span class="portal-split__badge">${icon("stethoscope", 16)} Área profesional</span>
          <h2 class="portal-split__promo-title">Portal del médico</h2>
          <p class="portal-split__promo-lead">Gestiona tu agenda y emite recetas e informes que llegan al instante al portal de tus pacientes.</p>
          <ul class="portal-split__points">
            <li>${icon("calendarCheck", 18)} Tu agenda de citas</li>
            <li>${icon("users", 18)} Tus pacientes</li>
            <li>${icon("file", 18)} Emisión de documentos clínicos</li>
          </ul>
          <p class="portal-split__legal">${icon("lock", 14)} Acceso exclusivo para profesionales.</p>
        </div>
      </aside>

      <div class="portal-split__form">
        <h1 id="medico-title">Acceso médicos</h1>
        <p class="portal-split__subtitle">Ingresa con tu correo institucional.</p>
        <form id="medico-login" novalidate>
          <div class="form-grid" style="grid-template-columns:1fr">
            <div class="field" data-field="correo">
              <label for="m_cor">Correo electrónico</label>
              <input class="input" id="m_cor" name="correo" type="email" autocomplete="username" placeholder="nombre@gastrodigest.pe" />
              <div class="field__error"></div>
            </div>
            <div class="field" data-field="password">
              <label for="m_pass">Contraseña</label>
              <input class="input" id="m_pass" name="password" type="password" autocomplete="current-password" />
              <div class="field__error"></div>
            </div>
          </div>
          <button class="btn btn--primary btn--block mt-6" type="submit" id="medico-login-btn">${icon("lock")} Ingresar</button>
        </form>
        <p class="wizard-alt">¿Eres paciente? <a href="/portal" target="_blank" rel="noopener">Ir al portal del paciente</a></p>
      </div>
    </section>`);

  const form = document.getElementById("medico-login");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);
    const payload = { correo: form.correo.value.trim(), password: form.password.value };
    if (!payload.correo) return setFieldError(form, "correo", "Ingresa tu correo.");
    if (!payload.password) return setFieldError(form, "password", "Ingresa tu contraseña.");

    const btn = document.getElementById("medico-login-btn");
    setLoading(btn, true);
    const res = await api.post("/api/medico/login", payload);
    setLoading(btn, false);

    if (res.success) {
      toast(`Bienvenido(a), ${res.data?.medico ?? ""}.`, "success");
      renderMedicoPortal();
    } else if (res.status === 400) {
      applyErrors(form, res.errors);
      toast(res.message, "warning");
    } else {
      toast(res.message || "No se pudo iniciar sesión.", "error");
    }
  });
}

// ---------------------------------------------------------------------
//  Dashboard
// ---------------------------------------------------------------------
function renderDashboard(datos) {
  sesion = datos;
  pacientesCache = [];
  preseleccion = null;
  const nombre = esc(`Dr(a). ${(sesion.apellidos || "").split(" ")[0] || sesion.nombres}`);
  mountFull(`
    <div class="portal-app">
      <aside class="portal-sidebar">
        <div class="portal-brand">
          <span class="brand__logo" aria-hidden="true">I.S.</span>
          <span class="portal-brand__name">GastroDigest</span>
        </div>
        <nav class="portal-nav" aria-label="Área médica">
          ${NAV.map(([id, label, ic]) => `
            <button class="portal-nav__item" data-sec="${id}">
              <span class="portal-nav__icon">${icon(ic, 20)}</span>${label}
            </button>`).join("")}
        </nav>
        <button class="portal-logout" id="medico-logout">${icon("logout", 18)} Cerrar sesión</button>
      </aside>

      <div class="portal-body">
        <header class="portal-topbar">
          <span class="portal-chip">${icon("stethoscope", 16)} ${nombre} · ${esc(sesion.especialidad)}</span>
        </header>
        <main class="portal-main" id="medico-main" tabindex="-1"></main>
      </div>
    </div>`);

  document.querySelectorAll(".portal-nav__item").forEach((b) =>
    b.addEventListener("click", () => go(b.dataset.sec))
  );
  document.getElementById("medico-logout").addEventListener("click", cerrarSesion);
  go("agenda");
}

function go(sec) {
  document.querySelectorAll(".portal-nav__item").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.sec === sec)
  );
  const main = document.getElementById("medico-main");
  window.scrollTo({ top: 0 });
  ({ agenda: secAgenda, pacientes: secPacientes, emitir: secEmitir }[sec] || secAgenda)(main);
}

async function cerrarSesion() {
  await api.post("/api/medico/logout", {});
  toast("Sesión cerrada.", "info");
  navigate("/medico");
}

// ---------------------------------------------------------------------
//  Agenda
// ---------------------------------------------------------------------
async function secAgenda(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Mi agenda</h1>
    <p class="portal-sub">Tus citas programadas y atendidas.</p>
    <div id="agenda-list"><div class="skeleton" style="height:120px"></div></div>`;

  const res = await api.get("/api/medico/agenda");
  const citas = res.success && Array.isArray(res.data) ? res.data : [];
  const cont = document.getElementById("agenda-list");
  if (!citas.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("calendarCheck", 30)}</span>
      <p>No tienes citas por el momento.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${citas.map(agendaCard).join("")}</div>`;
  cont.querySelectorAll("[data-emitir]").forEach((b) =>
    b.addEventListener("click", () => {
      preseleccion = { id_paciente: Number(b.dataset.emitir), nombre: b.dataset.nombre };
      go("emitir");
    })
  );
}

function agendaCard(c) {
  const [label, cls] = ESTADO[c.estado_actual] || [c.estado_actual, "muted"];
  return `
    <article class="cita-item">
      <span class="cita-item__date">${icon("calendar", 16)} ${fmtFecha(c.fecha_hora)}</span>
      <div class="cita-item__body">
        <strong>${esc(c.paciente)}</strong>
        <small>${esc(c.tipo_documento)} ${esc(c.numero_documento)}</small>
        ${c.motivo ? `<small class="cita-item__motivo">${esc(c.motivo)}</small>` : ""}
      </div>
      <span class="badge badge--${cls}">${esc(label)}</span>
      <button class="btn btn--ghost btn--sm" data-emitir="${c.id_paciente}" data-nombre="${esc(c.paciente)}">${icon("file", 16)} Emitir</button>
    </article>`;
}

// ---------------------------------------------------------------------
//  Pacientes
// ---------------------------------------------------------------------
async function secPacientes(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Mis pacientes</h1>
    <div id="pac-list"><div class="skeleton" style="height:120px"></div></div>`;
  const pacientes = await cargarPacientes();
  const cont = document.getElementById("pac-list");
  if (!pacientes.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("users", 30)}</span>
      <p>Aún no tienes pacientes registrados.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${pacientes.map((p) => `
    <article class="cita-item">
      <span class="quick2__icon">${icon("user", 20)}</span>
      <div class="cita-item__body"><strong>${esc(p.nombre)}</strong><small>${esc(p.tipo_documento)} ${esc(p.numero_documento)}</small></div>
      <button class="btn btn--ghost btn--sm" data-emitir="${p.id_paciente}" data-nombre="${esc(p.nombre)}">${icon("file", 16)} Emitir documento</button>
    </article>`).join("")}</div>`;
  cont.querySelectorAll("[data-emitir]").forEach((b) =>
    b.addEventListener("click", () => {
      preseleccion = { id_paciente: Number(b.dataset.emitir), nombre: b.dataset.nombre };
      go("emitir");
    })
  );
}

async function cargarPacientes() {
  if (pacientesCache.length) return pacientesCache;
  const res = await api.get("/api/medico/pacientes");
  pacientesCache = res.success && Array.isArray(res.data) ? res.data : [];
  return pacientesCache;
}

// ---------------------------------------------------------------------
//  Emitir documento
// ---------------------------------------------------------------------
async function secEmitir(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Emitir documento</h1>
    <p class="portal-sub">El documento aparecerá al instante en el portal del paciente.</p>
    <form id="doc-form" class="wizard-form" novalidate style="max-width:640px">
      <div class="form-grid">
        <div class="field field--full" data-field="id_paciente">
          <label for="d_pac">Paciente <span class="req">*</span></label>
          <select class="select" id="d_pac" name="id_paciente"><option value="">Cargando…</option></select>
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="tipo_documento">
          <label for="d_tipo">Tipo de documento <span class="req">*</span></label>
          <select class="select" id="d_tipo" name="tipo_documento">
            ${Object.entries(TIPO_DOC).map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join("")}
          </select>
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="fecha_emision">
          <label for="d_fecha">Fecha de emisión <span class="req">*</span></label>
          <input class="input" type="date" id="d_fecha" name="fecha_emision" value="${new Date().toISOString().slice(0, 10)}" />
          <div class="field__error"></div>
        </div>
        <div class="field field--full" data-field="titulo">
          <label for="d_tit">Título <span class="req">*</span></label>
          <input class="input" id="d_tit" name="titulo" placeholder="Ej. Hemograma completo" />
          <div class="field__error"></div>
        </div>
        <div class="field field--full" data-field="descripcion">
          <label for="d_desc">Descripción / indicaciones</label>
          <textarea class="textarea" id="d_desc" name="descripcion" placeholder="Opcional"></textarea>
          <div class="field__error"></div>
        </div>
      </div>
      <div class="wizard-actions">
        <button class="btn btn--cta" type="submit" id="doc-btn">${icon("file", 18)} Emitir documento</button>
      </div>
    </form>`;

  const form = document.getElementById("doc-form");
  const sel = form.querySelector("#d_pac");
  const pacientes = await cargarPacientes();
  if (!pacientes.length) {
    sel.innerHTML = `<option value="">No tienes pacientes aún</option>`;
  } else {
    sel.innerHTML = `<option value="">Selecciona un paciente…</option>` +
      pacientes.map((p) => `<option value="${p.id_paciente}">${esc(p.nombre)} — ${esc(p.numero_documento)}</option>`).join("");
    if (preseleccion) { sel.value = String(preseleccion.id_paciente); preseleccion = null; }
  }

  form.addEventListener("submit", (e) => emitir(e, form));
}

async function emitir(e, form) {
  e.preventDefault();
  clearErrors(form);
  const g = (n) => form[n].value.trim();
  const errs = {};
  if (!g("id_paciente")) errs.id_paciente = "Selecciona un paciente.";
  if (g("titulo").length < 3) errs.titulo = "Ingresa un título.";
  if (!g("fecha_emision")) errs.fecha_emision = "Selecciona la fecha.";
  if (Object.keys(errs).length) {
    Object.entries(errs).forEach(([k, v]) => setFieldError(form, k, v));
    return;
  }

  const btn = form.querySelector("#doc-btn");
  setLoading(btn, true);
  const res = await api.post("/api/medico/documentos", {
    id_paciente: Number(g("id_paciente")),
    tipo_documento: g("tipo_documento"),
    titulo: g("titulo"),
    descripcion: g("descripcion") || null,
    fecha_emision: g("fecha_emision"),
  });
  setLoading(btn, false, `${icon("file", 18)} Emitir documento`);

  if (res.success) {
    toast("Documento emitido y disponible en el portal del paciente.", "success");
    go("agenda");
  } else if (res.status === 400) {
    applyErrors(form, res.errors);
    toast(res.message, "warning");
  } else {
    toast(res.message || "No se pudo emitir el documento.", "error");
  }
}

// ---------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------
function fmtFecha(f) {
  const d = new Date(String(f).replace(" ", "T"));
  if (isNaN(d.getTime())) return esc(f);
  return d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
