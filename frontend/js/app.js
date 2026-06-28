// =====================================================================
//  app.js — Punto de arranque del frontend SPA.
// =====================================================================
import { route, startRouter } from "./router.js";
import { icon } from "./ui.js";
import { renderReserva } from "./views/reserva.js";
import { renderPortal } from "./views/portal.js";
import { renderReprogramar } from "./views/reprogramar.js";

// Año en el footer.
document.getElementById("year").textContent = String(new Date().getFullYear());

// Enlaces de navegación.
document.getElementById("nav-links").innerHTML = `
  <li><a href="/" data-link>${icon("calendar", 18)}<span>Reservar cita</span></a></li>
  <li><a href="/portal" data-link>${icon("user", 18)}<span>Portal del paciente</span></a></li>
`;

// Rutas.
route("/", renderReserva);
route("/portal", renderPortal);
route("/reprogramar/:token", renderReprogramar);

startRouter();
