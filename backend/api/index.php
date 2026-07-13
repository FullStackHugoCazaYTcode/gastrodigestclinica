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
use App\Controllers\AdminController;
use App\Controllers\AseguradoraController;
use App\Controllers\CitaController;
use App\Controllers\EncuestaController;
use App\Controllers\MedicoController;
use App\Controllers\MedicoPortalController;
use App\Controllers\OtpController;
use App\Controllers\PacienteController;
use App\Controllers\ReclamacionController;
use App\Controllers\PortalController;
use App\Controllers\RegistroController;
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

// Libro de Reclamaciones (público)
$router->post('/api/reclamaciones', fn() => (new ReclamacionController())->registrar());

// Encuesta de satisfacción (NPS) + testimonios (público)
$router->get('/api/testimonios',        fn() => (new EncuestaController())->testimonios());
$router->get('/api/encuestas/{token}',  fn($p) => (new EncuestaController())->mostrar($p));
$router->post('/api/encuestas/{token}', fn($p) => (new EncuestaController())->responder($p));

// Médicos y aseguradoras (catálogos)
$router->get('/api/medicos',      fn() => (new MedicoController())->listar());
$router->get('/api/medicos/{id}/disponibilidad', fn($p) => (new MedicoController())->disponibilidad($p));
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

// Registro de cuenta de paciente (wizard Fase 2A)
$router->get('/api/intereses',            fn() => (new RegistroController())->intereses());
$router->post('/api/registro/iniciar',    fn() => (new RegistroController())->iniciar());
$router->post('/api/registro/verificar',  fn() => (new RegistroController())->verificar());
$router->post('/api/registro/reenviar',   fn() => (new RegistroController())->reenviar());
$router->post('/api/registro/completar',  fn() => (new RegistroController())->completar());

// Panel de administración / dueño
$router->post('/api/admin/login',              fn() => (new AdminController())->login());
$router->post('/api/admin/logout',             fn() => (new AdminController())->logout());
$router->get('/api/admin/sesion',              fn() => (new AdminController())->sesion());
$router->get('/api/admin/resumen',             fn() => (new AdminController())->resumen());
// Digest diario para el cron de n8n (protegido por X-Webhook-Secret, sin sesión).
$router->get('/api/admin/resumen-diario',      fn() => (new AdminController())->resumenDiario());
$router->get('/api/admin/medicos',             fn() => (new AdminController())->medicos());
$router->post('/api/admin/medicos',            fn() => (new AdminController())->crearMedico());
$router->patch('/api/admin/medicos/{id}',      fn($p) => (new AdminController())->cambiarEstadoMedico($p));
$router->get('/api/admin/citas',               fn() => (new AdminController())->citas());
$router->get('/api/admin/pacientes',           fn() => (new AdminController())->pacientes());
$router->get('/api/admin/encuestas',           fn() => (new AdminController())->encuestas());
$router->patch('/api/admin/encuestas/{id}',    fn($p) => (new AdminController())->moderarEncuesta($p));
// Disponibilidad: horarios semanales + bloqueos por médico
$router->get('/api/admin/medicos/{id}/horarios',              fn($p) => (new AdminController())->horariosMedico($p));
$router->post('/api/admin/medicos/{id}/horarios',             fn($p) => (new AdminController())->agregarHorario($p));
$router->post('/api/admin/medicos/{idm}/horarios/{id}/eliminar', fn($p) => (new AdminController())->eliminarHorario($p));
$router->post('/api/admin/medicos/{id}/bloqueos',             fn($p) => (new AdminController())->agregarBloqueo($p));
$router->post('/api/admin/medicos/{idm}/bloqueos/{id}/eliminar', fn($p) => (new AdminController())->eliminarBloqueo($p));

// Área privada del médico
$router->post('/api/medico/login',      fn() => (new MedicoPortalController())->login());
$router->post('/api/medico/logout',     fn() => (new MedicoPortalController())->logout());
$router->get('/api/medico/sesion',      fn() => (new MedicoPortalController())->sesion());
$router->get('/api/medico/agenda',      fn() => (new MedicoPortalController())->agenda());
$router->patch('/api/medico/citas/{id}/atender', fn($p) => (new MedicoPortalController())->atenderCita($p));
$router->get('/api/medico/pacientes',   fn() => (new MedicoPortalController())->pacientes());
$router->post('/api/medico/documentos', fn() => (new MedicoPortalController())->emitirDocumento());

// Portal privado del paciente
$router->post('/api/portal/login',           fn() => (new PortalController())->login());
$router->post('/api/portal/logout',          fn() => (new PortalController())->logout());
$router->get('/api/portal/sesion',           fn() => (new PortalController())->sesion());
$router->get('/api/portal/citas',            fn() => (new PortalController())->citas());
$router->patch('/api/portal/citas/{id}/cancelar',    fn($p) => (new PortalController())->cancelarCita($p));
$router->patch('/api/portal/citas/{id}/reprogramar', fn($p) => (new PortalController())->reprogramarCita($p));
$router->patch('/api/portal/perfil',         fn() => (new PortalController())->actualizarPerfil());
$router->get('/api/portal/familiares',        fn() => (new PortalController())->familiares());
$router->post('/api/portal/familiares',       fn() => (new PortalController())->agregarFamiliar());
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
