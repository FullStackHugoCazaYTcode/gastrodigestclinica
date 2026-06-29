// =====================================================================
//  app.js — Punto de arranque del frontend SPA.
// =====================================================================
import { route, startRouter } from "./router.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { renderReserva } from "./views/reserva.js";
import { renderPortal } from "./views/portal.js";
import { renderReprogramar } from "./views/reprogramar.js";
import { initMotion } from "./motion.js";

// Layout persistente.
renderNavbar();
renderFooter();

// Rutas (las páginas de marketing se registran en la Tarea 3).
route("/", renderReserva);
route("/portal", renderPortal);
route("/reprogramar/:token", renderReprogramar);

startRouter();

// Capa de animación (scroll suave + reveals). No bloquea si el CDN falla.
initMotion();
