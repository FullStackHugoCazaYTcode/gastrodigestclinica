// =====================================================================
//  views/portalBooking.js — Wizard de reserva dentro del portal (4 pasos).
//   Servicio (presencial/virtual) → Paso 1 especialista (por médico o
//   especialidad) → Paso 2 fecha y hora → Paso 3 financiamiento →
//   Paso 4 confirmar y pagar → crea la cita + OTP.
// =====================================================================
import { api } from "../api.js";
import { icon, esc, toast, setLoading } from "../ui.js";
import { openOtpModal } from "../otpModal.js";

const PASOS = ["Especialista", "Fecha y hora", "Financiamiento", "Confirmar"];
const MODALIDAD = { presencial: "Presencial", virtual: "Virtual" };
const PRECIOS = { "Endoscopía Digestiva": 280, Hepatología: 150, Gastroenterología: 120 };
const PRECIO_DEFAULT = 120;
const SEDES = [
  "Sede Central — Jr. Dos de Mayo 1234, Huánuco",
  "Sede Amarilis — Av. Los Laureles 550, Amarilis",
];

// Franjas 08:00–19:30 agrupadas por Mañana / Tarde / Noche.
const SLOTS = [];
for (let h = 8; h <= 19; h++) for (const m of [0, 30]) SLOTS.push(h * 60 + m);
const toHHMM = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
const fmtHora = (mins) => {
  const h = Math.floor(mins / 60), m = mins % 60;
  const ap = h < 12 ? "a.m." : "p.m.";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
};
const franja = (mins) => (mins < 12 * 60 ? "Mañana" : mins < 18 * 60 ? "Tarde" : "Noche");
const HOY = new Date().toISOString().slice(0, 10);
const precioDe = (esp) => PRECIOS[esp] ?? PRECIO_DEFAULT;
// Normaliza para búsqueda sin acentos ("lucia" encuentra "Lucía").
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

let st, ctx;

/** context = { main, modalidad: 'presencial'|'virtual', sesion, onReserved } */
export function startBooking(context) {
  ctx = context;
  st = {
    via: null, medico: null, especialidad: null, sede: SEDES[0],
    fecha: "", hora: "", horaLabel: "", seguro: false, financiamiento: "particular",
    precio: 0, medicos: [],
  };
  preStep();
}

// ---------------------------------------------------------------------
//  Pre-paso: ¿para quién? + ¿cómo agendar?
// ---------------------------------------------------------------------
function preStep() {
  ctx.main.innerHTML = `
    <button class="linklike portal-back" id="b-volver-serv">${icon("arrowRight", 16)} Volver</button>
    <h1 class="portal-h1">Agendar cita — ${MODALIDAD[ctx.modalidad]}</h1>
    <p class="portal-sub">Selecciona el paciente y cómo deseas agendar tu cita.</p>

    <div class="book-block">
      <h2 class="book-label">¿Para quién es la cita?</h2>
      <div class="book-titular">${icon("user", 18)} (Titular) ${esc(ctx.sesion.nombres)} ${esc(ctx.sesion.apellidos)}</div>
    </div>

    <div class="book-block">
      <h2 class="book-label">¿Cómo deseas agendar tu cita?</h2>
      <div class="book-choose">
        <button class="book-choice" data-via="medico">
          <span class="book-choice__icon">${icon("stethoscope", 26)}</span>
          <strong>Por médico</strong><small>Busca a tu especialista por nombre</small>
        </button>
        <button class="book-choice" data-via="especialidad">
          <span class="book-choice__icon">${icon("search", 26)}</span>
          <strong>Por especialidad</strong><small>Filtra por área médica</small>
        </button>
      </div>
    </div>`;

  ctx.main.querySelector("#b-volver-serv").addEventListener("click", () => ctx.onBack());
  ctx.main.querySelectorAll(".book-choice").forEach((b) =>
    b.addEventListener("click", () => { st.via = b.dataset.via; irPaso(1); })
  );
}

// ---------------------------------------------------------------------
//  Cascarón de pasos con stepper + resumen lateral
// ---------------------------------------------------------------------
function shell(inner, { fechaHora = false, financiamiento = false } = {}) {
  return `
    <button class="linklike portal-back" id="b-volver">${icon("arrowRight", 16)} Regresar</button>
    <h1 class="portal-h1">Agendar cita</h1>
    ${stepper()}
    <div class="book-layout">
      <div class="book-main">${inner}</div>
      ${resumen(fechaHora, financiamiento)}
    </div>`;
}

function stepper() {
  return `<ol class="book-stepper">${PASOS.map((p, i) => {
    const n = i + 1;
    const cls = n < st.paso ? "is-done" : n === st.paso ? "is-active" : "";
    const dot = n < st.paso ? icon("check", 14) : n;
    return `<li class="${cls}"><span class="book-stepper__dot">${dot}</span><span class="book-stepper__label">Paso ${n}</span></li>`;
  }).join("")}</ol>`;
}

function resumen(fechaHora, financiamiento) {
  const m = st.medico;
  const row = (t, v) => `<div class="book-summary__row"><dt>${t}</dt><dd>${v}</dd></div>`;
  return `
    <aside class="book-summary">
      <h3>Resumen de la cita</h3>
      <dl>
        ${row("Paciente", `${esc(ctx.sesion.nombres)} ${esc(ctx.sesion.apellidos)}`)}
        ${row("Médico", m ? `Dr(a). ${esc(m.nombres)} ${esc(m.apellidos)}` : "—")}
        ${row("Especialidad", esc(st.especialidad || "—"))}
        ${row("Modalidad", MODALIDAD[ctx.modalidad])}
        ${ctx.modalidad === "presencial" ? row("Sede", esc(st.sede)) : ""}
        ${fechaHora ? row("Fecha", esc(st.fecha || "—")) + row("Hora", esc(st.horaLabel || "—")) : ""}
        ${financiamiento ? row("Financiamiento", st.financiamiento === "particular" ? "Paciente particular" : "Convenio") + row("Precio", `S/ ${st.precio.toFixed(2)}`) : ""}
      </dl>
    </aside>`;
}

function refrescarResumen() {
  const aside = ctx.main.querySelector(".book-summary");
  if (aside) aside.outerHTML = resumen(st.paso >= 2, st.paso >= 3);
}

function irPaso(n) {
  st.paso = n;
  ({ 1: paso1, 2: paso2, 3: paso3, 4: paso4 }[n])();
  const back = ctx.main.querySelector("#b-volver");
  if (back) back.addEventListener("click", () => (n === 1 ? preStep() : irPaso(n - 1)));
}

// ---------------------------------------------------------------------
//  Paso 1 — Especialista (por médico o por especialidad)
// ---------------------------------------------------------------------
async function paso1() {
  const buscador = st.via === "medico"
    ? `<div class="book-search">${icon("search", 18)}<input id="b-buscar" placeholder="Ingresa el nombre del médico" /></div>`
    : `<div class="book-esp" id="b-esp"></div>`;
  ctx.main.innerHTML = shell(`
    <h2 class="book-h2">${st.via === "medico" ? "Agendar por médico" : "Agendar por especialidad"}</h2>
    ${buscador}
    <div class="med-grid" id="b-medgrid"><div class="skeleton" style="height:96px"></div></div>`);

  if (!st.medicos.length) {
    const res = await api.get("/api/medicos");
    st.medicos = res.success && Array.isArray(res.data) ? res.data : [];
  }
  const grid = ctx.main.querySelector("#b-medgrid");

  if (st.via === "especialidad") {
    const esps = [...new Set(st.medicos.map((m) => m.especialidad))];
    const cont = ctx.main.querySelector("#b-esp");
    cont.innerHTML = esps.map((e) => `<button class="esp-chip" data-esp="${esc(e)}">${esc(e)}</button>`).join("");
    cont.querySelectorAll(".esp-chip").forEach((b) =>
      b.addEventListener("click", () => {
        cont.querySelectorAll(".esp-chip").forEach((x) => x.classList.toggle("is-active", x === b));
        pintarMedicos(grid, st.medicos.filter((m) => m.especialidad === b.dataset.esp));
      })
    );
    pintarMedicos(grid, []);
  } else {
    pintarMedicos(grid, st.medicos);
    const inp = ctx.main.querySelector("#b-buscar");
    inp.addEventListener("input", () => {
      const q = norm(inp.value.trim());
      pintarMedicos(grid, st.medicos.filter((m) => norm(`${m.nombres} ${m.apellidos}`).includes(q)));
    });
  }
}

function pintarMedicos(grid, lista) {
  if (!lista.length) {
    grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1">${st.via === "especialidad" ? "Elige una especialidad para ver médicos." : "No se encontraron médicos."}</p>`;
    return;
  }
  grid.innerHTML = lista.map(medSelCard).join("");
  grid.querySelectorAll(".medsel").forEach((b) =>
    b.addEventListener("click", () => {
      const m = st.medicos.find((x) => String(x.id_medico) === b.dataset.id);
      st.medico = m; st.especialidad = m.especialidad; st.precio = precioDe(m.especialidad);
      irPaso(2);
    })
  );
}

function medSelCard(m) {
  const ini = ((m.nombres?.[0] || "") + (m.apellidos?.[0] || "")).toUpperCase();
  const foto = m.foto ? `<img src="${esc(m.foto)}" alt="" loading="lazy" />` : `<span class="medsel__ini">${esc(ini)}</span>`;
  return `<button class="medsel" data-id="${m.id_medico}">
    <span class="medsel__photo">${foto}</span>
    <span class="medsel__body"><strong>Dr(a). ${esc(m.nombres)} ${esc(m.apellidos)}</strong><small>${esc(m.especialidad)}</small></span>
    <span class="medsel__arrow">${icon("chevronRight", 18)}</span>
  </button>`;
}

// ---------------------------------------------------------------------
//  Paso 2 — Modalidad (sede), fecha y hora
// ---------------------------------------------------------------------
function paso2() {
  const sedeHTML = ctx.modalidad === "presencial"
    ? `<div class="field"><label for="b-sede">Sede</label>
         <select class="select" id="b-sede">${SEDES.map((s) => `<option${s === st.sede ? " selected" : ""}>${esc(s)}</option>`).join("")}</select></div>`
    : `<div class="field"><label>Modalidad</label><div class="book-static">${icon("message", 16)} Cita virtual (videollamada)</div></div>`;

  ctx.main.innerHTML = shell(`
    <h2 class="book-h2">Modalidad, fecha y hora</h2>
    <div class="book-row2">
      ${sedeHTML}
      <div class="field"><label for="b-fecha">Fecha</label>
        <input class="input" type="date" id="b-fecha" min="${HOY}" value="${st.fecha}" /></div>
    </div>
    <label class="book-label">Selecciona la hora</label>
    <div id="b-horas" class="book-horas"><p class="text-muted">Elige una fecha para ver los horarios.</p></div>
    <div class="wizard-actions">
      <button class="btn btn--primary" id="b-cont2" disabled>Continuar ${icon("arrowRight", 18)}</button>
    </div>`, { fechaHora: true });

  const sede = ctx.main.querySelector("#b-sede");
  if (sede) sede.addEventListener("change", () => { st.sede = sede.value; refrescarResumen(); });

  const fecha = ctx.main.querySelector("#b-fecha");
  const cont = ctx.main.querySelector("#b-cont2");
  const horas = ctx.main.querySelector("#b-horas");

  const pintarHoras = async () => {
    st.fecha = fecha.value; st.hora = ""; st.horaLabel = ""; cont.disabled = true; refrescarResumen();
    if (!st.fecha) { horas.innerHTML = `<p class="text-muted">Elige una fecha para ver los horarios.</p>`; return; }

    // Disponibilidad real del médico para esa fecha (horario − bloqueos − citas tomadas).
    horas.innerHTML = `<div class="skeleton" style="height:80px"></div>`;
    const res = await api.get(`/api/medicos/${st.medico.id_medico}/disponibilidad?fecha=${encodeURIComponent(st.fecha)}`);
    const libres = new Set(res.success && Array.isArray(res.data?.slots) ? res.data.slots : []);
    if (!libres.size) {
      horas.innerHTML = `<p class="text-muted">No hay cupos disponibles ese día. Prueba con otra fecha.</p>`;
      return;
    }

    const grupos = ["Mañana", "Tarde", "Noche"];
    horas.innerHTML = grupos.map((g) => {
      const slots = SLOTS.filter((s) => franja(s) === g && libres.has(toHHMM(s)));
      if (!slots.length) return "";
      return `<div class="book-hgroup"><span class="book-hgroup__t">${g}</span>
        <div class="book-hchips">${slots.map((s) => `<button class="hchip" data-hhmm="${toHHMM(s)}" data-lbl="${fmtHora(s)}">${fmtHora(s)}</button>`).join("")}</div></div>`;
    }).join("");
    horas.querySelectorAll(".hchip").forEach((b) =>
      b.addEventListener("click", () => {
        horas.querySelectorAll(".hchip").forEach((x) => x.classList.toggle("is-active", x === b));
        st.hora = b.dataset.hhmm; st.horaLabel = b.dataset.lbl; cont.disabled = false; refrescarResumen();
      })
    );
  };
  fecha.addEventListener("change", pintarHoras);
  if (st.fecha) pintarHoras();

  cont.addEventListener("click", () => { if (st.fecha && st.hora) irPaso(3); });
}

// ---------------------------------------------------------------------
//  Paso 3 — Financiamiento
// ---------------------------------------------------------------------
function paso3() {
  ctx.main.innerHTML = shell(`
    <h2 class="book-h2">Financiamiento</h2>
    <fieldset class="book-fieldset">
      <legend>¿Cuentas con seguro?</legend>
      <label class="radio"><input type="radio" name="seguro" value="si"${st.seguro ? " checked" : ""}/> Sí</label>
      <label class="radio"><input type="radio" name="seguro" value="no"${!st.seguro ? " checked" : ""}/> No</label>
    </fieldset>
    <fieldset class="book-fieldset">
      <legend>Otros tipos de financiamiento</legend>
      <label class="radio"><input type="radio" name="fin" value="particular"${st.financiamiento === "particular" ? " checked" : ""}/> Paciente particular</label>
      <label class="radio"><input type="radio" name="fin" value="convenio"${st.financiamiento === "convenio" ? " checked" : ""}/> Convenio</label>
    </fieldset>
    <div class="book-precio"><span>Precio</span><strong>S/ ${st.precio.toFixed(2)}</strong></div>
    <div class="wizard-actions">
      <button class="btn btn--primary" id="b-cont3">Continuar ${icon("arrowRight", 18)}</button>
    </div>`, { fechaHora: true, financiamiento: true });

  ctx.main.querySelectorAll('input[name="seguro"]').forEach((r) =>
    r.addEventListener("change", () => { st.seguro = r.value === "si"; }));
  ctx.main.querySelectorAll('input[name="fin"]').forEach((r) =>
    r.addEventListener("change", () => { st.financiamiento = r.value; }));
  ctx.main.querySelector("#b-cont3").addEventListener("click", () => irPaso(4));
}

// ---------------------------------------------------------------------
//  Paso 4 — Confirmar y pagar
// ---------------------------------------------------------------------
function paso4() {
  const m = st.medico;
  const det = (t, v) => `<div class="book-detrow"><span>${t}</span><strong>${v}</strong></div>`;
  ctx.main.innerHTML = shell(`
    <h2 class="book-h2">Confirma y paga tu cita</h2>
    <div class="book-detalle">
      ${det("Paciente", `${esc(ctx.sesion.nombres)} ${esc(ctx.sesion.apellidos)}`)}
      ${det("Médico", `Dr(a). ${esc(m.nombres)} ${esc(m.apellidos)}`)}
      ${det("Especialidad", esc(st.especialidad))}
      ${det("Modalidad", MODALIDAD[ctx.modalidad])}
      ${ctx.modalidad === "presencial" ? det("Sede", esc(st.sede)) : ""}
      ${det("Fecha", esc(st.fecha))}
      ${det("Hora", esc(st.horaLabel))}
      ${det("Financiamiento", st.financiamiento === "particular" ? "Paciente particular" : "Convenio")}
    </div>
    <div class="book-total"><span>Total a pagar</span><strong>S/ ${st.precio.toFixed(2)}</strong></div>
    <div class="wizard-actions">
      <button class="btn btn--cta btn--lg" id="b-pagar">${icon("lock", 18)} Pagar y confirmar</button>
    </div>
    <p class="book-nota">${icon("shieldCheck", 14)} Pago seguro. Validaremos tu identidad con un código enviado a tu correo.</p>`,
    { fechaHora: true, financiamiento: true });

  ctx.main.querySelector("#b-pagar").addEventListener("click", confirmar);
}

async function confirmar() {
  const btn = ctx.main.querySelector("#b-pagar");
  setLoading(btn, true);
  const motivo = `${MODALIDAD[ctx.modalidad]} · ${st.especialidad} · ${st.financiamiento === "particular" ? "Particular" : "Convenio"}`;
  const res = await api.post("/api/citas", {
    id_paciente: ctx.sesion.id_paciente,
    id_medico: st.medico.id_medico,
    fecha_hora: `${st.fecha} ${st.hora}:00`,
    motivo,
  });
  setLoading(btn, false);
  if (!res.success) {
    toast(res.message || "No se pudo crear la cita.", "error");
    return;
  }
  openOtpModal(res.data.id_cita, {
    otpEnviado: res.data.otp_enviado,
    onSuccess: () => { toast("¡Cita reservada y confirmada!", "success"); ctx.onReserved(); },
  });
}
