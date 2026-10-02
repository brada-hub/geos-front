<template>
  <div class="kardex-header column q-gutter-y-md q-mb-lg">
    <!-- FILA PRINCIPAL: TÍTULO Y BOTONES DE ACCIÓN -->
    <div class="row items-center justify-between no-wrap q-gutter-md">
      <div class="row items-center q-gutter-md">
        <div class="header-icon-badge flex flex-center">
          <q-icon name="apartment" size="26px" color="white" />
        </div>
        <div>
          <div class="row items-center q-gutter-xs">
            <span class="text-h5 text-weight-bolder text-slate-900" style="letter-spacing: -0.02em;">
              Gestión de Archivadores & Kardex
            </span>
            <q-badge color="indigo-1" text-color="indigo-9" class="text-weight-bold q-ml-xs header-tag">
              Gemelo Digital
            </q-badge>
          </div>
          <div class="text-caption text-slate-500 q-mt-xs">
            Control Físico y Normalizado de Expedientes de Personal • Modelo 3FN
          </div>
        </div>
      </div>

      <div class="row q-gutter-sm items-center no-wrap">
        <!-- SELECTOR DE SEDE -->
        <q-select
          v-if="store.sedes.length > 0"
          v-model="store.selectedSedeId"
          :options="sedesOptions"
          option-value="id"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          options-dense
          bg-color="white"
          class="sede-select"
        >
          <template v-slot:prepend>
            <q-icon name="location_on" color="indigo" size="18px" />
          </template>
        </q-select>

        <q-btn
          unelevated
          icon="add"
          label="Nuevo Archivador"
          class="action-btn-primary"
          @click="$emit('add-mueble')"
        />
        <q-btn
          unelevated
          icon="person_add"
          label="Nuevo Expediente"
          class="action-btn-secondary"
          @click="$emit('add-empleado')"
        />
      </div>
    </div>

    <!-- BARRA DE FILTROS DINÁMICOS POR TIPO DE CONTRATO (3FN) -->
    <div class="filter-dock row items-center justify-between q-py-sm q-px-md">
      <div class="row items-center q-gutter-xs">
        <span class="text-caption text-weight-bolder text-slate-700 q-mr-sm row items-center">
          <q-icon name="tune" size="16px" color="indigo" class="q-mr-xs" />
          Régimen Contractual:
        </span>

        <button
          class="filter-pill"
          :class="{ 'filter-pill-active': store.selectedContratoIds.length === 0 }"
          @click="clearContratoFilters"
        >
          Todos (Mezcla Libre)
        </button>

        <button
          v-for="contrato in store.tiposContrato"
          :key="contrato.id"
          class="filter-pill"
          :class="[
            getContratoPillClass(contrato.nombre),
            { 'filter-pill-active': store.selectedContratoIds.includes(contrato.id) }
          ]"
          @click="toggleContratoFilter(contrato.id)"
        >
          <span class="contract-dot" :class="getContratoDotClass(contrato.nombre)"></span>
          {{ contrato.nombre }}
          <q-icon
            v-if="store.selectedContratoIds.includes(contrato.id)"
            name="check"
            size="12px"
            class="q-ml-xs"
          />
        </button>
      </div>

      <div class="text-caption text-slate-500 row items-center q-gutter-xs">
        <q-icon name="inventory_2" size="14px" color="slate-400" />
        <span><b>{{ totalMueblesMostrados }}</b> archivador(es) visible(s)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useGeosStore } from 'src/stores/geosStore';

const store = useGeosStore();

defineEmits(['add-mueble', 'add-empleado']);

const sedesOptions = computed(() => {
  const all = [{ id: null, label: 'Todas las Sedes' }];
  const list = (store.sedes || []).map(s => ({
    id: s.id,
    label: `${s.nombre} (${s.muebles_count || 0} archivadores)`
  }));
  return [...all, ...list];
});

const totalMueblesMostrados = computed(() => {
  return store.filteredMuebles.length;
});

const toggleContratoFilter = (id) => {
  const index = store.selectedContratoIds.indexOf(id);
  if (index > -1) {
    store.selectedContratoIds.splice(index, 1);
  } else {
    store.selectedContratoIds.push(id);
  }
};

const clearContratoFilters = () => {
  store.selectedContratoIds = [];
};

const getContratoPillClass = (nombre) => {
  const n = (nombre || '').toLowerCase();
  if (n.includes('indefinido')) return 'pill-indefinido';
  if (n.includes('plazo')) return 'pill-plazofijo';
  if (n.includes('prestaci')) return 'pill-prestacion';
  return 'pill-default';
};

const getContratoDotClass = (nombre) => {
  const n = (nombre || '').toLowerCase();
  if (n.includes('indefinido')) return 'dot-indefinido';
  if (n.includes('plazo')) return 'dot-plazofijo';
  if (n.includes('prestaci')) return 'dot-prestacion';
  return 'dot-default';
};

onMounted(() => {
  store.fetchCatalogos();
});
</script>

<style scoped>
.header-icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}

.text-slate-900 { color: #0f172a; }
.text-slate-700 { color: #334155; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }

.header-tag {
  border-radius: 6px;
  font-size: 11px;
  padding: 3px 8px;
}

.sede-select {
  min-width: 220px;
}

.action-btn-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  transition: all 0.2s ease;
}

.action-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
}

.action-btn-secondary {
  background: #0f172a;
  color: #f8fafc;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.action-btn-secondary:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

.filter-dock {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.05);
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-pill:hover {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.filter-pill-active {
  background: #4f46e5 !important;
  color: #ffffff !important;
  border-color: #4f46e5 !important;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
}

.contract-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.pill-indefinido .dot-indefinido { background: #3b82f6; }
.pill-plazofijo .dot-plazofijo { background: #f59e0b; }
.pill-prestacion .dot-prestacion { background: #8b5cf6; }
.dot-default { background: #64748b; }

.filter-pill-active .contract-dot {
  background: #ffffff !important;
}
</style>
