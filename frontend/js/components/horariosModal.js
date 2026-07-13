// =====================================================================
//  horariosModal.js — Panel del admin para gestionar la disponibilidad de
//  un médico: horario semanal recurrente + bloqueos por fecha (ausencias).
// =====================================================================
import { api } from "../api.js";
import { icon, el, esc, toast, setLoading } from "../ui.js";

const DIAS = [null, "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const hhmm = (t) => (t ? String(t).slice(0, 5) : "");
const hoyISO = () => new Date().toISOString().slice(0, 10);

export function openHorariosModal(medico) {
  const idm = medico.id_medico;
  const nombre = `Dr(a). ${medico.nombres} ${medico.apellidos}`;
  const root = document.getElementById("modal-root");
  const prevFocus = document.activeElement;

  const backdrop = el(`
    <div class="modal-backdrop">
      <div class="modal modal--wide" role="dialog" aria-modal="true" aria-label="Horarios de ${esc(nombre)}">
        <div class="modal__head">
          <div class="card__title" style="margin:0">
            <span class="card__icon">${icon("calendar")}</span>
            <h2>Horarios · ${esc(nombre)}</h2>
          </div>
          <button class="modal__close" type="button" data-close aria-label="Cerrar">${icon("x")}</button>
        </div>
        <div class="hor-body" id="hor-body"><div class="skeleton" style="height:180px"></div></div>
      </div>
    </div>`);
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
  backdrop.querySelector("[data-close]").addEventListener("click", close);

  const body = backdrop.querySelector("#hor-body");

  const cargar = async () => {
    const res = await api.get(`/api/admin/medicos/${idm}/horarios`);
    const horarios = res.success && Array.isArray(res.data?.horarios) ? res.data.horarios : [];
    const bloqueos = res.success && Array.isArray(res.data?.bloqueos) ? res.data.bloqueos : [];

    const porDia = {};
    horarios.forEach((h) => { (porDia[h.dia_semana] ||= []).push(h); });

    const diasHTML = [1, 2, 3, 4, 5, 6, 7].map((d) => {
      const items = (porDia[d] || [])
        .map((h) => `<span class="hor-chip">${hhmm(h.hora_inicio)}–${hhmm(h.hora_fin)}<button type="button" class="hor-x" data-del-h="${h.id_horario}" aria-label="Quitar">×</button></span>`)
        .join("");
      return `<div class="hor-day"><span class="hor-day__n">${DIAS[d]}</span>
        <div class="hor-day__b">${items || '<span class="text-muted" style="font-size:var(--text-sm)">Sin atención</span>'}</div></div>`;
    }).join("");

    const bloqHTML = bloqueos.length
      ? bloqueos.map((b) => {
          const rango = b.hora_inicio ? `${hhmm(b.hora_inicio)}–${hhmm(b.hora_fin)}` : "Todo el día";
          return `<div class="hor-bloq"><div><strong>${esc(b.fecha)}</strong> · ${rango}${b.motivo ? ` · ${esc(b.motivo)}` : ""}</div>
            <button type="button" class="hor-x" data-del-b="${b.id_bloqueo}" aria-label="Quitar">×</button></div>`;
        }).join("")
      : `<p class="text-muted" style="font-size:var(--text-sm)">Sin bloqueos próximos.</p>`;

    body.innerHTML = `
      <h3 class="hor-h3">Horario semanal</h3>
      <div class="hor-days">${diasHTML}</div>
      <form id="hor-add" class="hor-form">
        <select class="select" id="hor-dia" aria-label="Día">${[1, 2, 3, 4, 5, 6, 7].map((d) => `<option value="${d}">${DIAS[d]}</option>`).join("")}</select>
        <input class="input" type="time" id="hor-ini" value="08:00" aria-label="Hora inicio" />
        <input class="input" type="time" id="hor-fin" value="18:00" aria-label="Hora fin" />
        <button class="btn btn--primary btn--sm" type="submit">${icon("check", 14)} Agregar</button>
      </form>

      <h3 class="hor-h3" style="margin-top:var(--space-5)">Bloqueos (vacaciones / feriados)</h3>
      <div class="hor-bloqs">${bloqHTML}</div>
      <form id="bloq-add" class="hor-form">
        <input class="input" type="date" id="bloq-fecha" min="${hoyISO()}" aria-label="Fecha a bloquear" />
        <input class="input" type="time" id="bloq-ini" aria-label="Desde (opcional)" />
        <input class="input" type="time" id="bloq-fin" aria-label="Hasta (opcional)" />
        <input class="input" id="bloq-motivo" placeholder="Motivo (opcional)" maxlength="160" aria-label="Motivo" />
        <button class="btn btn--primary btn--sm" type="submit">${icon("check", 14)} Bloquear</button>
      </form>
      <p class="text-muted" style="font-size:var(--text-xs);margin-top:var(--space-2)">Deja las horas vacías para bloquear el día completo.</p>`;

    body.querySelectorAll("[data-del-h]").forEach((b) =>
      b.addEventListener("click", async () => {
        const r = await api.post(`/api/admin/medicos/${idm}/horarios/${b.dataset.delH}/eliminar`, {});
        if (r.success) { toast("Horario eliminado.", "info"); cargar(); }
        else toast(r.message || "No se pudo eliminar.", "error");
      })
    );
    body.querySelectorAll("[data-del-b]").forEach((b) =>
      b.addEventListener("click", async () => {
        const r = await api.post(`/api/admin/medicos/${idm}/bloqueos/${b.dataset.delB}/eliminar`, {});
        if (r.success) { toast("Bloqueo eliminado.", "info"); cargar(); }
        else toast(r.message || "No se pudo eliminar.", "error");
      })
    );

    body.querySelector("#hor-add").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      setLoading(btn, true);
      const r = await api.post(`/api/admin/medicos/${idm}/horarios`, {
        dia_semana: Number(body.querySelector("#hor-dia").value),
        hora_inicio: body.querySelector("#hor-ini").value,
        hora_fin: body.querySelector("#hor-fin").value,
      });
      if (r.success) { toast("Horario agregado.", "success"); cargar(); }
      else { setLoading(btn, false); toast(r.message || "No se pudo agregar.", "error"); }
    });

    body.querySelector("#bloq-add").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fecha = body.querySelector("#bloq-fecha").value;
      if (!fecha) { toast("Elige una fecha.", "warning"); return; }
      const btn = e.target.querySelector('button[type="submit"]');
      setLoading(btn, true);
      const r = await api.post(`/api/admin/medicos/${idm}/bloqueos`, {
        fecha,
        hora_inicio: body.querySelector("#bloq-ini").value,
        hora_fin: body.querySelector("#bloq-fin").value,
        motivo: body.querySelector("#bloq-motivo").value,
      });
      if (r.success) { toast("Bloqueo agregado.", "success"); cargar(); }
      else { setLoading(btn, false); toast(r.message || "No se pudo bloquear.", "error"); }
    });
  };

  cargar();
}
