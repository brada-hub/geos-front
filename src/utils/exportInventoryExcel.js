import * as XLSX from 'xlsx';

/**
 * Exporta el inventario general de expedientes físicos y virtuales a un archivo Excel (.xlsx)
 * @param {Array} empleadosList - Lista completa de empleados obtenida de store.allEmpleadosWithLocation
 * @param {Array} mueblesList - Lista de muebles de store.muebles
 * @param {Array} sedesList - Lista de sedes
 */
export function exportInventoryExcel(empleadosList = [], mueblesList = [], sedesList = []) {
  // 1. Hoja 1: Inventario General Detallado
  const dataGeneral = empleadosList.map((emp, index) => {
    return {
      'N°': index + 1,
      'N° Único': emp.numero_unico || '',
      'Código Archivo': emp.codigo_archivo || '',
      'Primer Apellido': emp.primer_apellido || '',
      'Segundo Apellido': emp.segundo_apellido || '',
      'Nombres': emp.nombres || '',
      'Documento de Identidad': emp.documento_identidad || '',
      'Fecha Nacimiento': emp.fecha_nacimiento || '',
      'Sexo': emp.sexo || (emp.sexo_relacion?.nombre || ''),
      'Cargo': emp.cargo || (emp.cargo_relacion?.nombre || ''),
      'Tipo Contrato': emp.tipo_contrato?.nombre || '',
      'Sede': emp.sede?.nombre || '',
      'Ubicación Archivística': emp.ubicacion_texto || (emp.isVirtual ? 'Gaveta Virtual' : 'Archivador'),
      'Archivador': emp.mueble_nombre || (emp.isVirtual ? 'Gaveta Virtual' : ''),
      'Gaveta (Fila)': emp.fila ? `Fila ${emp.fila}` : '',
      'Columna': emp.columna ? String.fromCharCode(64 + emp.columna) : '',
      'Etiqueta Gaveta': emp.cajon_etiqueta || '',
      'Estado Físico': emp.isVirtual ? 'EN GAVETA VIRTUAL' : 'ARCHIVADO FÍSICAMENTE'
    };
  });

  const wsGeneral = XLSX.utils.json_to_sheet(dataGeneral);

  // Ajustar anchos automáticos de columnas para Hoja 1
  const colWidths = [
    { wch: 6 },  // N°
    { wch: 10 }, // N° Único
    { wch: 18 }, // Código Archivo
    { wch: 18 }, // Primer Apellido
    { wch: 18 }, // Segundo Apellido
    { wch: 20 }, // Nombres
    { wch: 18 }, // CI
    { wch: 14 }, // Fecha Nacimiento
    { wch: 8 },  // Sexo
    { wch: 22 }, // Cargo
    { wch: 22 }, // Tipo Contrato
    { wch: 18 }, // Sede
    { wch: 38 }, // Ubicación Archivística
    { wch: 20 }, // Archivador
    { wch: 14 }, // Fila
    { wch: 10 }, // Columna
    { wch: 20 }, // Etiqueta Gaveta
    { wch: 24 }, // Estado Físico
  ];
  wsGeneral['!cols'] = colWidths;

  // 2. Hoja 2: Resumen por Archivadores y Sedes
  const dataResumen = (mueblesList || []).map((m, idx) => {
    const sedeObj = (sedesList || []).find(s => s.id === m.sede_id);
    const totalExp = (m.cajones || []).reduce((acc, c) => acc + (c.empleados?.length || 0), 0);
    return {
      'N°': idx + 1,
      'Archivador': m.nombre,
      'Sede': sedeObj ? sedeObj.nombre : 'No asignada',
      'Columnas': m.columnas || 1,
      'Total Gavetas': m.cajones?.length || 0,
      'Expedientes Físicos': totalExp,
      'Promedio Exp/Gaveta': (m.cajones?.length > 0) ? (totalExp / m.cajones.length).toFixed(1) : 0
    };
  });

  const wsResumen = XLSX.utils.json_to_sheet(dataResumen);
  wsResumen['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
  ];

  // Crear Workbook y agregar hojas
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsGeneral, 'Inventario General');
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Archivadores');

  // Generar fecha actual para el nombre del archivo
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `Inventario_Expedientes_DOCUS_RRHH_${fecha}.xlsx`;

  // Descargar archivo
  XLSX.writeFile(wb, fileName);
}
