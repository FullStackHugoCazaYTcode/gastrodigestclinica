<?php
declare(strict_types=1);

/**
 * api/index.php — Front-controller REST de GastroDigest.
 * Único punto de entrada: bootstrap → CORS → enrutamiento → dispatch.
 */

require_once dirname(__DIR__) . '/bootstrap.php';

use App\Core\Env;
use App\Core\Request;
use App\Core\Response;
use App\Core\Router;
use App\Controllers\AseguradoraController;
use App\Controllers\CitaController;
use App\Controllers\MedicoController;
use App\Controllers\OtpController;
use App\Controllers\PacienteController;
use App\Controllers\PortalController;
use App\Controllers\WebhookController;

// ---------- CORS (frontend en Vercel ⇄ backend en Railway) ----------
$frontend = (string) Env::get('APP_FRONTEND_URL', '*');
header('Access-Control-Allow-Origin: ' . $frontend);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, X-Webhook-Secret, X-HTTP-Method-Override');
if ($frontend !== '*') {
    header('Access-Control-Allow-Credentials: true'); // requerido por el portal (cookies)
}
if (Request::method() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------- Definición de rutas ----------
$router = new Router();

// Pacientes
$router->post('/api/pacientes',          fn() => (new PacienteController())->registrar());
$router->get('/api/pacientes/verificar', fn() => (new PacienteController())->verificarDocumento());

// Médicos y aseguradoras (catálogos)
$router->get('/api/medicos',      fn() => (new MedicoController())->listar());
$router->get('/api/aseguradoras', fn() => (new AseguradoraController())->listar());

// Citas + OTP
$router->post('/api/citas',       fn() => (new CitaController())->reservar());
$router->post('/api/otp/validar', fn() => (new OtpController())->validar());

// Webhooks entrantes de n8n
$router->patch('/api/citas/webhook-wsp',   fn() => (new WebhookController())->whatsapp());
$router->post('/api/citas/reprogramacion', fn() => (new WebhookController())->registrarReprogramacion());

// Reprogramación pública (link /reprogramar/{token})
$router->get('/api/reprogramar/{token}',   fn($p) => (new CitaController())->obtenerPorToken($p));
$router->patch('/api/reprogramar/{token}', fn($p) => (new CitaController())->reprogramar($p));

// Portal privado del paciente
$router->post('/api/portal/login',           fn() => (new PortalController())->login());
$router->post('/api/portal/logout',          fn() => (new PortalController())->logout());
$router->get('/api/portal/documentos',       fn() => (new PortalController())->documentos());
$router->get('/api/portal/documentos/{id}',  fn($p) => (new PortalController())->documento($p));

// ---------- Normalización de ruta (soporta subdirectorio local y raíz en Railway) ----------
$path   = Request::path();
$apiPos = strpos($path, '/api');
$route  = $apiPos !== false ? substr($path, $apiPos) : $path;

// ---------- Dispatch con frontera global de errores ----------
try {
    $router->dispatch(Request::method(), $route);
} catch (\Throwable $e) {
    error_log('[API] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Response::error('Error interno del servidor.', 500);
}
