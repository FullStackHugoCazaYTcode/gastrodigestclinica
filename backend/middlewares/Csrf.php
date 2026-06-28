<?php
declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Request;
use App\Core\Response;
use App\Core\Security;

/**
 * Csrf — Verifica el token CSRF (header X-CSRF-Token) en peticiones que
 * cambian estado dentro del portal autenticado.
 */
final class Csrf
{
    public static function verify(): void
    {
        if (!Security::verifyCsrf(Request::header('X-CSRF-Token'))) {
            Response::error('Token CSRF inválido o ausente.', 403);
        }
    }
}
