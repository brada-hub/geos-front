<template>
  <div class="kardex-header column q-gutter-y-xs q-mb-md">
    <!-- FILA PRINCIPAL: TÍTULO Y ACCIONES COMPACTAS -->
    <div class="row items-center justify-between q-gutter-xs">
      <div class="row items-center q-gutter-sm">
        <div class="header-icon-badge flex flex-center gt-xs">
          <q-icon name="apartment" size="24px" color="white" />
        </div>
        <div>
          <div class="row items-center q-gutter-xs">
            <span class="text-h6 text-weight-bolder text-slate-900 header-title-responsive">
              Archivadores & Kardex
            </span>
            <q-badge color="blue-1" text-color="primary" class="text-weight-bold q-ml-xs header-tag gt-xs">
              Gemelo Digital
            </q-badge>
          </div>
          <div class="text-caption text-slate-500 gt-xs" style="font-size: 11.5px;">
            Control Físico y Normalizado de Expedientes de Personal • Modelo 3FN
          </div>
        </div>
      </div>

      <!-- ACCIONES EN DESKTOP / TABLET (gt-xs) -->
      <div class="gt-xs row q-gutter-sm items-center no-wrap">
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
          :dark="$q.dark.isActive"
          :bg-color="$q.dark.isActive ? 'dark' : 'white'"
          class="sede-select"
        >
          <template v-slot:prepend>
            <q-icon name="location_on" color="primary" size="18px" />
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

      <!-- ACCIONES COMPACTAS EN MÓVIL (lt-sm) -->
      <div class="lt-sm row items-center q-gutter-xs col-12 q-mt-xs">
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
          :dark="$q.dark.isActive"
          :bg-color="$q.dark.isActive ? 'dark' : 'white'"
          class="col"
        >
          <template v-slot:prepend>
            <q-icon name="location_on" color="primary" size="16px" />
          </template>
        </q-select>

        <!-- BOTÓN NUEVO DESPLEGABLE EN MÓVIL (AHORRA ESPACIO) -->
        <q-btn-dropdown
          unelevated
          color="primary"
          icon="add"
          label="Crear"
          dense
          class="action-btn-primary q-px-sm"
          auto-close
        >
          <q-list dense style="min-width: 190px;">
            <q-item clickable @click="$emit('add-mueble')">
              <q-item-section avatar>
                <q-icon name="apartment" size="18px" color="primary" />
              </q-item-section>
              <q-item-section class="text-weight-bold">Nuevo Archivador</q-item-section>
            </q-item>
            <q-item clickable @click="$emit('add-empleado')">
              <q-item-section avatar>
                <q-icon name="person_add" size="18px" color="primary" />
              </q-item-section>
              <q-item-section class="text-weight-bold">Nuevo Expediente</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <!-- BARRA DE FILTROS DINÁMICOS POR TIPO DE CONTRATO (HORIZONTAL SWIPE COMPACTO) -->
    <div class="filter-dock row items-center no-wrap q-py-xs q-px-sm">
      <div class="filter-scroll-row row items-center no-wrap scroll hide-scrollbar col q-gutter-xs">
        <span class="text-caption text-weight-bolder text-slate-700 gt-xs q-mr-xs row items-center">
          <q-icon name="tune" size="15px" color="primary" class="q-mr-xs" />
          Régimen:
        </span>

        <button
          class="filter-pill"
          :class="{ 'filter-pill-active': store.selectedContratoIds.length === 0 }"
          @click="clearContratoFilters"
        >
          Todos ({{ totalMueblesMostrados }})
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
            size="11px"
            class="q-ml-xs"
          />
        </button>
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
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
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
  background: #2563eb;
  color: white;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
}

.action-btn-primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
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
  border-radius: 12px;
  box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.filter-scroll-row {
  -webkit-overflow-scrolling: touch;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.header-title-responsive {
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

@media (min-width: 600px) {
  .header-title-responsive {
    font-size: 1.45rem;
  }
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
  background: #2563eb !important;
  color: #ffffff !important;
  border-color: #2563eb !important;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.contract-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.pill-indefinido .dot-indefinido { background: #2563eb; }
.pill-plazofijo .dot-plazofijo { background: #475569; }
.pill-prestacion .dot-prestacion { background: #64748b; }
.dot-default { background: #94a3b8; }

.filter-pill-active .contract-dot {
  background: #ffffff !important;
}
</style>
