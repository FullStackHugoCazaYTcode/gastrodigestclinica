// =====================================================================
//  preloader.js — Oculta la pantalla de carga inicial cuando la app está lista.
// =====================================================================
export function hidePreloader() {
  const p = document.getElementById("preloader");
  if (!p) return;

  const remove = () => {
    p.classList.add("is-hidden");
    setTimeout(() => p.remove(), 600);
  };

  // Movimiento reducido: quitar de inmediato, sin animación.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    p.remove();
    return;
  }

  // Mínimo visible (evita parpadeo); la app ya está montada detrás.
  setTimeout(remove, 750);

  // Salvaguarda: nunca bloquear el sitio.
  setTimeout(() => p.isConnected && remove(), 4000);
}
