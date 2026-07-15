// =====================================================================
//  views/registro.js — Wizard de creación de cuenta del paciente (Fase 2A).
//  4 pasos, estilo Clínica Internacional:
//    1) Documento  2) Datos + dirección  3) Verificación OTP  4) Intereses
//  El código de verificación se envía por correo (Brevo vía n8n).
// =====================================================================
import { api } from "../api.js";
import { mount, icon, esc, toast, clearErrors, setFieldError, applyErrors, setLoading } from "../ui.js";
import { navigate } from "../router.js";
import {
  validarDocumento, validarEmail, validarTelefono, esMenor, calcularEdad, MAX_FECHA_NAC,
} from "../validators.js";
import { UBIGEO, DEPARTAMENTOS } from "../data/ubigeo.js";

const PASOS = ["Documento", "Tus datos", "Verificación", "Intereses"];

let estado = fresco();

function fresco() {
  return { paso: 1, token: null, correo: "", expiraEn: 300, datos: {}, intereses: [] };
}

export function renderRegistro() {
  // El registro es parte de la app del portal: sin el chrome de marketing.
  document.body.classList.add("portal-mode");
  estado = fresco();
  mount(shellHTML());
  irAPaso(1);
}

// ---------------------------------------------------------------------
//  Cascarón (promo + stepper + panel que cambia por paso)
// ---------------------------------------------------------------------
function shellHTML() {
  return `
    <section class="registro" aria-labelledby="registro-title">
      <aside class="registro__promo">
        <div class="registro__promo-inner">
          <span class="registro__badge">${icon("shieldCheck", 16)} Cuenta segura</span>
          <h2 class="registro__promo-title">Más que una cita, tu salud digestiva en un solo lugar</h2>
          <p class="registro__promo-lead">Crea tu cuenta para reservar citas, recibir tus resultados y gestionar tu atención desde cualquier lugar.</p>
          <ol class="stepper" id="stepper">
            ${PASOS.map((p, i) => `
              <li class="stepper__item" data-step="${i + 1}">
                <span class="stepper__dot">${i + 1}</span>
                <span class="stepper__label">${p}</span>
              </li>`).join("")}
          </ol>
        </div>
      </aside>

      <div class="registro__main">
        <h1 id="registro-title" class="registro__title">Crear una cuenta</h1>
        <div id="wizard-panel"></div>
      </div>
    </section>`;
}

function irAPaso(n) {
  // Detiene el contador del OTP al salir del paso 3.
  if (contadorId) { clearInterval(contadorId); contadorId = null; }
  estado.paso = n;
  document.querySelectorAll("#stepper .stepper__item").forEach((li) => {
    const s = Number(li.dataset.step);
    li.classList.toggle("is-active", s === n);
    li.classList.toggle("is-done", s < n);
  });
  const panel = document.getElementById("wizard-panel");
  const render = { 1: paso1, 2: paso2, 3: paso3, 4: paso4 }[n];
  render(panel);
}

// ---------------------------------------------------------------------
//  PASO 1 — Documento
// ---------------------------------------------------------------------
function paso1(panel) {
  panel.innerHTML = `
    <form id="paso1" class="wizard-form" novalidate>
      <div class="field" data-field="tipo_documento">
        <label for="r_tipo">Tipo de documento <span class="req">*</span></label>
        <select class="select" id="r_tipo" name="tipo_documento">
          <option value="DNI">DNI</option>
          <option value="CE">Carné de Extranjería</option>
          <option value="PAS">Pasaporte</option>
        </select>
        <div class="field__error"></div>
      </div>
      <div class="field" data-field="numero_documento">
        <label for="r_num">Número de documento <span class="req">*</span></label>
        <input class="input" id="r_num" name="numero_documento" inputmode="numeric" placeholder="Ej. 70123456" value="${esc(estado.datos.numero_documento || "")}" />
        <div class="field__error"></div>
      </div>
      <div class="field" data-field="fecha_emision_dni">
        <label for="r_femi">Fecha de emisión del DNI <span class="req" data-dni-req>*</span></label>
        <input class="input" type="date" id="r_femi" name="fecha_emision_dni" max="${MAX_FECHA_NAC}" value="${esc(estado.datos.fecha_emision_dni || "")}" />
        <div class="field__hint">La encuentras en tu documento, debajo de la firma.</div>
        <div class="field__error"></div>
      </div>

      <div class="wizard-actions">
        <button class="btn btn--primary btn--block" type="submit">Continuar ${icon("arrowRight", 18)}</button>
      </div>
      <p class="wizard-alt">¿Ya tienes cuenta? <a href="/portal" data-link>Inicia sesión</a></p>
    </form>`;

  const form = panel.querySelector("#paso1");
  const tipo = form.querySelector("#r_tipo");
  if (estado.datos.tipo_documento) tipo.value = estado.datos.tipo_documento;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);
    const t = tipo.value;
    const num = form.numero_documento.value.trim();
    const femi = form.fecha_emision_dni.value;

    const docErr = validarDocumento(t, num);
    if (docErr) return setFieldError(form, "numero_documento", docErr);
    if (t === "DNI" && !femi) return setFieldError(form, "fecha_emision_dni", "Ingresa la fecha de emisión del DNI.");

    const btn = form.querySelector('button[type="submit"]');
    setLoading(btn, true);

    // 1) ¿Ya existe una cuenta con este documento? (no dejar avanzar si sí).
    const chk = await api.get(`/api/pacientes/verificar?tipo=${encodeURIComponent(t)}&numero=${encodeURIComponent(num)}`);
    if (chk.success && chk.data?.ya_registrado) {
      setLoading(btn, false, `Continuar ${icon("arrowRight", 18)}`);
      setFieldError(form, "numero_documento", "Este documento ya está registrado. Inicia sesión.");
      toast("Ese documento ya tiene una cuenta. Inicia sesión.", "warning");
      return;
    }

    Object.assign(estado.datos, { tipo_documento: t, numero_documento: num, fecha_emision_dni: femi || null });

    // 2) Autocompletar con RENIEC (solo DNI y si aún no consultamos ese número).
    //    Si el servicio no responde, se continúa igual y el paciente llena manual.
    if (t === "DNI" && estado.reniecPara !== num) {
      const res = await api.get(`/api/reniec/dni?numero=${encodeURIComponent(num)}`);
      if (res.success && res.data) {
        estado.datos.nombres = res.data.nombres || "";
        estado.datos.apellido_paterno = res.data.apellido_paterno || "";
        estado.datos.apellido_materno = res.data.apellido_materno || "";
        if (res.data.fecha_nacimiento) estado.datos.fecha_nacimiento = res.data.fecha_nacimiento;
        estado.reniecPara = num;
        toast("Datos encontrados en RENIEC. Verifícalos y continúa.", "success");
      }
    }
    setLoading(btn, false, `Continuar ${icon("arrowRight", 18)}`);
    irAPaso(2);
  });
}

// ---------------------------------------------------------------------
//  PASO 2 — Datos personales + dirección
// ---------------------------------------------------------------------
function paso2(panel) {
  const d = estado.datos;
  panel.innerHTML = `
    <form id="paso2" class="wizard-form" novalidate>
      <div class="form-grid">
        <div class="field" data-field="nombres">
          <label for="r_nom">Nombre(s) <span class="req">*</span></label>
          <input class="input" id="r_nom" name="nombres" autocomplete="given-name" value="${esc(d.nombres || "")}" />
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="apellido_paterno">
          <label for="r_apep">Apellido paterno <span class="req">*</span></label>
          <input class="input" id="r_apep" name="apellido_paterno" value="${esc(d.apellido_paterno || "")}" />
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="apellido_materno">
          <label for="r_apem">Apellido materno <span class="req">*</span></label>
          <input class="input" id="r_apem" name="apellido_materno" value="${esc(d.apellido_materno || "")}" />
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="fecha_nacimiento">
          <label for="r_fnac">Fecha de nacimiento <span class="req">*</span></label>
          <input class="input" type="date" id="r_fnac" name="fecha_nacimiento" max="${MAX_FECHA_NAC}" value="${esc(d.fecha_nacimiento || "")}" />
          <div class="field__hint" id="r_edad"></div>
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="sexo">
          <label for="r_sexo">Sexo</label>
          <select class="select" id="r_sexo" name="sexo">
            <option value="X">Prefiero no indicar</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
          </select>
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="telefono">
          <label for="r_cel">Celular <span class="req">*</span></label>
          <input class="input" id="r_cel" name="telefono" inputmode="numeric" placeholder="Ej. 987654321" value="${esc(d.telefono || "")}" />
          <div class="field__error"></div>
        </div>
        <div class="field field--full" data-field="correo">
          <label for="r_correo">Correo electrónico <span class="req">*</span></label>
          <input class="input" type="email" id="r_correo" name="correo" autocomplete="email" value="${esc(d.correo || "")}" />
          <div class="field__hint">Aquí te llegará el código de verificación.</div>
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="password">
          <label for="r_pass">Contraseña <span class="req">*</span></label>
          <input class="input" type="password" id="r_pass" name="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres" />
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="password2">
          <label for="r_pass2">Confirmar contraseña <span class="req">*</span></label>
          <input class="input" type="password" id="r_pass2" name="password2" autocomplete="new-password" />
          <div class="field__error"></div>
        </div>

        <div class="field" data-field="departamento">
          <label for="r_dep">Departamento <span class="req">*</span></label>
          <select class="select" id="r_dep" name="departamento">
            <option value="">Seleccionar</option>
            ${DEPARTAMENTOS.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join("")}
          </select>
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="provincia">
          <label for="r_prov">Provincia <span class="req">*</span></label>
          <select class="select" id="r_prov" name="provincia"><option value="">Seleccionar</option></select>
          <div class="field__error"></div>
        </div>
        <div class="field" data-field="distrito">
          <label for="r_dist">Distrito <span class="req">*</span></label>
          <select class="select" id="r_dist" name="distrito"><option value="">Seleccionar</option></select>
          <div class="field__error"></div>
        </div>
        <div class="field field--full" data-field="direccion">
          <label for="r_dir">Dirección <span class="req">*</span></label>
          <input class="input" id="r_dir" name="direccion" placeholder="Calle / Jr. / Av. y número" value="${esc(d.direccion || "")}" />
          <div class="field__error"></div>
        </div>

        <div class="field field--full" data-field="consentimiento_datos">
          <label class="checkbox">
            <input type="checkbox" id="r_terminos" name="consentimiento_datos" />
            <span>Acepto los <a href="/nosotros" data-link>Términos</a> y la Política de Privacidad de Datos (Ley N.° 29733). <span class="req">*</span></span>
          </label>
          <div class="field__error"></div>
        </div>
      </div>

      <div class="wizard-actions">
        <button class="btn btn--ghost" type="button" id="volver2">${icon("arrowRight", 18)} Regresar</button>
        <button class="btn btn--primary" type="submit" id="enviar2">Continuar ${icon("arrowRight", 18)}</button>
      </div>
    </form>`;

  const form = panel.querySelector("#paso2");
  if (d.sexo) form.sexo.value = d.sexo;

  // Selects en cascada de ubigeo.
  wireUbigeo(form, d);

  // Edad en vivo.
  const fnac = form.querySelector("#r_fnac");
  const edad = form.querySelector("#r_edad");
  fnac.addEventListener("change", () => {
    const e = calcularEdad(fnac.value);
    edad.textContent = e >= 0 ? `Edad: ${e} año(s)` : "";
  });

  form.querySelector("#volver2").addEventListener("click", () => { capturarPaso2(form); irAPaso(1); });
  form.addEventListener("submit", (e) => onEnviarPaso2(e, form));
}

function wireUbigeo(form, d) {
  const dep = form.querySelector("#r_dep");
  const prov = form.querySelector("#r_prov");
  const dist = form.querySelector("#r_dist");

  const llenar = (sel, items, elegido) => {
    sel.innerHTML = `<option value="">Seleccionar</option>` +
      items.map((x) => `<option value="${esc(x)}"${x === elegido ? " selected" : ""}>${esc(x)}</option>`).join("");
  };

  const onDep = (provElegida, distElegido) => {
    const provincias = dep.value && UBIGEO[dep.value] ? Object.keys(UBIGEO[dep.value]) : [];
    llenar(prov, provincias, provElegida);
    onProv(distElegido);
  };
  const onProv = (distElegido) => {
    const distritos = dep.value && prov.value && UBIGEO[dep.value]?.[prov.value] ? UBIGEO[dep.value][prov.value] : [];
    llenar(dist, distritos, distElegido);
  };

  dep.addEventListener("change", () => onDep());
  prov.addEventListener("change", () => onProv());

  // Restaurar selección previa (al regresar del paso 3).
  if (d.departamento) { dep.value = d.departamento; onDep(d.provincia, d.distrito); }
}

function capturarPaso2(form) {
  Object.assign(estado.datos, {
    nombres: form.nombres.value.trim(),
    apellido_paterno: form.apellido_paterno.value.trim(),
    apellido_materno: form.apellido_materno.value.trim(),
    fecha_nacimiento: form.fecha_nacimiento.value,
    sexo: form.sexo.value,
    telefono: form.telefono.value.trim(),
    correo: form.correo.value.trim(),
    departamento: form.departamento.value,
    provincia: form.provincia.value,
    distrito: form.distrito.value,
    direccion: form.direccion.value.trim(),
  });
}

function validarPaso2(form) {
  const errs = {};
  const g = (n) => form[n].value.trim();
  if (!g("nombres")) errs.nombres = "Ingresa tu nombre.";
  if (!g("apellido_paterno")) errs.apellido_paterno = "Ingresa tu apellido paterno.";
  if (!g("apellido_materno")) errs.apellido_materno = "Ingresa tu apellido materno.";
  const fnac = g("fecha_nacimiento");
  if (!fnac) errs.fecha_nacimiento = "Selecciona tu fecha de nacimiento.";
  else if (esMenor(fnac)) errs.fecha_nacimiento = "Los menores deben registrarse con su apoderado en recepción.";
  if (!validarTelefono(g("telefono"))) errs.telefono = "Celular inválido (9 a 15 dígitos).";
  if (!validarEmail(g("correo"))) errs.correo = "Correo electrónico inválido.";
  if (form.password.value.length < 8) errs.password = "La contraseña debe tener al menos 8 caracteres.";
  if (form.password.value !== form.password2.value) errs.password2 = "Las contraseñas no coinciden.";
  if (!g("departamento")) errs.departamento = "Selecciona el departamento.";
  if (!g("provincia")) errs.provincia = "Selecciona la provincia.";
  if (!g("distrito")) errs.distrito = "Selecciona el distrito.";
  if (!g("direccion")) errs.direccion = "Ingresa tu dirección.";
  if (!form.consentimiento_datos.checked) errs.consentimiento_datos = "Debes aceptar los Términos y la Política de Privacidad.";
  return errs;
}

async function onEnviarPaso2(e, form) {
  e.preventDefault();
  clearErrors(form);
  const errs = validarPaso2(form);
  if (Object.keys(errs).length) {
    Object.entries(errs).forEach(([k, v]) => setFieldError(form, k, v));
    toast("Revisa los campos marcados.", "warning");
    return;
  }
  capturarPaso2(form);

  const btn = form.querySelector("#enviar2");
  setLoading(btn, true);

  const d = estado.datos;
  const payload = {
    tipo_documento: d.tipo_documento,
    numero_documento: d.numero_documento,
    fecha_emision_dni: d.fecha_emision_dni,
    nombres: d.nombres,
    apellidos: `${d.apellido_paterno} ${d.apellido_materno}`.trim(),
    fecha_nacimiento: d.fecha_nacimiento,
    sexo: d.sexo || "X",
    telefono: d.telefono,
    correo: d.correo,
    password: form.password.value,
    departamento: d.departamento,
    provincia: d.provincia,
    distrito: d.distrito,
    direccion: d.direccion,
    consentimiento_datos: true,
  };

  const res = await api.post("/api/registro/iniciar", payload);
  setLoading(btn, false, `Continuar ${icon("arrowRight", 18)}`);

  if (res.success) {
    estado.token = res.data?.registro_token || null;
    estado.correo = res.data?.correo || d.correo;
    estado.expiraEn = res.data?.expira_en_segundos || 300;
    toast("Te enviamos un código a tu correo.", "success");
    irAPaso(3);
  } else if (res.status === 409) {
    setFieldError(form, "numero_documento", res.message);
    toast(res.message, "warning");
    irAPaso(1);
  } else {
    applyErrors(form, res.errors);
    toast(res.message || "No se pudo continuar.", "error");
  }
}

// ---------------------------------------------------------------------
//  PASO 3 — Verificación OTP (5 dígitos)
// ---------------------------------------------------------------------
function paso3(panel) {
  panel.innerHTML = `
    <div class="otp-step">
      <span class="otp-step__icon">${icon("phone", 26)}</span>
      <h2 class="otp-step__title">Verifica tu información</h2>
      <p class="otp-step__lead">Enviamos un código de 5 dígitos a <strong>${esc(estado.correo)}</strong>. Ingrésalo aquí.</p>

      <form id="paso3" class="otp-form" novalidate>
        <div class="otp-inputs" id="otp-inputs">
          ${[0, 1, 2, 3, 4].map((i) => `<input class="otp-box" inputmode="numeric" maxlength="1" aria-label="Dígito ${i + 1}" data-i="${i}" />`).join("")}
        </div>
        <p class="otp-timer" id="otp-timer" aria-live="polite"></p>
        <div class="otp-links">
          <button type="button" class="linklike" id="otp-reenviar" disabled>Volver a enviar código</button>
          <button type="button" class="linklike" id="otp-editar">Actualizar mis datos</button>
        </div>
        <div class="wizard-actions">
          <button class="btn btn--ghost" type="button" id="volver3">${icon("arrowRight", 18)} Regresar</button>
          <button class="btn btn--primary" type="submit" id="enviar3">Continuar ${icon("arrowRight", 18)}</button>
        </div>
      </form>
    </div>`;

  const form = panel.querySelector("#paso3");
  const boxes = [...panel.querySelectorAll(".otp-box")];
  wireOtpBoxes(boxes);
  boxes[0].focus();

  arrancarContador(panel.querySelector("#otp-timer"), panel.querySelector("#otp-reenviar"));

  panel.querySelector("#otp-editar").addEventListener("click", () => irAPaso(2));
  panel.querySelector("#volver3").addEventListener("click", () => irAPaso(2));
  panel.querySelector("#otp-reenviar").addEventListener("click", () => reenviarOtp(panel));
  form.addEventListener("submit", (e) => onVerificar(e, boxes));
}

function wireOtpBoxes(boxes) {
  boxes.forEach((box, i) => {
    box.addEventListener("input", () => {
      box.value = box.value.replace(/\D/g, "").slice(0, 1);
      if (box.value && i < boxes.length - 1) boxes[i + 1].focus();
    });
    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !box.value && i > 0) boxes[i - 1].focus();
    });
    box.addEventListener("paste", (e) => {
      e.preventDefault();
      const txt = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, boxes.length);
      [...txt].forEach((c, k) => { if (boxes[k]) boxes[k].value = c; });
      boxes[Math.min(txt.length, boxes.length - 1)].focus();
    });
  });
}

let contadorId = null;
function arrancarContador(timerEl, reenviarBtn) {
  if (contadorId) clearInterval(contadorId);
  let restante = estado.expiraEn;
  const pintar = () => {
    const m = String(Math.floor(restante / 60)).padStart(2, "0");
    const s = String(restante % 60).padStart(2, "0");
    if (restante > 0) {
      timerEl.textContent = `El código es válido por ${m}:${s}`;
      reenviarBtn.disabled = true;
    } else {
      timerEl.textContent = "El código expiró. Solicita uno nuevo.";
      reenviarBtn.disabled = false;
      clearInterval(contadorId);
    }
    restante--;
  };
  pintar();
  contadorId = setInterval(pintar, 1000);
}

async function reenviarOtp(panel) {
  const res = await api.post("/api/registro/reenviar", { token: estado.token });
  if (res.success) {
    estado.expiraEn = res.data?.expira_en_segundos || 300;
    arrancarContador(panel.querySelector("#otp-timer"), panel.querySelector("#otp-reenviar"));
    toast("Te enviamos un nuevo código.", "success");
  } else {
    toast(res.message || "No se pudo reenviar el código.", "error");
  }
}

async function onVerificar(e, boxes) {
  e.preventDefault();
  const codigo = boxes.map((b) => b.value).join("");
  if (!/^[0-9]{5}$/.test(codigo)) {
    toast("Ingresa los 5 dígitos del código.", "warning");
    return;
  }
  const btn = document.getElementById("enviar3");
  setLoading(btn, true);
  const res = await api.post("/api/registro/verificar", { token: estado.token, codigo });
  setLoading(btn, false, `Continuar ${icon("arrowRight", 18)}`);

  if (res.success) {
    if (contadorId) clearInterval(contadorId);
    toast("Código verificado.", "success");
    irAPaso(4);
  } else {
    boxes.forEach((b) => (b.value = ""));
    boxes[0].focus();
    toast(res.message || "Código incorrecto.", "error");
  }
}

// ---------------------------------------------------------------------
//  PASO 4 — Temas de interés + Crear cuenta
// ---------------------------------------------------------------------
async function paso4(panel) {
  panel.innerHTML = `
    <div class="intereses-step">
      <h2 class="intereses-step__title">Selecciona tus temas de interés</h2>
      <p class="intereses-step__lead">Opcional. Nos ayuda a mostrarte información relevante para ti.</p>
      <div class="intereses-grid" id="intereses-grid">
        <div class="skeleton" style="height:64px"></div>
        <div class="skeleton" style="height:64px"></div>
        <div class="skeleton" style="height:64px"></div>
      </div>
      <div class="wizard-actions">
        <button class="btn btn--ghost" type="button" id="volver4">${icon("arrowRight", 18)} Regresar</button>
        <button class="btn btn--cta" type="button" id="crear-cuenta">${icon("checkCircle", 18)} Crear cuenta</button>
      </div>
    </div>`;

  panel.querySelector("#volver4").addEventListener("click", () => irAPaso(3));
  panel.querySelector("#crear-cuenta").addEventListener("click", () => onCrearCuenta());

  const grid = panel.querySelector("#intereses-grid");
  const res = await api.get("/api/intereses");
  const items = res.success && Array.isArray(res.data) ? res.data : [];
  if (!items.length) {
    grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1">No hay temas disponibles. Puedes crear tu cuenta igual.</p>`;
    return;
  }
  grid.innerHTML = items.map((it) => `
    <button type="button" class="interes-chip" data-codigo="${esc(it.codigo)}" aria-pressed="false">
      <span class="interes-chip__icon">${icon(it.icono || "sparkles", 22)}</span>
      <span>${esc(it.nombre)}</span>
    </button>`).join("");

  grid.querySelectorAll(".interes-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const on = chip.classList.toggle("is-selected");
      chip.setAttribute("aria-pressed", String(on));
      const cod = chip.dataset.codigo;
      if (on) estado.intereses.push(cod);
      else estado.intereses = estado.intereses.filter((c) => c !== cod);
    });
  });
}

async function onCrearCuenta() {
  const btn = document.getElementById("crear-cuenta");
  setLoading(btn, true);
  const res = await api.post("/api/registro/completar", {
    token: estado.token,
    intereses: estado.intereses,
  });
  setLoading(btn, false, `${icon("checkCircle", 18)} Crear cuenta`);

  if (res.success) {
    toast(`¡Bienvenido(a), ${res.data?.paciente ?? ""}!`, "success");
    navigate("/portal");
  } else if (res.status === 409) {
    toast(res.message, "warning");
    navigate("/portal");
  } else {
    toast(res.message || "No se pudo crear la cuenta.", "error");
  }
}
