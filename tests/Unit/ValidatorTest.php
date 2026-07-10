<?php
declare(strict_types=1);

namespace Tests\Unit;

use App\Core\Validator;
use PHPUnit\Framework\TestCase;

/**
 * Pruebas de la validación en el límite del sistema (Ley 29414 incluida).
 */
final class ValidatorTest extends TestCase
{
    // ---- documento ---------------------------------------------------

    public function testDniConOchoDigitosEsValido(): void
    {
        $this->assertNull(Validator::documento('DNI', '12345678'));
    }

    public function testDniConMenosDeOchoDigitosFalla(): void
    {
        $this->assertNotNull(Validator::documento('DNI', '1234567'));
    }

    public function testDniConLetrasFalla(): void
    {
        $this->assertNotNull(Validator::documento('DNI', '1234567A'));
    }

    public function testCarneExtranjeriaDeNueveAlfanumericosEsValido(): void
    {
        $this->assertNull(Validator::documento('CE', 'ABC123456'));
    }

    public function testPasaporteFueraDeRangoFalla(): void
    {
        $this->assertNotNull(Validator::documento('PAS', '12345'));      // < 6
        $this->assertNull(Validator::documento('PAS', 'AB123456'));      // dentro de rango
    }

    public function testTipoDocumentoDesconocidoFalla(): void
    {
        $this->assertNotNull(Validator::documento('OTRO', '12345678'));
    }

    // ---- edad / menor de edad ---------------------------------------

    public function testEdadDeFechaInvalidaEsMenosUno(): void
    {
        $this->assertSame(-1, Validator::edad('no-es-fecha'));
    }

    public function testEsMenorDetectaAMenoresDeDieciocho(): void
    {
        $menor = date('Y-m-d', strtotime('-10 years'));
        $adulto = date('Y-m-d', strtotime('-40 years'));

        $this->assertTrue(Validator::esMenor($menor));
        $this->assertFalse(Validator::esMenor($adulto));
    }

    // ---- email / teléfono -------------------------------------------

    public function testEmailValidoEInvalido(): void
    {
        $this->assertTrue(Validator::email('paciente@gastrodigest.pe'));
        $this->assertFalse(Validator::email('correo-invalido'));
    }

    public function testTelefonoAceptaNueveADieciseisDigitos(): void
    {
        $this->assertTrue(Validator::telefono('987654321'));
        $this->assertFalse(Validator::telefono('12345678'));   // 8 dígitos
        $this->assertFalse(Validator::telefono('98765432a'));  // con letra
    }

    // ---- fecha -------------------------------------------------------

    public function testFechaValidaRechazaFechasImposibles(): void
    {
        $this->assertTrue(Validator::fechaValida('2026-01-15'));
        $this->assertFalse(Validator::fechaValida('2026-02-30')); // 30 de febrero
        $this->assertFalse(Validator::fechaValida('15/01/2026')); // formato incorrecto
    }

    // ---- faltantes ---------------------------------------------------

    public function testFaltantesDetectaCamposVaciosYAusentes(): void
    {
        $data = ['nombre' => 'Ana', 'correo' => '   '];
        $faltantes = Validator::faltantes($data, ['nombre', 'correo', 'telefono']);

        $this->assertArrayNotHasKey('nombre', $faltantes);
        $this->assertArrayHasKey('correo', $faltantes);    // sólo espacios
        $this->assertArrayHasKey('telefono', $faltantes);  // ausente
    }

    public function testFaltantesVacioCuandoTodoPresente(): void
    {
        $data = ['a' => '1', 'b' => 'x'];
        $this->assertSame([], Validator::faltantes($data, ['a', 'b']));
    }
}
