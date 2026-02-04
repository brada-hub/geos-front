<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" position="bottom" seamless>
    <q-card
      class="gaveta-modal-card"
      :class="{ 'modal-dragging': isDragging }"
      style="width: 100%; max-height: 60vh;"
    >
      <q-card-section class="bg-primary text-white">
        <div class="row items-center justify-between">
          <div>
            <div class="text-overline">Gaveta</div>
            <div class="text-h4 text-weight-bold">F{{ drawer?.fila }} - C{{ drawer?.columna }}</div>
          </div>
          <q-btn icon="close" flat round size="lg" @click="$emit('update:modelValue', false)" />
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg" style="overflow-y: auto;">
        <!-- ETIQUETA CON BOTÓN GUARDAR -->
        <div class="row q-col-gutter-sm q-mb-lg" v-if="drawer">
          <div class="col">
            <q-input
              v-model="localEtiqueta"
              outlined
              dense
              label="Etiqueta de la gaveta"
              placeholder="Ej: CARRERA MEDICINA"
            >
              <template v-slot:prepend>
                <q-icon name="label" color="primary" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn color="primary" icon="save" label="Guardar" @click="saveEtiqueta" />
          </div>
        </div>

        <div class="text-h6 text-grey-8 q-mb-md">
          Expedientes ({{ empleadosCount }})
        </div>

        <!-- LISTA VERTICAL TIPO CARPETAS -->
        <draggable
          v-if="drawer"
          v-model="localEmpleados"
          group="expedientes"
          item-key="id"
          class="carpetas-container"
          @change="handleChange"
          @start="$emit('drag-start')"
          @end="$emit('drag-end')"
        >
          <template #item="{ element }">
            <KardexFolder
              :ref="el => { if (el && element.id === highlightedKardexId) scrollToElement(el.$el) }"
              :kardex="element"
              :is-matched="isEmpleadoMatchedLocal(element)"
              :is-highlighted="element.id === highlightedKardexId"
              @click="$emit('open-kardex', element)"
            />
          </template>
        </draggable>

        <div v-if="empleadosCount === 0" class="text-center q-pa-xl text-grey-5">
          <q-icon name="inbox" size="64px" />
          <div class="q-mt-md text-h6">Gaveta vacía</div>
          <div class="text-caption">Arrastra expedientes aquí para agregarlos</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';
import draggable from 'vuedraggable';
import KardexFolder from './KardexFolder.vue';

const $q = useQuasar();
const store = useGeosStore();

const props = defineProps({
  modelValue: Boolean,
  drawer: Object,
  isDragging: Boolean,
  searchQuery: {
    type: String,
    default: ''
  },
  highlightedKardexId: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits([
  'update:modelValue',
  'drag-change',
  'drag-start',
  'drag-end',
  'open-kardex'
]);

const localEtiqueta = ref('');

watch(() => props.drawer, (newDrawer) => {
  if (newDrawer) {
    localEtiqueta.value = newDrawer.etiqueta || '';
  }
}, { immediate: true });

// Scroll to highlighted element
const scrollToElement = (el) => {
  if (el) {
    nextTick(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
};

// Read-only computed - draggable handles the sync via events
const localEmpleados = computed({
  get: () => props.drawer?.empleados || [],
  set: () => {
    // Mutations are handled by drag-change event
  }
});

const empleadosCount = computed(() => (props.drawer?.empleados || []).length);

// Local search function
const isEmpleadoMatchedLocal = (empleado) => {
  if (!props.searchQuery || !props.searchQuery.trim()) return false;
  const q = props.searchQuery.toLowerCase().trim();
  const nombre = empleado.nombre_completo?.toLowerCase() || '';
  const codigo = empleado.codigo_archivo?.toLowerCase() || '';
  const numero = String(empleado.numero_unico || '').toLowerCase();
  return nombre.includes(q) || codigo.includes(q) || numero.includes(q);
};

const saveEtiqueta = async () => {
  if (props.drawer) {
    await store.updateCajon(props.drawer.id, { etiqueta: localEtiqueta.value });
    await store.fetchMuebles();
    $q.notify({ type: 'positive', message: 'Etiqueta guardada' });
  }
};

const handleChange = (evt) => {
  emit('drag-change', evt, props.drawer?.id);
};
</script>

<style scoped>
.gaveta-modal-card {
  background: #f5f5f5;
  transition: all 0.3s ease;
}

.modal-dragging {
  opacity: 0.3;
  transform: translateY(80%);
  pointer-events: none;
}

.carpetas-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
</style>
