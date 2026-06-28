<?php
declare(strict_types=1);

namespace App\Config;

use App\Core\Env;
use PDO;
use PDOException;
use RuntimeException;

/**
 * Database — Conexión PDO centralizada bajo patrón Singleton.
 *
 * Es el ÚNICO punto de acceso a MySQL en toda la aplicación. Todos los
 * modelos obtienen la conexión vía Database::pdo(). Las credenciales se
 * leen SIEMPRE de variables de entorno; NUNCA se hardcodean.
 */
final class Database
{
    private static ?Database $instance = null;
    private PDO $connection;

    private function __construct()
    {
        $host = Env::mustGet('DB_HOST');
        $port = Env::get('DB_PORT', '3306');
        $name = Env::get('DB_NAME', 'gastrodigest');
        $user = Env::mustGet('DB_USER');
        $pass = Env::get('DB_PASS', '');

        $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);

        try {
            $this->connection = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // Prepared Statements reales
                PDO::ATTR_STRINGIFY_FETCHES  => false,
            ]);
        } catch (PDOException $e) {
            // No se expone el detalle de conexión (no filtrar credenciales).
            error_log('[Database] Conexión fallida: ' . $e->getMessage());
            throw new RuntimeException('No se pudo establecer conexión con la base de datos.');
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /** Acceso directo a la instancia PDO compartida. */
    public static function pdo(): PDO
    {
        return self::getInstance()->connection;
    }

    private function __clone() {}

    public function __wakeup(): void
    {
        throw new RuntimeException('El Singleton de conexión no es serializable.');
    }
}
