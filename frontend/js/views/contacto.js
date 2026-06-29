// =====================================================================
//  views/contacto.js — Contacto: datos, horario, mapa y CTA.
// =====================================================================
import { mountFull, icon } from "../ui.js";
import { auroraHTML } from "../components/aurora.js";
import { revealOnScroll } from "../motion.js";

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
          <div class="contact__item">${icon("mapPin", 20)}<div><strong>Dirección</strong><span>Jr. Dos de Mayo 1234, Huánuco</span></div></div>
          <div class="contact__item">${icon("phone", 20)}<div><strong>Teléfono / WhatsApp</strong><span>+51 962 000 000</span></div></div>
          <div class="contact__item">${icon("mail", 20)}<div><strong>Correo</strong><span>citas@gastrodigest.pe</span></div></div>
          <div class="contact__item">${icon("clock", 20)}<div><strong>Horario</strong><span>Lun – Sáb · 8:00 a 18:00</span></div></div>
          <a class="btn btn--cta btn--lg" href="/reservar" data-link>${icon("calendar")} Reservar cita</a>
        </div>
        <div class="contact__map" data-reveal>
          <iframe title="Ubicación de GastroDigest en Huánuco"
            src="https://www.google.com/maps?q=Huanuco,Peru&output=embed"
            loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    </section>
  `);
  revealOnScroll();
}
