<?php
declare(strict_types=1);

namespace App\Middlewares;

use App\Core\Env;
use App\Core\Request;
use App\Core\Response;

/**
 * WebhookGuard — Autentica las llamadas entrantes de n8n mediante un
 * secreto compartido (header X-Webhook-Secret). Evita que terceros
 * manipulen el estado de las citas a través de los webhooks.
 */
final class WebhookGuard
{
    public static function verify(): void
    {
        $secret   = Env::get('N8N_WEBHOOK_SECRET');
        $provided = Request::header('X-Webhook-Secret');

        if ($secret === null || $provided === null || !hash_equals($secret, $provided)) {
            Response::error('Webhook no autorizado.', 401);
        }
    }
}
