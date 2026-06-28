// =====================================================================
//  validators.js — Validación en cliente (refleja la del backend).
//  Defensa en profundidad: el servidor revalida siempre.
// =====================================================================

export function validarDocumento(tipo, numero) {
  switch (tipo) {
    case "DNI":
      return /^[0-9]{8}$/.test(numero) ? null : "El DNI debe tener exactamente 8 dígitos.";
    case "CE":
      return /^[A-Za-z0-9]{9}$/.test(numero) ? null : "El Carné de Extranjería debe tener 9 caracteres alfanuméricos.";
    case "PAS":
      return numero.length >= 6 && numero.length <= 20 ? null : "El Pasaporte debe tener entre 6 y 20 caracteres.";
    default:
      return "Seleccione un tipo de documento válido.";
  }
}

export function calcularEdad(fechaIso) {
  if (!fechaIso) return -1;
  const nac = new Date(fechaIso + "T00:00:00");
  if (Number.isNaN(nac.getTime())) return -1;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

export function esMenor(fechaIso) {
  const edad = calcularEdad(fechaIso);
  return edad >= 0 && edad < 18;
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validarTelefono(tel) {
  return /^[0-9]{9,15}$/.test(tel);
}

export const MAX_FECHA_NAC = new Date().toISOString().slice(0, 10);
