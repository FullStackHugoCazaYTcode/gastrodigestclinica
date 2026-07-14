# Fotos de los médicos

Coloca aquí las fotos de los médicos. Vercel las sirve como estáticos, así que
la ruta pública es `/img/medicos/<archivo>`.

## Convención
- Formato: **WebP** o **JPG** (evita PNG pesados para fotos).
- Tamaño recomendado: cuadrada, ~600×600 px, < 200 KB.
- Nombre en minúsculas con guiones: `dr-<apellido>.jpg` (ej. `dra-ruiz.jpg`).

## Cómo se asigna a un médico
En **Administración → Médicos → Perfil**, en el campo **Foto** se pega la ruta:

```
/img/medicos/dra-ruiz.jpg
```

También se acepta una URL externa (Cloudinary, etc.) si se prefiere.
