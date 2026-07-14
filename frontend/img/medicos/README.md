# Fotos de los médicos

Coloca aquí las fotos de los médicos. Vercel las sirve como estáticos, así que
la ruta pública es `/img/medicos/<archivo>`.

## Convención
- Formato: **WebP** o **JPG** (evita PNG pesados para fotos).
- Tamaño recomendado: cuadrada, ~600×600 px, < 200 KB.
- Nombre en minúsculas con guiones: `dr-<apellido>.jpg` (ej. `dra-ruiz.jpg`).

## Fotos que faltan colocar (equipo actual)
Guarda estas 5 imágenes aquí con EXACTAMENTE estos nombres (así el seed
`database/seeds/2026_equipo_gastrodigest.sql` ya apunta a ellas):

| Archivo | Profesional |
|---|---|
| `dra-ramirez.jpg`   | Dra. Elena Ramírez Villalobos (Directora Médica) |
| `dra-mendoza.jpg`   | Dra. Sofía Mendoza Alarcón (Neurogastroenterología) |
| `dra-vargas.jpg`    | Dra. Camila Vargas del Carpio (Hepatología) |
| `lic-rojas.jpg`     | Lic. Mateo Rojas Cárdenas (Enfermería) |
| `dra-fernandez.jpg` | Dra. Lucía Fernández Salazar (Cirugía GI) |

## Cómo se asigna a un médico
En **Administración → Médicos → Perfil**, en el campo **Foto** se pega la ruta:

```
/img/medicos/dra-ruiz.jpg
```

También se acepta una URL externa (Cloudinary, etc.) si se prefiere.
