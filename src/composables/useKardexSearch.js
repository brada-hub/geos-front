// Composable para manejar búsqueda y filtros
import { ref, computed } from 'vue';

export function useKardexSearch(muebles) {
  const searchQuery = ref('');

  // Función reactiva que depende de searchQuery
  const isEmpleadoMatched = (empleado) => {
    if (!searchQuery.value) return false;
    const q = searchQuery.value.toLowerCase().trim();
    if (!q) return false;

    const nombre = empleado.nombre_completo?.toLowerCase() || '';
    const codigo = empleado.codigo_archivo?.toLowerCase() || '';
    const numero = String(empleado.numero_unico || '').toLowerCase();

    return nombre.includes(q) || codigo.includes(q) || numero.includes(q);
  };

  // Lista de resultados con información del cajón - para navegación
  const searchResults = computed(() => {
    if (!searchQuery.value || !searchQuery.value.trim()) return [];
    const results = [];
    (muebles.value || []).forEach(mueble => {
      (mueble.cajones || []).forEach(cajon => {
        (cajon.empleados || []).forEach(empleado => {
          if (isEmpleadoMatched(empleado)) {
            results.push({
              empleado,
              cajon,
              mueble,
              // Info para mostrar
              ubicacion: `${mueble.nombre} → F${cajon.fila}-C${cajon.columna}`
            });
          }
        });
      });
    });
    return results;
  });

  // Computed para el conteo
  const resultCount = computed(() => searchResults.value.length);

  // Lista de cajones que tienen matches
  const highlightedCajones = computed(() => {
    const ids = new Set();
    searchResults.value.forEach(r => ids.add(r.cajon.id));
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
