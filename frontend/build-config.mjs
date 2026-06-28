// =====================================================================
//  build-config.mjs — Genera js/config.js en el build de Vercel.
//  Inyecta la URL del backend (Railway) desde la variable de entorno.
//  Vercel ejecuta este script vía "buildCommand" (ver vercel.json).
// =====================================================================
import { writeFileSync } from "node:fs";

const apiUrl = process.env.API_URL || process.env.VITE_API_URL || "";

const content =
  `// Archivo GENERADO en build (Vercel). No editar manualmente.\n` +
  `window.ENV_API_URL = ${JSON.stringify(apiUrl)};\n`;

writeFileSync("js/config.js", content);
console.log(
  apiUrl
    ? `✓ config.js generado · API_URL = ${apiUrl}`
    : "⚠ API_URL no definida; el cliente usará el fallback local (http://localhost/gastrodigest/backend/api)."
);
