<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Security;
use App\Core\Validator;
use App\Middlewares\SessionGuard;
use App\Middlewares\WebhookGuard;
use App\Models\Administrador;
use App\Models\Cita;
use App\Models\Encuesta;
use App\Models\HorarioMedico;
use App\Models\Medico;
use App\Models\Paciente;
use App\Models\Reclamacion;

/**
 * AdminController — Panel de administración/dueño: métricas, gestión de
 * médicos (alta/estado), agenda global y pacientes.
 */
final class AdminController
{
    private const PASSWORD_MIN = 8;

    public function login(): void
    {
        $d = Request::json();
        if (!empty(Validator::faltantes($d, ['correo', 'password']))) {
            Response::error('Credenciales incompletas.', 400);
        }

        $cred = (new Administrador())->credencialPorCorreo(trim((string) $d['correo']));
        if ($cred === null || !password_verify((string) $d['password'], (string) $cred['password_hash'])) {
            Response::error('Correo o contraseña incorrectos.', 401);
        }

        SessionGuard::loginAdmin((int) $cred['id_admin']);
        Response::success([
            'admin'      => $cred['nombres'],
            'csrf_token' => Security::csrfToken(),
        ], 'Sesión iniciada.');
    }

    public function logout(): void
    {
        SessionGuard::destroy();
        Response::success(null, 'Sesión cerrada.');
    }

    public function sesion(): void
    {
        $idAdmin = SessionGuard::requireAdmin();
        $a = (new Administrador())->porId($idAdmin);
        if ($a === null) {
            SessionGuard::destroy();
            Response::error('Sesión inválida.', 401);
        }
        Response::success(['id_admin' => (int) $a['id_admin'], 'nombres' => $a['nombres'], 'correo' => $a['correo']], 'Sesión activa.');
    }

    /** Métricas del dashboard. */
    public function resumen(): void
    {
        SessionGuard::requireAdmin();
        $conteo = (new Cita())->conteoPorEstado();
        $porEstado = [];
        $totalCitas = 0;
        foreach ($conteo as $row) {
            $porEstado[$row['estado_actual']] = (int) $row['n'];
            $totalCitas += (int) $row['n'];
        }
        $medicos = (new Medico())->todos();
        $activos = count(array_filter($medicos, static fn($m) => (int) $m['estado_activo'] === 1));

        Response::success([
            'total_citas'      => $totalCitas,
            'total_pacientes'  => (new Paciente())->total(),
            'total_medicos'    => count($medicos),
            'medicos_activos'  => $activos,
            'citas_por_estado' => $porEstado,
        ], 'Resumen.');
    }

    /**
     * Digest diario para el cron de n8n (sin sesión: lo llama una máquina).
     * Protegido por el secreto compartido de webhook.
     */
    public function resumenDiario(): void
    {
        WebhookGuard::verify();
        $hoy = date('Y-m-d');
        $agenda = (new Cita())->agendaDelDia($hoy);
        Response::success([
            'fecha'                => $hoy,
            'citas_hoy'            => count($agenda),
            'agenda'               => $agenda,
            'pacientes_nuevos_hoy' => (new Paciente())->nuevosDesde($hoy),
            'reclamaciones_nuevas' => (new Reclamacion())->conteoDelDia($hoy),
        ], 'Resumen diario.');
    }

    public function medicos(): void
    {
        SessionGuard::requireAdmin();
        Response::success((new Medico())->todos(), 'Médicos.');
    }

    public function crearMedico(): void
    {
        SessionGuard::requireAdmin();
        $d = Request::json();
        $req = ['cmp', 'nombres', 'apellidos', 'especialidad', 'correo', 'password'];
        if (!empty($errores = Validator::faltantes($d, $req))) {
            Response::error('Completa los campos obligatorios.', 400, $errores);
        }

        $cmp = trim((string) $d['cmp']);
        $correo = trim((string) $d['correo']);
        $campos = [];
        if (!preg_match('/^[A-Za-z0-9]{4,10}$/', $cmp)) {
            $campos['cmp'] = 'CMP inválido (4 a 10 caracteres alfanuméricos).';
        }
        if (!Validator::email($correo)) {
            $campos['correo'] = 'Correo electrónico inválido.';
        }
        if (strlen((string) $d['password']) < self::PASSWORD_MIN) {
            $campos['password'] = 'La contraseña debe tener al menos ' . self::PASSWORD_MIN . ' caracteres.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        $medico = new Medico();
        if ($medico->cmpExiste($cmp)) {
            Response::error('Ya existe un médico con ese CMP.', 409);
        }
        if ($medico->correoExiste($correo)) {
            Response::error('Ya existe un médico con ese correo.', 409);
        }

        $id = $medico->crear([
            'cmp'           => $cmp,
            'nombres'       => trim((string) $d['nombres']),
            'apellidos'     => trim((string) $d['apellidos']),
            'especialidad'  => trim((string) $d['especialidad']),
            'correo'        => $correo,
            'telefono'      => isset($d['telefono']) ? preg_replace('/\D+/', '', (string) $d['telefono']) : null,
            'password_hash' => password_hash((string) $d['password'], PASSWORD_DEFAULT),
        ]);

        Response::created(['id_medico' => $id], 'Médico creado. Ya puede iniciar sesión en su portal.');
    }

    public function cambiarEstadoMedico(array $params): void
    {
        SessionGuard::requireAdmin();
        $d = Request::json();
        $activo = !empty($d['estado_activo']);
        (new Medico())->cambiarEstado((int) $params['id'], $activo);
        Response::success(['estado_activo' => $activo], 'Estado actualizado.');
    }

    /** PATCH /api/admin/medicos/{id}/perfil — foto, bio, experiencia, etc. */
    public function actualizarPerfilMedico(array $params): void
    {
        SessionGuard::requireAdmin();
        $d = Request::json();

        $exp = $d['anios_experiencia'] ?? null;
        $exp = ($exp === '' || $exp === null) ? null : (int) $exp;
        if ($exp !== null && ($exp < 0 || $exp > 70)) {
            Response::error('Años de experiencia inválidos.', 400, ['anios_experiencia' => 'Debe estar entre 0 y 70.']);
        }

        $limpiar = static fn($v, int $max) => ($v = trim((string) ($v ?? ''))) === '' ? null : mb_substr($v, 0, $max);

        (new Medico())->actualizarPerfil((int) $params['id'], [
            'foto'             => $limpiar($d['foto'] ?? null, 255),
            'sub_especialidad' => $limpiar($d['sub_especialidad'] ?? null, 120),
            'anios_experiencia' => $exp,
            'formacion'        => $limpiar($d['formacion'] ?? null, 255),
            'bio'              => $limpiar($d['bio'] ?? null, 800),
        ]);
        Response::success(null, 'Perfil del médico actualizado.');
    }

    public function citas(): void
    {
        SessionGuard::requireAdmin();
        Response::success((new Cita())->todas(), 'Agenda global.');
    }

    /** GET /api/admin/recepcion?fecha= — agenda del día para el panel de recepción. */
    public function recepcion(): void
    {
        SessionGuard::requireAdmin();
        $fecha = (string) Request::query('fecha', '');
        if (!Validator::fechaValida($fecha)) {
            $fecha = date('Y-m-d');
        }
        Response::success([
            'fecha' => $fecha,
            'citas' => (new Cita())->agendaRecepcion($fecha),
        ], 'Agenda de recepción.');
    }

    /** PATCH /api/admin/recepcion/{id} — recepción confirma llegada o marca inasistencia. */
    public function recepcionTransicion(array $params): void
    {
        SessionGuard::requireAdmin();
        $accion = (string) (Request::json()['accion'] ?? '');
        $nuevo = match ($accion) {
            'confirmar'  => 'CONFIRMADA_RECEPCION',
            'no_asistio' => 'NO_ASISTIO',
            default      => null,
        };
        if ($nuevo === null) {
            Response::error('Acción no válida.', 400);
        }

        $res = (new Cita())->transicionar((int) $params['id'], $nuevo, 'RECEPCION', 'Recepción: ' . $accion);
        match ($res) {
            'OK'                      => Response::success(['estado' => $nuevo], 'Estado actualizado.'),
            'TRANSICION_NO_PERMITIDA' => Response::error('Esa acción no aplica al estado actual de la cita.', 409),
            default                   => Response::error('Cita no encontrada.', 404),
        };
    }

    /** Encuestas respondidas para moderar cuáles se publican como testimonios. */
    public function encuestas(): void
    {
        SessionGuard::requireAdmin();
        Response::success((new Encuesta())->paraModeracion(), 'Opiniones de pacientes.');
    }

    /** Aprueba u oculta un testimonio. */
    public function moderarEncuesta(array $params): void
    {
        SessionGuard::requireAdmin();
        $d = Request::json();
        $aprobado = !empty($d['aprobado']);
        (new Encuesta())->moderar((int) $params['id'], $aprobado);
        Response::success(['aprobado' => $aprobado], 'Testimonio actualizado.');
    }

    public function pacientes(): void
    {
        SessionGuard::requireAdmin();
        Response::success((new Paciente())->todos(), 'Pacientes.');
    }

    // ---- Disponibilidad: horarios y bloqueos por médico -----------------

    /** GET /api/admin/medicos/{id}/horarios — horario semanal + bloqueos. */
    public function horariosMedico(array $params): void
    {
        SessionGuard::requireAdmin();
        $idm = (int) $params['id'];
        $hm = new HorarioMedico();
        Response::success([
            'horarios' => $hm->horariosDe($idm),
            'bloqueos' => $hm->bloqueosDe($idm),
        ], 'Horarios del médico.');
    }

    /** POST /api/admin/medicos/{id}/horarios — agrega un bloque semanal. */
    public function agregarHorario(array $params): void
    {
        SessionGuard::requireAdmin();
        $d = Request::json();
        $dia = (int) ($d['dia_semana'] ?? 0);
        $ini = trim((string) ($d['hora_inicio'] ?? ''));
        $fin = trim((string) ($d['hora_fin'] ?? ''));

        $campos = [];
        if ($dia < 1 || $dia > 7) {
            $campos['dia_semana'] = 'Selecciona un día válido.';
        }
        if (!$this->horaValida($ini)) {
            $campos['hora_inicio'] = 'Hora de inicio inválida.';
        }
        if (!$this->horaValida($fin)) {
            $campos['hora_fin'] = 'Hora de fin inválida.';
        }
        if (empty($campos) && $fin <= $ini) {
            $campos['hora_fin'] = 'La hora de fin debe ser mayor que la de inicio.';
        }
        if (!empty($campos)) {
            Response::error('Revisa los datos ingresados.', 400, $campos);
        }

        $id = (new HorarioMedico())->agregarHorario((int) $params['id'], $dia, $ini . ':00', $fin . ':00');
        Response::created(['id_horario' => $id], 'Horario agregado.');
    }

    /** POST /api/admin/medicos/{idm}/horarios/{id}/eliminar */
    public function eliminarHorario(array $params): void
    {
        SessionGuard::requireAdmin();
        (new HorarioMedico())->eliminarHorario((int) $params['id'], (int) $params['idm']);
        Response::success(null, 'Horario eliminado.');
    }

    /** POST /api/admin/medicos/{id}/bloqueos — agrega una ausencia por fecha. */
    public function agregarBloqueo(array $params): void
    {
        SessionGuard::requireAdmin();
        $d = Request::json();
        $fecha = trim((string) ($d['fecha'] ?? ''));
        if (!Validator::fechaValida($fecha)) {
            Response::error('Fecha inválida.', 400, ['fecha' => 'Usa el formato AAAA-MM-DD.']);
        }

        $ini = trim((string) ($d['hora_inicio'] ?? ''));
        $fin = trim((string) ($d['hora_fin'] ?? ''));
        $hi = $hf = null;
        // Ambos vacíos = día completo; si viene uno, ambos deben ser válidos.
        if ($ini !== '' || $fin !== '') {
            if (!$this->horaValida($ini) || !$this->horaValida($fin) || $fin <= $ini) {
                Response::error('Rango horario inválido.', 400, [
                    'hora_inicio' => 'Indica inicio y fin válidos, o déjalos vacíos para bloquear todo el día.',
                ]);
            }
            $hi = $ini . ':00';
            $hf = $fin . ':00';
        }

        $motivo = isset($d['motivo']) ? mb_substr(trim((string) $d['motivo']), 0, 160) : '';
        $motivo = $motivo === '' ? null : $motivo;

        $id = (new HorarioMedico())->agregarBloqueo((int) $params['id'], $fecha, $hi, $hf, $motivo);
        Response::created(['id_bloqueo' => $id], 'Bloqueo agregado.');
    }

    /** POST /api/admin/medicos/{idm}/bloqueos/{id}/eliminar */
    public function eliminarBloqueo(array $params): void
    {
        SessionGuard::requireAdmin();
        (new HorarioMedico())->eliminarBloqueo((int) $params['id'], (int) $params['idm']);
        Response::success(null, 'Bloqueo eliminado.');
    }

    private function horaValida(string $h): bool
    {
        return (bool) preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $h);
    }
}
