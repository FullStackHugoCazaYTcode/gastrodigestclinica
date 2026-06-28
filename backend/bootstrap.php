<?php
declare(strict_types=1);

/**
 * bootstrap.php — Arranque único del backend GastroDigest.
 *
 * Responsabilidades:
 *   1) Cargar variables de entorno (.env local; en Railway llegan por $_ENV).
 *   2) Registrar un autoloader PSR-4 simple (sin Composer).
 *   3) Incluir db.php — ÚNICO punto de conexión (Singleton centralizado).
 *   4) Configurar la cookie de sesión de forma segura (portal del paciente).
 *
 * Se incluye una sola vez desde api/index.php.
 */

require_once __DIR__ . '/core/Env.php';
\App\Core\Env::load(dirname(__DIR__) . '/.env');

spl_autoload_register(static function (string $class): void {
    $map = [
        'App\\Core\\'        => __DIR__ . '/core/',
        'App\\Models\\'      => __DIR__ . '/models/',
        'App\\Controllers\\' => __DIR__ . '/controllers/',
        'App\\Middlewares\\' => __DIR__ . '/middlewares/',
        'App\\Services\\'    => __DIR__ . '/services/',
    ];
    foreach ($map as $prefix => $dir) {
        if (str_starts_with($class, $prefix)) {
            $file = $dir . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
            if (is_file($file)) {
                require_once $file;
            }
            return;
        }
    }
});

// db.php es el ÚNICO archivo de conexión. Cualquier otra ruta (p. ej. db..php)
// rompería el árbol de dependencias del Singleton — por eso se centraliza aquí.
require_once __DIR__ . '/config/db.php';

// Sesión segura para el portal privado (cookies HttpOnly; Secure/SameSite en prod).
$enProduccion = \App\Core\Env::get('APP_ENV', 'local') === 'production';
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'httponly' => true,
    'secure'   => $enProduccion,
    'samesite' => $enProduccion ? 'None' : 'Lax',
]);
