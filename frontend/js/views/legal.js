// =====================================================================
//  views/legal.js — Páginas legales:
//   · Libro de Reclamaciones (form INDECOPI, D.S. 011-2011-PCM)
//   · Política de Privacidad (Ley N.° 29733)
// =====================================================================
import { api } from "../api.js";
import { mount, icon, esc, toast, clearErrors, setFieldError, applyErrors, setLoading } from "../ui.js";
import { validarDocumento, validarEmail, validarTelefono } from "../validators.js";

const RAZON_SOCIAL = "GastroDigest Clínica de Gastroenterología S.A.C.";
const RUC = "10716090065";

// ---------------------------------------------------------------------
//  Libro de Reclamaciones
// ---------------------------------------------------------------------
export function renderLibroReclamaciones() {
  const HOY = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  mount(`
    <section class="page-hero page-hero--legal">
      <div class="page-hero__inner">
        <span class="eyebrow eyebrow--center">${icon("book", 16)} Defensa del consumidor</span>
        <h1>Libro de Reclamaciones</h1>
        <p class="section__lead">Conforme al Código de Protección y Defensa del Consumidor (Ley N.° 29571). Registra aquí tu reclamo o queja; recibirás respuesta en un plazo máximo de <strong>15 días hábiles</strong>.</p>
      </div>
    </section>

    <div class="legal-book">
      <div class="legal-book__meta">
        <div><span>Razón social</span><strong>${RAZON_SOCIAL}</strong></div>
        <div><span>RUC</span><strong>${RUC}</strong></div>
        <div><span>Fecha</span><strong>${HOY}</strong></div>
      </div>

      <form id="reclamo-form" novalidate>
        <fieldset class="legal-fs">
          <legend>1. Identificación del consumidor</legend>
          <div class="form-grid">
            <div class="field" data-field="nombres"><label for="lr_nom">Nombres y apellidos <span class="req">*</span></label><input class="input" id="lr_nom" name="nombres" autocomplete="name" /><div class="field__error"></div></div>
            <div class="field" data-field="tipo_documento"><label for="lr_tipo">Tipo de documento</label>
              <select class="select" id="lr_tipo" name="tipo_documento"><option value="DNI">DNI</option><option value="CE">Carné de Extranjería</option><option value="PAS">Pasaporte</option></select><div class="field__error"></div></div>
            <div class="field" data-field="numero_documento"><label for="lr_doc">N.° de documento <span class="req">*</span></label><input class="input" id="lr_doc" name="numero_documento" /><div class="field__error"></div></div>
            <div class="field" data-field="telefono"><label for="lr_tel">Teléfono</label><input class="input" id="lr_tel" name="telefono" inputmode="numeric" /><div class="field__error"></div></div>
            <div class="field" data-field="correo"><label for="lr_cor">Correo electrónico <span class="req">*</span></label><input class="input" type="email" id="lr_cor" name="correo" autocomplete="email" /><div class="field__error"></div></div>
            <div class="field field--full" data-field="domicilio"><label for="lr_dom">Domicilio</label><input class="input" id="lr_dom" name="domicilio" /><div class="field__error"></div></div>
          </div>
        </fieldset>

        <fieldset class="legal-fs">
          <legend>2. Identificación del bien contratado</legend>
          <div class="form-grid">
            <div class="field" data-field="tipo_bien"><label for="lr_bien">Tipo</label>
              <select class="select" id="lr_bien" name="tipo_bien"><option value="SERVICIO">Servicio</option><option value="PRODUCTO">Producto</option></select><div class="field__error"></div></div>
            <div class="field" data-field="monto"><label for="lr_monto">Monto reclamado (S/)</label><input class="input" id="lr_monto" name="monto" inputmode="decimal" placeholder="Opcional" /><div class="field__error"></div></div>
            <div class="field field--full" data-field="descripcion_bien"><label for="lr_desc">Descripción del servicio o producto</label><input class="input" id="lr_desc" name="descripcion_bien" placeholder="Ej. Consulta gastroenterológica, endoscopía…" /><div class="field__error"></div></div>
          </div>
        </fieldset>

        <fieldset class="legal-fs">
          <legend>3. Detalle de la reclamación</legend>
          <div class="field" data-field="tipo" style="margin-bottom:var(--space-4)">
            <div class="legal-radios">
              <label class="legal-radio"><input type="radio" name="tipo" value="RECLAMO" checked /> <span><strong>Reclamo</strong><small>Disconformidad con el producto o servicio</small></span></label>
              <label class="legal-radio"><input type="radio" name="tipo" value="QUEJA" /> <span><strong>Queja</strong><small>Malestar respecto a la atención</small></span></label>
            </div>
          </div>
          <div class="form-grid">
            <div class="field field--full" data-field="detalle"><label for="lr_detalle">Detalle <span class="req">*</span></label><textarea class="textarea" id="lr_detalle" name="detalle" placeholder="Describe lo sucedido con el mayor detalle posible."></textarea><div class="field__error"></div></div>
            <div class="field field--full" data-field="pedido"><label for="lr_pedido">Pedido del consumidor <span class="req">*</span></label><textarea class="textarea" id="lr_pedido" name="pedido" placeholder="¿Qué solución esperas?"></textarea><div class="field__error"></div></div>
            <div class="field field--full" data-field="consentimiento">
              <label class="checkbox"><input type="checkbox" id="lr_cons" name="consentimiento" /><span>Declaro que los datos son verídicos y acepto el tratamiento de mis datos para atender este reclamo (Ley N.° 29733). <span class="req">*</span></span></label>
              <div class="field__error"></div>
            </div>
          </div>
        </fieldset>

        <div class="actions actions--end">
          <button class="btn btn--cta btn--lg" type="submit" id="lr-btn">${icon("book", 18)} Enviar reclamación</button>
        </div>
      </form>
    </div>
  `);

  const form = document.getElementById("reclamo-form");
  form.addEventListener("submit", (e) => onEnviarReclamo(e, form));
}

function validarReclamo(form) {
  const errs = {};
  const g = (n) => form[n].value.trim();
  if (!g("nombres")) errs.nombres = "Ingresa tus nombres y apellidos.";
  const docErr = validarDocumento(form.tipo_documento.value, g("numero_documento"));
  if (docErr) errs.numero_documento = docErr;
  if (!validarEmail(g("correo"))) errs.correo = "Correo electrónico inválido.";
  if (g("telefono") && !validarTelefono(g("telefono"))) errs.telefono = "Teléfono inválido (9 a 15 dígitos).";
  if (g("detalle").length < 10) errs.detalle = "Describe el detalle (mín. 10 caracteres).";
  if (g("pedido").length < 5) errs.pedido = "Indica tu pedido.";
  if (!form.consentimiento.checked) errs.consentimiento = "Debes aceptar la declaración.";
  return errs;
}

async function onEnviarReclamo(e, form) {
  e.preventDefault();
  clearErrors(form);
  const errs = validarReclamo(form);
  if (Object.keys(errs).length) {
    Object.entries(errs).forEach(([k, v]) => setFieldError(form, k, v));
    toast("Revisa los campos marcados.", "warning");
    return;
  }

  const g = (n) => form[n].value.trim();
  const payload = {
    tipo: form.tipo.value,
    nombres: g("nombres"),
    tipo_documento: form.tipo_documento.value,
    numero_documento: g("numero_documento"),
    telefono: g("telefono") || null,
    correo: g("correo"),
    domicilio: g("domicilio") || null,
    tipo_bien: form.tipo_bien.value,
    descripcion_bien: g("descripcion_bien") || null,
    monto: g("monto") || null,
    detalle: g("detalle"),
    pedido: g("pedido"),
  };

  const btn = document.getElementById("lr-btn");
  setLoading(btn, true);
  const res = await api.post("/api/reclamaciones", payload);
  setLoading(btn, false);

  if (res.success) {
    renderConfirmacion(res.data?.numero_hoja || "—", payload.correo);
  } else if (res.status === 400) {
    applyErrors(form, res.errors);
    toast(res.message, "warning");
  } else {
    toast(res.message || "No se pudo registrar la reclamación.", "error");
  }
}

function renderConfirmacion(numeroHoja, correo) {
  mount(`
    <div class="legal-ok">
      <span class="legal-ok__icon">${icon("checkCircle", 40)}</span>
      <h1>Reclamación registrada</h1>
      <p class="section__lead">Guardamos tu Hoja de Reclamación. Te responderemos en un máximo de <strong>15 días hábiles</strong> al correo <strong>${esc(correo)}</strong>.</p>
      <div class="legal-ok__code"><span>Hoja de Reclamación N.°</span><strong>${esc(numeroHoja)}</strong></div>
      <a class="btn btn--primary" href="/" data-link>${icon("home", 18)} Volver al inicio</a>
    </div>
  `);
}

// ---------------------------------------------------------------------
//  Política de Privacidad (Ley N.° 29733)
// ---------------------------------------------------------------------
export function renderPrivacidad() {
  mount(`
    <section class="page-hero page-hero--legal">
      <div class="page-hero__inner">
        <span class="eyebrow eyebrow--center">${icon("shieldCheck", 16)} Protección de datos</span>
        <h1>Política de Privacidad</h1>
        <p class="section__lead">Cómo tratamos y protegemos tus datos personales, conforme a la Ley N.° 29733 y su Reglamento.</p>
      </div>
    </section>

    <article class="legal-doc">
      <p><strong>${RAZON_SOCIAL}</strong> (RUC ${RUC}), con domicilio en Pasaje 14 de Agosto 150, Huánuco, es responsable del tratamiento de tus datos personales.</p>

      <h2>1. Datos que recopilamos</h2>
      <p>Recopilamos los datos que nos brindas al crear tu cuenta, reservar una cita o comunicarte con nosotros: nombres, tipo y número de documento, fecha de nacimiento, teléfono, correo electrónico y dirección. Con motivo de la atención médica, tratamos también datos de salud, considerados <em>datos sensibles</em>.</p>

      <h2>2. Finalidad del tratamiento</h2>
      <ul>
        <li>Gestionar tu registro, citas y acceso al portal del paciente.</li>
        <li>Emitir y poner a tu disposición documentos clínicos (recetas, informes, resultados).</li>
        <li>Enviarte confirmaciones y recordatorios de tus citas.</li>
        <li>Cumplir obligaciones legales y de defensa del consumidor.</li>
      </ul>

      <h2>3. Consentimiento</h2>
      <p>El tratamiento de tus datos se realiza con tu consentimiento previo, libre, expreso e informado, otorgado al aceptar esta política durante el registro. En el caso de menores de edad, se requiere el consentimiento del apoderado (Ley N.° 29414).</p>

      <h2>4. Conservación y seguridad</h2>
      <p>Tus datos se conservan mientras dure la relación con la clínica y por los plazos que exige la normativa de salud. Aplicamos medidas técnicas y organizativas (contraseñas cifradas, control de acceso por rol, conexiones seguras) para protegerlos.</p>

      <h2>5. Ejercicio de tus derechos (ARCO)</h2>
      <p>Puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo a <a href="mailto:datos@gastrodigest.pe">datos@gastrodigest.pe</a>. Si consideras que tus derechos no fueron atendidos, puedes presentar un reclamo ante la Autoridad Nacional de Protección de Datos Personales.</p>

      <h2>6. Transferencias</h2>
      <p>No compartimos tus datos con terceros salvo cuando sea necesario para la prestación del servicio (por ejemplo, mensajería de confirmación) o cuando lo exija la ley, siempre bajo obligaciones de confidencialidad.</p>

      <p class="legal-doc__foot">Última actualización: julio de 2026. Para dudas sobre esta política, escríbenos a <a href="mailto:datos@gastrodigest.pe">datos@gastrodigest.pe</a>.</p>
    </article>
  `);
}
