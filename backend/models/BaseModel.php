<?php
declare(strict_types=1);

namespace App\Models;

use App\Config\Database;
use PDO;
use PDOStatement;

/**
 * BaseModel — Base de todos los modelos. Toma la conexión del Singleton.
 */
abstract class BaseModel
{
    protected PDO $db;

    public function __construct()
    {
        $this->db = Database::pdo();
    }

    /** Ejecuta una consulta preparada y devuelve el statement. */
    protected function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
}
