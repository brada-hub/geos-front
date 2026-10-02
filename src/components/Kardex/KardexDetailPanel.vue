<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="jump-down"
    transition-hide="jump-up"
    backdrop-filter="blur(4px)"
  >
    <q-card
      class="gaveta-modal-card column no-wrap shadow-12"
      :class="{ 'modal-dragging': isDragging }"
    >
      <!-- HEADER CON INFORMACIÓN Y BOTÓN DE CONFIGURACIÓN -->
      <q-card-section class="detail-header q-py-sm q-px-md border-bottom">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-sm ellipsis">
            <div class="detail-icon-badge flex flex-center">
              <q-icon name="inbox" size="20px" color="indigo" />
            </div>
            <div class="ellipsis">
              <div class="row items-center q-gutter-xs no-wrap">
                <span class="text-subtitle1 text-weight-bolder text-slate-900">{{ drawerTitle }}</span>
                <span v-if="currentDrawer?.etiqueta" class="text-subtitle2 text-indigo-7 text-weight-bold ellipsis">
                  • "{{ currentDrawer.etiqueta }}"
                </span>
                <q-badge color="indigo-1" text-color="indigo-9" class="text-weight-bold q-ml-xs">
                  {{ sortedEmpleados.length }} expedientes
                </q-badge>
              </div>
              <!-- BADGES INFORMATIVOS DE REGLAS DE LA GAVETA -->
              <div class="row items-center q-gutter-xs q-mt-xs no-wrap ellipsis">
                <q-badge v-if="sedesRestringidas.length > 0" class="badge-rule-sede">
                  🏢 {{ sedesRestringidas.map(s => s.nombre).join(' + ') }}
                </q-badge>
                <q-badge v-if="contratosRestringidos.length > 0" class="badge-rule-contrato">
                  🔒 {{ contratosRestringidos.map(c => c.codigo || c.nombre).join(' + ') }}
                </q-badge>
                <q-badge v-if="currentDrawer?.apellido_desde || currentDrawer?.apellido_hasta" class="badge-rule-rango">
                  🔤 [{{ currentDrawer.apellido_desde || 'A' }} - {{ currentDrawer.apellido_hasta || 'Z' }}]
                </q-badge>
              </div>
            </div>
          </div>

          <!-- BOTONES DE ACCIÓN: CONFIGURAR Y CERRAR -->
          <div class="row items-center q-gutter-xs no-wrap">
            <q-btn
              unelevated
              color="amber-5"
              text-color="dark"
              icon="tune"
              label="Configurar Gaveta"
              class="text-weight-bolder btn-config"
              size="sm"
              @click="$emit('configure', currentDrawer)"
            >
              <q-tooltip>Abrir configuración de reglas, sedes y rango de apellidos</q-tooltip>
            </q-btn>
            <q-btn icon="close" flat round dense color="slate-600" @click="$emit('update:modelValue', false)">
              <q-tooltip>Cerrar ventana</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <!-- BARRA DE BÚSQUEDA Y ACCIONES DENTRO DE LA GAVETA -->
      <div class="q-px-md q-py-xs bg-slate-50 row items-center justify-between border-bottom">
        <div class="text-caption text-slate-700 row items-center q-gutter-xs">
          <q-icon name="sort_by_alpha" color="indigo" size="16px" />
          <span>Ordenados alfabéticamente: <b>Primer Apellido, Segundo Apellido, Nombres</b></span>
        </div>

        <div class="row items-center q-gutter-sm">
          <q-input
            v-model="filterExpedientes"
            outlined
            dense
            clearable
            placeholder="Buscar en esta gaveta..."
            class="bg-white search-in-drawer-input"
            style="width: 240px; font-size: 12px;"
          >
            <template v-slot:prepend>
              <q-icon name="search" size="16px" />
            </template>
          </q-input>
        </div>
      </div>

      <!-- CONTENIDO PRINCIPAL: SOLO EXPEDIENTES (ÚNICA ÁREA CON SCROLL) -->
      <q-card-section class="col q-pa-md expedientes-scroll-area">
        <!-- LISTA VERTICAL DE CARPETAS CON DRAG & DROP -->
        <draggable
          v-if="currentDrawer"
          v-model="draggableEmpleados"
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

        <div v-if="sortedEmpleados.length === 0" class="text-center q-pa-xl text-grey-5 column items-center">
          <q-icon name="folder_open" size="64px" />
          <div class="q-mt-sm text-subtitle1 font-weight-bold">Gaveta vacía</div>
          <div class="text-caption text-grey-6">
            Arrastra expedientes aquí o presiona "Configurar Gaveta" para auto-sincronizar.
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useGeosStore } from 'src/stores/geosStore';
import draggable from 'vuedraggable';
import KardexFolder from './KardexFolder.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  drawer: {
    type: Object,
    default: null
  },
  isDragging: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  },
  highlightedKardexId: {
    type: Number,
    default: null
  }
});

const emit = defineEmits([
  'update:modelValue',
  'drag-change',
  'drag-start',
  'drag-end',
  'open-kardex',
  'configure'
]);

const store = useGeosStore();
const filterExpedientes = ref('');

const currentDrawer = computed(() => {
  if (!props.drawer) return null;
  for (const m of store.muebles) {
    const found = (m.cajones || []).find(c => c.id === props.drawer.id);
    if (found) return found;
  }
  return props.drawer;
});

const drawerTitle = computed(() => {
  if (!currentDrawer.value) return '';
  return currentDrawer.value.columna === 1
    ? `Gaveta ${currentDrawer.value.fila}`
    : `Col ${String.fromCharCode(64 + currentDrawer.value.columna)} - Gaveta ${currentDrawer.value.fila}`;
});

const sedesRestringidas = computed(() => currentDrawer.value?.sedes_permitidas || []);
const contratosRestringidos = computed(() => currentDrawer.value?.tipos_contrato_permitidos || []);

// Lista ordenada estrictamente por Primer Apellido, Segundo Apellido y Nombres
const sortedEmpleados = computed(() => {
  let list = [...(currentDrawer.value?.empleados || [])];

  list.sort((a, b) => {
    const apA = (a.primer_apellido || '').trim().toLowerCase();
    const apB = (b.primer_apellido || '').trim().toLowerCase();
    if (apA !== apB) {
      return apA.localeCompare(apB, 'es', { sensitivity: 'base' });
    }

    const sApA = (a.segundo_apellido || '').trim().toLowerCase();
    const sApB = (b.segundo_apellido || '').trim().toLowerCase();
    if (sApA !== sApB) {
      return sApA.localeCompare(sApB, 'es', { sensitivity: 'base' });
    }

    const nomA = (a.nombres || a.nombre_completo || '').trim().toLowerCase();
    const nomB = (b.nombres || b.nombre_completo || '').trim().toLowerCase();
    return nomA.localeCompare(nomB, 'es', { sensitivity: 'base' });
  });

  if (filterExpedientes.value && filterExpedientes.value.trim()) {
    const q = filterExpedientes.value.toLowerCase().trim();
    list = list.filter(e => {
      const nombre = (e.nombre_completo || '').toLowerCase();
      const pAp = (e.primer_apellido || '').toLowerCase();
      const sAp = (e.segundo_apellido || '').toLowerCase();
      const nom = (e.nombres || '').toLowerCase();
      const ci = (e.documento_identidad || '').toLowerCase();
      const cod = (e.codigo_archivo || '').toLowerCase();
      return nombre.includes(q) || pAp.includes(q) || sAp.includes(q) || nom.includes(q) || ci.includes(q) || cod.includes(q);
    });
  }

  return list;
});

// vuedraggable computed
const draggableEmpleados = computed({
  get: () => sortedEmpleados.value,
  set: () => {
    // handled by drag-change event
  }
});

const handleChange = (evt) => {
  if (currentDrawer.value) {
    emit('drag-change', evt, currentDrawer.value.id);
  }
};

const isEmpleadoMatchedLocal = (empleado) => {
  if (!props.searchQuery || !props.searchQuery.trim()) return false;
  const q = props.searchQuery.toLowerCase().trim();
  const nombre = empleado.nombre_completo?.toLowerCase() || '';
  const codigo = empleado.codigo_archivo?.toLowerCase() || '';
  const numero = String(empleado.numero_unico || '').toLowerCase();
  return nombre.includes(q) || codigo.includes(q) || numero.includes(q);
};

const scrollToElement = (el) => {
  if (el) {
    nextTick(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
};
</script>

<style scoped>
.gaveta-modal-card {
  width: 820px;
  max-width: 95vw;
  height: 82vh;
  max-height: 800px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  background: #ffffff;
}

.detail-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
}

.btn-config {
  border-radius: 8px;
}

.badge-rule-sede {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
  font-size: 10px;
}

.badge-rule-contrato {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  font-size: 10px;
}

.badge-rule-rango {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  font-size: 10px;
}

.modal-dragging {
  opacity: 0.95;
}

.border-bottom {
  border-bottom: 1px solid #e2e8f0;
}

.expedientes-scroll-area {
  overflow-y: auto;
  background: #f8fafc;
}

.carpetas-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
  min-height: 120px;
}
</style>
