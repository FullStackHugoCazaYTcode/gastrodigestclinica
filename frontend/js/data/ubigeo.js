// =====================================================================
//  data/ubigeo.js — Subconjunto práctico de ubigeo peruano para el
//  registro (selects en cascada). Centrado en Huánuco (sede) + Lima y
//  otras capitales. No pretende ser exhaustivo (Fase 2A).
// =====================================================================

export const UBIGEO = {
  Huánuco: {
    Huánuco: ["Huánuco", "Amarilis", "Pillco Marca", "Santa María del Valle", "Churubamba", "Chinchao"],
    "Leoncio Prado": ["Rupa-Rupa (Tingo María)", "Castillo Grande", "José Crespo y Castillo", "Daniel Alomía Robles"],
    Ambo: ["Ambo", "San Rafael", "Tomay Kichwa"],
    Pachitea: ["Panao", "Molino", "Chaglla"],
    "Dos de Mayo": ["La Unión", "Chuquis", "Marías"],
    Huamalíes: ["Llata", "Monzón", "Tantamayo"],
  },
  Lima: {
    Lima: ["Lima (Cercado)", "Miraflores", "San Isidro", "Santiago de Surco", "La Molina", "San Borja", "Jesús María", "Barranco", "San Miguel", "Los Olivos", "Ate", "Comas"],
    "Lima (provincia)": ["Huacho", "Barranca", "Cañete", "Huaral"],
  },
  Áncash: {
    Huaraz: ["Huaraz", "Independencia"],
    Santa: ["Chimbote", "Nuevo Chimbote"],
  },
  "La Libertad": {
    Trujillo: ["Trujillo", "Víctor Larco Herrera", "La Esperanza"],
    Ascope: ["Ascope", "Chicama"],
  },
  Junín: {
    Huancayo: ["Huancayo", "El Tambo", "Chilca"],
    Satipo: ["Satipo", "Pangoa"],
  },
  Ucayali: {
    "Coronel Portillo": ["Callería (Pucallpa)", "Yarinacocha", "Manantay"],
  },
  Arequipa: {
    Arequipa: ["Arequipa (Cercado)", "Cayma", "Yanahuara", "Cerro Colorado"],
  },
};

export const DEPARTAMENTOS = Object.keys(UBIGEO);
