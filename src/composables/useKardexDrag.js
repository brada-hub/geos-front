// Composable para manejar la lógica de drag & drop
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';

export function useKardexDrag() {
  const $q = useQuasar();
  const store = useGeosStore();
  const isDragging = ref(false);

  const onDragStart = () => {
    isDragging.value = true;
  };

  const onDragEnd = () => {
    isDragging.value = false;
  };

  const onDragChange = async (evt, newCajonId) => {
    if (evt.added) {
      const empleado = evt.added.element;
      const res = await store.updateEmpleadoUbicacion(empleado.id, newCajonId);
      if (res && res.success) {
        $q.notify({
          type: 'positive',
          icon: 'check_circle',
          message: `#${empleado.numero_unico || empleado.id} reubicado exitosamente`,
          position: 'top-right'
        });
      } else {
        $q.notify({
          type: 'negative',
          icon: 'block',
          message: res?.message || 'No se puede mover el expediente a esta gaveta por reglas de admisión',
          position: 'top-right',
          timeout: 4500
        });
      }
    }
  };

  return {
    isDragging,
    onDragStart,
    onDragEnd,
    onDragChange
  };
}
