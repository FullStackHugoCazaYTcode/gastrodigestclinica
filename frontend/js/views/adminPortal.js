// =====================================================================
//  views/adminPortal.js — Panel de administración / dueño (app-shell).
//   Login → dashboard: Resumen, Médicos (alta + estado), Citas, Pacientes.
// =====================================================================
import { api } from "../api.js";
import {
  mount, mountFull, icon, esc, toast, clearErrors, setFieldError, applyErrors, setLoading,
} from "../ui.js";
import { navigate } from "../router.js";
import { logoMark } from "../components/logo.js";
import { openHorariosModal } from "../components/horariosModal.js";

const NAV = [
  ["resumen", "Resumen", "activity"],
  ["medicos", "Médicos", "stethoscope"],
  ["recepcion", "Recepción", "clock"],
  ["citas", "Citas", "calendarCheck"],
  ["pacientes", "Pacientes", "users"],
  ["opiniones", "Opiniones", "heart"],
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

let sesion = null;

export async function renderAdminPortal() {
  document.body.classList.add("portal-mode");
  mount(`<div class="card"><div class="skeleton" style="height:120px"></div></div>`);
  const ses = await api.get("/api/admin/sesion");
  if (ses.success) renderDashboard(ses.data);
  else renderLogin();
}

// ---------------------------------------------------------------------
//  Login
// ---------------------------------------------------------------------
function renderLogin() {
  mount(`
    <section class="portal-split" aria-labelledby="admin-title">
      <aside class="portal-split__promo portal-split__promo--admin">
        <div class="portal-split__promo-inner">
          <span class="portal-split__badge">${icon("shieldCheck", 16)} Administración</span>
          <h2 class="portal-split__promo-title">Panel de gestión</h2>
          <p class="portal-split__promo-lead">Administra médicos, revisa la agenda de toda la clínica y consulta a tus pacientes.</p>
          <ul class="portal-split__points">
            <li>${icon("stethoscope", 18)} Gestión de médicos</li>
            <li>${icon("calendarCheck", 18)} Agenda global</li>
            <li>${icon("activity", 18)} Métricas y reportes</li>
          </ul>
          <p class="portal-split__legal">${icon("lock", 14)} Acceso restringido a administradores.</p>
        </div>
      </aside>

      <div class="portal-split__form">
        <h1 id="admin-title">Administración</h1>
        <p class="portal-split__subtitle">Ingresa con tu cuenta de administrador.</p>
        <form id="admin-login" novalidate>
          <div class="form-grid" style="grid-template-columns:1fr">
            <div class="field" data-field="correo">
              <label for="a_cor">Correo electrónico</label>
              <input class="input" id="a_cor" name="correo" type="email" autocomplete="username" placeholder="admin@gastrodigest.pe" />
              <div class="field__error"></div>
            </div>
            <div class="field" data-field="password">
              <label for="a_pass">Contraseña</label>
              <input class="input" id="a_pass" name="password" type="password" autocomplete="current-password" />
              <div class="field__error"></div>
            </div>
          </div>
          <button class="btn btn--primary btn--block mt-6" type="submit" id="admin-login-btn">${icon("lock")} Ingresar</button>
        </form>
      </div>
    </section>`);

  const form = document.getElementById("admin-login");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);
    const payload = { correo: form.correo.value.trim(), password: form.password.value };
    if (!payload.correo) return setFieldError(form, "correo", "Ingresa tu correo.");
    if (!payload.password) return setFieldError(form, "password", "Ingresa tu contraseña.");

    const btn = document.getElementById("admin-login-btn");
    setLoading(btn, true);
    const res = await api.post("/api/admin/login", payload);
    setLoading(btn, false);

    if (res.success) {
      toast(`Bienvenido(a), ${res.data?.admin ?? ""}.`, "success");
      renderAdminPortal();
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
  mountFull(`
    <div class="portal-app">
      <aside class="portal-sidebar">
        <div class="portal-brand">
          <span class="brand__mark" aria-hidden="true">${logoMark(38)}</span>
          <span class="portal-brand__name">Admin</span>
        </div>
        <nav class="portal-nav" aria-label="Administración">
          ${NAV.map(([id, label, ic]) => `
            <button class="portal-nav__item" data-sec="${id}">
              <span class="portal-nav__icon">${icon(ic, 20)}</span>${label}
            </button>`).join("")}
        </nav>
        <button class="portal-logout" id="admin-logout">${icon("logout", 18)} Cerrar sesión</button>
      </aside>

      <div class="portal-body">
        <header class="portal-topbar">
          <span class="portal-chip">${icon("shieldCheck", 16)} ${esc(sesion.nombres)}</span>
        </header>
        <main class="portal-main" id="admin-main" tabindex="-1"></main>
      </div>
    </div>`);

  document.querySelectorAll(".portal-nav__item").forEach((b) =>
    b.addEventListener("click", () => go(b.dataset.sec))
  );
  document.getElementById("admin-logout").addEventListener("click", cerrarSesion);
  go("resumen");
}

function go(sec) {
  document.querySelectorAll(".portal-nav__item").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.sec === sec)
  );
  const main = document.getElementById("admin-main");
  window.scrollTo({ top: 0 });
  ({ resumen: secResumen, recepcion: secRecepcion, medicos: secMedicos, citas: secCitas, pacientes: secPacientes, opiniones: secOpiniones }[sec] || secResumen)(main);
}

async function cerrarSesion() {
  await api.post("/api/admin/logout", {});
  toast("Sesión cerrada.", "info");
  navigate("/admin");
}

// ---------------------------------------------------------------------
//  Opiniones (moderación de testimonios NPS)
// ---------------------------------------------------------------------
async function secOpiniones(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Opiniones de pacientes</h1>
    <p class="portal-sub">Aprueba cuáles se publican como testimonios en el sitio. Solo se pueden publicar las que tienen el consentimiento del paciente.</p>
    <div id="op-cont"><div class="skeleton" style="height:120px"></div></div>`;
  await cargarOpiniones(main);
}

async function cargarOpiniones(main) {
  const res = await api.get("/api/admin/encuestas");
  const lista = res.success && Array.isArray(res.data) ? res.data : [];
  const cont = main.querySelector("#op-cont");
  if (!lista.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("heart", 30)}</span><p>Aún no hay opiniones respondidas.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${lista.map(opinionRow).join("")}</div>`;
  cont.querySelectorAll("[data-aprobar]").forEach((b) =>
    b.addEventListener("click", async () => {
      const id = b.dataset.aprobar;
      const aprobar = b.dataset.aprobado === "0";
      setLoading(b, true);
      const r = await api.patch(`/api/admin/encuestas/${id}`, { aprobado: aprobar });
      if (r.success) { toast(aprobar ? "Testimonio publicado." : "Testimonio ocultado.", "success"); cargarOpiniones(main); }
      else { setLoading(b, false); toast(r.message || "No se pudo actualizar.", "error"); }
    })
  );
}

function opinionRow(e) {
  const stars = Math.max(0, Math.min(5, Number(e.puntaje) || 0));
  const aprobado = Number(e.aprobado) === 1;
  const consiente = Number(e.autoriza_publicar) === 1;
  const acciones = consiente
    ? `<button class="btn btn--ghost btn--sm" data-aprobar="${e.id_encuesta}" data-aprobado="${aprobado ? 1 : 0}">${aprobado ? "Ocultar" : "Publicar"}</button>`
    : `<span class="badge badge--muted">Sin consentimiento</span>`;
  return `
    <article class="cita-item">
      <span class="cita-item__date" aria-label="${stars} de 5 estrellas">${"★".repeat(stars)}${"☆".repeat(5 - stars)}</span>
      <div class="cita-item__body">
        <strong>${esc(e.paciente)}</strong>
        <small>${esc(e.especialidad || "")}${e.respondida_at ? " · " + esc(String(e.respondida_at).slice(0, 10)) : ""}</small>
        ${e.comentario ? `<small class="cita-item__motivo">"${esc(e.comentario)}"</small>` : `<small class="text-muted">Sin comentario</small>`}
      </div>
      <span class="badge badge--${aprobado ? "atendida" : "pendiente"}">${aprobado ? "Publicado" : "Oculto"}</span>
      ${acciones}
    </article>`;
}

// ---------------------------------------------------------------------
//  Resumen (métricas)
// ---------------------------------------------------------------------
async function secResumen(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Resumen</h1>
    <div id="resumen-cont"><div class="skeleton" style="height:120px"></div></div>`;
  const res = await api.get("/api/admin/resumen");
  const cont = document.getElementById("resumen-cont");
  if (!res.success) { cont.innerHTML = `<p class="text-muted">No se pudo cargar el resumen.</p>`; return; }
  const d = res.data;
  const stat = (icn, num, label) => `
    <div class="admin-stat">
      <span class="admin-stat__icon">${icon(icn, 22)}</span>
      <div><strong>${num}</strong><small>${label}</small></div>
    </div>`;
  const estados = Object.entries(d.citas_por_estado || {})
    .map(([e, n]) => { const [l, c] = ESTADO[e] || [e, "muted"]; return `<span class="badge badge--${c}">${esc(l)}: ${n}</span>`; })
    .join("") || `<span class="text-muted">Sin citas registradas.</span>`;

  cont.innerHTML = `
    <div class="admin-stats">
      ${stat("calendarCheck", d.total_citas, "Citas")}
      ${stat("users", d.total_pacientes, "Pacientes")}
      ${stat("stethoscope", d.medicos_activos + "/" + d.total_medicos, "Médicos activos")}
    </div>
    <section class="portal-panel" style="margin-top:var(--space-5)">
      <h2 class="portal-h2">Citas por estado</h2>
      <div class="admin-badges">${estados}</div>
    </section>`;
}

// ---------------------------------------------------------------------
//  Médicos (alta + estado)
// ---------------------------------------------------------------------
async function secMedicos(main) {
  main.innerHTML = `
    <div class="admin-head">
      <h1 class="portal-h1">Médicos</h1>
      <button class="btn btn--cta btn--sm" id="nuevo-medico">${icon("stethoscope", 16)} Nuevo médico</button>
    </div>
    <div id="form-medico"></div>
    <div id="medicos-cont"><div class="skeleton" style="height:120px"></div></div>`;

  main.querySelector("#nuevo-medico").addEventListener("click", () => toggleFormMedico(main));
  await cargarMedicos(main);
}

async function cargarMedicos(main) {
  const res = await api.get("/api/admin/medicos");
  const medicos = res.success && Array.isArray(res.data) ? res.data : [];
  const cont = main.querySelector("#medicos-cont");
  if (!medicos.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("stethoscope", 30)}</span><p>Aún no hay médicos.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${medicos.map(medicoRow).join("")}</div>`;
  cont.querySelectorAll("[data-toggle]").forEach((b) =>
    b.addEventListener("click", async () => {
      const id = b.dataset.toggle;
      const activar = b.dataset.activo === "0";
      setLoading(b, true);
      const r = await api.patch(`/api/admin/medicos/${id}`, { estado_activo: activar });
      if (r.success) { toast("Estado actualizado.", "success"); cargarMedicos(main); }
      else { setLoading(b, false); toast(r.message || "No se pudo actualizar.", "error"); }
    })
  );
  cont.querySelectorAll("[data-horarios]").forEach((b) =>
    b.addEventListener("click", () => {
      const m = medicos.find((x) => String(x.id_medico) === b.dataset.horarios);
      if (m) openHorariosModal(m);
    })
  );
}

function medicoRow(m) {
  const activo = Number(m.estado_activo) === 1;
  return `
    <article class="cita-item">
      <span class="quick2__icon">${icon("stethoscope", 20)}</span>
      <div class="cita-item__body">
        <strong>Dr(a). ${esc(m.nombres)} ${esc(m.apellidos)}</strong>
        <small>${esc(m.especialidad)} · CMP ${esc(m.cmp)} · ${esc(m.correo)}</small>
      </div>
      <span class="badge badge--${activo ? "atendida" : "cancelada"}">${activo ? "Activo" : "Inactivo"}</span>
      <button class="btn btn--ghost btn--sm" data-horarios="${m.id_medico}">${icon("calendar", 14)} Horarios</button>
      <button class="btn btn--ghost btn--sm" data-toggle="${m.id_medico}" data-activo="${activo ? 1 : 0}">
        ${activo ? "Desactivar" : "Activar"}
      </button>
    </article>`;
}

function toggleFormMedico(main) {
  const host = main.querySelector("#form-medico");
  if (host.innerHTML.trim()) { host.innerHTML = ""; return; }
  host.innerHTML = `
    <form id="medico-form" class="portal-panel wizard-form" novalidate style="margin-bottom:var(--space-4)">
      <h2 class="portal-h2">Registrar médico</h2>
      <div class="form-grid">
        <div class="field" data-field="nombres"><label for="nm_nom">Nombres <span class="req">*</span></label><input class="input" id="nm_nom" name="nombres"/><div class="field__error"></div></div>
        <div class="field" data-field="apellidos"><label for="nm_ape">Apellidos <span class="req">*</span></label><input class="input" id="nm_ape" name="apellidos"/><div class="field__error"></div></div>
        <div class="field" data-field="cmp"><label for="nm_cmp">CMP <span class="req">*</span></label><input class="input" id="nm_cmp" name="cmp" placeholder="Ej. CMP56789"/><div class="field__error"></div></div>
        <div class="field" data-field="especialidad"><label for="nm_esp">Especialidad <span class="req">*</span></label><input class="input" id="nm_esp" name="especialidad" value="Gastroenterología"/><div class="field__error"></div></div>
        <div class="field" data-field="correo"><label for="nm_cor">Correo <span class="req">*</span></label><input class="input" type="email" id="nm_cor" name="correo" placeholder="nombre@gastrodigest.pe"/><div class="field__error"></div></div>
        <div class="field" data-field="telefono"><label for="nm_tel">Teléfono</label><input class="input" id="nm_tel" name="telefono" inputmode="numeric"/><div class="field__error"></div></div>
        <div class="field field--full" data-field="password"><label for="nm_pass">Contraseña de acceso <span class="req">*</span></label><input class="input" type="text" id="nm_pass" name="password" placeholder="Mínimo 8 caracteres"/><div class="field__error"></div></div>
      </div>
      <div class="wizard-actions">
        <button class="btn btn--ghost btn--sm" type="button" id="cancelar-medico">Cancelar</button>
        <button class="btn btn--primary btn--sm" type="submit" id="guardar-medico">${icon("check", 16)} Registrar</button>
      </div>
    </form>`;
  host.querySelector("#cancelar-medico").addEventListener("click", () => { host.innerHTML = ""; });
  host.querySelector("#medico-form").addEventListener("submit", (e) => crearMedico(e, main));
}

async function crearMedico(e, main) {
  e.preventDefault();
  const form = e.currentTarget;
  clearErrors(form);
  const g = (n) => form[n].value.trim();
  const errs = {};
  ["nombres", "apellidos", "cmp", "especialidad", "correo"].forEach((n) => { if (!g(n)) errs[n] = "Obligatorio."; });
  if (g("password").length < 8) errs.password = "Mínimo 8 caracteres.";
  if (Object.keys(errs).length) { Object.entries(errs).forEach(([k, v]) => setFieldError(form, k, v)); return; }

  const btn = form.querySelector("#guardar-medico");
  setLoading(btn, true);
  const res = await api.post("/api/admin/medicos", {
    cmp: g("cmp"), nombres: g("nombres"), apellidos: g("apellidos"),
    especialidad: g("especialidad"), correo: g("correo"),
    telefono: g("telefono") || null, password: g("password"),
  });
  setLoading(btn, false, `${icon("check", 16)} Registrar`);

  if (res.success) {
    toast("Médico registrado. Ya puede iniciar sesión.", "success");
    main.querySelector("#form-medico").innerHTML = "";
    cargarMedicos(main);
  } else if (res.status === 400 || res.status === 409) {
    applyErrors(form, res.errors);
    toast(res.message, "warning");
  } else {
    toast(res.message || "No se pudo registrar.", "error");
  }
}

// ---------------------------------------------------------------------
//  Recepción (agenda del día: confirmar llegada / no asistió)
// ---------------------------------------------------------------------
async function secRecepcion(main) {
  const hoy = new Date().toISOString().slice(0, 10);
  main.innerHTML = `
    <div class="admin-head">
      <h1 class="portal-h1">Recepción</h1>
      <input class="input" type="date" id="rec-fecha" value="${hoy}" style="width:auto" aria-label="Fecha" />
    </div>
    <p class="portal-sub">Confirma la llegada de los pacientes o marca inasistencias sobre la agenda del día.</p>
    <div id="rec-cont"><div class="skeleton" style="height:120px"></div></div>`;
  const fechaInput = main.querySelector("#rec-fecha");
  const cargar = () => cargarRecepcion(main, fechaInput.value || hoy);
  fechaInput.addEventListener("change", cargar);
  await cargar();
}

async function cargarRecepcion(main, fecha) {
  const cont = main.querySelector("#rec-cont");
  cont.innerHTML = `<div class="skeleton" style="height:120px"></div>`;
  const res = await api.get(`/api/admin/recepcion?fecha=${encodeURIComponent(fecha)}`);
  const citas = res.success && Array.isArray(res.data?.citas) ? res.data.citas : [];
  if (!citas.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("calendarCheck", 30)}</span><p>No hay citas para esta fecha.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${citas.map(recepcionRow).join("")}</div>`;
  cont.querySelectorAll("[data-rec]").forEach((b) =>
    b.addEventListener("click", async () => {
      setLoading(b, true);
      const r = await api.patch(`/api/admin/recepcion/${b.dataset.id}`, { accion: b.dataset.rec });
      if (r.success) { toast("Estado actualizado.", "success"); cargarRecepcion(main, fecha); }
      else { setLoading(b, false); toast(r.message || "No se pudo actualizar.", "error"); }
    })
  );
}

function recepcionRow(c) {
  const [label, cls] = ESTADO[c.estado_actual] || [c.estado_actual, "muted"];
  const pendiente = ["RESERVADA_WEB", "CONFIRMADA_WSP"].includes(c.estado_actual);
  const confirmada = c.estado_actual === "CONFIRMADA_RECEPCION";
  const acciones = (pendiente || confirmada)
    ? `<div class="cita-item__actions">
        ${pendiente ? `<button class="btn btn--cta btn--sm" data-rec="confirmar" data-id="${c.id_cita}">${icon("check", 14)} Llegó</button>` : ""}
        <button class="btn btn--ghost btn--sm" data-rec="no_asistio" data-id="${c.id_cita}">No asistió</button>
       </div>`
    : "";
  return `<article class="cita-item">
    <span class="cita-item__date">${icon("clock", 16)} ${fmtHoraCorta(c.fecha_hora)}</span>
    <div class="cita-item__body">
      <strong>${esc(c.paciente)}</strong>
      <small>${esc(c.tipo_documento)} ${esc(c.numero_documento)} · Dr(a). ${esc(c.medico)} · ${esc(c.especialidad)}</small>
    </div>
    <span class="badge badge--${cls}">${esc(label)}</span>
    ${acciones}
  </article>`;
}

function fmtHoraCorta(f) {
  const d = new Date(String(f).replace(" ", "T"));
  return isNaN(d.getTime()) ? esc(f) : d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

// ---------------------------------------------------------------------
//  Citas (agenda global)
// ---------------------------------------------------------------------
async function secCitas(main) {
  main.innerHTML = `<h1 class="portal-h1">Agenda global</h1><div id="citas-cont"><div class="skeleton" style="height:120px"></div></div>`;
  const res = await api.get("/api/admin/citas");
  const citas = res.success && Array.isArray(res.data) ? res.data : [];
  const cont = document.getElementById("citas-cont");
  if (!citas.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("calendarCheck", 30)}</span><p>No hay citas registradas.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${citas.map((c) => {
    const [label, cls] = ESTADO[c.estado_actual] || [c.estado_actual, "muted"];
    return `<article class="cita-item">
      <span class="cita-item__date">${icon("calendar", 16)} ${fmtFecha(c.fecha_hora)}</span>
      <div class="cita-item__body"><strong>${esc(c.paciente)}</strong><small>Dr(a). ${esc(c.medico)} · ${esc(c.especialidad)}</small></div>
      <span class="badge badge--${cls}">${esc(label)}</span>
    </article>`;
  }).join("")}</div>`;
}

// ---------------------------------------------------------------------
//  Pacientes
// ---------------------------------------------------------------------
async function secPacientes(main) {
  main.innerHTML = `<h1 class="portal-h1">Pacientes</h1><div id="pac-cont"><div class="skeleton" style="height:120px"></div></div>`;
  const res = await api.get("/api/admin/pacientes");
  const pacientes = res.success && Array.isArray(res.data) ? res.data : [];
  const cont = document.getElementById("pac-cont");
  if (!pacientes.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("users", 30)}</span><p>Aún no hay pacientes.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${pacientes.map((p) => `
    <article class="cita-item">
      <span class="quick2__icon">${icon("user", 20)}</span>
      <div class="cita-item__body"><strong>${esc(p.nombre)}</strong><small>${esc(p.tipo_documento)} ${esc(p.numero_documento)} · ${esc(p.correo)}</small></div>
    </article>`).join("")}</div>`;
}

// ---------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------
function fmtFecha(f) {
  const d = new Date(String(f).replace(" ", "T"));
  if (isNaN(d.getTime())) return esc(f);
  return d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
