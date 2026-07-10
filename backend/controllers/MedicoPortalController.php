<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Env;
use App\Core\Request;
use App\Core\Response;
use App\Core\Security;
use App\Core\Validator;
use App\Middlewares\SessionGuard;
use App\Models\Cita;
use App\Models\DocumentoClinico;
use App\Models\Encuesta;
use App\Models\Medico;
use App\Models\Paciente;
use App\Services\N8nClient;

/**
 * MedicoPortalController — Área privada del médico: login, agenda,
 * pacientes y emisión de documentos clínicos hacia el portal del paciente.
 */
final class MedicoPortalController
{
    private const TIPOS_DOC = [
        'RECETA_MEDICA', 'INFORME_ENDOSCOPIA', 'INFORME_COLONOSCOPIA', 'RESULTADO_LABORATORIO',
    ];

    /** Etiquetas legibles para las notificaciones al paciente. */
    private const TIPO_LABEL = [
        'RECETA_MEDICA'         => 'Receta médica',
        'INFORME_ENDOSCOPIA'    => 'Informe de endoscopía',
        'INFORME_COLONOSCOPIA'  => 'Informe de colonoscopía',
        'RESULTADO_LABORATORIO' => 'Resultado de laboratorio',
    ];

    public function login(): void
    {
        $d = Request::json();
        $errores = Validator::faltantes($d, ['correo', 'password']);
        if (!empty($errores)) {
            Response::error('Credenciales incompletas.', 400, $errores);
        }

        $cred = (new Medico())->credencialPorCorreo(trim((string) $d['correo']));
        if ($cred === null
            || empty($cred['password_hash'])
            || !password_verify((string) $d['password'], (string) $cred['password_hash'])
        ) {
            Response::error('Correo o contraseña incorrectos.', 401);
        }

        SessionGuard::loginMedico((int) $cred['id_medico']);
        Response::success([
            'medico'       => 'Dr(a). ' . trim($cred['nombres'] . ' ' . $cred['apellidos']),
            'especialidad' => $cred['especialidad'],
            'csrf_token'   => Security::csrfToken(),
        ], 'Sesión iniciada.');
    }

    public function logout(): void
    {
        SessionGuard::destroy();
        Response::success(null, 'Sesión cerrada.');
    }

    public function sesion(): void
    {
        $idMedico = SessionGuard::requireMedico();
        $m = (new Medico())->porId($idMedico);
        if ($m === null) {
            SessionGuard::destroy();
            Response::error('Sesión inválida.', 401);
        }
        Response::success([
            'id_medico'    => (int) $m['id_medico'],
            'nombres'      => $m['nombres'],
            'apellidos'    => $m['apellidos'],
            'especialidad' => $m['especialidad'],
            'cmp'          => $m['cmp'],
        ], 'Sesión activa.');
    }

    public function agenda(): void
    {
        $idMedico = SessionGuard::requireMedico();
        Response::success((new Cita())->porMedico($idMedico), 'Agenda del médico.');
    }

    /** Marca una cita de su agenda como atendida. */
    public function atenderCita(array $params): void
    {
        $idMedico = SessionGuard::requireMedico();
        $idCita = (int) $params['id'];
        $resultado = (new Cita())->atenderPorMedico($idCita, $idMedico);
        match ($resultado) {
            'OK'                     => $this->atendida($idCita, $idMedico),
            'NO_AUTORIZADO'          => Response::error('Esta cita no pertenece a tu agenda.', 403),
            'TRANSICION_NO_PERMITIDA'=> Response::error('La cita no puede marcarse como atendida en su estado actual.', 409),
            default                  => Response::error('Cita no encontrada.', 404),
        };
    }

    /** Post-atención: dispara la encuesta de satisfacción y responde. */
    private function atendida(int $idCita, int $idMedico): never
    {
        $this->dispararEncuesta($idCita, $idMedico);
        Response::success(['estado' => 'ATENDIDA'], 'Cita marcada como atendida.');
    }

    /**
     * Crea la encuesta NPS y la emite a n8n (fire-and-forget). Nunca rompe la
     * respuesta principal: cualquier fallo queda en el log.
     */
    private function dispararEncuesta(int $idCita, int $idMedico): void
    {
        try {
            $cita = (new Cita())->porId($idCita);
            if ($cita === null) {
                return;
            }
            $paciente = (new Paciente())->porId((int) $cita['id_paciente']);
            $medico   = (new Medico())->porId($idMedico);
            if ($paciente === null || $medico === null) {
                return;
            }

            $token = Security::uuid();
            // Idempotente: si ya existía encuesta para la cita, no reenvía.
            if (!(new Encuesta())->crearParaCita($idCita, (int) $cita['id_paciente'], $token)) {
                return;
            }

            $base = (string) (Env::get('APP_FRONTEND_URL') ?? Env::get('APP_URL', ''));
            N8nClient::enviarEncuesta([
                'telefono' => (string) ($paciente['telefono'] ?? ''),
                'correo'   => (string) ($paciente['correo'] ?? ''),
                'paciente' => trim(($paciente['nombres'] ?? '') . ' ' . ($paciente['apellidos'] ?? '')),
                'medico'   => 'Dr(a). ' . trim(($medico['nombres'] ?? '') . ' ' . ($medico['apellidos'] ?? '')),
                'link'     => rtrim($base, '/') . '/encuesta/' . $token,
            ]);
        } catch (\Throwable $e) {
            error_log('[encuesta] no se pudo disparar: ' . $e->getMessage());
        }
    }

    public function pacientes(): void
    {
        $idMedico = SessionGuard::requireMedico();
        Response::success((new Medico())->pacientesConCitas($idMedico), 'Pacientes del médico.');
    }

    /** Emite un documento clínico para un paciente que atiende el médico. */
    public function emitirDocumento(): void
    {
        $idMedico = SessionGuard::requireMedico();
        $d = Request::json();

        $errores = Validator::faltantes($d, ['id_paciente', 'tipo_documento', 'titulo', 'fecha_emision']);
        if (!empty($errores)) {
            Response::error('Completa los campos obligatorios.', 400, $errores);
        }

        $campos = [];
        if (!in_array($d['tipo_documento'], self::TIPOS_DOC, true)) {
            $campos['tipo_documento'] = 'Tipo de documento inválido.';
        }
        if (!Validator::fechaValida((string) $d['fecha_emision'])) {
            $campos['fecha_emision'] = 'Fecha de emisión inválida (AAAA-MM-DD).';
        }
        if (mb_strlen(trim((string) $d['titulo'])) < 3) {
            $campos['titulo'] = 'El título es demasiado corto.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        $medico = new Medico();
        if (!$medico->atiendePaciente($idMedico, (int) $d['id_paciente'])) {
            Response::error('Solo puedes emitir documentos a tus pacientes.', 403);
        }

        $id = (new DocumentoClinico())->crear([
            'id_paciente'    => (int) $d['id_paciente'],
            'id_medico'      => $idMedico,
            'id_cita'        => isset($d['id_cita']) ? (int) $d['id_cita'] : null,
            'tipo_documento' => $d['tipo_documento'],
            'titulo'         => trim((string) $d['titulo']),
            'descripcion'    => isset($d['descripcion']) ? trim((string) $d['descripcion']) : null,
            'fecha_emision'  => (string) $d['fecha_emision'],
        ]);

        // Automatización: avisa al paciente que su documento ya está en el portal.
        // Fire-and-forget: si n8n no responde, no bloquea la emisión (queda en log).
        $paciente = (new Paciente())->porId((int) $d['id_paciente']);
        if ($paciente !== null) {
            N8nClient::notificarDocumento([
                'telefono'  => (string) ($paciente['telefono'] ?? ''),
                'correo'    => (string) ($paciente['correo'] ?? ''),
                'paciente'  => trim(($paciente['nombres'] ?? '') . ' ' . ($paciente['apellidos'] ?? '')),
                'documento' => self::TIPO_LABEL[$d['tipo_documento']] ?? (string) $d['tipo_documento'],
                'titulo'    => trim((string) $d['titulo']),
            ]);
        }

        Response::created(['id_documento' => $id], 'Documento emitido. Ya está disponible en el portal del paciente.');
    }
}
