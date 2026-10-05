// Definición y utilidades para las 13 secciones del File de Personal en DOCUS RRHH

export const SECCIONES_FILE_DEFAULT = [
  {
    id: 1,
    codigo: 'DOC_PER',
    nombre: 'Documentos Personales',
    descripcion: 'C.I. vigente, Certificado de Nacimiento, Libreta Militar, etc.',
    fojas: 2,
    estado: 'presente', // 'presente' | 'pendiente' | 'no_aplica'
    observacion: 'Cédula de Identidad y Certificado vigentes'
  },
  {
    id: 2,
    codigo: 'CV',
    nombre: 'Currículum Vitae',
    descripcion: 'Hoja de vida documentada, Título en Provisión Nacional, certificados',
    fojas: 8,
    estado: 'presente',
    observacion: 'Títulos académicos y certificados de respaldo'
  },
  {
    id: 3,
    codigo: 'INC',
    nombre: 'Documento de Incorporación',
    descripcion: 'Memorándum de designación o nombramiento, Acta de posesión',
    fojas: 1,
    estado: 'presente',
    observacion: 'Memorándum de inicio de funciones original'
  },
  {
    id: 4,
    codigo: 'CONTRATOS',
    nombre: 'Contratos',
    descripcion: 'Contrato individual de trabajo, adendas de renovación vigentes',
    fojas: 4,
    estado: 'presente',
    observacion: 'Contrato laboral firmado por ambas partes'
  },
  {
    id: 5,
    codigo: 'CNS',
    nombre: 'Documento Caja Nacional',
    descripcion: 'Seguro de Salud (Formulario AVC-04, AVC-05, Carnet de Asegurado CNS)',
    fojas: 2,
    estado: 'presente',
    observacion: 'Afiliación formal a la Caja Nacional de Salud'
  },
  {
    id: 6,
    codigo: 'GESTORA',
    nombre: 'Documento Gestora',
    descripcion: 'Registro en la Gestora Pública de la Seguridad Social a Largo Plazo',
    fojas: 1,
    estado: 'presente',
    observacion: 'Certificado de registro y estado de aportes'
  },
  {
    id: 7,
    codigo: 'MEMOS',
    nombre: 'Memorándums',
    descripcion: 'Comunicaciones oficiales, felicitaciones, rotaciones o llamadas de atención',
    fojas: 0,
    estado: 'pendiente',
    observacion: 'Sin llamadas de atención registradas'
  },
  {
    id: 8,
    codigo: 'INSTR',
    nombre: 'Instructivos',
    descripcion: 'Circulares internas, instructivos institucionales firmados',
    fojas: 0,
    estado: 'pendiente',
    observacion: ''
  },
  {
    id: 9,
    codigo: 'EVAL',
    nombre: 'Evaluaciones',
    descripcion: 'Evaluaciones periódicas de desempeño y cumplimiento de metas',
    fojas: 0,
    estado: 'pendiente',
    observacion: 'Pendiente de evaluación anual'
  },
  {
    id: 10,
    codigo: 'LIC_PERM',
    nombre: 'Licencias y Permisos',
    descripcion: 'Boletas de permiso particular, bajas médicas oficiales y licencias',
    fojas: 0,
    estado: 'pendiente',
    observacion: ''
  },
  {
    id: 11,
    codigo: 'VAC',
    nombre: 'Vacaciones',
    descripcion: 'Formularios oficiales de solicitud, cómputo y uso de vacaciones',
    fojas: 0,
    estado: 'pendiente',
    observacion: 'Sin solicitudes registradas en la gestión'
  },
  {
    id: 12,
    codigo: 'BOLETAS',
    nombre: 'Boletas de Pago',
    descripcion: 'Papeletas de pago de haberes mensuales debidamente firmadas',
    fojas: 6,
    estado: 'presente',
    observacion: 'Boletas de pago foliadas'
  },
  {
    id: 13,
    codigo: 'CONCL',
    nombre: 'Documento de Conclusión',
    descripcion: 'Finiquito visado por Ministerio de Trabajo, renuncia o memorándum de desvinculación',
    fojas: 0,
    estado: 'no_aplica',
    observacion: 'Personal en actividad continua (No aplica conclusión)'
  }
];

const STORAGE_PREFIX = 'docus_file_sections_';

/**
 * Obtiene las secciones de un empleado dado su ID.
 * Si ya fueron modificadas y guardadas en localStorage, se recuperan; de lo contrario se devuelven los valores por defecto.
 */
export function getEmpleadoSecciones(empleadoId) {
  if (!empleadoId) return JSON.parse(JSON.stringify(SECCIONES_FILE_DEFAULT));
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${empleadoId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 13) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error leyendo secciones del file desde localStorage:', e);
  }
  return JSON.parse(JSON.stringify(SECCIONES_FILE_DEFAULT));
}

/**
 * Guarda las secciones actualizadas de un empleado.
 */
export function saveEmpleadoSecciones(empleadoId, secciones) {
  if (!empleadoId || !Array.isArray(secciones)) return false;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${empleadoId}`, JSON.stringify(secciones));
    return true;
  } catch (e) {
    console.error('Error guardando secciones del file en localStorage:', e);
    return false;
  }
}

/**
 * Calcula métricas de auditoría del file (total fojas, porcentaje de completitud, secciones pendientes).
 */
export function calcularResumenFile(secciones) {
  if (!Array.isArray(secciones)) {
    return { totalFojas: 0, presentes: 0, pendientes: 0, noAplica: 0, porcentaje: 0, estadoGeneral: 'Pendiente' };
  }

  let totalFojas = 0;
  let presentes = 0;
  let pendientes = 0;
  let noAplica = 0;

  secciones.forEach(sec => {
    totalFojas += Number(sec.fojas || 0);
    if (sec.estado === 'presente') presentes++;
    else if (sec.estado === 'pendiente') pendientes++;
    else if (sec.estado === 'no_aplica') noAplica++;
  });

  const evaluables = 13 - noAplica;
  const porcentaje = evaluables > 0 ? Math.round((presentes / evaluables) * 100) : 100;

  let estadoGeneral = 'DOCUMENTACIÓN PENDIENTE';
  if (porcentaje === 100) estadoGeneral = 'LEGAJO COMPLETO & REGULARIZADO';
  else if (porcentaje >= 75) estadoGeneral = 'LEGAJO CON CONTROL PARCIAL';

  return {
    totalFojas,
    presentes,
    pendientes,
    noAplica,
    porcentaje,
    estadoGeneral
  };
}
