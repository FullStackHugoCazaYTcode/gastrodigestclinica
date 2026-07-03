// =====================================================================
//  views/portal.js — Portal privado del paciente (login + documentos).
// =====================================================================
import { api } from "../api.js";
import { mount, icon, esc, toast, clearErrors, setFieldError, applyErrors, setLoading } from "../ui.js";

const TIPO_DOC = {
  RECETA_MEDICA: "Receta médica",
  INFORME_ENDOSCOPIA: "Informe de endoscopía",
  INFORME_COLONOSCOPIA: "Informe de colonoscopía",
  RESULTADO_LABORATORIO: "Resultado de laboratorio",
};

export async function renderPortal() {
  // Si ya hay sesión activa, mostramos los documentos directamente.
  mount(`<div class="card"><div class="skeleton" style="height:120px"></div></div>`);
  const res = await api.get("/api/portal/documentos");
  if (res.success) {
    renderDocumentos(res.data || []);
  } else {
    renderLogin();
  }
}

function renderLogin() {
  mount(`
    <section class="portal-split" aria-labelledby="portal-title">
      <aside class="portal-split__promo">
        <div class="portal-split__promo-inner">
          <span class="portal-split__badge">${icon("shieldCheck", 16)} Acceso seguro</span>
          <h2 class="portal-split__promo-title">Tu salud, siempre contigo</h2>
          <p class="portal-split__promo-lead">Consulta y descarga tus documentos clínicos cuando los necesites, desde cualquier dispositivo.</p>
          <ul class="portal-split__points">
            <li>${icon("activity", 18)} Informes de endoscopía y colonoscopía</li>
            <li>${icon("droplet", 18)} Resultados de laboratorio</li>
            <li>${icon("heart", 18)} Recetas médicas al alcance</li>
          </ul>
          <p class="portal-split__legal">${icon("lock", 14)} Datos protegidos conforme a la Ley N.° 29733.</p>
        </div>
      </aside>

      <div class="portal-split__form">
        <h1 id="portal-title">Portal del paciente</h1>
        <p class="portal-split__subtitle">Ingresa con tu documento y contraseña.</p>
        <form id="login-form" novalidate>
          <div class="form-grid" style="grid-template-columns:1fr">
            <div class="field" data-field="tipo_documento">
              <label for="l_tipo">Tipo de documento</label>
              <select class="select" id="l_tipo" name="tipo_documento">
                <option value="DNI">DNI</option>
                <option value="CE">Carné de Extranjería</option>
                <option value="PAS">Pasaporte</option>
              </select>
              <div class="field__error"></div>
            </div>
            <div class="field" data-field="numero_documento">
              <label for="l_num">N.° de documento</label>
              <input class="input" id="l_num" name="numero_documento" autocomplete="username" />
              <div class="field__error"></div>
            </div>
            <div class="field" data-field="password">
              <label for="l_pass">Contraseña</label>
              <input class="input" type="password" id="l_pass" name="password" autocomplete="current-password" />
              <div class="field__error"></div>
            </div>
          </div>
          <button class="btn btn--primary btn--block mt-6" type="submit" id="login-btn">
            ${icon("lock")} Ingresar
          </button>
        </form>
        <p class="wizard-alt">¿No tienes cuenta? <a href="/registro" data-link>Crear una cuenta</a></p>
      </div>
    </section>
  `);

  const form = document.getElementById("login-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);

    const payload = {
      tipo_documento: form.tipo_documento.value,
      numero_documento: form.numero_documento.value.trim(),
      password: form.password.value,
    };
    if (!payload.numero_documento) return setFieldError(form, "numero_documento", "Ingresa tu documento.");
    if (!payload.password) return setFieldError(form, "password", "Ingresa tu contraseña.");

    const btn = document.getElementById("login-btn");
    setLoading(btn, true);
    const res = await api.post("/api/portal/login", payload);
    setLoading(btn, false);

    if (res.success) {
      toast(`Bienvenido(a), ${res.data?.paciente ?? "paciente"}.`, "success");
      renderPortal();
    } else if (res.status === 400) {
      applyErrors(form, res.errors);
      toast(res.message, "warning");
    } else {
      toast(res.message || "No se pudo iniciar sesión.", "error");
    }
  });
}

function renderDocumentos(docs) {
  const lista = docs.length
    ? `<div class="doc-list">${docs.map(docCard).join("")}</div>`
    : `<div class="state"><div class="state__icon state__icon--info">${icon("file", 32)}</div>
         <h3>Aún no tienes documentos</h3>
         <p class="text-muted">Cuando tu médico emita recetas o informes, aparecerán aquí.</p></div>`;

  mount(`
    <section class="hero" style="display:flex;justify-content:space-between;align-items:flex-end;gap:var(--space-4);flex-wrap:wrap">
      <div>
        <span class="eyebrow">${icon("file", 16)} Mis documentos</span>
        <h1>Documentos clínicos</h1>
      </div>
      <button class="btn btn--ghost" id="logout-btn">${icon("logout")} Cerrar sesión</button>
    </section>
    ${lista}
  `);

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await api.post("/api/portal/logout", {});
    toast("Sesión cerrada.", "info");
    renderLogin();
  });
}

function docCard(d) {
  return `
    <article class="doc-card">
      <span class="doc-card__type">${icon("file", 16)} ${esc(TIPO_DOC[d.tipo_documento] ?? d.tipo_documento)}</span>
      <span class="doc-card__title">${esc(d.titulo)}</span>
      ${d.descripcion ? `<span class="doc-card__meta">${esc(d.descripcion)}</span>` : ""}
      <span class="doc-card__meta">Emitido el ${esc(d.fecha_emision)}${d.medico_emisor ? ` · ${esc(d.medico_emisor)}` : ""}</span>
    </article>`;
}
