// =====================================================================
//  views/recuperar.js — Recuperar contraseña del portal del paciente.
//  Ruta: /recuperar · 1) documento → código al correo · 2) código + nueva clave
// =====================================================================
import { api } from "../api.js";
import { mount, icon, esc, toast, clearErrors, setFieldError, applyErrors, setLoading } from "../ui.js";
import { validarDocumento } from "../validators.js";

let estado = { tipo: "DNI", numero: "" };

export function renderRecuperar() {
  // Es parte de la app del portal: sin el chrome de marketing.
  document.body.classList.add("portal-mode");
  estado = { tipo: "DNI", numero: "" };
  paso1();
}

function shell(inner) {
  return `
    <div class="card" style="max-width:460px;margin-inline:auto">
      <div class="card__title">
        <span class="card__icon">${icon("shield")}</span>
        <h1>Recuperar contraseña</h1>
      </div>
      ${inner}
    </div>`;
}

// ---------------------------------------------------------------------
//  Paso 1 — Documento
// ---------------------------------------------------------------------
function paso1() {
  mount(shell(`
    <p class="text-muted mt-2" style="font-size:var(--text-sm)">
      Ingresa tu documento y te enviaremos un código a tu correo registrado.
    </p>
    <form id="rec1" class="wizard-form mt-4" novalidate>
      <div class="field" data-field="tipo_documento">
        <label for="rc_tipo">Tipo de documento</label>
        <select class="select" id="rc_tipo" name="tipo_documento">
          <option value="DNI">DNI</option>
          <option value="CE">Carné de Extranjería</option>
          <option value="PAS">Pasaporte</option>
        </select>
        <div class="field__error"></div>
      </div>
      <div class="field" data-field="numero_documento">
        <label for="rc_num">Número de documento</label>
        <input class="input" id="rc_num" name="numero_documento" inputmode="numeric" value="${esc(estado.numero)}" />
        <div class="field__error"></div>
      </div>
      <button class="btn btn--primary btn--block mt-5" type="submit" id="rec1-btn">${icon("mail", 18)} Enviar código</button>
      <p class="wizard-alt mt-4">¿Recordaste tu contraseña? <a href="/portal" data-link>Inicia sesión</a></p>
    </form>`));

  const form = document.getElementById("rec1");
  form.tipo_documento.value = estado.tipo;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);
    const tipo = form.tipo_documento.value;
    const num = form.numero_documento.value.trim();
    const err = validarDocumento(tipo, num);
    if (err) return setFieldError(form, "numero_documento", err);

    const btn = document.getElementById("rec1-btn");
    setLoading(btn, true);
    const res = await api.post("/api/portal/recuperar/solicitar", {
      tipo_documento: tipo,
      numero_documento: num,
    });
    setLoading(btn, false, `${icon("mail", 18)} Enviar código`);

    estado = { tipo, numero: num };
    toast(res.message || "Si el documento está registrado, te enviamos un código.", "info");
    paso2();
  });
}

// ---------------------------------------------------------------------
//  Paso 2 — Código + nueva contraseña
// ---------------------------------------------------------------------
function paso2() {
  mount(shell(`
    <p class="text-muted mt-2" style="font-size:var(--text-sm)">
      Si <strong>${esc(estado.tipo)} ${esc(estado.numero)}</strong> está registrado, te llegó un código de
      6 dígitos a tu correo. Vence en 15 minutos.
    </p>
    <form id="rec2" class="wizard-form mt-4" novalidate>
      <div class="field" data-field="codigo">
        <label for="rc_cod">Código de 6 dígitos</label>
        <input class="input" id="rc_cod" name="codigo" inputmode="numeric" maxlength="6" placeholder="Ej. 123456" autocomplete="one-time-code" />
        <div class="field__error"></div>
      </div>
      <div class="field" data-field="password">
        <label for="rc_pass">Nueva contraseña</label>
        <input class="input" type="password" id="rc_pass" name="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
        <div class="field__error"></div>
      </div>
      <div class="field" data-field="password2">
        <label for="rc_pass2">Confirmar contraseña</label>
        <input class="input" type="password" id="rc_pass2" name="password2" autocomplete="new-password" />
        <div class="field__error"></div>
      </div>
      <button class="btn btn--cta btn--block mt-5" type="submit" id="rec2-btn">${icon("checkCircle", 18)} Cambiar contraseña</button>
      <p class="wizard-alt mt-4"><button type="button" class="linklike" id="rec-volver">Usar otro documento</button></p>
    </form>`));

  const form = document.getElementById("rec2");
  document.getElementById("rec-volver").addEventListener("click", () => paso1());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);
    const codigo = form.codigo.value.trim();
    const pass = form.password.value;
    const pass2 = form.password2.value;

    if (!/^[0-9]{6}$/.test(codigo)) return setFieldError(form, "codigo", "Ingresa los 6 dígitos del código.");
    if (pass.length < 8) return setFieldError(form, "password", "La contraseña debe tener al menos 8 caracteres.");
    if (pass !== pass2) return setFieldError(form, "password2", "Las contraseñas no coinciden.");

    const btn = document.getElementById("rec2-btn");
    setLoading(btn, true);
    const res = await api.post("/api/portal/recuperar/cambiar", {
      tipo_documento: estado.tipo,
      numero_documento: estado.numero,
      codigo,
      password: pass,
    });
    setLoading(btn, false, `${icon("checkCircle", 18)} Cambiar contraseña`);

    if (res.success) {
      exito();
      return;
    }
    if (res.errors) applyErrors(form, res.errors);
    toast(res.message || "No se pudo cambiar la contraseña.", "error");
  });
}

function exito() {
  mount(`
    <div class="card" style="max-width:460px;margin-inline:auto">
      <div class="state">
        <div class="state__icon state__icon--success">${icon("checkCircle", 36)}</div>
        <h1>Contraseña actualizada</h1>
        <p class="text-muted">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        <div class="actions"><a class="btn btn--primary" href="/portal" data-link>Ir a iniciar sesión</a></div>
      </div>
    </div>`);
}
