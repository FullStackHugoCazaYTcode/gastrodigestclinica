// =====================================================================
//  views/portalDashboard.js — Portal del paciente (app-shell con sidebar).
//  Se renderiza en "portal-mode" (sin el chrome de marketing) y funciona
//  como una app dedicada: Inicio, Mis citas, Documentos, Agendar.
// =====================================================================
import { api } from "../api.js";
import { mountFull, icon, esc, toast, clearErrors, applyErrors, setLoading } from "../ui.js";
import { navigate } from "../router.js";
import { startBooking } from "./portalBooking.js";
import { logoMark } from "../components/logo.js";
import { openCancelarModal, openReprogramarModal } from "../components/gestionCita.js";

const NAV = [
  ["inicio", "Inicio", "home"],
  ["citas", "Mis citas", "calendarCheck"],
  ["documentos", "Documentos clínicos", "file"],
];

// Reutiliza las variantes de .badge ya definidas en components.css.
const ESTADO = {
  RESERVADA_WEB:        ["Reservada", "reservada"],
  CONFIRMADA_WSP:       ["Confirmada", "confirmada"],
  CONFIRMADA_RECEPCION: ["Confirmada", "confirmada"],
  ATENCION_CONDICIONADA:["Condicionada", "pendiente"],
  ATENDIDA:             ["Atendida", "atendida"],
  NO_ASISTIO:           ["No asistió", "cancelada"],
  CANCELADA_PACIENTE:   ["Cancelada", "cancelada"],
};

const DOC_CAT = {
  RECETA_MEDICA:         { label: "Recetas médicas", icon: "file" },
  RESULTADO_LABORATORIO: { label: "Resultados de laboratorio", icon: "droplet" },
  INFORME_ENDOSCOPIA:    { label: "Informes de endoscopía", icon: "activity" },
  INFORME_COLONOSCOPIA:  { label: "Informes de colonoscopía", icon: "search" },
};

const MODALIDADES = [
  ["stethoscope", "presencial", "Cita presencial", "Atiéndete en nuestra sede con un especialista."],
  ["message", "virtual", "Cita virtual", "Consulta por videollamada desde donde estés."],
];

let sesion = null;

export function renderDashboard(datos) {
  sesion = datos;
  const nombre = esc((sesion.nombres || "").split(" ")[0] || "paciente");
  mountFull(`
    <div class="portal-app">
      <aside class="portal-sidebar">
        <a class="portal-brand" href="/" data-link aria-label="GastroDigest inicio">
          <span class="brand__mark" aria-hidden="true">${logoMark(38)}</span>
          <span class="portal-brand__name">Gastro<span class="brand__name-alt">Digest</span></span>
        </a>
        <nav class="portal-nav" aria-label="Portal del paciente">
          ${NAV.map(([id, label, ic]) => `
            <button class="portal-nav__item" data-sec="${id}">
              <span class="portal-nav__icon">${icon(ic, 20)}</span>${label}
            </button>`).join("")}
        </nav>
        <button class="btn btn--cta portal-agendar" data-sec="agendar">${icon("calendar", 18)} Agendar cita</button>
        <button class="portal-logout" id="portal-logout">${icon("logout", 18)} Cerrar sesión</button>
      </aside>

      <div class="portal-body">
        <header class="portal-topbar">
          <div class="portal-account">
            <button class="portal-chip" id="account-btn" aria-haspopup="true" aria-expanded="false">
              ${icon("user", 16)} ${nombre} ${icon("chevronDown", 16)}
            </button>
            <div class="portal-menu" id="account-menu" hidden>
              <button class="portal-menu__item" data-act="perfil">${icon("user", 16)} Mis datos</button>
              <button class="portal-menu__item" data-act="familiares">${icon("users", 16)} Mis familiares</button>
              <button class="portal-menu__item" data-act="pagos">${icon("file", 16)} Medios de pago</button>
              <button class="portal-menu__item portal-menu__item--danger" data-act="logout">${icon("logout", 16)} Cerrar sesión</button>
            </div>
          </div>
        </header>
        <main class="portal-main" id="portal-main" tabindex="-1"></main>
      </div>
    </div>
  `);

  document.querySelectorAll(".portal-nav__item, .portal-agendar").forEach((b) =>
    b.addEventListener("click", () => go(b.dataset.sec))
  );
  document.getElementById("portal-logout").addEventListener("click", cerrarSesion);
  wireAccountMenu();
  go("inicio");
}

function wireAccountMenu() {
  const btn = document.getElementById("account-btn");
  const menu = document.getElementById("account-menu");
  const toggle = (open) => {
    const show = open ?? menu.hidden;
    menu.hidden = !show;
    btn.setAttribute("aria-expanded", String(show));
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
  document.addEventListener("click", () => { if (!menu.hidden) toggle(false); });
  menu.addEventListener("click", (e) => {
    const item = e.target.closest(".portal-menu__item");
    if (!item) return;
    toggle(false);
    const act = item.dataset.act;
    if (act === "perfil") go("perfil");
    else if (act === "familiares") go("familiares");
    else if (act === "logout") cerrarSesion();
    else toast("Esta sección estará disponible próximamente.", "info");
  });
}

function go(sec) {
  document.querySelectorAll(".portal-nav__item").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.sec === sec)
  );
  const main = document.getElementById("portal-main");
  main.scrollTo?.({ top: 0 });
  window.scrollTo({ top: 0 });
  ({ inicio: secInicio, citas: secCitas, documentos: secDocumentos, agendar: secAgendar, perfil: secPerfil, familiares: secFamiliares }[sec] || secInicio)(main);
}

async function cerrarSesion() {
  await api.post("/api/portal/logout", {});
  toast("Sesión cerrada.", "info");
  navigate("/portal");
}

// ---------------------------------------------------------------------
//  Inicio
// ---------------------------------------------------------------------
async function secInicio(main) {
  const nombre = esc((sesion.nombres || "").split(" ")[0] || "");
  main.innerHTML = `
    <h1 class="portal-h1">¡Hola, ${nombre}!</h1>
    <div class="portal-grid">
      <section class="portal-panel">
        <h2 class="portal-h2">Accesos rápidos</h2>
        <div class="quick2">
          <button class="quick2__card" data-go="citas">
            <span class="quick2__icon">${icon("calendarCheck", 22)}</span>
            <span><strong>Mis citas</strong><small>Revisa tus próximas citas</small></span>
          </button>
          <button class="quick2__card" data-go="documentos">
            <span class="quick2__icon">${icon("file", 22)}</span>
            <span><strong>Documentos</strong><small>Recetas y resultados</small></span>
          </button>
          <button class="quick2__card" data-go="agendar">
            <span class="quick2__icon">${icon("calendar", 22)}</span>
            <span><strong>Agendar cita</strong><small>Reserva en minutos</small></span>
          </button>
        </div>
      </section>
      <aside class="portal-panel portal-panel--accent" id="proxima-cita">
        <h2 class="portal-h2">Próxima cita</h2>
        <div class="skeleton" style="height:96px"></div>
      </aside>
    </div>`;

  main.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go)));

  const res = await api.get("/api/portal/citas");
  const citas = res.success && Array.isArray(res.data) ? res.data : [];
  const proximas = citas.filter(esProxima).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  const box = document.getElementById("proxima-cita");
  if (proximas.length) {
    const c = proximas[0];
    box.innerHTML = `
      <h2 class="portal-h2">Próxima cita</h2>
      ${citaCard(c)}`;
  } else {
    box.innerHTML = `
      <h2 class="portal-h2">Próxima cita</h2>
      <div class="portal-empty portal-empty--sm">
        <p>No cuentas con citas por el momento.</p>
        <button class="btn btn--cta btn--sm" data-go="agendar">${icon("calendar", 16)} Agendar cita</button>
      </div>`;
    box.querySelector("[data-go]").addEventListener("click", () => go("agendar"));
  }
}

// ---------------------------------------------------------------------
//  Mis citas (Próximas / Historial)
// ---------------------------------------------------------------------
async function secCitas(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Mis citas</h1>
    <div class="portal-tabs" role="tablist">
      <button class="portal-tab is-active" data-tab="proximas" role="tab">Próximas</button>
      <button class="portal-tab" data-tab="historial" role="tab">Historial</button>
    </div>
    <div id="citas-list"><div class="skeleton" style="height:120px"></div></div>`;

  const res = await api.get("/api/portal/citas");
  const citas = res.success && Array.isArray(res.data) ? res.data : [];
  const proximas = citas.filter(esProxima).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
  const historial = citas.filter((c) => !esProxima(c));
  const byId = new Map(citas.map((c) => [String(c.id_cita), c]));
  const refrescar = () => secCitas(main);

  const pintar = (tab) => {
    const lista = tab === "proximas" ? proximas : historial;
    const cont = document.getElementById("citas-list");
    if (!lista.length) {
      cont.innerHTML = `
        <div class="portal-empty">
          <span class="portal-empty__icon">${icon("calendarCheck", 30)}</span>
          <p>${tab === "proximas" ? "No cuentas con citas por el momento." : "Aún no tienes citas en tu historial."}</p>
          ${tab === "proximas" ? `<button class="btn btn--cta" data-go="agendar">${icon("calendar", 16)} Agenda tu cita</button>` : ""}
        </div>`;
      cont.querySelector("[data-go]")?.addEventListener("click", () => go("agendar"));
    } else {
      cont.innerHTML = `<div class="cita-list">${lista.map((c) => citaCard(c, true)).join("")}</div>`;
    }
  };

  main.querySelectorAll(".portal-tab").forEach((t) =>
    t.addEventListener("click", () => {
      main.querySelectorAll(".portal-tab").forEach((x) => x.classList.toggle("is-active", x === t));
      pintar(t.dataset.tab);
    })
  );
  pintar("proximas");

  // Gestión de citas (delegación sobre el contenedor, sobrevive al re-pintado de tabs).
  document.getElementById("citas-list").addEventListener("click", (e) => {
    const reprog = e.target.closest("[data-reprog]");
    const cancel = e.target.closest("[data-cancel]");
    if (reprog) {
      const c = byId.get(reprog.dataset.reprog);
      if (c) openReprogramarModal(c, refrescar);
    } else if (cancel) {
      const c = byId.get(cancel.dataset.cancel);
      if (c) openCancelarModal(c, refrescar);
    }
  });
}

// ---------------------------------------------------------------------
//  Documentos clínicos (categorías → detalle)
// ---------------------------------------------------------------------
async function secDocumentos(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Documentos clínicos</h1>
    <div id="docs-cont"><div class="skeleton" style="height:120px"></div></div>`;

  const res = await api.get("/api/portal/documentos");
  const docs = res.success && Array.isArray(res.data) ? res.data : [];
  const cont = document.getElementById("docs-cont");

  const cats = Object.keys(DOC_CAT).map((tipo) => ({
    tipo,
    ...DOC_CAT[tipo],
    items: docs.filter((d) => d.tipo_documento === tipo),
  }));

  cont.innerHTML = `<div class="doc-cats">${cats.map((c) => `
    <button class="doc-cat" data-tipo="${c.tipo}">
      <span class="doc-cat__icon">${icon(c.icon, 24)}</span>
      <span class="doc-cat__label">${esc(c.label)}</span>
      <span class="doc-cat__count">${c.items.length}</span>
      <span class="doc-cat__arrow">${icon("chevronRight", 18)}</span>
    </button>`).join("")}</div>
    <div id="doc-detalle"></div>`;

  cont.querySelectorAll(".doc-cat").forEach((b) =>
    b.addEventListener("click", () => {
      cont.querySelectorAll(".doc-cat").forEach((x) => x.classList.toggle("is-active", x === b));
      const cat = cats.find((c) => c.tipo === b.dataset.tipo);
      const det = document.getElementById("doc-detalle");
      det.innerHTML = cat.items.length
        ? `<div class="doc-list">${cat.items.map(docCard).join("")}</div>`
        : `<div class="portal-empty"><span class="portal-empty__icon">${icon(cat.icon, 30)}</span>
             <p>No tienes ${esc(cat.label.toLowerCase())} por el momento.</p></div>`;
    })
  );
}

// ---------------------------------------------------------------------
//  Agendar cita (selección de servicio → flujo de reserva)
// ---------------------------------------------------------------------
function secAgendar(main) {
  main.innerHTML = `
    <h1 class="portal-h1">Agendar cita</h1>
    <p class="portal-sub">Selecciona la modalidad de tu cita.</p>
    <div class="serv-list">
      ${MODALIDADES.map(([ic, id, t, d]) => `
        <button class="serv-row" data-mod="${id}">
          <span class="serv-row__icon">${icon(ic, 22)}</span>
          <span class="serv-row__body"><strong>${esc(t)}</strong><small>${esc(d)}</small></span>
          <span class="serv-row__arrow">${icon("arrowRight", 18)}</span>
        </button>`).join("")}
    </div>`;

  main.querySelectorAll(".serv-row").forEach((b) =>
    b.addEventListener("click", () =>
      startBooking({
        main,
        modalidad: b.dataset.mod,
        sesion,
        onBack: () => secAgendar(main),
        onReserved: () => go("citas"),
      })
    )
  );
}

// ---------------------------------------------------------------------
//  Mis datos (perfil)
// ---------------------------------------------------------------------
function secPerfil(main) {
  renderPerfil(main, false);
}

function renderPerfil(main, editando) {
  const s = sesion;
  const edad = calcEdad(s.fecha_nacimiento);
  const direccion = [s.direccion, s.distrito, s.provincia, s.departamento].filter(Boolean).join(", ");

  const contacto = editando
    ? `<form id="perfil-form" class="perfil-datos" novalidate>
         <div class="field" data-field="telefono">
           <label for="p_tel">Teléfono</label>
           <input class="input" id="p_tel" name="telefono" inputmode="numeric" value="${esc(s.telefono || "")}" />
           <div class="field__error"></div>
         </div>
         <div class="field" data-field="correo">
           <label for="p_cor">Correo electrónico</label>
           <input class="input" type="email" id="p_cor" name="correo" value="${esc(s.correo || "")}" />
           <div class="field__error"></div>
         </div>
         <div class="field" data-field="direccion">
           <label for="p_dir">Dirección</label>
           <input class="input" id="p_dir" name="direccion" value="${esc(s.direccion || "")}" />
           <div class="field__error"></div>
         </div>
         <div class="perfil-actions">
           <button class="btn btn--ghost btn--sm" type="button" id="perfil-cancelar">Cancelar</button>
           <button class="btn btn--primary btn--sm" type="submit" id="perfil-guardar">${icon("check", 16)} Guardar</button>
         </div>
       </form>`
    : `<div class="perfil-datos">
         <div class="perfil-field"><label>Teléfono</label><div class="perfil-value">${esc(s.telefono || "—")}</div></div>
         <div class="perfil-field"><label>Correo electrónico</label><div class="perfil-value">${esc(s.correo || "—")}</div></div>
         <div class="perfil-field"><label>Dirección</label><div class="perfil-value">${esc(direccion || "—")}</div></div>
       </div>`;

  main.innerHTML = `
    <h1 class="portal-h1">Mi perfil</h1>
    <div class="perfil-grid3">
      <aside class="perfil-card">
        <div class="perfil-avatar">${icon("user", 44)}</div>
        <h2 class="perfil-name">${esc(s.nombres)} ${esc(s.apellidos)}</h2>
        <ul class="perfil-meta">
          <li><span>Edad</span><strong>${edad >= 0 ? edad + " años" : "—"}</strong></li>
          <li><span>${esc(s.tipo_documento)}</span><strong>${esc(s.numero_documento)}</strong></li>
        </ul>
      </aside>

      <section class="portal-panel">
        <div class="perfil-head">
          <h2 class="portal-h2">Datos de contacto</h2>
          ${editando ? "" : `<button class="linklike" id="perfil-editar">${icon("user", 14)} Editar</button>`}
        </div>
        ${contacto}
      </section>

      <aside class="perfil-side">
        <div class="portal-panel portal-panel--accent">
          <h3 class="perfil-side__title">Mis seres queridos</h3>
          <p class="perfil-side__desc">Agrega familiares y agenda citas para ellos.</p>
          <button class="btn btn--ghost btn--sm" id="perfil-familiar">${icon("users", 16)} Agregar un familiar</button>
        </div>
        <div class="portal-panel">
          <h3 class="perfil-side__title">Investigación</h3>
          <p class="perfil-side__desc">¿Quieres formar parte de estudios clínicos en GastroDigest?</p>
          <div class="perfil-radios">
            <label class="radio"><input type="radio" name="investigacion" /> Sí</label>
            <label class="radio"><input type="radio" name="investigacion" checked /> No</label>
          </div>
        </div>
      </aside>
    </div>`;

  if (editando) {
    main.querySelector("#perfil-cancelar").addEventListener("click", () => renderPerfil(main, false));
    main.querySelector("#perfil-form").addEventListener("submit", (e) => guardarPerfil(e, main));
  } else {
    main.querySelector("#perfil-editar").addEventListener("click", () => renderPerfil(main, true));
  }
  main.querySelector("#perfil-familiar").addEventListener("click", () =>
    toast("La gestión de familiares estará disponible próximamente.", "info")
  );
}

async function guardarPerfil(e, main) {
  e.preventDefault();
  const form = e.currentTarget;
  clearErrors(form);
  const payload = {
    telefono: form.telefono.value.trim(),
    correo: form.correo.value.trim(),
    direccion: form.direccion.value.trim(),
  };
  const btn = form.querySelector("#perfil-guardar");
  setLoading(btn, true);
  const res = await api.patch("/api/portal/perfil", payload);
  setLoading(btn, false, `${icon("check", 16)} Guardar`);

  if (res.success) {
    Object.assign(sesion, res.data);
    toast("Datos actualizados.", "success");
    renderPerfil(main, false);
  } else if (res.status === 400) {
    applyErrors(form, res.errors);
    toast(res.message, "warning");
  } else {
    toast(res.message || "No se pudo actualizar.", "error");
  }
}

// ---------------------------------------------------------------------
//  Mis familiares (dependientes / apoderado)
// ---------------------------------------------------------------------
async function secFamiliares(main) {
  main.innerHTML = `
    <div class="admin-head">
      <h1 class="portal-h1">Mis familiares</h1>
      <button class="btn btn--cta btn--sm" id="nuevo-fam">${icon("users", 16)} Agregar familiar</button>
    </div>
    <p class="portal-sub">Registra a las personas a tu cargo (hijos, dependientes) para agendar y gestionar sus citas.</p>
    <div id="fam-form"></div>
    <div id="fam-cont"><div class="skeleton" style="height:120px"></div></div>`;
  main.querySelector("#nuevo-fam").addEventListener("click", () => toggleFamForm(main));
  await cargarFamiliares(main);
}

async function cargarFamiliares(main) {
  const res = await api.get("/api/portal/familiares");
  const fams = res.success && Array.isArray(res.data) ? res.data : [];
  const cont = main.querySelector("#fam-cont");
  if (!fams.length) {
    cont.innerHTML = `<div class="portal-empty"><span class="portal-empty__icon">${icon("users", 30)}</span><p>Aún no tienes familiares registrados.</p></div>`;
    return;
  }
  cont.innerHTML = `<div class="cita-list">${fams.map(famCard).join("")}</div>`;
}

function famCard(f) {
  const edad = calcEdad(f.fecha_nacimiento);
  const menor = edad >= 0 && edad < 18;
  return `
    <article class="cita-item">
      <span class="quick2__icon">${icon("user", 20)}</span>
      <div class="cita-item__body">
        <strong>${esc(f.nombres)} ${esc(f.apellidos)}</strong>
        <small>${esc(f.tipo_documento)} ${esc(f.numero_documento)}${edad >= 0 ? ` · ${edad} años` : ""}</small>
      </div>
      ${menor ? `<span class="badge badge--pendiente">Menor de edad</span>` : ""}
    </article>`;
}

function toggleFamForm(main) {
  const host = main.querySelector("#fam-form");
  if (host.innerHTML.trim()) { host.innerHTML = ""; return; }
  const hoy = new Date().toISOString().slice(0, 10);
  host.innerHTML = `
    <form id="familiar-form" class="portal-panel wizard-form" novalidate style="margin-bottom:var(--space-4)">
      <h2 class="portal-h2">Nuevo familiar</h2>
      <div class="form-grid">
        <div class="field" data-field="nombres"><label for="f_nom">Nombres <span class="req">*</span></label><input class="input" id="f_nom" name="nombres" autocomplete="off"/><div class="field__error"></div></div>
        <div class="field" data-field="apellidos"><label for="f_ape">Apellidos <span class="req">*</span></label><input class="input" id="f_ape" name="apellidos" autocomplete="off"/><div class="field__error"></div></div>
        <div class="field" data-field="tipo_documento"><label for="f_tdoc">Tipo de documento <span class="req">*</span></label><select class="select" id="f_tdoc" name="tipo_documento"><option value="DNI">DNI</option><option value="CE">Carné de extranjería</option><option value="PAS">Pasaporte</option></select><div class="field__error"></div></div>
        <div class="field" data-field="numero_documento"><label for="f_ndoc">Número de documento <span class="req">*</span></label><input class="input" id="f_ndoc" name="numero_documento" inputmode="numeric"/><div class="field__error"></div></div>
        <div class="field" data-field="fecha_nacimiento"><label for="f_fnac">Fecha de nacimiento <span class="req">*</span></label><input class="input" type="date" id="f_fnac" name="fecha_nacimiento" max="${hoy}"/><div class="field__error"></div></div>
        <div class="field" data-field="sexo"><label for="f_sexo">Sexo <span class="req">*</span></label><select class="select" id="f_sexo" name="sexo"><option value="M">Masculino</option><option value="F">Femenino</option><option value="X">Prefiero no decir</option></select><div class="field__error"></div></div>
      </div>
      <div class="wizard-actions">
        <button class="btn btn--ghost btn--sm" type="button" id="fam-cancelar">Cancelar</button>
        <button class="btn btn--cta btn--sm" type="submit" id="fam-guardar">${icon("check", 16)} Agregar familiar</button>
      </div>
    </form>`;
  host.querySelector("#fam-cancelar").addEventListener("click", () => { host.innerHTML = ""; });
  host.querySelector("#familiar-form").addEventListener("submit", (e) => guardarFamiliar(e, main));
}

async function guardarFamiliar(e, main) {
  e.preventDefault();
  const form = e.target;
  clearErrors(form);
  const btn = form.querySelector("#fam-guardar");
  setLoading(btn, true);
  const res = await api.post("/api/portal/familiares", {
    nombres: form.nombres.value.trim(),
    apellidos: form.apellidos.value.trim(),
    tipo_documento: form.tipo_documento.value,
    numero_documento: form.numero_documento.value.trim(),
    fecha_nacimiento: form.fecha_nacimiento.value,
    sexo: form.sexo.value,
  });
  setLoading(btn, false);
  if (res.success) {
    toast("Familiar agregado.", "success");
    main.querySelector("#fam-form").innerHTML = "";
    cargarFamiliares(main);
  } else if (res.errors) {
    applyErrors(form, res.errors);
  } else {
    toast(res.message || "No se pudo agregar el familiar.", "error");
  }
}

function calcEdad(fechaIso) {
  if (!fechaIso) return -1;
  const nac = new Date(String(fechaIso).replace(" ", "T"));
  if (isNaN(nac.getTime())) return -1;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

// ---------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------
function esProxima(c) {
  const terminal = ["ATENDIDA", "NO_ASISTIO", "CANCELADA_PACIENTE"];
  return !terminal.includes(c.estado_actual) && new Date(String(c.fecha_hora).replace(" ", "T")) >= new Date();
}

function fmtFecha(f) {
  const d = new Date(String(f).replace(" ", "T"));
  if (isNaN(d.getTime())) return esc(f);
  return d.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function citaCard(c, conAcciones = false) {
  const [label, cls] = ESTADO[c.estado_actual] || [c.estado_actual, "muted"];
  const acciones = conAcciones && esProxima(c)
    ? `<div class="cita-item__actions">
         <button class="btn btn--ghost btn--xs" type="button" data-reprog="${c.id_cita}">${icon("calendar", 14)} Reprogramar</button>
         <button class="btn btn--ghost btn--xs" type="button" data-cancel="${c.id_cita}">${icon("x", 14)} Cancelar</button>
       </div>`
    : "";
  return `
    <article class="cita-item">
      <span class="cita-item__date">${icon("calendar", 16)} ${fmtFecha(c.fecha_hora)}</span>
      <div class="cita-item__body">
        <strong>Dr(a). ${esc(c.medico)}</strong>
        <small>${esc(c.especialidad)}</small>
        ${c.motivo ? `<small class="cita-item__motivo">${esc(c.motivo)}</small>` : ""}
      </div>
      <span class="badge badge--${cls}">${esc(label)}</span>
      ${acciones}
    </article>`;
}

function docCard(d) {
  const cat = DOC_CAT[d.tipo_documento];
  return `
    <article class="doc-card">
      <span class="doc-card__type">${icon(cat?.icon || "file", 16)} ${esc(cat?.label || d.tipo_documento)}</span>
      <span class="doc-card__title">${esc(d.titulo)}</span>
      ${d.descripcion ? `<span class="doc-card__meta">${esc(d.descripcion)}</span>` : ""}
      <span class="doc-card__meta">Emitido el ${esc(d.fecha_emision)}${d.medico_emisor ? ` · ${esc(d.medico_emisor)}` : ""}</span>
    </article>`;
}
