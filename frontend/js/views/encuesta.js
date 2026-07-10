// =====================================================================
//  views/encuesta.js — Encuesta de satisfacción (NPS) vía token.
//  Ruta: /encuesta/:token  (enlace enviado por n8n tras ser atendido)
// =====================================================================
import { api } from "../api.js";
import { mount, icon, esc, toast, setLoading } from "../ui.js";

export async function renderEncuesta({ token }) {
  mount(`<div class="card" style="max-width:560px;margin-inline:auto"><div class="skeleton" style="height:200px"></div></div>`);

  const res = await api.get(`/api/encuestas/${encodeURIComponent(token)}`);

  if (!res.success) {
    return estado("alert", "info", "Enlace no válido", res.message || "La encuesta no existe o el enlace ya no está disponible.");
  }
  if (res.data.respondida) {
    return estado("checkCircle", "success", "¡Gracias!", "Ya registramos tu opinión sobre esta atención. Agradecemos tu tiempo.");
  }

  const d = res.data;
  mount(`
    <section class="hero">
      <span class="eyebrow">${icon("heart", 16)} Tu opinión nos importa</span>
      <h1>¿Cómo fue tu atención?</h1>
      <p>Cuéntanos sobre tu cita con Dr(a). ${esc(d.medico)}. Toma menos de un minuto y nos ayuda a mejorar.</p>
    </section>

    <div class="card" style="max-width:560px;margin-inline:auto">
      <div class="summary" style="margin-top:0">
        <div class="summary__row"><span>Especialista</span><span>Dr(a). ${esc(d.medico)}</span></div>
        <div class="summary__row"><span>Especialidad</span><span>${esc(d.especialidad)}</span></div>
      </div>

      <form id="enc-form" novalidate>
        <label class="book-label mt-5">Tu calificación <span class="req">*</span></label>
        <div class="encuesta-stars" id="enc-stars" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
          ${[1, 2, 3, 4, 5]
            .map((n) => `<button type="button" class="enc-star" data-v="${n}" role="radio" aria-checked="false" aria-label="${n} estrella${n > 1 ? "s" : ""}">★</button>`)
            .join("")}
        </div>

        <label class="book-label mt-5" for="enc-com">Comentario (opcional)</label>
        <textarea class="textarea" id="enc-com" maxlength="500" rows="4" placeholder="¿Qué te pareció la atención? ¿Algo que podamos mejorar?"></textarea>

        <label class="enc-consent mt-4">
          <input type="checkbox" id="enc-pub" />
          <span>Autorizo que mi comentario se publique como testimonio en el sitio (se mostrará solo mi nombre y la inicial del apellido).</span>
        </label>

        <button class="btn btn--cta btn--block mt-6" type="submit" id="enc-btn" disabled>Enviar opinión</button>
      </form>
    </div>
  `);

  let puntaje = 0;
  const stars = [...document.querySelectorAll(".enc-star")];
  const btn = document.getElementById("enc-btn");
  const paint = (v) =>
    stars.forEach((s, i) => {
      const on = i < v;
      s.classList.toggle("is-on", on);
      s.setAttribute("aria-checked", String(i + 1 === puntaje));
    });

  stars.forEach((s) => {
    s.addEventListener("mouseenter", () => paint(Number(s.dataset.v)));
    s.addEventListener("mouseleave", () => paint(puntaje));
    s.addEventListener("click", () => {
      puntaje = Number(s.dataset.v);
      paint(puntaje);
      btn.disabled = false;
    });
  });

  document.getElementById("enc-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (puntaje < 1) {
      toast("Elige una calificación de 1 a 5 estrellas.", "warning");
      return;
    }
    setLoading(btn, true);
    const out = await api.post(`/api/encuestas/${encodeURIComponent(token)}`, {
      puntaje,
      comentario: document.getElementById("enc-com").value.trim(),
      autoriza_publicar: document.getElementById("enc-pub").checked,
    });
    setLoading(btn, false);

    if (out.success) {
      estado("checkCircle", "success", "¡Gracias por tu opinión!", "Tu respuesta nos ayuda a seguir mejorando la atención de GastroDigest.");
    } else {
      toast(out.message || "No se pudo registrar tu opinión.", "error");
    }
  });
}

function estado(ic, tono, titulo, texto) {
  mount(`
    <div class="card" style="max-width:560px;margin-inline:auto">
      <div class="state">
        <div class="state__icon state__icon--${tono}">${icon(ic, 34)}</div>
        <h1>${esc(titulo)}</h1>
        <p class="text-muted">${esc(texto)}</p>
        <div class="actions"><a class="btn btn--primary" href="/" data-link>Ir al inicio</a></div>
      </div>
    </div>`);
}
