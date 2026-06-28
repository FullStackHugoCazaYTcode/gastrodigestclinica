// =====================================================================
//  views/reprogramar.js — Reprogramación de cita vía token (link de n8n).
//  Ruta: /reprogramar/:token
// =====================================================================
import { api } from "../api.js";
import { mount, icon, toast, setLoading } from "../ui.js";

const HOY = new Date().toISOString().slice(0, 10);
const HORAS = [];
for (let h = 8; h <= 17; h++) {
  for (const m of [0, 30]) HORAS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}

export async function renderReprogramar({ token }) {
  mount(`<div class="card"><div class="skeleton" style="height:140px"></div></div>`);

  const res = await api.get(`/api/reprogramar/${encodeURIComponent(token)}`);
  if (!res.success) {
    mount(`
      <div class="card">
        <div class="state">
          <div class="state__icon state__icon--info">${icon("alert", 32)}</div>
          <h1>Enlace no válido</h1>
          <p class="text-muted">${res.message || "El enlace de reprogramación expiró o no existe."}</p>
          <div class="actions"><a class="btn btn--primary" href="/" data-link>Ir al inicio</a></div>
        </div>
      </div>`);
    return;
  }

  mount(`
    <section class="hero">
      <span class="eyebrow">${icon("refresh", 16)} Reprogramación</span>
      <h1>Reprograma tu cita</h1>
      <p>Elige una nueva fecha y hora disponibles para tu atención.</p>
    </section>

    <div class="card" style="max-width:520px">
      <div class="summary" style="margin-top:0">
        <div class="summary__row"><span>Horario actual</span><span>${res.data.fecha_hora_actual}</span></div>
        <div class="summary__row"><span>Estado</span><span>${res.data.estado}</span></div>
      </div>

      <form id="reprog-form" novalidate>
        <div class="form-grid mt-4">
          <div class="field" data-field="fecha">
            <label for="r_fecha">Nueva fecha <span class="req">*</span></label>
            <input class="input" type="date" id="r_fecha" name="fecha" min="${HOY}" />
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="hora">
            <label for="r_hora">Nueva hora <span class="req">*</span></label>
            <select class="select" id="r_hora" name="hora">
              <option value="">Selecciona…</option>
              ${HORAS.map((h) => `<option value="${h}">${h}</option>`).join("")}
            </select>
            <div class="field__error"></div>
          </div>
        </div>
        <button class="btn btn--cta btn--block mt-6" type="submit" id="reprog-btn">
          ${icon("refresh")} Confirmar nueva fecha
        </button>
      </form>
    </div>
  `);

  const form = document.getElementById("reprog-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fecha = form.fecha.value;
    const hora = form.hora.value;
    if (!fecha || !hora) {
      toast("Selecciona la nueva fecha y hora.", "warning");
      return;
    }

    const btn = document.getElementById("reprog-btn");
    setLoading(btn, true);
    const out = await api.patch(`/api/reprogramar/${encodeURIComponent(token)}`, {
      nueva_fecha_hora: `${fecha} ${hora}:00`,
    });
    setLoading(btn, false);

    if (out.success) {
      mount(`
        <div class="card">
          <div class="state">
            <div class="state__icon state__icon--success">${icon("checkCircle", 36)}</div>
            <h1>Cita reprogramada</h1>
            <p class="text-muted">Tu cita quedó agendada para el ${fecha} a las ${hora}.</p>
            <div class="actions"><a class="btn btn--primary" href="/" data-link>Volver al inicio</a></div>
          </div>
        </div>`);
    } else {
      toast(out.message || "No se pudo reprogramar.", "error");
    }
  });
}
