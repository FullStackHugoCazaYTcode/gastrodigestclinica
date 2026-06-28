// =====================================================================
//  views/reserva.js — Flujo de reserva de cita.
//  Registro de paciente (+ apoderado dinámico) → creación de cita → OTP.
// =====================================================================
import { api } from "../api.js";
import { mount, icon, toast, clearErrors, setFieldError, applyErrors, setLoading } from "../ui.js";
import {
  validarDocumento, esMenor, validarEmail, validarTelefono, calcularEdad, MAX_FECHA_NAC,
} from "../validators.js";
import { openOtpModal } from "../otpModal.js";

// Franjas horarias de atención: 08:00 a 17:30 cada 30 min.
const HORAS = [];
for (let h = 8; h <= 17; h++) {
  for (const m of [0, 30]) HORAS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}

const HOY = new Date().toISOString().slice(0, 10);
const val = (form, name) => form.querySelector(`[name="${name}"]`)?.value.trim() ?? "";

export function renderReserva() {
  mount(`
    <section class="hero" aria-labelledby="reserva-title">
      <span class="eyebrow">${icon("stethoscope", 16)} Atención gastroenterológica</span>
      <h1 id="reserva-title">Reserva tu cita en minutos</h1>
      <p>Completa tus datos, valida tu identidad con un código y recibe la confirmación por WhatsApp. Sin filas ni llamadas.</p>
    </section>

    <form id="reserva-form" novalidate>
      <!-- ===== Datos del paciente ===== -->
      <div class="card">
        <div class="card__title"><span class="card__icon">${icon("user")}</span><h2>Datos del paciente</h2></div>
        <p class="card__desc">Tus datos están protegidos conforme a la Ley N.° 29733.</p>

        <div class="form-grid">
          <div class="field" data-field="tipo_documento">
            <label for="tipo_documento">Tipo de documento <span class="req">*</span></label>
            <select class="select" id="tipo_documento" name="tipo_documento">
              <option value="DNI">DNI</option>
              <option value="CE">Carné de Extranjería</option>
              <option value="PAS">Pasaporte</option>
            </select>
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="numero_documento">
            <label for="numero_documento">N.° de documento <span class="req">*</span></label>
            <input class="input" id="numero_documento" name="numero_documento" autocomplete="off" placeholder="Ej. 70123456" />
            <div class="field__error"></div>
          </div>

          <div class="field" data-field="nombres">
            <label for="nombres">Nombres <span class="req">*</span></label>
            <input class="input" id="nombres" name="nombres" autocomplete="given-name" />
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="apellidos">
            <label for="apellidos">Apellidos <span class="req">*</span></label>
            <input class="input" id="apellidos" name="apellidos" autocomplete="family-name" />
            <div class="field__error"></div>
          </div>

          <div class="field" data-field="fecha_nacimiento">
            <label for="fecha_nacimiento">Fecha de nacimiento <span class="req">*</span></label>
            <input class="input" type="date" id="fecha_nacimiento" name="fecha_nacimiento" max="${MAX_FECHA_NAC}" />
            <div class="field__hint" id="edad-hint"></div>
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="sexo">
            <label for="sexo">Sexo</label>
            <select class="select" id="sexo" name="sexo">
              <option value="X">Prefiero no indicar</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
            </select>
            <div class="field__error"></div>
          </div>

          <div class="field" data-field="telefono">
            <label for="telefono">Teléfono (WhatsApp) <span class="req">*</span></label>
            <input class="input" id="telefono" name="telefono" inputmode="numeric" placeholder="51987654321" />
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="correo">
            <label for="correo">Correo electrónico <span class="req">*</span></label>
            <input class="input" type="email" id="correo" name="correo" autocomplete="email" />
            <div class="field__error"></div>
          </div>
        </div>

        <!-- ===== Apoderado (slideDown si es menor de edad) ===== -->
        <div class="apoderado" id="apoderado" aria-hidden="true">
          <div class="apoderado__inner">
            <div class="apoderado__banner">${icon("shield", 18)}
              <span>El paciente es menor de edad: registra los datos del apoderado (Ley N.° 29414).</span>
            </div>
            <div class="form-grid">
              <div class="field" data-field="apo_dni">
                <label for="apo_dni">DNI del apoderado <span class="req">*</span></label>
                <input class="input" id="apo_dni" name="apo_dni" inputmode="numeric" placeholder="8 dígitos" />
                <div class="field__error"></div>
              </div>
              <div class="field" data-field="apo_nombres">
                <label for="apo_nombres">Nombres del apoderado <span class="req">*</span></label>
                <input class="input" id="apo_nombres" name="apo_nombres" />
                <div class="field__error"></div>
              </div>
              <div class="field" data-field="apo_relacion">
                <label for="apo_relacion">Parentesco <span class="req">*</span></label>
                <select class="select" id="apo_relacion" name="apo_relacion">
                  <option value="">Selecciona…</option>
                  <option value="PADRE">Padre</option>
                  <option value="MADRE">Madre</option>
                  <option value="TUTOR_LEGAL">Tutor legal</option>
                  <option value="ABUELO">Abuelo(a)</option>
                  <option value="OTRO">Otro</option>
                </select>
                <div class="field__error"></div>
              </div>
              <div class="field" data-field="apo_telefono">
                <label for="apo_telefono">Teléfono del apoderado <span class="req">*</span></label>
                <input class="input" id="apo_telefono" name="apo_telefono" inputmode="numeric" />
                <div class="field__error"></div>
              </div>
              <div class="field field--full" data-field="apo_correo">
                <label for="apo_correo">Correo del apoderado <span class="req">*</span></label>
                <input class="input" type="email" id="apo_correo" name="apo_correo" />
                <div class="field__error"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== Datos de la cita ===== -->
      <div class="card">
        <div class="card__title"><span class="card__icon">${icon("calendar")}</span><h2>Datos de la cita</h2></div>
        <p class="card__desc">Selecciona el especialista, la fecha y la hora disponible.</p>

        <div class="form-grid">
          <div class="field field--full" data-field="id_medico">
            <label for="id_medico">Médico especialista <span class="req">*</span></label>
            <select class="select" id="id_medico" name="id_medico"><option value="">Cargando…</option></select>
            <div class="field__error"></div>
          </div>

          <div class="field" data-field="fecha">
            <label for="fecha">Fecha <span class="req">*</span></label>
            <input class="input" type="date" id="fecha" name="fecha" min="${HOY}" />
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="hora">
            <label for="hora">Hora <span class="req">*</span></label>
            <select class="select" id="hora" name="hora">
              <option value="">Selecciona…</option>
              ${HORAS.map((h) => `<option value="${h}">${h}</option>`).join("")}
            </select>
            <div class="field__error"></div>
          </div>

          <div class="field" data-field="id_aseguradora">
            <label for="id_aseguradora">Aseguradora</label>
            <select class="select" id="id_aseguradora" name="id_aseguradora"><option value="">Cargando…</option></select>
            <div class="field__error"></div>
          </div>
          <div class="field" data-field="numero_afiliado">
            <label for="numero_afiliado">N.° de afiliado</label>
            <input class="input" id="numero_afiliado" name="numero_afiliado" placeholder="Opcional" />
            <div class="field__hint">Requerido por SITEDS si usas seguro.</div>
            <div class="field__error"></div>
          </div>

          <div class="field field--full" data-field="motivo">
            <label for="motivo">Motivo de la consulta</label>
            <textarea class="textarea" id="motivo" name="motivo" placeholder="Opcional — describe brevemente tu motivo."></textarea>
            <div class="field__error"></div>
          </div>

          <div class="field field--full" data-field="consentimiento">
            <label class="checkbox">
              <input type="checkbox" id="consentimiento" name="consentimiento" />
              <span>Acepto el tratamiento de mis datos personales conforme a la Ley N.° 29733. <span class="req">*</span></span>
            </label>
            <div class="field__error"></div>
          </div>
        </div>

        <div class="actions actions--end">
          <button class="btn btn--cta btn--lg" type="submit" id="submit-btn">
            ${icon("calendar")} Reservar cita
          </button>
        </div>
      </div>
    </form>
  `);

  const form = document.getElementById("reserva-form");
  cargarCatalogos(form);
  wireApoderado(form);
  wireDocumento(form);
  form.addEventListener("submit", (e) => onSubmit(e, form));
}

// ---- Carga de catálogos (médicos y aseguradoras) ----
async function cargarCatalogos(form) {
  const [medicos, aseguradoras] = await Promise.all([
    api.get("/api/medicos"),
    api.get("/api/aseguradoras"),
  ]);

  const selMedico = form.querySelector("#id_medico");
  if (medicos.success && Array.isArray(medicos.data)) {
    selMedico.innerHTML =
      `<option value="">Selecciona un especialista…</option>` +
      medicos.data
        .map((m) => `<option value="${m.id_medico}">Dr(a). ${m.nombres} ${m.apellidos} — ${m.especialidad}</option>`)
        .join("");
  } else {
    selMedico.innerHTML = `<option value="">No se pudieron cargar los médicos</option>`;
    toast("No se pudieron cargar los médicos.", "error");
  }

  const selAseg = form.querySelector("#id_aseguradora");
  if (aseguradoras.success && Array.isArray(aseguradoras.data)) {
    selAseg.innerHTML =
      `<option value="">Selecciona…</option>` +
      aseguradoras.data.map((a) => `<option value="${a.id_aseguradora}">${a.nombre}</option>`).join("");
  } else {
    selAseg.innerHTML = `<option value="">Sin aseguradoras</option>`;
  }
}

// ---- Apoderado dinámico según la edad ----
function wireApoderado(form) {
  const fecha = form.querySelector("#fecha_nacimiento");
  const apo = form.querySelector("#apoderado");
  const hint = form.querySelector("#edad-hint");

  fecha.addEventListener("change", () => {
    const edad = calcularEdad(fecha.value);
    hint.textContent = edad >= 0 ? `Edad: ${edad} año(s)` : "";
    const menor = esMenor(fecha.value);
    apo.classList.toggle("is-open", menor);
    apo.setAttribute("aria-hidden", String(!menor));
  });
}

// ---- Validación de documento en vivo ----
function wireDocumento(form) {
  const tipo = form.querySelector("#tipo_documento");
  const numero = form.querySelector("#numero_documento");

  const revisar = async () => {
    const err = validarDocumento(tipo.value, numero.value.trim());
    const field = form.querySelector('[data-field="numero_documento"]');
    field.classList.remove("has-error");
    if (!numero.value.trim()) return;
    if (err) { setFieldError(form, "numero_documento", err); return; }

    const res = await api.get(`/api/pacientes/verificar?tipo=${tipo.value}&numero=${encodeURIComponent(numero.value.trim())}`);
    if (res.success && res.data?.ya_registrado) {
      toast("Este documento ya está registrado. Puedes continuar para reservar.", "info");
    }
  };

  numero.addEventListener("blur", revisar);
  tipo.addEventListener("change", () => { if (numero.value.trim()) revisar(); });
}

// ---- Validación + envío ----
function validar(form) {
  const errores = {};
  const fechaNac = val(form, "fecha_nacimiento");

  const docErr = validarDocumento(val(form, "tipo_documento"), val(form, "numero_documento"));
  if (docErr) errores.numero_documento = docErr;
  if (!val(form, "nombres")) errores.nombres = "Ingresa los nombres.";
  if (!val(form, "apellidos")) errores.apellidos = "Ingresa los apellidos.";
  if (!fechaNac) errores.fecha_nacimiento = "Selecciona la fecha de nacimiento.";
  if (!validarTelefono(val(form, "telefono"))) errores.telefono = "Teléfono inválido (9 a 15 dígitos).";
  if (!validarEmail(val(form, "correo"))) errores.correo = "Correo electrónico inválido.";
  if (!form.querySelector("#consentimiento").checked) errores.consentimiento = "Debes aceptar el tratamiento de datos.";
  if (!val(form, "id_medico")) errores.id_medico = "Selecciona un médico.";
  if (!val(form, "fecha")) errores.fecha = "Selecciona la fecha de la cita.";
  if (!val(form, "hora")) errores.hora = "Selecciona la hora.";

  if (fechaNac && esMenor(fechaNac)) {
    if (!/^[0-9]{8}$/.test(val(form, "apo_dni"))) errores.apo_dni = "DNI del apoderado: 8 dígitos.";
    if (!val(form, "apo_nombres")) errores.apo_nombres = "Ingresa los nombres del apoderado.";
    if (!val(form, "apo_relacion")) errores.apo_relacion = "Selecciona el parentesco.";
    if (!validarTelefono(val(form, "apo_telefono"))) errores.apo_telefono = "Teléfono inválido.";
    if (!validarEmail(val(form, "apo_correo"))) errores.apo_correo = "Correo del apoderado inválido.";
  }
  return errores;
}

async function onSubmit(e, form) {
  e.preventDefault();
  clearErrors(form);

  const errores = validar(form);
  if (Object.keys(errores).length) {
    Object.entries(errores).forEach(([k, v]) => setFieldError(form, k, v));
    toast("Revisa los campos marcados.", "warning");
    return;
  }

  const btn = form.querySelector("#submit-btn");
  setLoading(btn, true);

  const fechaNac = val(form, "fecha_nacimiento");
  const pacientePayload = {
    tipo_documento: val(form, "tipo_documento"),
    numero_documento: val(form, "numero_documento"),
    nombres: val(form, "nombres"),
    apellidos: val(form, "apellidos"),
    fecha_nacimiento: fechaNac,
    sexo: val(form, "sexo") || "X",
    telefono: val(form, "telefono"),
    correo: val(form, "correo"),
    consentimiento_datos: true,
  };
  if (esMenor(fechaNac)) {
    pacientePayload.apoderado = {
      dni: val(form, "apo_dni"),
      nombres: val(form, "apo_nombres"),
      relacion_parentesco: val(form, "apo_relacion"),
      telefono: val(form, "apo_telefono"),
      correo: val(form, "apo_correo"),
    };
  }

  // 1) Registrar paciente.
  const reg = await api.post("/api/pacientes", pacientePayload);
  if (!reg.success) {
    setLoading(btn, false);
    if (reg.status === 409) {
      setFieldError(form, "numero_documento", reg.message);
      toast("Este documento ya está registrado. Usa el portal o un documento distinto.", "warning");
    } else {
      applyErrors(form, reg.errors);
      toast(reg.message || "No se pudo registrar el paciente.", "error");
    }
    return;
  }

  // 2) Crear la cita (PENDIENTE_OTP).
  const selMedico = form.querySelector("#id_medico");
  const citaPayload = {
    id_paciente: reg.data.id_paciente,
    id_medico: Number(val(form, "id_medico")),
    fecha_hora: `${val(form, "fecha")} ${val(form, "hora")}:00`,
    motivo: val(form, "motivo") || null,
  };
  const aseg = val(form, "id_aseguradora");
  if (aseg) citaPayload.id_aseguradora = Number(aseg);
  if (val(form, "numero_afiliado")) citaPayload.numero_afiliado = val(form, "numero_afiliado");

  const cita = await api.post("/api/citas", citaPayload);
  setLoading(btn, false);

  if (!cita.success) {
    toast(cita.message || "No se pudo crear la cita.", "error");
    return;
  }

  // 3) Modal OTP.
  const resumen = {
    paciente: `${pacientePayload.nombres} ${pacientePayload.apellidos}`,
    medico: selMedico.options[selMedico.selectedIndex].text,
    fechaHora: `${val(form, "fecha")} ${val(form, "hora")}`,
  };
  openOtpModal(cita.data.id_cita, {
    otpEnviado: cita.data.otp_enviado,
    onSuccess: () => renderExito(resumen),
  });
}

function renderExito(r) {
  mount(`
    <div class="card">
      <div class="state">
        <div class="state__icon state__icon--success">${icon("checkCircle", 36)}</div>
        <h1>¡Cita reservada!</h1>
        <p class="text-muted">Tu identidad fue validada. Recibirás la confirmación por WhatsApp.</p>
        <span class="badge badge--reservada">RESERVADA_WEB</span>
      </div>
      <div class="summary">
        <div class="summary__row"><span>Paciente</span><span>${r.paciente}</span></div>
        <div class="summary__row"><span>Especialista</span><span>${r.medico}</span></div>
        <div class="summary__row"><span>Fecha y hora</span><span>${r.fechaHora}</span></div>
      </div>
      <div class="actions">
        <a class="btn btn--ghost" href="/" data-link>${icon("calendar")} Reservar otra cita</a>
        <a class="btn btn--primary" href="/portal" data-link>${icon("user")} Ir al portal</a>
      </div>
    </div>
  `);
}
