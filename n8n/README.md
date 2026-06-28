# n8n · Orquestación de GastroDigest

Tres workflows que desacoplan la mensajería del backend PHP. PHP emite eventos y
n8n entrega/recibe instrucciones vía webhooks.

| Archivo | Disparador | Qué hace |
|---|---|---|
| [`01-otp.json`](workflows/01-otp.json) | Webhook `POST /webhook/otp` (lo llama PHP) | Envía el OTP por **WhatsApp Cloud API**; si falla, **Catch Error → SMTP**. |
| [`02-respuesta-paciente.json`](workflows/02-respuesta-paciente.json) | Webhook `POST /webhook/whatsapp-respuesta` (lo llama WhatsApp) | Normaliza la respuesta y según `1/2/3` llama a PHP: **Confirmar**, **Reprogramar** (genera link), **Cancelar**. |
| [`03-recordatorio.json`](workflows/03-recordatorio.json) | Schedule diario 09:00 | Consulta en **MySQL** las citas de mañana y envía el recordatorio interactivo con botones `1/2/3`. |

## Flujo completo

```
Reserva web ─POST /webhook/otp→ n8n ─WhatsApp→ Paciente
                                  └(falla)→ SMTP

Schedule 09:00 → MySQL (citas de mañana) → WhatsApp [Confirmar|Reprogramar|Cancelar]
        Paciente pulsa botón → WhatsApp ─webhook→ n8n (02)
            1 → PATCH /api/citas/webhook-wsp  {estado: CONFIRMADA_WSP}
            2 → POST  /api/citas/reprogramacion → link /reprogramar/{uuid} → WhatsApp
            3 → PATCH /api/citas/webhook-wsp  {estado: CANCELADA_PACIENTE}
```

El `id` de cada botón se codifica como `"<opcion>_<id_cita>"` (p. ej. `2_45`); el nodo
**Normalizar respuesta** del workflow 02 lo separa en `opcion` e `id_cita`.

## Variables de entorno (en el servicio n8n de Railway)

| Variable | Descripción |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | ID del número de WhatsApp Cloud API |
| `WHATSAPP_API_TOKEN` | Token permanente de WhatsApp Cloud API |
| `PHP_API_BASE_URL` | URL del backend en Railway, ej. `https://api.gastrodigest.up.railway.app` |
| `N8N_WEBHOOK_SECRET` | Mismo secreto que en el backend (header `X-Webhook-Secret`) |
| `SMTP_FROM` | Remitente del fallback por correo |

> En Railway, define estas variables y activa el acceso a `$env` con
> `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` para que las expresiones `{{ $env.X }}` funcionen.

## Credenciales a configurar tras importar

- **SMTP** (nodo *Fallback SMTP*): host, puerto, usuario y contraseña del correo saliente.
- **MySQL** (nodo *Citas de mañana*): mismos `MYSQLHOST/PORT/USER/PASSWORD/DATABASE` de Railway.

## Importar en n8n (Railway)

1. Abre la UI de n8n (servicio en Railway) → menú **⋮ → Import from File**.
2. Importa los tres `.json` de `workflows/`.
3. Asigna las credenciales (SMTP, MySQL) y define las variables de entorno.
4. Activa cada workflow (toggle **Active**).
5. Copia las URLs de producción de los webhooks `otp` y `whatsapp-respuesta`:
   - `N8N_WEBHOOK_BASE_URL` del backend = la base de n8n (sin `/webhook/...`).
   - Configura el **webhook de entrada de WhatsApp Cloud API** apuntando a la URL del
     workflow 02.

## Seguridad

- El backend firma sus llamadas a n8n y verifica las entrantes con `X-Webhook-Secret`.
- Recomendado: en los nodos *Webhook* de n8n, activar **Header Auth** con el mismo secreto
  para rechazar peticiones no firmadas.
