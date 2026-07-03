<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Core\Request;
use App\Core\Response;
use App\Core\Security;
use App\Core\Validator;
use App\Middlewares\SessionGuard;
use App\Models\Interes;
use App\Models\Paciente;
use App\Models\RegistroPendiente;
use App\Services\N8nClient;

/**
 * RegistroController — Registro de cuentas de paciente (Fase 2A).
 * Wizard: iniciar (crea pendiente + envía OTP) → verificar → completar
 * (crea la cuenta e inicia sesión). El código se envía por correo (Brevo).
 */
final class RegistroController
{
    private const OTP_TTL_SEGUNDOS = 300;   // 5 minutos
    private const OTP_MAX_INTENTOS  = 5;
    private const PASSWORD_MIN      = 8;

    /** Catálogo de temas de interés (paso 4 del wizard). */
    public function intereses(): void
    {
        Response::success((new Interes())->activos(), 'Temas de interés.');
    }

    /** Paso 1-2: valida datos, crea el registro pendiente y envía el OTP. */
    public function iniciar(): void
    {
        $d = Request::json();
        $req = ['tipo_documento', 'numero_documento', 'nombres', 'apellidos',
                'fecha_nacimiento', 'telefono', 'correo', 'password'];
        $errores = Validator::faltantes($d, $req);
        if (!empty($errores)) {
            Response::error('Completa los campos obligatorios.', 400, $errores);
        }

        $tipo   = (string) $d['tipo_documento'];
        $numero = trim((string) $d['numero_documento']);
        $correo = trim((string) $d['correo']);
        $tel    = preg_replace('/\D+/', '', (string) $d['telefono']);
        $pass   = (string) $d['password'];

        // ---- Validaciones de formato (defensa en profundidad) ----
        $campos = [];
        if ($msg = Validator::documento($tipo, $numero)) {
            $campos['numero_documento'] = $msg;
        }
        if (!Validator::email($correo)) {
            $campos['correo'] = 'Ingresa un correo electrónico válido.';
        }
        if (!Validator::telefono((string) $tel)) {
            $campos['telefono'] = 'El celular debe tener entre 9 y 15 dígitos.';
        }
        if (!Validator::fechaValida((string) $d['fecha_nacimiento'])) {
            $campos['fecha_nacimiento'] = 'Fecha de nacimiento inválida (AAAA-MM-DD).';
        }
        if (strlen($pass) < self::PASSWORD_MIN) {
            $campos['password'] = 'La contraseña debe tener al menos ' . self::PASSWORD_MIN . ' caracteres.';
        }
        if (empty($d['consentimiento_datos'])) {
            $campos['consentimiento_datos'] = 'Debes aceptar los Términos y la Política de Privacidad.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        // ---- Regla legal: menores requieren apoderado (Ley 29414) ----
        if (Validator::esMenor((string) $d['fecha_nacimiento'])) {
            Response::error(
                'Los menores de edad deben registrarse con su apoderado en recepción.',
                422
            );
        }

        // ---- Unicidad: no duplicar cuentas ----
        $paciente = new Paciente();
        if ($paciente->existePorDocumento($tipo, $numero)) {
            Response::error('Ya existe una cuenta con este documento. Inicia sesión.', 409);
        }
        if ($paciente->correoExiste($correo)) {
            Response::error('Este correo ya está registrado.', 409);
        }

        // ---- Crear registro pendiente + OTP ----
        $token  = Security::uuid();
        $codigo = self::codigo5();

        (new RegistroPendiente())->crear([
            'token'               => $token,
            'tipo_documento'      => $tipo,
            'numero_documento'    => $numero,
            'fecha_emision_dni'   => $d['fecha_emision_dni'] ?? null,
            'nombres'             => trim((string) $d['nombres']),
            'apellidos'           => trim((string) $d['apellidos']),
            'fecha_nacimiento'    => (string) $d['fecha_nacimiento'],
            'sexo'                => in_array($d['sexo'] ?? 'X', ['M', 'F', 'X'], true) ? ($d['sexo'] ?? 'X') : 'X',
            'telefono'            => $tel,
            'correo'              => $correo,
            'password_hash'       => password_hash($pass, PASSWORD_DEFAULT),
            'departamento'        => $d['departamento'] ?? null,
            'provincia'           => $d['provincia'] ?? null,
            'distrito'            => $d['distrito'] ?? null,
            'direccion'           => $d['direccion'] ?? null,
            'consentimiento_datos' => true,
            'otp_hash'            => Security::hashOtp($codigo),
            'otp_expira_en'       => date('Y-m-d H:i:s', time() + self::OTP_TTL_SEGUNDOS),
        ]);

        // El campo 'correo' activa el envío por Brevo dentro de n8n.
        N8nClient::enviarOtp($tel, $codigo, $correo);

        Response::created([
            'registro_token'     => $token,
            'correo'             => self::enmascararCorreo($correo),
            'expira_en_segundos' => self::OTP_TTL_SEGUNDOS,
        ], 'Te enviamos un código de verificación a tu correo.');
    }

    /** Paso 3: verifica el código OTP del registro. */
    public function verificar(): void
    {
        $d = Request::json();
        if (!empty(Validator::faltantes($d, ['token', 'codigo']))) {
            Response::error('Datos incompletos.', 400);
        }
        if (!preg_match('/^[0-9]{5}$/', (string) $d['codigo'])) {
            Response::error('El código debe tener 5 dígitos.', 400);
        }

        $modelo = new RegistroPendiente();
        $reg = $modelo->porToken((string) $d['token']);
        if ($reg === null) {
            Response::error('Registro no encontrado. Vuelve a iniciar el proceso.', 404);
        }
        if ((int) $reg['verificado'] === 1) {
            Response::success(null, 'Código ya verificado.');
        }
        if (strtotime((string) $reg['otp_expira_en']) < time()) {
            Response::error('El código expiró. Solicita uno nuevo.', 409);
        }
        if ((int) $reg['otp_intentos'] >= self::OTP_MAX_INTENTOS) {
            Response::error('Demasiados intentos. Solicita un nuevo código.', 403);
        }
        if (!hash_equals((string) $reg['otp_hash'], Security::hashOtp((string) $d['codigo']))) {
            $modelo->registrarIntentoFallido((string) $d['token']);
            Response::error('Código incorrecto.', 401);
        }

        $modelo->marcarVerificado((string) $d['token']);
        Response::success(null, 'Código verificado correctamente.');
    }

    /** Reenvía un nuevo código OTP para un registro en curso. */
    public function reenviar(): void
    {
        $d = Request::json();
        if (!empty(Validator::faltantes($d, ['token']))) {
            Response::error('Datos incompletos.', 400);
        }

        $modelo = new RegistroPendiente();
        $reg = $modelo->porToken((string) $d['token']);
        if ($reg === null) {
            Response::error('Registro no encontrado. Vuelve a iniciar el proceso.', 404);
        }

        $codigo = self::codigo5();
        $modelo->actualizarOtp(
            (string) $d['token'],
            Security::hashOtp($codigo),
            date('Y-m-d H:i:s', time() + self::OTP_TTL_SEGUNDOS)
        );
        N8nClient::enviarOtp((string) $reg['telefono'], $codigo, (string) $reg['correo']);

        Response::success([
            'expira_en_segundos' => self::OTP_TTL_SEGUNDOS,
        ], 'Te enviamos un nuevo código.');
    }

    /** Paso 4: crea la cuenta (verificada), asigna intereses e inicia sesión. */
    public function completar(): void
    {
        $d = Request::json();
        if (!empty(Validator::faltantes($d, ['token']))) {
            Response::error('Datos incompletos.', 400);
        }

        $modelo = new RegistroPendiente();
        $reg = $modelo->porToken((string) $d['token']);
        if ($reg === null) {
            Response::error('Registro no encontrado. Vuelve a iniciar el proceso.', 404);
        }
        if ((int) $reg['verificado'] !== 1) {
            Response::error('Verifica el código antes de crear la cuenta.', 409);
        }

        $paciente = new Paciente();
        if ($paciente->existePorDocumento((string) $reg['tipo_documento'], (string) $reg['numero_documento'])) {
            $modelo->eliminar((string) $d['token']);
            Response::error('Ya existe una cuenta con este documento. Inicia sesión.', 409);
        }

        $intereses = is_array($d['intereses'] ?? null) ? $d['intereses'] : [];
        $idsInteres = (new Interes())->idsPorCodigos($intereses);

        // ---- Transacción: crear paciente + intereses + purgar pendiente ----
        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {
            $idPaciente = $paciente->crearCuenta($reg);
            (new Interes())->asignar($idPaciente, $idsInteres);
            $modelo->eliminar((string) $d['token']);
            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        SessionGuard::login($idPaciente);
        Response::created([
            'paciente'   => trim($reg['nombres'] . ' ' . $reg['apellidos']),
            'csrf_token' => Security::csrfToken(),
        ], '¡Cuenta creada! Bienvenido(a) a tu portal.');
    }

    // ---------- Utilidades ----------

    /** Código OTP de 5 dígitos para el registro (el OTP de reserva usa 4). */
    private static function codigo5(): string
    {
        return str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
    }

    private static function enmascararCorreo(string $correo): string
    {
        $partes = explode('@', $correo);
        if (count($partes) !== 2) {
            return $correo;
        }
        $usuario = $partes[0];
        $visible = substr($usuario, 0, 1);
        return $visible . str_repeat('*', max(1, strlen($usuario) - 1)) . '@' . $partes[1];
    }
}
