// =====================================================================
//  gestionCita.js — Modales para reprogramar y cancelar una cita desde
//  el portal del paciente. Reutiliza el patrón de modal (otpModal) y los
//  estilos de horarios del asistente de reserva (.book-horas / .hchip).
// =====================================================================
import { api } from "../api.js";
import { icon, el, esc, toast, setLoading } from "../ui.js";

// Slots cada 30 min de 8:00 a 19:30 (mismo esquema que la reserva).
const SLOTS = [];
for (let h = 8; h <= 19; h++) for (const m of [0, 30]) SLOTS.push(h * 60 + m);

const GRUPOS = [
  ["Mañana", (min) => min < 12 * 60],
  ["Tarde", (min) => min >= 12 * 60 && min < 18 * 60],
  ["Noche", (min) => min >= 18 * 60],
];

const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const fmtHora = (min) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h < 12 ? "a. m." : "p. m.";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
};
const hoyISO = () => new Date().toISOString().slice(0, 10);
const fmtFecha = (f) => {
  const d = new Date(String(f).replace(" ", "T"));
  return isNaN(d.getTime())
    ? esc(f)
    : d.toLocaleString("es-PE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

function mountModal(inner) {
  const root = document.getElementById("modal-root");
  const prevFocus = document.activeElement;
  const backdrop = el(`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true">${inner}</div></div>`);
  root.appendChild(backdrop);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
    prevFocus?.focus?.();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  backdrop.addEventListener("mousedown", (e) => { if (e.target === backdrop) close(); });
  backdrop.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  return { backdrop, close };
}

// ---------------------------------------------------------------------
//  Cancelar cita
// ---------------------------------------------------------------------
export function openCancelarModal(cita, onDone) {
  const { backdrop, close } = mountModal(`
    <div class="modal__head">
      <div class="card__title" style="margin:0">
        <span class="card__icon">${icon("warning")}</span>
        <h2>Cancelar cita</h2>
      </div>
      <button class="modal__close" type="button" data-close aria-label="Cerrar">${icon("x")}</button>
    </div>
    <p class="text-muted mt-4" style="font-size:var(--text-sm)">
      ¿Seguro que deseas cancelar tu cita con <strong>Dr(a). ${esc(cita.medico)}</strong>
      del <strong>${fmtFecha(cita.fecha_hora)}</strong>? Esta acción no se puede deshacer.
    </p>
    <div class="modal__actions">
      <button class="btn btn--ghost" type="button" data-close>No, mantener</button>
      <button class="btn btn--danger" type="button" id="gc-confirm">Sí, cancelar</button>
    </div>`);

  backdrop.querySelector("#gc-confirm").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    setLoading(btn, true);
    const res = await api.patch(`/api/portal/citas/${cita.id_cita}/cancelar`);
    if (res.success) {
      toast("Tu cita fue cancelada.", "success");
      close();
      onDone?.();
      return;
    }
    setLoading(btn, false);
    toast(res.message || "No se pudo cancelar la cita.", "error");
  });
}

// ---------------------------------------------------------------------
//  Reprogramar cita
// ---------------------------------------------------------------------
export function openReprogramarModal(cita, onDone) {
  const { backdrop, close } = mountModal(`
    <div class="modal__head">
      <div class="card__title" style="margin:0">
        <span class="card__icon">${icon("calendar")}</span>
        <h2>Reprogramar cita</h2>
      </div>
      <button class="modal__close" type="button" data-close aria-label="Cerrar">${icon("x")}</button>
    </div>
    <p class="text-muted mt-4" style="font-size:var(--text-sm)">
      Elige una nueva fecha y hora para tu cita con <strong>Dr(a). ${esc(cita.medico)}</strong>.
    </p>
    <div class="field mt-4">
      <label for="gc-fecha">Nueva fecha</label>
      <input class="input" type="date" id="gc-fecha" min="${hoyISO()}" />
    </div>
    <label class="book-label mt-4">Selecciona la hora</label>
    <div id="gc-horas" class="book-horas" style="max-height:240px;overflow-y:auto">
      <p class="text-muted">Elige una fecha para ver los horarios.</p>
    </div>
    <div class="modal__actions">
      <button class="btn btn--ghost" type="button" data-close>Cancelar</button>
      <button class="btn btn--cta" type="button" id="gc-confirm" disabled>Confirmar cambio</button>
    </div>`);

  const fecha = backdrop.querySelector("#gc-fecha");
  const horas = backdrop.querySelector("#gc-horas");
  const confirm = backdrop.querySelector("#gc-confirm");
  let hhmm = "";

  const pintar = async () => {
    hhmm = "";
    confirm.disabled = true;
    if (!fecha.value) {
      horas.innerHTML = `<p class="text-muted">Elige una fecha para ver los horarios.</p>`;
      return;
    }

    // Disponibilidad real del médico (si la cita la trae). Si no, muestra todo.
    let libres = null;
    if (cita.id_medico) {
      horas.innerHTML = `<div class="skeleton" style="height:70px"></div>`;
      const res = await api.get(`/api/medicos/${cita.id_medico}/disponibilidad?fecha=${encodeURIComponent(fecha.value)}`);
      libres = new Set(res.success && Array.isArray(res.data?.slots) ? res.data.slots : []);
      if (!libres.size) {
        horas.innerHTML = `<p class="text-muted">No hay cupos disponibles ese día. Prueba con otra fecha.</p>`;
        return;
      }
    }
    const disponible = (s) => (libres ? libres.has(toHHMM(s)) : true);

    horas.innerHTML = GRUPOS.map(([label, test]) => {
      const chips = SLOTS.filter((s) => test(s) && disponible(s))
        .map((s) => `<button class="hchip" type="button" data-hhmm="${toHHMM(s)}">${fmtHora(s)}</button>`)
        .join("");
      if (!chips) return "";
      return `<div class="book-hgroup"><span class="book-hgroup__t">${label}</span><div class="book-hchips">${chips}</div></div>`;
    }).join("");
    horas.querySelectorAll(".hchip").forEach((b) =>
      b.addEventListener("click", () => {
        horas.querySelectorAll(".hchip").forEach((x) => x.classList.toggle("is-active", x === b));
        hhmm = b.dataset.hhmm;
        confirm.disabled = false;
      })
    );
  };
  fecha.addEventListener("change", pintar);

  confirm.addEventListener("click", async () => {
    if (!fecha.value || !hhmm) return;
    setLoading(confirm, true);
    const res = await api.patch(`/api/portal/citas/${cita.id_cita}/reprogramar`, {
      fecha_hora: `${fecha.value} ${hhmm}:00`,
    });
    if (res.success) {
      toast("Tu cita fue reprogramada.", "success");
      close();
      onDone?.();
      return;
    }
    setLoading(confirm, false);
    toast(res.message || "No se pudo reprogramar la cita.", "error");
  });
}
