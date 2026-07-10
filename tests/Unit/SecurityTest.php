<?php
declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Security;
use PHPUnit\Framework\TestCase;

/**
 * Pruebas de las utilidades de seguridad libres de sesión/BD.
 */
final class SecurityTest extends TestCase
{
    // ---- OTP ---------------------------------------------------------

    public function testOtpSiempreEsDeCuatroDigitos(): void
    {
        // Con ceros a la izquierda incluidos (str_pad). Repetimos para cubrir el rango.
        for ($i = 0; $i < 200; $i++) {
            $this->assertMatchesRegularExpression('/^[0-9]{4}$/', Security::otpCode());
        }
    }

    public function testHashOtpEsDeterministaYSha256(): void
    {
        $a = Security::hashOtp('1234');
        $b = Security::hashOtp('1234');

        $this->assertSame($a, $b, 'El hash debe ser determinista.');
        $this->assertSame(64, strlen($a), 'SHA-256 en hex tiene 64 caracteres.');
        $this->assertNotSame($a, Security::hashOtp('4321'), 'Códigos distintos → hashes distintos.');
    }

    // ---- UUID --------------------------------------------------------

    public function testUuidTieneFormatoV4(): void
    {
        $uuid = Security::uuid();
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/',
            $uuid
        );
    }

    public function testUuidsSonUnicos(): void
    {
        $this->assertNotSame(Security::uuid(), Security::uuid());
    }

    // ---- Sanitización ------------------------------------------------

    public function testSanitizeEscapaHtmlYRecorta(): void
    {
        $limpio = Security::sanitize('  <script>alert(1)</script>  ');

        $this->assertStringNotContainsString('<script>', $limpio);
        $this->assertStringContainsString('&lt;script&gt;', $limpio);
        $this->assertSame($limpio, trim($limpio), 'Debe recortar espacios en los extremos.');
    }
}
