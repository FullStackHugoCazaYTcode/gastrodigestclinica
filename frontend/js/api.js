// =====================================================================
//  api.js — Cliente Fetch con el envelope estándar de la API.
//  { success, message, data, errors } + códigos HTTP.
// =====================================================================

const API_BASE_URL =
  (window.ENV_API_URL && window.ENV_API_URL.trim()) ||
  "http://localhost/gastrodigest/backend/api";

/**
 * Realiza una petición y normaliza siempre la respuesta al envelope.
 * @returns {Promise<{ok:boolean,status:number,success:boolean,message:string,data:*,errors:*}>}
 */
async function request(path, { method = "GET", body, headers = {} } = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      credentials: "include", // cookies de sesión del portal
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    return {
      ok: res.ok,
      status: res.status,
      success: json?.success ?? res.ok,
      message: json?.message ?? (res.ok ? "OK" : "Error en la solicitud."),
      data: json?.data ?? null,
      errors: json?.errors ?? null,
    };
  } catch (networkError) {
    return {
      ok: false,
      status: 0,
      success: false,
      message: "No se pudo conectar con el servidor. Verifica tu conexión.",
      data: null,
      errors: null,
    };
  }
}

export const api = {
  base: API_BASE_URL,
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
};
