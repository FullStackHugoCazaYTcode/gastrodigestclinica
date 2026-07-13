<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Security;
use App\Core\Validator;
use App\Middlewares\SessionGuard;
use App\Models\Cita;
use App\Models\DocumentoClinico;
use App\Models\Paciente;

/**
 * PortalController — Portal privado del paciente: login, logout y documentos.
 * Autorización estricta: el id_paciente de sesión debe coincidir con el recurso.
 */
final class PortalController
{
    public function login(): void
    {
        $d = Request::json();
        $errores = Validator::faltantes($d, ['tipo_documento', 'numero_documento', 'password']);
        if (!empty($errores)) {
            Response::error('Credenciales incompletas.', 400, $errores);
        }

        $cred = (new Paciente())->credencialPorDocumento(
            (string) $d['tipo_documento'],
            (string) $d['numero_documento']
        );

        // Mensaje genérico para no revelar si el documento existe.
        if ($cred === null
            || empty($cred['password_hash'])
            || !password_verify((string) $d['password'], (string) $cred['password_hash'])
        ) {
            Response::error('Documento o contraseña incorrectos.', 401);
        }

        SessionGuard::login((int) $cred['id_paciente']);
        Response::success([
            'paciente'   => trim($cred['nombres'] . ' ' . $cred['apellidos']),
            'csrf_token' => Security::csrfToken(),
        ], 'Sesión iniciada.');
    }

    public function logout(): void
    {
        SessionGuard::destroy();
        Response::success(null, 'Sesión cerrada.');
    }

    /** Devuelve el paciente autenticado (o 401). Usado para gatear /reservar. */
    public function sesion(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $p = (new Paciente())->porId($idPaciente);
        if ($p === null) {
            SessionGuard::destroy();
            Response::error('Sesión inválida.', 401);
        }
        Response::success([
            'id_paciente'      => (int) $p['id_paciente'],
            'nombres'          => $p['nombres'],
            'apellidos'        => $p['apellidos'],
            'tipo_documento'   => $p['tipo_documento'],
            'numero_documento' => $p['numero_documento'],
            'correo'           => $p['correo'],
            'telefono'         => $p['telefono'],
            'fecha_nacimiento' => $p['fecha_nacimiento'],
            'sexo'             => $p['sexo'],
            'departamento'     => $p['departamento'] ?? null,
            'provincia'        => $p['provincia'] ?? null,
            'distrito'         => $p['distrito'] ?? null,
            'direccion'        => $p['direccion'] ?? null,
        ], 'Sesión activa.');
    }

    public function documentos(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $docs = (new DocumentoClinico())->porPaciente($idPaciente);
        Response::success($docs, 'Documentos del paciente.');
    }

    public function citas(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $citas = (new Cita())->porPaciente($idPaciente);
        Response::success($citas, 'Citas del paciente.');
    }

    /** El paciente cancela una de sus citas. */
    public function cancelarCita(array $params): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $res = (new Cita())->cancelarPorPaciente((int) $params['id'], $idPaciente);
        match ($res) {
            'OK'                      => Response::success(['estado' => 'CANCELADA_PACIENTE'], 'Tu cita fue cancelada.'),
            'NO_AUTORIZADO'           => Response::error('Esta cita no te pertenece.', 403),
            'TRANSICION_NO_PERMITIDA' => Response::error('Esta cita ya no se puede cancelar.', 409),
            default                   => Response::error('Cita no encontrada.', 404),
        };
    }

    /** El paciente reprograma una de sus citas a un nuevo horario. */
    public function reprogramarCita(array $params): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $d = Request::json();
        $fechaHora = trim((string) ($d['fecha_hora'] ?? ''));

        if (!preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $fechaHora)) {
            Response::error('Selecciona una fecha y hora válidas.', 400, ['fecha_hora' => 'Formato inválido.']);
        }
        if (strtotime($fechaHora) < time()) {
            Response::error('Debes elegir un horario futuro.', 400, ['fecha_hora' => 'La fecha y hora ya pasaron.']);
        }

        $res = (new Cita())->reprogramarPorPaciente((int) $params['id'], $idPaciente, $fechaHora);
        match ($res) {
            'OK'                => Response::success(['fecha_hora' => $fechaHora], 'Tu cita fue reprogramada.'),
            'NO_AUTORIZADO'     => Response::error('Esta cita no te pertenece.', 403),
            'NO_APLICABLE'      => Response::error('Esta cita ya no se puede reprogramar.', 409),
            'CONFLICTO_HORARIO' => Response::error('Ese horario ya está ocupado. Elige otro.', 409),
            default             => Response::error('Cita no encontrada.', 404),
        };
    }

    /** Actualiza los datos de contacto del paciente autenticado. */
    public function actualizarPerfil(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $d = Request::json();

        $tel = preg_replace('/\D+/', '', (string) ($d['telefono'] ?? ''));
        $correo = trim((string) ($d['correo'] ?? ''));
        $direccion = trim((string) ($d['direccion'] ?? ''));

        $campos = [];
        if (!Validator::telefono((string) $tel)) {
            $campos['telefono'] = 'El celular debe tener entre 9 y 15 dígitos.';
        }
        if (!Validator::email($correo)) {
            $campos['correo'] = 'Ingresa un correo electrónico válido.';
        }
        if ($direccion === '') {
            $campos['direccion'] = 'Ingresa tu dirección.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        (new Paciente())->actualizarContacto($idPaciente, [
            'telefono' => $tel, 'correo' => $correo, 'direccion' => $direccion,
        ]);
        Response::success([
            'telefono'  => $tel,
            'correo'    => $correo,
            'direccion' => $direccion,
        ], 'Datos actualizados correctamente.');
    }

    /** Familiares (dependientes) del paciente autenticado. */
    public function familiares(): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        Response::success((new Paciente())->familiaresDe($idPaciente), 'Familiares a tu cargo.');
    }

    /** Agrega un familiar/dependiente a cargo del paciente autenticado (apoderado). */
    public function agregarFamiliar(): void
    {
        $idApoderado = SessionGuard::requirePaciente();
        $d = Request::json();

        $req = ['nombres', 'apellidos', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'sexo'];
        if (!empty($errores = Validator::faltantes($d, $req))) {
            Response::error('Completa los campos obligatorios.', 400, $errores);
        }

        $campos = [];
        if ($msg = Validator::documento((string) $d['tipo_documento'], trim((string) $d['numero_documento']))) {
            $campos['numero_documento'] = $msg;
        }
        if (!Validator::fechaValida((string) $d['fecha_nacimiento'])) {
            $campos['fecha_nacimiento'] = 'Fecha de nacimiento inválida (AAAA-MM-DD).';
        }
        if (!in_array($d['sexo'], ['M', 'F', 'X'], true)) {
            $campos['sexo'] = 'Selecciona el sexo.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        $paciente = new Paciente();
        if ($paciente->existePorDocumento((string) $d['tipo_documento'], trim((string) $d['numero_documento']))) {
            Response::error('Ya existe un paciente registrado con ese documento.', 409);
        }

        // El familiar hereda el contacto del apoderado (ahí llegan sus avisos).
        $apo = $paciente->porId($idApoderado);
        $id = $paciente->crear([
            'tipo_documento'       => $d['tipo_documento'],
            'numero_documento'     => trim((string) $d['numero_documento']),
            'nombres'              => trim((string) $d['nombres']),
            'apellidos'            => trim((string) $d['apellidos']),
            'fecha_nacimiento'     => (string) $d['fecha_nacimiento'],
            'sexo'                 => $d['sexo'],
            'telefono'             => $apo['telefono'] ?? null,
            'correo'               => $apo['correo'] ?? null,
            'id_apoderado'         => $idApoderado,
            'consentimiento_datos' => true, // el apoderado otorga el consentimiento
        ]);

        Response::created(['id_paciente' => $id], 'Familiar agregado correctamente.');
    }

    public function documento(array $params): void
    {
        $idPaciente = SessionGuard::requirePaciente();
        $doc = (new DocumentoClinico())->porIdYPaciente((int) $params['id'], $idPaciente);
        if ($doc === null) {
            // 403: existe pero no es del paciente, o no existe (no se distingue).
            Response::error('Documento no encontrado o no autorizado.', 403);
        }
        Response::success($doc, 'Documento.');
    }
}
