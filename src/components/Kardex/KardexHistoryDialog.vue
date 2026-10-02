<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
    <q-card style="min-width: 500px; max-width: 700px">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap">
            <div class="kardex-numero-big q-mr-md">{{ kardex?.numero_unico || kardex?.id }}</div>
            <div>
              <div class="text-h5 text-weight-bold">{{ kardex?.nombre_completo }}</div>
              <div class="row items-center q-gutter-x-sm text-caption q-mt-xs">
                <span><strong>Código:</strong> {{ kardex?.codigo_archivo }}</span>
                <span v-if="kardex?.documento_identidad">• <strong>CI:</strong> {{ kardex?.documento_identidad }}</span>
                <span v-if="kardex?.cargo">• <strong>Cargo:</strong> {{ kardex?.cargo }}</span>
              </div>
              <div class="row items-center q-gutter-x-sm q-mt-xs">
                <q-badge
                  v-if="kardex?.tipo_contrato"
                  :color="kardex.tipo_contrato.color || 'indigo-9'"
                  text-color="white"
                  class="text-weight-bold"
                >
                  {{ kardex.tipo_contrato.nombre }}
                </q-badge>
                <span v-if="kardex?.fecha_nacimiento" class="text-caption text-blue-grey-1">
                  Nacimiento: {{ kardex?.fecha_nacimiento }}
                </span>
                <span v-if="kardex?.sexo || kardex?.sexo_id" class="text-caption text-blue-grey-1">
                  Sexo: {{ (typeof kardex?.sexo === 'object' ? kardex?.sexo?.nombre : null) || (kardex?.sexo === 'M' || kardex?.sexo_id === 1 ? 'Masculino' : 'Femenino') }}
                </span>
              </div>
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
            :icon="getMovIcon(mov)"
            :color="getMovColor(mov)"
            :subtitle="formatDate(mov.created_at)"
          >
            <template v-slot:title>
              <div class="row items-center q-gutter-xs">
                <span class="text-weight-bold">{{ getMovTitle(mov) }}</span>
              </div>
            </template>

            <div v-if="mov.comentario" class="text-body2 text-grey-8 q-my-xs">
              {{ mov.comentario }}
            </div>

            <!-- DETALLES DE UBICACIÓN ORIGEN / DESTINO -->
            <div v-if="mov.tipo_movimiento === 'ubicacion' && (mov.cajon_origen || mov.cajon_destino)" class="q-mt-xs bg-grey-2 q-pa-xs rounded-borders text-caption text-grey-8">
              <span v-if="mov.cajon_origen">
                <strong>Origen:</strong> Gaveta F{{ mov.cajon_origen.fila }}-C{{ mov.cajon_origen.columna }} ({{ mov.cajon_origen.mueble?.nombre || 'Archivador' }})
              </span>
              <span v-if="mov.cajon_origen && mov.cajon_destino"> ➔ </span>
              <span v-if="mov.cajon_destino">
                <strong>Destino:</strong> Gaveta F{{ mov.cajon_destino.fila }}-C{{ mov.cajon_destino.columna }} ({{ mov.cajon_destino.mueble?.nombre || 'Archivador' }})
              </span>
            </div>

            <!-- DETALLES DE CONTRATO ANTERIOR / NUEVO -->
            <div v-if="mov.tipo_movimiento === 'contrato' && (mov.tipo_contrato_anterior || mov.tipo_contrato_nuevo)" class="q-mt-xs text-caption">
              <q-badge color="grey-6" text-color="white" class="q-mr-xs">
                {{ mov.tipo_contrato_anterior?.nombre || 'Sin contrato previo' }}
              </q-badge>
              <span>➔</span>
              <q-badge :color="mov.tipo_contrato_nuevo?.color || 'primary'" text-color="white" class="q-ml-xs">
                {{ mov.tipo_contrato_nuevo?.nombre || 'Nuevo contrato' }}
              </q-badge>
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

const getMovIcon = (mov) => {
  switch (mov.tipo_movimiento) {
    case 'contrato': return 'work_history';
    case 'cargo': return 'badge';
    case 'ubicacion': return 'drive_file_move';
    case 'estado': return 'swap_horiz';
    default: return 'event';
  }
};

const getMovColor = (mov) => {
  switch (mov.tipo_movimiento) {
    case 'contrato': return 'purple-8';
    case 'cargo': return 'teal-8';
    case 'ubicacion': return 'indigo-8';
    case 'estado': return 'blue-8';
    default: return 'primary';
  }
};

const getMovTitle = (mov) => {
  if (mov.tipo_movimiento === 'contrato') {
    return 'Transición de Régimen Contractual';
  }
  if (mov.tipo_movimiento === 'cargo') {
    return 'Ascenso o Modificación de Cargo';
  }
  if (mov.tipo_movimiento === 'ubicacion') {
    return 'Reubicación de Expediente entre Gavetas';
  }
  if (mov.estado_nuevo !== null && mov.estado_nuevo !== undefined) {
    return `Estado: ${getEstadoLabel(mov.estado_anterior)} → ${getEstadoLabel(mov.estado_nuevo)}`;
  }
  return 'Movimiento registrado';
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
