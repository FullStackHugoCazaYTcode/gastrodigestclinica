<?php
declare(strict_types=1);

namespace App\Core;

/**
 * Router — Enrutador REST minimalista con parámetros de ruta ({token}, {id}).
 */
final class Router
{
    /** @var array<int, array{method:string, pattern:string, handler:callable}> */
    private array $routes = [];

    public function add(string $method, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'method'  => strtoupper($method),
            'pattern' => $pattern,
            'handler' => $handler,
        ];
    }

    public function get(string $p, callable $h): void   { $this->add('GET', $p, $h); }
    public function post(string $p, callable $h): void  { $this->add('POST', $p, $h); }
    public function patch(string $p, callable $h): void { $this->add('PATCH', $p, $h); }
    public function put(string $p, callable $h): void   { $this->add('PUT', $p, $h); }

    public function dispatch(string $method, string $path): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            $params = $this->match($route['pattern'], $path);
            if ($params !== null) {
                ($route['handler'])($params);
                return;
            }
        }
        Response::error('Recurso o endpoint no encontrado.', 404);
    }

    /** @return array<string,string>|null Parámetros nombrados, o null si no coincide. */
    private function match(string $pattern, string $path): ?array
    {
        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern);
        if (!preg_match('#^' . $regex . '$#', $path, $matches)) {
            return null;
        }
        return array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
    }
}
