// =====================================================================
//  app.js — Punto de arranque del frontend SPA.
// =====================================================================
import { route, startRouter } from "./router.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { renderHome } from "./views/home.js";
import { renderServicios } from "./views/servicios.js";
import { renderNosotros } from "./views/nosotros.js";
import { renderMedicos } from "./views/medicos.js";
import { renderContacto } from "./views/contacto.js";
import { renderReserva } from "./views/reserva.js";
import { renderPortal } from "./views/portal.js";
import { renderReprogramar } from "./views/reprogramar.js";
import { initMotion } from "./motion.js";
import { hidePreloader } from "./components/preloader.js";

// Layout persistente.
renderNavbar();
renderFooter();

// Rutas del sitio.
route("/", renderHome);
route("/servicios", renderServicios);
route("/nosotros", renderNosotros);
route("/medicos", renderMedicos);
route("/contacto", renderContacto);
route("/reservar", renderReserva);
route("/portal", renderPortal);
route("/reprogramar/:token", renderReprogramar);

startRouter();

// Capa de animación (reveals al scroll). No bloquea si el CDN falla.
initMotion();

// Oculta el preloader cuando todo está montado.
hidePreloader();
