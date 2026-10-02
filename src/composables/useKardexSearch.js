// Composable para manejar búsqueda y filtros
import { ref, computed } from 'vue';

export function useKardexSearch(muebles, sinAsignar = null) {
  const searchQuery = ref('');

  // Función reactiva que depende de searchQuery
  const isEmpleadoMatched = (empleado) => {
    if (!searchQuery.value) return false;
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return false;

    const nombre = (empleado.nombre_completo || '').toLowerCase();
    const pAp = (empleado.primer_apellido || '').toLowerCase();
    const sAp = (empleado.segundo_apellido || '').toLowerCase();
    const nom = (empleado.nombres || '').toLowerCase();
    const codigo = (empleado.codigo_archivo || '').toLowerCase();
    const numero = String(empleado.numero_unico || '').toLowerCase();
    const doc = String(empleado.documento_identidad || '').toLowerCase();
    const cargo = String(empleado.cargo || '').toLowerCase();
    const contrato = String(empleado.tipo_contrato?.nombre || '').toLowerCase();
    const sede = String(empleado.sede?.nombre || '').toLowerCase();

    return nombre.includes(q) ||
      pAp.includes(q) ||
      sAp.includes(q) ||
      nom.includes(q) ||
      codigo.includes(q) ||
      numero.includes(q) ||
      doc.includes(q) ||
      cargo.includes(q) ||
      contrato.includes(q) ||
      sede.includes(q);
  };

  // Lista de resultados con información detallada de gaveta, fila y mueble
  const searchResults = computed(() => {
    if (!searchQuery.value || !searchQuery.value.trim()) return [];
    const results = [];

    // 1. Buscar en archivadores físicos
    (muebles.value || []).forEach(mueble => {
      (mueble.cajones || []).forEach(cajon => {
        (cajon.empleados || []).forEach(empleado => {
          if (isEmpleadoMatched(empleado)) {
            const gavetaNum = mueble.columnas > 1
              ? `Gaveta ${cajon.fila} (Fila ${cajon.fila}, Col ${String.fromCharCode(64 + cajon.columna)})`
              : `Gaveta ${cajon.fila} (Fila ${cajon.fila})`;

            results.push({
              empleado,
              cajon,
              mueble,
              muebleNombre: mueble.nombre,
              gavetaNumero: gavetaNum,
              gavetaEtiqueta: cajon.etiqueta ? cajon.etiqueta.trim() : null,
              fila: cajon.fila,
              columna: cajon.columna,
              isVirtual: false,
              ubicacion: `${mueble.nombre} • ${gavetaNum}${cajon.etiqueta ? ` - "${cajon.etiqueta}"` : ''}`
            });
          }
        });
      });
    });

    // 2. Buscar en Gaveta Virtual si está disponible
    const virtualList = typeof sinAsignar === 'function' ? sinAsignar() : (sinAsignar?.value || []);
    (virtualList || []).forEach(empleado => {
      if (isEmpleadoMatched(empleado)) {
        results.push({
          empleado,
          cajon: null,
          mueble: null,
          muebleNombre: 'Gaveta Virtual',
          gavetaNumero: 'Bandeja de Entrada',
          gavetaEtiqueta: 'Sin archivar físicamente',
          fila: null,
          columna: null,
          isVirtual: true,
          ubicacion: 'Gaveta Virtual (Sin asignar a archivador físico)'
        });
      }
    });

    return results;
  });

  // Computed para el conteo
  const resultCount = computed(() => searchResults.value.length);

  // Lista de cajones que tienen matches
  const highlightedCajones = computed(() => {
    const ids = new Set();
    searchResults.value.forEach(r => {
      if (r.cajon && r.cajon.id) {
        ids.add(r.cajon.id);
      }
    });
    return ids;
  });

  return {
    searchQuery,
    isEmpleadoMatched,
    searchResults,
    resultCount,
    highlightedCajones
  };
}
