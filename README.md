# 🏥 GastroDigest · Sistema de Información Front-Office

Plataforma web transaccional para la **Clínica Gastroenterológica GastroDigest** (Huánuco, Perú).
Automatiza la reserva de citas, valida la identidad de los pacientes (OTP), gestiona la
excepción legal de menores de edad (apoderado) e integra mensajería asíncrona vía **n8n**
(WhatsApp + SMTP).

> Proyecto académico full-stack · Escuela Profesional de **Ingeniería de Sistemas (I.S.)**
> Cumplimiento: **Ley N.° 29733** (datos personales) y **Ley N.° 29414** (consentimiento de menores).

---

## 🧱 Stack

| Capa | Tecnología | Despliegue |
|---|---|---|
| Frontend | HTML5 · CSS3 · **JavaScript Vanilla** (Fetch, módulos ES) | **Vercel** |
| Backend | **PHP 8.2 OOP · MVC** · PDO (Prepared Statements) | **Railway** (Docker) |
| Base de datos | **MySQL 8** · InnoDB | **Railway** |
| Middleware | **n8n** (WhatsApp Cloud API + SMTP) | **Railway** (`n8nio/n8n`) |
| Local | Laragon / Apache · MySQL Workbench | — |

## 📁 Estructura del monorepo

```
gastrodigest/
├── backend/          PHP (MVC + API REST) · Dockerfile para Railway
│   ├── api/index.php       front-controller + CORS
│   ├── bootstrap.php       autoloader PSR-4 + sesión segura
│   ├── config/db.php       Singleton PDO (única conexión)
│   ├── core/ models/ controllers/ middlewares/ services/
│   └── Dockerfile
├── frontend/         SPA Vanilla · vercel.json · build-config.mjs
│   ├── index.html · css/ · js/ (views, router, api, otpModal)
├── database/
│   └── gastrodigest.sql    DDL completo (importable de un clic)
├── n8n/
│   ├── workflows/*.json    OTP · respuesta paciente · recordatorio
│   └── README.md
├── .github/workflows/deploy.yml   CI: valida PHP/JSON en cada PR
├── .env.example
└── .gitignore
```

## 🔑 Variables de entorno

Copia `.env.example` a `.env` (nunca se versiona). Detalle:

| Variable | Uso |
|---|---|
| `APP_ENV` | `local` o `production` |
| `APP_URL` | URL pública del backend (Railway) |
| `APP_FRONTEND_URL` | URL del frontend (Vercel) — requerido por CORS/portal |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASS` | Conexión MySQL |
| `N8N_WEBHOOK_BASE_URL` | Base de n8n para emitir OTP/recordatorios |
| `N8N_WEBHOOK_SECRET` | Secreto compartido (header `X-Webhook-Secret`) |
| `WHATSAPP_API_TOKEN` | Token de WhatsApp Cloud API (lo usa n8n) |

---

## 💻 Puesta en marcha local (Laragon)

1. **Clonar** dentro del `www` de Laragon:
   ```bash
   git clone <repo> gastrodigest && cd gastrodigest
   cp .env.example .env      # completa DB_USER/DB_PASS locales y APP_ENV=local
   ```
2. **Base de datos** (MySQL Workbench): abre `database/gastrodigest.sql` y ejecútalo
   (⚡ *Execute*). Crea el esquema, vistas, evento y datos semilla.
3. **Backend**: Laragon ya sirve Apache. El API queda en
   `http://localhost/gastrodigest/backend/api`.
   - Para citas en tiempo real, habilita el scheduler: `SET GLOBAL event_scheduler = ON;`
4. **Frontend**: sírvelo por HTTP (los módulos ES no funcionan con `file://`):
   ```bash
   npx serve frontend -s -l 4173      # o la extensión Live Server
   ```
   En local, `js/config.js` queda vacío y el cliente usa el fallback al backend de Laragon.

> El portal del paciente requiere una contraseña. Para una prueba, define una con PHP:
> ```sql
> UPDATE Pacientes SET password_hash = '<hash>' WHERE id_paciente = 1;
> ```
> donde `<hash>` se genera con `php -r "echo password_hash('Demo1234', PASSWORD_DEFAULT);"`.

---

## ☁️ Despliegue en producción

### 1) Railway — MySQL

1. *New Project → Provision MySQL*.
2. En la pestaña **Variables** copia `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`,
   `MYSQLUSER`, `MYSQLPASSWORD`.

**Conectar MySQL Workbench a Railway** y cargar el esquema:

| Campo Workbench | Valor Railway |
|---|---|
| Hostname | `MYSQLHOST` |
| Port | `MYSQLPORT` |
| Username | `MYSQLUSER` |
| Password | `MYSQLPASSWORD` |

Conéctate y ejecuta `database/gastrodigest.sql` (Data Import o *Execute*).

### 2) Railway — Backend PHP (Docker)

1. *New Service → Deploy from GitHub repo* (este repo).
2. **Settings → Root Directory:** `backend` (para que use `backend/Dockerfile`).
3. **Variables** del servicio:
   ```
   APP_ENV=production
   APP_URL=https://<tu-backend>.up.railway.app
   APP_FRONTEND_URL=https://<tu-frontend>.vercel.app
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASS=${{MySQL.MYSQLPASSWORD}}
   N8N_WEBHOOK_BASE_URL=https://<tu-n8n>.up.railway.app
   N8N_WEBHOOK_SECRET=<secreto-fuerte>
   WHATSAPP_API_TOKEN=<token>
   ```
   (Las referencias `${{MySQL.*}}` enlazan el servicio MySQL automáticamente.)
4. El contenedor escucha en `$PORT` (lo inyecta Railway) — ya resuelto en el `Dockerfile`.

### 3) Railway — n8n

1. *New Service → Docker Image* → `n8nio/n8n:latest`.
2. Añade un **Volume** en `/home/node/.n8n` (persistencia de workflows/credenciales).
3. Variables: `N8N_HOST`, `WEBHOOK_URL=https://<tu-n8n>.up.railway.app/`,
   `N8N_PORT=5678`, `N8N_BLOCK_ENV_ACCESS_IN_NODE=false`, más las de
   [`n8n/README.md`](n8n/README.md).
4. Importa los workflows de `n8n/workflows/` y asigna credenciales (SMTP, MySQL).

### 4) Vercel — Frontend

1. *Add New Project* → importa el repo de GitHub.
2. **Root Directory:** `frontend`.
3. **Build Command:** `node build-config.mjs` · **Output Directory:** `.`
4. **Environment Variables:** `API_URL=https://<tu-backend>.up.railway.app`
   (el build genera `js/config.js` con esa URL).
5. Cada `push` a `main` dispara un deploy automático.

---

## 🔌 API REST (resumen)

Todas las respuestas usan el envelope `{ success, message, data, errors }`.

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/pacientes` | Registro (+ apoderado si es menor) |
| `GET` | `/api/pacientes/verificar` | Validación de documento en vivo |
| `GET` | `/api/medicos` · `/api/aseguradoras` | Catálogos |
| `POST` | `/api/citas` | Reserva → `PENDIENTE_OTP` (bloqueo de horario) |
| `POST` | `/api/otp/validar` | OTP → `RESERVADA_WEB` |
| `PATCH` | `/api/citas/webhook-wsp` | n8n: confirmar/cancelar |
| `POST` | `/api/citas/reprogramacion` | n8n: genera token de reprogramación |
| `GET`/`PATCH` | `/api/reprogramar/{token}` | Flujo público de reprogramación |
| `POST` | `/api/portal/login` · `/logout` | Sesión del paciente (CSRF, 30 min) |
| `GET` | `/api/portal/documentos[/{id}]` | Documentos (autorización por sesión) |

## 🔒 Seguridad y cumplimiento

- PDO con **Prepared Statements** en el 100% de las consultas (anti SQL-Injection).
- **OTP hasheado** (SHA-256), límite de intentos y TTL de 5 min (anti-troll).
- **Bloqueo de horario** con `SELECT FOR UPDATE` + índice único sobre columna generada.
- Webhooks de n8n autenticados con `X-Webhook-Secret`.
- Portal: sesiones `HttpOnly`/`Secure`, **CSRF**, `session_regenerate_id`, autorización
  estricta por `id_paciente` (anti-IDOR).
- Sin credenciales en el código: todo por variables de entorno; `.env` en `.gitignore`.
- `Documentos_Clinicos` restringido por ENUM (notas de evolución prohibidas por esquema);
  `ON DELETE RESTRICT` para trazabilidad legal.

## ✅ Estado de verificación

- **Frontend:** verificado en navegador (render, identidad visual §6, `slideDown` de
  apoderado, modal OTP con countdown). Sin errores de JS.
- **n8n:** los tres workflows validan como JSON correcto.
- **Backend/SQL:** revisados manualmente. **No** ejecutados en vivo (este entorno no tiene
  binarios PHP/MySQL); el CI (`php -l`) los valida en cada PR y se prueban de extremo a
  extremo al levantar Laragon o desplegar en Railway.

---

<p align="center"><strong>I.S.</strong> · Escuela Profesional de Ingeniería de Sistemas · Huánuco, Perú · 2026</p>
