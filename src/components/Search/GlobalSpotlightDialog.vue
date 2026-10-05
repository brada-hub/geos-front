<template>
  <q-dialog
    v-model="isOpen"
    position="top"
    class="spotlight-dialog-wrapper"
    transition-show="jump-down"
    transition-hide="jump-up"
  >
    <q-card class="spotlight-card shadow-24">
      <!-- CABECERA DEL BUSCADOR SPOTLIGHT -->
      <div class="spotlight-search-header row items-center q-px-md q-py-sm">
        <q-icon name="search" size="22px" color="primary" class="q-mr-sm" />
        <input
          ref="searchInputRef"
          v-model="query"
          type="text"
          class="spotlight-input col"
          placeholder="Buscar por apellido, nombre, CI, cargo, sede, expediente..."
          @keydown.down.prevent="navigateResults(1)"
          @keydown.up.prevent="navigateResults(-1)"
          @keydown.enter.prevent="selectCurrentResult"
          @keydown.esc="close"
        />
        <div class="row items-center q-gutter-xs">
          <q-btn
            v-if="query"
            flat
            round
            dense
            size="xs"
            icon="close"
            color="grey-6"
            @click="query = ''"
          />
          <span class="spotlight-badge-kbd gt-xs">ESC</span>
        </div>
      </div>

      <q-separator style="background: #e2e8f0;" />

      <!-- BARRA DE FILTROS RÁPIDOS / METADATA -->
      <div class="spotlight-toolbar row items-center justify-between q-px-md q-py-xs bg-slate-50">
        <div class="row items-center q-gutter-xs">
          <span class="text-caption text-slate-500 font-weight-medium" style="font-size: 11px;">
            {{ filteredResults.length }} expedientes encontrados
          </span>
          <span v-if="query" class="text-caption text-primary" style="font-size: 11px;">
            para "{{ query }}"
          </span>
        </div>
        <div class="row items-center q-gutter-xs gt-xs">
          <span class="text-caption text-slate-400" style="font-size: 10px;">Navegar:</span>
          <span class="spotlight-mini-kbd">↑</span>
          <span class="spotlight-mini-kbd">↓</span>
          <span class="text-caption text-slate-400 q-ml-xs" style="font-size: 10px;">Seleccionar:</span>
          <span class="spotlight-mini-kbd">ENTER</span>
        </div>
      </div>

      <!-- LISTA DE RESULTADOS -->
      <q-scroll-area class="spotlight-results-scroll" style="height: 380px;">
        <div v-if="filteredResults.length > 0" class="q-py-xs">
          <div
            v-for="(item, index) in filteredResults"
            :key="item.id || index"
            class="spotlight-item q-px-md q-py-sm cursor-pointer row items-center justify-between"
            :class="{ 'spotlight-item-selected': index === selectedIndex }"
            @mouseenter="selectedIndex = index"
            @click="onSelect(item)"
          >
            <!-- INFORMACIÓN PRINCIPAL -->
            <div class="col ellipsis q-pr-sm">
              <div class="row items-center q-gutter-xs q-mb-xs">
                <!-- NÚMERO / CÓDIGO -->
                <span class="spotlight-code-badge">
                  {{ item.codigo_archivo || `EXP-${item.numero_unico || item.id}` }}
                </span>
                <!-- NOMBRE COMPLETO -->
                <span class="text-weight-bold text-slate-900 spotlight-name-text ellipsis">
                  {{ item.primer_apellido }} {{ item.segundo_apellido || '' }} {{ item.nombres }}
                </span>
                <!-- BADGE CI -->
                <span class="spotlight-ci-pill">
                  CI: {{ item.documento_identidad }}
                </span>
              </div>

              <!-- CARGO, SEDE Y CONTRATO -->
              <div class="row items-center q-gutter-xs text-caption text-slate-600 ellipsis">
                <span v-if="item.cargo" class="text-weight-medium">
                  {{ item.cargo }}
                </span>
                <span v-if="item.cargo" class="text-slate-300">•</span>
                <span v-if="item.sede?.nombre" class="text-slate-900 text-weight-bold">
                  {{ item.sede.nombre }}
                </span>
                <span v-if="item.tipo_contrato?.nombre" class="text-slate-300">•</span>
                <span v-if="item.tipo_contrato?.nombre" class="text-slate-700">
                  {{ item.tipo_contrato.nombre }}
                </span>
              </div>
            </div>

            <!-- UBICACIÓN ARCHIVÍSTICA (FÍSICA O VIRTUAL) -->
            <div class="column items-end no-wrap">
              <div
                class="spotlight-location-badge row items-center q-gutter-xs"
                :class="item.isVirtual ? 'location-virtual' : 'location-physical'"
              >
                <q-icon :name="item.isVirtual ? 'inbox' : 'inventory_2'" size="13px" />
                <span class="ellipsis" style="max-width: 220px;">
                  {{ item.isVirtual ? 'Gaveta Virtual' : `${item.mueble_nombre} • Gav. ${item.fila}` }}
                </span>
              </div>
              <span v-if="!item.isVirtual && item.cajon_etiqueta" class="text-caption text-slate-400" style="font-size: 10px;">
                "{{ item.cajon_etiqueta }}"
              </span>
              <span v-else-if="item.isVirtual" class="text-caption text-slate-500" style="font-size: 10px; font-weight: 600;">
                Bandeja de Entrada
              </span>
            </div>
          </div>
        </div>

        <!-- ESTADO VACÍO (SIN RESULTADOS) -->
        <div v-else class="flex flex-center column q-pa-xl text-center">
          <q-icon name="manage_search" size="48px" color="slate-300" />
          <div class="text-subtitle2 text-slate-700 q-mt-sm">
            {{ query ? 'No se encontraron expedientes coincidentes' : 'Comienza a escribir para buscar' }}
          </div>
          <div class="text-caption text-slate-400">
            Puedes buscar por apellido, cédula de identidad, cargo o sede.
          </div>
        </div>
      </q-scroll-area>

      <!-- FOOTER DEL MODAL -->
      <div class="spotlight-footer row items-center justify-between q-px-md q-py-sm bg-slate-100 border-top">
        <div class="row items-center q-gutter-xs text-caption text-slate-500" style="font-size: 11px;">
          <q-icon name="my_location" size="14px" color="primary" />
          <span>Al seleccionar, el sistema hará foco y parpadeará el archivador exacto.</span>
        </div>
        <q-btn flat dense no-caps size="sm" label="Cerrar" color="grey-7" @click="close" />
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useGeosStore } from 'src/stores/geosStore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'locate']);

const store = useGeosStore();
const router = useRouter();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const query = ref('');
const selectedIndex = ref(0);
const searchInputRef = ref(null);

// Resetear y enfocar al abrir
watch(isOpen, async (val) => {
  if (val) {
    query.value = '';
    selectedIndex.value = 0;
    await nextTick();
    if (searchInputRef.value) {
      searchInputRef.value.focus();
    }
  }
});

// Lista filtrada reactiva
const filteredResults = computed(() => {
  const all = store.allEmpleadosWithLocation || [];
  if (!query.value || !query.value.trim()) {
    // Si no hay query, mostrar los primeros 25 registros
    return all.slice(0, 25);
  }

  const q = query.value.toLowerCase().trim();

  return all.filter((emp) => {
    const nombre = (emp.nombre_completo || '').toLowerCase();
    const pAp = (emp.primer_apellido || '').toLowerCase();
    const sAp = (emp.segundo_apellido || '').toLowerCase();
    const nom = (emp.nombres || '').toLowerCase();
    const doc = String(emp.documento_identidad || '').toLowerCase();
    const codigo = (emp.codigo_archivo || '').toLowerCase();
    const num = String(emp.numero_unico || '').toLowerCase();
    const cargo = (emp.cargo || '').toLowerCase();
    const sede = (emp.sede?.nombre || '').toLowerCase();
    const contrato = (emp.tipo_contrato?.nombre || '').toLowerCase();
    const mueble = (emp.mueble_nombre || '').toLowerCase();

    return (
      nombre.includes(q) ||
      pAp.includes(q) ||
      sAp.includes(q) ||
      nom.includes(q) ||
      doc.includes(q) ||
      codigo.includes(q) ||
      num.includes(q) ||
      cargo.includes(q) ||
      sede.includes(q) ||
      contrato.includes(q) ||
      mueble.includes(q)
    );
  }).slice(0, 40); // Limitar a 40 para máximo rendimiento
});

watch(filteredResults, () => {
  selectedIndex.value = 0;
});

const navigateResults = (step) => {
  if (filteredResults.value.length === 0) return;
  const next = selectedIndex.value + step;
  if (next < 0) {
    selectedIndex.value = filteredResults.value.length - 1;
  } else if (next >= filteredResults.value.length) {
    selectedIndex.value = 0;
  } else {
    selectedIndex.value = next;
  }
};

const selectCurrentResult = () => {
  if (filteredResults.value.length > 0 && filteredResults.value[selectedIndex.value]) {
    onSelect(filteredResults.value[selectedIndex.value]);
  }
};

const onSelect = (item) => {
  close();

  // Configurar el objetivo de localización en el store
  store.locateEmpleado({
    muebleId: item.mueble_id,
    cajonId: item.cajon_id,
    empleadoId: item.id,
    isVirtual: item.isVirtual,
    nombre: item.nombre_completo || `${item.primer_apellido} ${item.nombres}`
  });

  // Redirigir a la vista de archivadores si no estamos ahí
  if (router.currentRoute.value.path !== '/kardex') {
    router.push('/kardex');
  }

  emit('locate', item);
};

const close = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.spotlight-dialog-wrapper :deep(.q-dialog__inner) {
  padding-top: 60px;
}

.spotlight-card {
  width: 680px;
  max-width: 95vw;
  border-radius: 16px;
  background: #ffffff;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
  border: 1px solid rgba(226, 232, 240, 0.9);
}

.spotlight-search-header {
  background: #ffffff;
  height: 56px;
}

.spotlight-input {
  border: none;
  outline: none;
  font-size: 15px;
  color: #0f172a;
  font-weight: 500;
  background: transparent;
}

.spotlight-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.spotlight-badge-kbd {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
}

.spotlight-mini-kbd {
  background: #e2e8f0;
  color: #475569;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}

.spotlight-item {
  transition: all 0.15s ease;
  border-left: 3px solid transparent;
}

.spotlight-item:hover,
.spotlight-item-selected {
  background: #f8fafc;
  border-left-color: #2563eb;
}

.spotlight-code-badge {
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 10.5px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #bfdbfe;
  font-family: monospace;
}

.spotlight-name-text {
  font-size: 13.5px;
}

.spotlight-ci-pill {
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
}

.spotlight-location-badge {
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
}

.location-physical {
  background: #eff6ff;
  color: #1e40af;
  border: 1px solid #dbeafe;
}

.location-virtual {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}
</style>
