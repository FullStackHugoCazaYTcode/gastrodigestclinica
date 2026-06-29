// =====================================================================
//  otpModal.js — Modal de validación OTP con countdown visual (5 min).
// =====================================================================
import { api } from "./api.js";
import { icon, el, toast } from "./ui.js";

const TTL_SECONDS = 300;

export function openOtpModal(idCita, { otpEnviado = true, onSuccess } = {}) {
  const root = document.getElementById("modal-root");
  const previousFocus = document.activeElement;

  const backdrop = el(`
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="otp-title">
        <div class="modal__head">
          <div class="card__title" style="margin:0">
            <span class="card__icon">${icon("shield")}</span>
            <h2 id="otp-title">Verifica tu identidad</h2>
          </div>
          <button class="modal__close" type="button" aria-label="Cerrar">${icon("x")}</button>
        </div>
        <p class="text-muted mt-2" style="font-size:var(--text-sm)">
          Ingresa el código de 4 dígitos que enviamos por WhatsApp o correo.
        </p>
        ${
          otpEnviado
            ? ""
            : `<div class="apoderado__banner mt-2">${icon("warning", 18)}
                 <span>No se pudo enviar el código automáticamente (n8n no configurado). Revisa la integración.</span></div>`
        }

        <div class="otp-inputs" id="otp-inputs">
          ${[0, 1, 2, 3]
            .map((i) => `<input type="text" inputmode="numeric" maxlength="1" aria-label="Dígito ${i + 1}" />`)
            .join("")}
        </div>
        <div class="field__error" id="otp-error" style="justify-content:center"></div>

        <div class="countdown" id="otp-countdown">
          <div class="countdown__row">
            <span class="text-muted" style="display:inline-flex;gap:6px;align-items:center">
              ${icon("clock", 16)} Tiempo restante
            </span>
            <span class="countdown__time" id="otp-time">5:00</span>
          </div>
          <div class="countdown__track" id="otp-progress" role="progressbar" aria-label="Tiempo restante para validar el código" aria-valuemin="0" aria-valuemax="${TTL_SECONDS}" aria-valuenow="${TTL_SECONDS}"><div class="countdown__bar" id="otp-bar"></div></div>
        </div>

        <button class="btn btn--cta btn--block mt-6" id="otp-validate" type="button">Validar código</button>
      </div>
    </div>`);

  root.appendChild(backdrop);

  const inputs = [...backdrop.querySelectorAll("#otp-inputs input")];
  const inputsWrap = backdrop.querySelector("#otp-inputs");
  const errorEl = backdrop.querySelector("#otp-error");
  const timeEl = backdrop.querySelector("#otp-time");
  const barEl = backdrop.querySelector("#otp-bar");
  const progressEl = backdrop.querySelector("#otp-progress");
  const countdownEl = backdrop.querySelector("#otp-countdown");
  const validateBtn = backdrop.querySelector("#otp-validate");

  let remaining = TTL_SECONDS;
  let validating = false;
  let closed = false;

  const close = () => {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
    previousFocus?.focus?.();
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };

  document.addEventListener("keydown", onKey);
  backdrop.querySelector(".modal__close").addEventListener("click", close);
  backdrop.addEventListener("mousedown", (e) => { if (e.target === backdrop) close(); });
  backdrop.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...backdrop.querySelectorAll("button:not([disabled]), input:not([disabled])")];
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ---- Countdown ----
  const renderTime = () => {
    const m = Math.floor(remaining / 60);
    const s = String(remaining % 60).padStart(2, "0");
    timeEl.textContent = `${m}:${s}`;
    barEl.style.width = `${(remaining / TTL_SECONDS) * 100}%`;
    countdownEl.classList.toggle("is-low", remaining <= 30);
  };
  const expire = () => {
    clearInterval(timer);
    remaining = 0;
    renderTime();
    inputs.forEach((i) => (i.disabled = true));
    validateBtn.disabled = true;
  };
  renderTime();
  const timer = setInterval(() => {
    remaining--;
    if (remaining <= 0) { expire(); setError("El código expiró. Realiza la reserva nuevamente."); return; }
    renderTime();
  }, 1000);

  // ---- Inputs ----
  const setError = (msg) => {
    errorEl.innerHTML = msg ? `${icon("alert", 14)}<span>${msg}</span>` : "";
    inputsWrap.classList.toggle("has-error", Boolean(msg));
  };
  const code = () => inputs.map((i) => i.value).join("");

  inputs.forEach((inp, idx) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "").slice(0, 1);
      setError("");
      if (inp.value && idx < 3) inputs[idx + 1].focus();
      if (code().length === 4) validate();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !inp.value && idx > 0) inputs[idx - 1].focus();
    });
    inp.addEventListener("paste", (e) => {
      e.preventDefault();
      const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 4).split("");
      digits.forEach((d, i) => { if (inputs[i]) inputs[i].value = d; });
      if (digits.length) inputs[Math.min(digits.length, 3)].focus();
      if (code().length === 4) validate();
    });
  });
  inputs[0].focus();

  // ---- Validación ----
  async function validate() {
    if (validating || closed || remaining <= 0) return;
    if (code().length !== 4) { setError("Ingresa los 4 dígitos."); return; }

    validating = true;
    validateBtn.disabled = true;
    const prev = validateBtn.innerHTML;
    validateBtn.innerHTML = `<span class="spinner"></span> Validando…`;

    const res = await api.post("/api/otp/validar", { id_cita: idCita, codigo: code() });
    validating = false;

    if (res.success) {
      close();
      onSuccess?.();
      return;
    }

    validateBtn.disabled = false;
    validateBtn.innerHTML = prev;

    if (res.status === 409 || res.status === 403) {
      expire();
      setError(res.message);
    } else {
      setError(res.message || "Código incorrecto.");
      inputs.forEach((i) => (i.value = ""));
      inputs[0].focus();
    }
  }
  validateBtn.addEventListener("click", validate);
}
