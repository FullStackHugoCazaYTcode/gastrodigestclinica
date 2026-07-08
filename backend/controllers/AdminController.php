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

    public function citas(): void
    {
        SessionGuard::requireAdmin();
        Response::success((new Cita())->todas(), 'Agenda global.');
    }

    public function pacientes(): void
    {
        SessionGuard::requireAdmin();
        Response::success((new Paciente())->todos(), 'Pacientes.');
    }
}
