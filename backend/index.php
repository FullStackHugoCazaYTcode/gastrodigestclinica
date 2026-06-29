<?php
declare(strict_types=1);

/**
 * index.php — Página de bienvenida / health-check de la API (ruta raíz "/").
 * Apache la sirve como DirectoryIndex cuando se visita el dominio sin /api/.
 */

require_once __DIR__ . '/bootstrap.php';

use App\Config\Database;

// Chequeo de salud de la base de datos (sin romper la página si falla).
$dbOk = false;
try {
    Database::pdo()->query('SELECT 1');
    $dbOk = true;
} catch (\Throwable $e) {
    error_log('[health] DB no disponible: ' . $e->getMessage());
}

http_response_code(200);
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GastroDigest · API</title>
  <style>
    :root {
      --primary:#1A6B9A; --secondary:#2EAD8E; --bg:#F8FAFC; --text:#1E293B;
      --muted:#64748B; --border:#E2E8F0; --ok:#22C55E; --err:#EF4444;
    }
    * { box-sizing:border-box; margin:0; }
    body {
      font-family:'Segoe UI',system-ui,-apple-system,Roboto,sans-serif;
      background:var(--bg); color:var(--text); min-height:100vh;
      display:grid; place-items:center; padding:24px;
    }
    .card {
      background:#fff; border:1px solid var(--border); border-radius:16px;
      box-shadow:0 18px 40px -12px rgba(26,107,154,.22); padding:40px;
      max-width:560px; width:100%;
    }
    .brand { display:flex; align-items:center; gap:14px; margin-bottom:24px; }
    .logo {
      display:grid; place-items:center; width:48px; height:48px; border-radius:12px;
      background:linear-gradient(140deg,var(--primary),var(--secondary));
      color:#fff; font-weight:700; letter-spacing:.02em;
    }
    h1 { font-size:1.5rem; } .sub { color:var(--muted); font-size:.9rem; }
    .badges { display:flex; gap:10px; flex-wrap:wrap; margin:24px 0; }
    .badge {
      display:inline-flex; align-items:center; gap:8px; padding:6px 14px;
      border-radius:999px; font-size:.85rem; font-weight:600;
    }
    .badge::before { content:""; width:8px; height:8px; border-radius:50%; background:currentColor; }
    .badge--ok { background:#F0FDF4; color:#15803D; }
    .badge--err { background:#FEF2F2; color:#B91C1C; }
    .badge--info { background:#EAF3F8; color:#114C70; }
    h2 { font-size:.8rem; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:10px; }
    ul { list-style:none; display:grid; gap:8px; }
    li { display:flex; gap:10px; align-items:center; font-size:.9rem; }
    .m { font-family:ui-monospace,Consolas,monospace; font-weight:700; color:var(--primary); min-width:48px; }
    code { background:var(--bg); padding:2px 8px; border-radius:6px; border:1px solid var(--border); }
    footer { margin-top:28px; padding-top:16px; border-top:1px solid var(--border); color:var(--muted); font-size:.8rem; text-align:center; }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">
      <span class="logo">I.S.</span>
      <div>
        <h1>GastroDigest · API</h1>
        <span class="sub">Sistema de información front-office · Clínica Gastroenterológica</span>
      </div>
    </div>

    <div class="badges">
      <span class="badge badge--ok">API operativa</span>
      <span class="badge <?= $dbOk ? 'badge--ok' : 'badge--err' ?>">
        Base de datos: <?= $dbOk ? 'conectada' : 'no disponible' ?>
      </span>
      <span class="badge badge--info">v1</span>
    </div>

    <h2>Endpoints principales</h2>
    <ul>
      <li><span class="m">GET</span> <code>/api/medicos</code></li>
      <li><span class="m">GET</span> <code>/api/aseguradoras</code></li>
      <li><span class="m">POST</span> <code>/api/pacientes</code></li>
      <li><span class="m">POST</span> <code>/api/citas</code></li>
      <li><span class="m">POST</span> <code>/api/otp/validar</code></li>
      <li><span class="m">POST</span> <code>/api/portal/login</code></li>
    </ul>

    <footer>
      Escuela Profesional de Ingeniería de Sistemas (I.S.) · Huánuco, Perú · 2026<br>
      Datos protegidos conforme a la Ley N.° 29733
    </footer>
  </main>
</body>
</html>
