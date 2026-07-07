// =====================================================================
//  app.js — Punto de arranque del frontend SPA.
// =====================================================================
import { route, startRouter } from "./router.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { renderChatbot } from "./components/chatbot.js";
import { renderHome } from "./views/home.js";
import { renderServicios } from "./views/servicios.js";
import { renderNosotros } from "./views/nosotros.js";
import { renderMedicos } from "./views/medicos.js";
import { renderContacto } from "./views/contacto.js";
import { renderReserva } from "./views/reserva.js";
import { renderRegistro } from "./views/registro.js";
import { renderPortal } from "./views/portal.js";
import { renderMedicoPortal } from "./views/medicoPortal.js";
import { renderAdminPortal } from "./views/adminPortal.js";
import { renderReprogramar } from "./views/reprogramar.js";
import { renderLibroReclamaciones, renderPrivacidad } from "./views/legal.js";
import { initMotion } from "./motion.js";
import { hidePreloader } from "./components/preloader.js";

// Evita el parpadeo del chrome de marketing si la app arranca en una vista de app.
if (/^\/(portal|medico|admin|registro)/.test(location.pathname)) document.body.classList.add("portal-mode");

// Layout persistente.
renderNavbar();
renderFooter();
renderChatbot();

// Rutas del sitio (con título y descripción por página para SEO).
route("/", renderHome, {
  desc: "Clínica gastroenterológica en Huánuco: endoscopía, colonoscopía y consulta especializada. Reserva en línea y accede a tu portal del paciente.",
});
route("/servicios", renderServicios, {
  title: "Servicios",
  desc: "Consulta gastroenterológica, endoscopía digestiva alta, colonoscopía y pruebas de laboratorio en Huánuco. Resultados en tu portal.",
});
route("/nosotros", renderNosotros, {
  title: "Nosotros",
  desc: "Conoce a GastroDigest: clínica de gastroenterología en Huánuco con médicos colegiados, tecnología moderna y trato humano.",
});
route("/medicos", renderMedicos, {
  title: "Médicos",
  desc: "Nuestro equipo de especialistas en gastroenterología, colegiados (CMP) y con amplia trayectoria. Agenda con tu médico de confianza.",
});
route("/contacto", renderContacto, {
  title: "Contacto",
  desc: "Estamos en Jr. Dos de Mayo 1234, Huánuco. Lun–Sáb 8:00 a. m. – 6:00 p. m. Teléfono y WhatsApp: +51 962 000 000.",
});
route("/reservar", renderReserva, {
  title: "Agendar cita",
  desc: "Reserva tu cita gastroenterológica en línea, confírmala por WhatsApp y recibe tus resultados en tu portal.",
});
route("/registro", renderRegistro, { title: "Crear cuenta" });
route("/portal", renderPortal, { title: "Portal del paciente" });
route("/medico", renderMedicoPortal, { title: "Acceso médicos" });
route("/admin", renderAdminPortal, { title: "Administración" });
route("/reprogramar/:token", renderReprogramar, { title: "Reprogramar cita" });
route("/libro-reclamaciones", renderLibroReclamaciones, {
  title: "Libro de Reclamaciones",
  desc: "Registra tu reclamo o queja conforme a la Ley N.° 29571 (INDECOPI). Respuesta en 15 días hábiles.",
});
route("/privacidad", renderPrivacidad, {
  title: "Política de Privacidad",
  desc: "Cómo GastroDigest protege y trata tus datos personales conforme a la Ley N.° 29733.",
});

startRouter();

// Capa de animación (reveals al scroll). No bloquea si el CDN falla.
initMotion();

// Oculta el preloader cuando todo está montado.
hidePreloader();
