// =====================================================================
//  faq.js — Acordeón de preguntas frecuentes (accesible) + JSON-LD SEO.
// =====================================================================
import { icon } from "../ui.js";

export const FAQ = [
  ["¿Qué preparación necesito para una colonoscopía?",
   "Dieta baja en residuos los 3 días previos y la solución de limpieza indicada la noche anterior. Al reservar te entregamos las instrucciones detalladas paso a paso."],
  ["¿La endoscopía duele? ¿Incluye sedación?",
   "Es un procedimiento breve y se realiza con sedación, por lo que no sentirás molestias. Requiere ayuno de 8 horas previas."],
  ["¿Atienden emergencias gastroenterológicas?",
   "Brindamos orientación y derivación oportuna. Para urgencias graves, acude al servicio de emergencia más cercano y luego coordina tu seguimiento con nosotros."],
  ["¿Trabajan con seguros?",
   "Atendemos pacientes particulares y con seguro (EsSalud, EPS). La elegibilidad se valida al momento de reservar tu cita."],
  ["¿Necesito ayuno antes de mi consulta?",
   "Para una consulta regular no es necesario. Para procedimientos como endoscopía o colonoscopía sí; te lo indicamos al agendar."],
  ["¿Cómo recibo mis resultados?",
   "Tus informes, recetas y resultados quedan disponibles de forma segura en tu Portal del Paciente, accesibles cuando los necesites."],
];

export function faqHTML() {
  return `<section class="section faq">
    <div class="container">
      <span class="eyebrow eyebrow--center">${icon("message", 16)} Resolvemos tus dudas</span>
      <h2 class="section__title">Preguntas frecuentes</h2>
      <div class="faq__list">
        ${FAQ.map(([q, a], i) => `
          <div class="faq__item" data-reveal>
            <button class="faq__q" aria-expanded="false" aria-controls="faq-a-${i}">
              <span>${q}</span>${icon("chevronDown", 20)}
            </button>
            <div class="faq__a" id="faq-a-${i}">
              <div class="faq__a-inner"><p>${a}</p></div>
            </div>
          </div>`).join("")}
      </div>
    </div>
  </section>`;
}

export function wireFaq(root = document) {
  root.querySelectorAll(".faq__q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq__item");
      const open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
    });
  });
}

export function injectFaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
  let s = document.getElementById("faq-jsonld");
  if (!s) {
    s = document.createElement("script");
    s.id = "faq-jsonld";
    s.type = "application/ld+json";
    document.head.appendChild(s);
  }
  s.textContent = JSON.stringify(data);
}
