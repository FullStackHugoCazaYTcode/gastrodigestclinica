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

// Rutas del sitio.
route("/", renderHome);
route("/servicios", renderServicios);
route("/nosotros", renderNosotros);
route("/medicos", renderMedicos);
route("/contacto", renderContacto);
route("/reservar", renderReserva);
route("/registro", renderRegistro);
route("/portal", renderPortal);
route("/medico", renderMedicoPortal);
route("/admin", renderAdminPortal);
route("/reprogramar/:token", renderReprogramar);
route("/libro-reclamaciones", renderLibroReclamaciones);
route("/privacidad", renderPrivacidad);

startRouter();

// Capa de animación (reveals al scroll). No bloquea si el CDN falla.
initMotion();

// Oculta el preloader cuando todo está montado.
hidePreloader();
