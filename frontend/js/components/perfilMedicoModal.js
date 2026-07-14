// =====================================================================
//  perfilMedicoModal.js — Editar el perfil público de un médico (admin):
//  foto, sub-especialidad, años de experiencia, formación y biografía.
// =====================================================================
import { api } from "../api.js";
import { icon, el, esc, toast, setLoading } from "../ui.js";

export function openPerfilMedicoModal(medico, onSaved) {
  const nombre = `Dr(a). ${medico.nombres} ${medico.apellidos}`;
  const root = document.getElementById("modal-root");
  const prevFocus = document.activeElement;
  const val = (v) => esc(v == null ? "" : String(v));

  const backdrop = el(`
    <div class="modal-backdrop">
      <div class="modal modal--wide" role="dialog" aria-modal="true" aria-label="Perfil de ${esc(nombre)}">
        <div class="modal__head">
          <div class="card__title" style="margin:0">
            <span class="card__icon">${icon("user")}</span>
            <h2>Perfil · ${esc(nombre)}</h2>
          </div>
          <button class="modal__close" type="button" data-close aria-label="Cerrar">${icon("x")}</button>
        </div>

        <form id="perfil-form" class="hor-body" novalidate>
          <div class="field" data-field="foto">
            <label for="pf-foto">Foto (ruta o URL)</label>
            <input class="input" id="pf-foto" name="foto" value="${val(medico.foto)}" placeholder="/img/medicos/dr-apellido.jpg" />
            <div class="field__error"></div>
          </div>
          <div class="form-grid">
            <div class="field" data-field="sub_especialidad">
              <label for="pf-sub">Sub-especialidad / área</label>
              <input class="input" id="pf-sub" name="sub_especialidad" value="${val(medico.sub_especialidad)}" placeholder="Ej. Endoscopía avanzada" />
              <div class="field__error"></div>
            </div>
            <div class="field" data-field="anios_experiencia">
              <label for="pf-exp">Años de experiencia</label>
              <input class="input" type="number" min="0" max="70" id="pf-exp" name="anios_experiencia" value="${val(medico.anios_experiencia)}" placeholder="Ej. 15" />
              <div class="field__error"></div>
            </div>
          </div>
          <div class="field" data-field="formacion">
            <label for="pf-form">Formación / universidad</label>
            <input class="input" id="pf-form" name="formacion" value="${val(medico.formacion)}" placeholder="Ej. UNMSM · Especialidad en el INEN" />
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="bio">
            <label for="pf-bio">Biografía / descripción</label>
            <textarea class="textarea" id="pf-bio" name="bio" rows="4" maxlength="800" placeholder="Trayectoria y enfoque del médico.">${val(medico.bio)}</textarea>
            <div class="field__error"></div>
          </div>
          <div class="modal__actions">
            <button class="btn btn--ghost" type="button" data-close>Cancelar</button>
            <button class="btn btn--cta" type="submit" id="pf-guardar">${icon("check", 16)} Guardar perfil</button>
          </div>
        </form>
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
  backdrop.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));

  backdrop.querySelector("#perfil-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector("#pf-guardar");
    setLoading(btn, true);
    const res = await api.patch(`/api/admin/medicos/${medico.id_medico}/perfil`, {
      foto: form.foto.value.trim(),
      sub_especialidad: form.sub_especialidad.value.trim(),
      anios_experiencia: form.anios_experiencia.value.trim(),
      formacion: form.formacion.value.trim(),
      bio: form.bio.value.trim(),
    });
    if (res.success) {
      toast("Perfil actualizado.", "success");
      close();
      onSaved?.();
      return;
    }
    setLoading(btn, false);
    toast(res.message || "No se pudo guardar el perfil.", "error");
  });
}
