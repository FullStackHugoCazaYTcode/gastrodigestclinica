// =====================================================================
//  views/contacto.js — Contacto: datos, horario, mapa y CTA.
// =====================================================================
import { mountFull, icon } from "../ui.js";
import { auroraHTML } from "../components/aurora.js";
import { revealOnScroll, motionReady } from "../motion.js";

const MAPS_URL = "https://maps.app.goo.gl/WReRiXqWujZsfRhP7";
const MAPS_EMBED = "https://www.google.com/maps?q=Pasaje+14+de+Agosto+150,+Hu%C3%A1nuco,+Per%C3%BA&output=embed";
const WHATSAPP = "https://wa.me/51974492948";

export function renderContacto() {
  mountFull(`
    <section class="page-hero">
      ${auroraHTML()}
      <div class="container page-hero__inner">
        <span class="eyebrow eyebrow--center">${icon("mapPin", 16)} Contáctanos</span>
        <h1>Estamos para atenderte</h1>
        <p class="section__lead">Reserva en línea o visítanos en nuestra sede en Huánuco.</p>
      </div>
    </section>

    <section class="section">
      <div class="container contact">
        <div class="contact__info" data-reveal>
          <div class="contact__item">${icon("mapPin", 20)}<div><strong>Dirección</strong><span>Pasaje 14 de Agosto 150, Huánuco</span></div></div>
          <div class="contact__item">${icon("phone", 20)}<div><strong>Teléfono / WhatsApp</strong><span>+51 974 492 948</span></div></div>
          <div class="contact__item">${icon("mail", 20)}<div><strong>Correo</strong><span>hr177153@gmail.com</span></div></div>
          <div class="contact__item">${icon("clock", 20)}<div><strong>Horario</strong><span>Lun – Sáb · 8:00 a. m. – 6:00 p. m.</span></div></div>
          <div style="display:flex;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-4)">
            <a class="btn btn--cta btn--lg" href="/portal" target="_blank" rel="noopener">${icon("calendar")} Reservar cita</a>
            <a class="btn btn--ghost btn--lg" href="${WHATSAPP}" target="_blank" rel="noopener">${icon("message")} WhatsApp</a>
            <a class="btn btn--ghost btn--lg" href="${MAPS_URL}" target="_blank" rel="noopener">${icon("mapPin")} Cómo llegar</a>
          </div>
        </div>
        <div class="contact__map" data-reveal>
          <iframe title="Ubicación de GastroDigest — Pasaje 14 de Agosto 150, Huánuco"
            src="${MAPS_EMBED}"
            loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            tabindex="-1"></iframe>
        </div>
      </div>
    </section>
  `);
  motionReady.then(() => revealOnScroll());
}
