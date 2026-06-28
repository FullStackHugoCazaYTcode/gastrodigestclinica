<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Models\Apoderado;
use App\Models\Paciente;

/**
 * PacienteController — Registro de pacientes y verificación de documento.
 * Aplica la regla legal: menor de 18 → apoderado obligatorio (Ley 29414).
 */
final class PacienteController
{
    public function registrar(): void
    {
        $d = Request::json();
        $errores = Validator::faltantes($d, [
            'tipo_documento', 'numero_documento', 'nombres', 'apellidos',
            'fecha_nacimiento', 'telefono', 'correo',
        ]);

        if (!empty($d['tipo_documento']) && !empty($d['numero_documento'])) {
            $docErr = Validator::documento((string) $d['tipo_documento'], (string) $d['numero_documento']);
            if ($docErr !== null) {
                $errores['numero_documento'] = $docErr;
            }
        }
        if (!empty($d['correo']) && !Validator::email((string) $d['correo'])) {
            $errores['correo'] = 'Correo electrónico inválido.';
        }
        if (!empty($d['telefono']) && !Validator::telefono((string) $d['telefono'])) {
            $errores['telefono'] = 'Teléfono inválido (9 a 15 dígitos).';
        }
        if (!empty($d['fecha_nacimiento']) && !Validator::fechaValida((string) $d['fecha_nacimiento'])) {
            $errores['fecha_nacimiento'] = 'Fecha inválida (formato YYYY-MM-DD).';
        }
        if (empty($d['consentimiento_datos'])) {
            $errores['consentimiento_datos'] = 'Debe aceptar el tratamiento de datos (Ley 29733).';
        }

        if (!empty($errores)) {
            Response::error('Datos inválidos.', 400, $errores);
        }

        $pacientes = new Paciente();
        if ($pacientes->buscarPorDocumento((string) $d['tipo_documento'], (string) $d['numero_documento'])) {
            Response::error('Ya existe un paciente registrado con ese documento.', 409);
        }

        // Regla legal: si es menor, el apoderado es obligatorio.
        $d['id_apoderado'] = Validator::esMenor((string) $d['fecha_nacimiento'])
            ? $this->resolverApoderado($d['apoderado'] ?? null)
            : null;

        $idPaciente = $pacientes->crear($d);

        Response::created([
            'id_paciente'       => $idPaciente,
            'requiere_apoderado' => $d['id_apoderado'] !== null,
        ], 'Paciente registrado correctamente.');
    }

    /** Endpoint de verificación en tiempo real para el frontend. */
    public function verificarDocumento(): void
    {
        $tipo   = (string) Request::query('tipo', '');
        $numero = (string) Request::query('numero', '');

        $error = Validator::documento($tipo, $numero);
        if ($error !== null) {
            Response::error($error, 400);
        }
        $yaRegistrado = (new Paciente())->buscarPorDocumento($tipo, $numero) !== null;
        Response::success(['valido' => true, 'ya_registrado' => $yaRegistrado], 'Documento válido.');
    }

    /** Crea o reutiliza el apoderado y devuelve su id. Corta con 400 si es inválido. */
    private function resolverApoderado(mixed $apo): int
    {
        if (!is_array($apo)) {
            Response::error('Paciente menor de edad: los datos del apoderado son obligatorios.', 400, [
                'apoderado' => 'Requerido para pacientes menores de 18 años (Ley 29414).',
            ]);
        }
        $errores = Validator::faltantes($apo, ['dni', 'nombres', 'relacion_parentesco', 'telefono', 'correo']);
        if (!empty($apo['dni']) && !preg_match('/^[0-9]{8}$/', (string) $apo['dni'])) {
            $errores['dni'] = 'El DNI del apoderado debe tener 8 dígitos.';
        }
        if (!empty($apo['correo']) && !Validator::email((string) $apo['correo'])) {
            $errores['correo'] = 'Correo del apoderado inválido.';
        }
        if (!empty($errores)) {
            Response::error('Datos del apoderado inválidos.', 400, $errores);
        }

        $model     = new Apoderado();
        $existente = $model->buscarPorDni((string) $apo['dni']);
        return $existente ? (int) $existente['id_apoderado'] : $model->crear($apo);
    }
}
