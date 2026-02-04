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
      const success = await store.updateEmpleadoUbicacion(empleado.id, newCajonId);
      if (success) {
        $q.notify({
          type: 'positive',
          message: `#${empleado.numero_unico || empleado.id} reubicado`,
          position: 'top-right'
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
