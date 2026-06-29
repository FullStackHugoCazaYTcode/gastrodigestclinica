// =====================================================================
//  motion.js — Capa de animación (GSAP + ScrollTrigger + Lenis).
//  Carga las librerías por ESM dinámico con try/catch: si el CDN falla
//  o el usuario prefiere movimiento reducido, el sitio degrada a estático.
// =====================================================================

let gsap = null;
let ScrollTrigger = null;
let lenis = null;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Inicializa scroll suave + GSAP/ScrollTrigger. Idempotente y a prueba de fallos. */
export async function initMotion() {
  if (prefersReducedMotion() || gsap) return;
  try {
    const g = await import("https://esm.sh/gsap@3.12.5");
    gsap = g.gsap || g.default;
    const st = await import("https://esm.sh/gsap@3.12.5/ScrollTrigger");
    ScrollTrigger = st.ScrollTrigger || st.default;
    gsap.registerPlugin(ScrollTrigger);

    const L = await import("https://esm.sh/lenis@1.1.13");
    const Lenis = L.default || L.Lenis;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    window.__lenis = lenis; // handle para scroll programático (verificación)
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    lenis.on("scroll", () => ScrollTrigger.update());
  } catch (e) {
    console.warn("[motion] librerías no disponibles, modo estático:", e);
    gsap = null;
  }
}

/** Revela con fade+slide los elementos [data-reveal] al entrar en viewport. */
export function revealOnScroll(root = document) {
  const els = root.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion() || !gsap) {
    els.forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
    return;
  }
  els.forEach((el) => {
    if (el.dataset.revealed) return;
    el.dataset.revealed = "1";
    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" } }
    );
  });
  ScrollTrigger.refresh();
}

/** Anima un contador numérico (usa data-count). */
export function countUp(el) {
  const to = Number(el.dataset.count || 0);
  if (prefersReducedMotion() || !gsap) {
    el.textContent = to.toLocaleString("es-PE");
    return;
  }
  const obj = { v: 0 };
  gsap.to(obj, {
    v: to, duration: 1.6, ease: "power2.out",
    scrollTrigger: { trigger: el, start: "top 90%" },
    onUpdate: () => { el.textContent = Math.round(obj.v).toLocaleString("es-PE"); },
  });
}

/** Recalcula posiciones de ScrollTrigger (tras montar contenido nuevo). */
export function refreshMotion() {
  if (ScrollTrigger) ScrollTrigger.refresh();
}
