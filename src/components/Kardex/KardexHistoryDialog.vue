<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div class="row items-center no-wrap">
            <div class="kardex-numero-big q-mr-md">{{ kardex?.numero_unico || kardex?.id }}</div>
            <div>
              <div class="text-h5 text-weight-bold">{{ kardex?.nombre_completo }}</div>
              <div class="text-caption">{{ kardex?.codigo_archivo }}</div>
            </div>
          </div>
          <q-btn icon="close" flat round @click="$emit('update:modelValue', false)" />
        </div>
      </q-card-section>

      <q-card-section>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-6">
            <q-select
              v-model="localEstado"
              :options="estadoOptions"
              emit-value
              map-options
              outlined
              label="Estado actual"
            />
          </div>
          <div class="col-6">
            <q-input v-model="comentario" outlined label="Agregar comentario" />
          </div>
        </div>

        <q-btn
          color="primary"
          label="Registrar Movimiento"
          @click="registrarMovimiento"
          :loading="loading"
          class="q-mb-lg"
        />

        <q-separator class="q-my-md" />

        <div class="text-h6 q-mb-md">Historial de Movimientos</div>

        <q-timeline color="primary">
          <q-timeline-entry
            v-for="mov in historial"
            :key="mov.id"
            :subtitle="formatDate(mov.created_at)"
          >
            <template v-slot:title>
              <span v-if="mov.estado_nuevo !== null">Estado: {{ getEstadoLabel(mov.estado_anterior) }} → {{ getEstadoLabel(mov.estado_nuevo) }}</span>
              <span v-else>Movimiento registrado</span>
            </template>
            <div v-if="mov.comentario" class="text-grey-7">{{ mov.comentario }}</div>
            <div v-if="mov.cajon_destino_id" class="text-caption text-grey-5">
              Movido a gaveta ID: {{ mov.cajon_destino_id }}
            </div>
          </q-timeline-entry>
        </q-timeline>

        <div v-if="historial.length === 0" class="text-center q-pa-md text-grey-5">
          Sin historial de movimientos
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import { useGeosStore } from 'src/stores/geosStore';

const $q = useQuasar();
const store = useGeosStore();

const props = defineProps({
  modelValue: Boolean,
  kardex: Object
});

defineEmits(['update:modelValue']);

// Estados: 0 = Presente, 1 = Ausente, 2 = Prestado
const estadoOptions = [
  { label: 'Presente', value: 0 },
  { label: 'Ausente', value: 1 },
  { label: 'Prestado', value: 2 },
];

const estadoLabels = { 0: 'Presente', 1: 'Ausente', 2: 'Prestado' };

const localEstado = ref(0);
const comentario = ref('');
const historial = ref([]);
const loading = ref(false);

watch(() => props.kardex, async (newKardex) => {
  if (newKardex) {
    localEstado.value = newKardex.estado || 'presente';
    comentario.value = '';
    await loadHistorial();
  }
}, { immediate: true });

const loadHistorial = async () => {
  if (!props.kardex?.id) return;
  try {
    const response = await api.get(`/empleados/${props.kardex.id}/movimientos`);
    historial.value = response.data;
  } catch {
    historial.value = [];
  }
};

const registrarMovimiento = async () => {
  if (!props.kardex) return;
  loading.value = true;
  try {
    await api.post(`/empleados/${props.kardex.id}/movimientos`, {
      comentario: comentario.value,
      estado_nuevo: localEstado.value,
    });
    comentario.value = '';
    await loadHistorial();
    await store.fetchMuebles();
    $q.notify({ type: 'positive', message: 'Movimiento registrado' });
  } catch {
    $q.notify({ type: 'negative', message: 'Error al registrar' });
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('es-ES');
};

const getEstadoLabel = (estado) => {
  return estadoLabels[estado] ?? 'N/A';
};
</script>

<style scoped>
.kardex-numero-big {
  font-size: 32px;
  font-weight: 900;
  background: rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 12px;
}
</style>
