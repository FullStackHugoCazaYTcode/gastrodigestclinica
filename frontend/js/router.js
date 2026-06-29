// =====================================================================
//  router.js — Enrutador SPA con History API.
//  Rutas: "/" (reserva), "/portal", "/reprogramar/:token".
//  Vercel reescribe todas las rutas a index.html (ver vercel.json).
// =====================================================================

const routes = [];

export function route(pattern, handler) {
  const keys = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:[^/]+/g, (m) => {
        keys.push(m.slice(1));
        return "([^/]+)";
      }) +
      "/?$"
  );
  routes.push({ regex, keys, handler });
}

export function navigate(path) {
  if (path !== location.pathname) history.pushState({}, "", path);
  resolve();
}

function resolve() {
  const path = location.pathname || "/";
  for (const r of routes) {
    const match = path.match(r.regex);
    if (match) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(match[i + 1])));
      r.handler(params);
      updateActiveLinks(path);
      return;
    }
  }
  // Sin coincidencia → ruta por defecto.
  navigate("/");
}

function updateActiveLinks(path) {
  document.querySelectorAll("#site-nav .nav-links a").forEach((a) => {
    const active = a.getAttribute("href") === path;
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function startRouter() {
  // Intercepta clics en enlaces internos marcados con data-link.
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-link]");
    if (!link) return;
    const url = new URL(link.href);
    if (url.origin === location.origin) {
      e.preventDefault();
      navigate(url.pathname);
    }
  });
  window.addEventListener("popstate", resolve);
  resolve();
}
