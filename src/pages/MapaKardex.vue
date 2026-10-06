<template>
  <q-page class="kardex-page-canvas q-pa-sm q-pa-sm-md q-pa-md-lg">
    <!-- HEADER COMPACTO Y RESPONSIVO -->
    <KardexHeader
      @add-mueble="muebleDialog = true"
      @add-empleado="empleadoDialog = true"
    />

    <!-- NAVEGACIÓN ENTRE APARTADOS PRINCIPALES (AMIGABLE Y OPTIMIZADO) -->
    <div class="row items-center justify-between q-mb-md view-tabs-bar q-col-gutter-xs">
      <div class="view-segmented-pills row items-center q-gutter-none">
        <button
          class="view-pill-btn"
          :class="{ 'view-pill-btn-active': activeViewTab === 'muebles' }"
          @click="activeViewTab = 'muebles'"
        >
          <q-icon name="dashboard" size="15px" class="q-mr-xs" />
          <span>Archivadores Físicos</span>
          <span class="view-pill-count">{{ muebles.length }}</span>
        </button>

        <button
          class="view-pill-btn"
          :class="{ 'view-pill-btn-active': activeViewTab === 'virtual' }"
          @click="activeViewTab = 'virtual'"
        >
          <q-icon name="cloud_queue" size="15px" class="q-mr-xs" />
          <span>Gaveta Virtual</span>
          <span
            class="view-pill-count"
            :class="store.expedientesSinAsignar?.length > 0 ? 'view-pill-count-alert' : ''"
          >
            {{ store.expedientesSinAsignar?.length || 0 }}
          </span>
        </button>
      </div>

      <!-- BUSCADOR RÁPIDO INTEGRADO CUANDO SE ESTÁ EN ARCHIVADORES FÍSICOS -->
      <div class="col-12 col-sm-auto q-mt-xs q-mt-sm-none" v-if="activeViewTab === 'muebles'" style="min-width: 250px;">
        <KardexSearchBar
          v-model="searchQuery"
          :result-count="resultCount"
          :search-results="searchResults"
          @select-result="navigateToResult"
        />
      </div>
    </div>

    <!-- ZONA DE SEPARACIÓN FLOTANTE (NO MUEVE EL LAYOUT NI INTERRUMPE EL ARRASTRE) -->
    <transition name="fade">
      <div
        v-if="store.dragContext?.type === 'columna'"
        class="fixed-bottom row justify-center q-pb-xl z-top no-pointer-events"
      >
        <div
          class="separation-dock q-pa-md text-center cursor-pointer all-pointer-events shadow-10"
          :class="{ 'dropzone-active': isDropZoneActive }"
          @dragenter.prevent="isDropZoneActive = true"
          @dragover.prevent="isDropZoneActive = true"
          @dragleave="isDropZoneActive = false"
          @drop="onDropSeparateColumn"
        >
          <div class="row items-center q-gutter-sm justify-center">
            <q-icon name="call_split" size="28px" :color="isDropZoneActive ? 'positive' : 'white'" />
            <div class="text-subtitle1 text-weight-bolder text-white">
              {{ isDropZoneActive ? '¡Suelta aquí para separar!' : 'Suelta aquí abajo para separar la columna como nuevo archivador' }}
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- LOADING -->
    <div v-if="loading && muebles.length === 0" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- APARTADO 1: GAVETA VIRTUAL (CUANDO SE SELECCIONA O SI SE ARRASTRA) -->
    <div v-show="activeViewTab === 'virtual' || isDragging" class="q-mb-md">
      <GavetaVirtualDock
        @drag-start="onDragStart"
        @drag-end="onDragEnd"
        @open-kardex="openKardex"
      />
    </div>

    <!-- APARTADO 2: MAPA DE ARCHIVADORES FÍSICOS -->
    <div v-show="activeViewTab === 'muebles'">

    <!-- MUEBLES CON DRAG & DROP -->
    <draggable
      v-if="muebles.length > 0"
      v-model="mueblesList"
      item-key="id"
      handle=".drag-handle"
      :filter="'.col-header-box, button, input, .no-sort'"
      :prevent-on-filter="false"
      animation="250"
      ghost-class="mueble-ghost"
      class="row q-col-gutter-md items-stretch"
    >
      <template #item="{ element: mueble }">
        <div
          :class="mueble.columnas > 2 ? 'col-12 col-md-6' : 'col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2'"
        >
          <KardexMueble
            :mueble="mueble"
            :highlighted-cajones="highlightedCajones"
            :targeted-cajon-id="targetedCajonId"
            @open-drawer="openDrawer"
            @configure-drawer="openDrawerConfig"
            @drag-change="onDragChange"
          />
        </div>
      </template>
    </draggable>

    <!-- EMPTY STATE -->
    <div v-else class="flex flex-center column q-pa-xl text-center">
      <q-icon name="inventory_2" size="72px" color="grey-5" />
      <div class="text-h6 text-grey-7 q-mt-md">No hay archivadores registrados</div>
      <div class="text-caption text-grey-6 q-mb-md">Comienza agregando tu primera torre de gavetas.</div>
      <q-btn
        color="primary"
        icon="add"
        label="Crear Archivador"
        unelevated
        @click="muebleDialog = true"
      />
    </div>
  </div>

    <!-- PANEL DE DETALLE DE GAVETA (SOLO EXPEDIENTES) -->
    <KardexDetailPanel
      v-model="drawerPanelOpen"
      :drawer="selectedDrawer"
      :is-dragging="isDragging"
      :search-query="searchQuery"
      :highlighted-kardex-id="highlightedKardexId"
      @drag-change="onDragChange"
      @drag-start="onDragStart"
      @drag-end="onDragEnd"
      @open-kardex="openKardex"
      @open-file="openVisorLibroDirecto"
      @configure="openDrawerConfig"
    />

    <!-- MODAL DE CONFIGURACIÓN DE GAVETA (REGLAS, SEDES, RANGOS APELLIDOS) -->
    <KardexDrawerConfigDialog
      v-model="configDialogOpen"
      :cajon="selectedConfigDrawer"
    />

    <!-- HISTORIAL DE KARDEX -->
    <KardexHistoryDialog
      v-model="kardexDialog"
      :kardex="selectedKardex"
    />

    <!-- VISOR DIRECTO DE LIBRO PDF -->
    <VisorLibroPdfDialog
      v-model="visorLibroOpen"
      :empleado="selectedVisorEmpleado"
    />

    <!-- DIALOGS DE CREACIÓN -->
    <NewMuebleDialog v-model="muebleDialog" />
    <NewEmpleadoDialog v-model="empleadoDialog" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';
import draggable from 'vuedraggable';

// Composables
import { useKardexDrag } from 'src/composables/useKardexDrag';
import { useKardexSearch } from 'src/composables/useKardexSearch';

// Components
import KardexHeader from 'src/components/Kardex/KardexHeader.vue';
import KardexSearchBar from 'src/components/Kardex/KardexSearchBar.vue';
import KardexMueble from 'src/components/Kardex/KardexMueble.vue';
import KardexDetailPanel from 'src/components/Kardex/KardexDetailPanel.vue';
import KardexDrawerConfigDialog from 'src/components/Kardex/KardexDrawerConfigDialog.vue';
import KardexHistoryDialog from 'src/components/Kardex/KardexHistoryDialog.vue';
import VisorLibroPdfDialog from 'src/components/Kardex/VisorLibroPdfDialog.vue';
import NewMuebleDialog from 'src/components/Kardex/NewMuebleDialog.vue';
import NewEmpleadoDialog from 'src/components/Kardex/NewEmpleadoDialog.vue';
import GavetaVirtualDock from 'src/components/Kardex/GavetaVirtualDock.vue';

// Quasar & Store
const $q = useQuasar();
const store = useGeosStore();
const muebles = computed(() => store.filteredMuebles);
const mueblesList = computed({
  get: () => store.filteredMuebles,
  set: (val) => {
    store.muebles = val;
  }
});
const loading = computed(() => store.loading);

// Composables
const { isDragging, onDragStart, onDragEnd, onDragChange } = useKardexDrag();
const { searchQuery, searchResults, highlightedCajones, resultCount } = useKardexSearch(
  muebles,
  () => store.expedientesSinAsignar
);

// State for dialogs/panels
const activeViewTab = ref('muebles');
const muebleDialog = ref(false);
const empleadoDialog = ref(false);
const drawerPanelOpen = ref(false);
const configDialogOpen = ref(false);
const kardexDialog = ref(false);
const visorLibroOpen = ref(false);
const selectedVisorEmpleado = ref(null);

const selectedDrawer = ref(null);
const selectedConfigDrawer = ref(null);
const selectedKardex = ref(null);
const highlightedKardexId = ref(null);

// Actions
const openVisorLibroDirecto = (empleado) => {
  selectedVisorEmpleado.value = empleado;
  visorLibroOpen.value = true;
};

const openDrawer = (cajon) => {
  selectedDrawer.value = cajon;
  highlightedKardexId.value = null;
  drawerPanelOpen.value = true;
};

const openDrawerConfig = (cajon) => {
  selectedConfigDrawer.value = cajon;
  configDialogOpen.value = true;
};

const openKardex = (kardex) => {
  selectedKardex.value = kardex;
  kardexDialog.value = true;
};

// Navegar al resultado de búsqueda
const navigateToResult = (result) => {
  if (result.isVirtual) {
    activeViewTab.value = 'virtual';
    openKardex(result.empleado);
    return;
  }

  activeViewTab.value = 'muebles';
  // Abrir la gaveta física del resultado
  selectedDrawer.value = result.cajon;
  // Marcar el kardex específico para resaltarlo
  highlightedKardexId.value = result.empleado.id;
  // Abrir el panel
  drawerPanelOpen.value = true;

  // Limpiar el highlight después de unos segundos
  setTimeout(() => {
    highlightedKardexId.value = null;
  }, 3000);
};

// Drag & Drop para separar columna al soltar en el tablero
const isDropZoneActive = ref(false);

const onDropSeparateColumn = async (evt) => {
  isDropZoneActive.value = false;
  const ctx = store.dragContext;
  if (ctx && ctx.type === 'columna') {
    evt.preventDefault();
    const ok = await store.extraerColumna(ctx.muebleId, { columna: ctx.columna });
    if (ok) {
      $q.notify({
        type: 'positive',
        icon: 'call_split',
        message: '¡Columna separada en su propio archivador independiente!'
      });
    }
    store.clearDragContext();
  }
};

// Localizador Visual Spotlight (Ctrl + K)
const targetedCajonId = ref(null);

const handleSpotlightLocator = async (target) => {
  if (!target) return;

  if (target.isVirtual) {
    activeViewTab.value = 'virtual';
    await nextTick();
    const dockEl = document.querySelector('.dock-wrapper') || document.querySelector('.gaveta-dock');
    if (dockEl) {
      dockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const emp = (store.expedientesSinAsignar || []).find((e) => e.id === target.empleadoId);
    if (emp) {
      openKardex(emp);
    }
    return;
  }

  activeViewTab.value = 'muebles';
  if (target.cajonId) {
    targetedCajonId.value = target.cajonId;

    // Buscar el cajon en los muebles para abrirlo
    let targetCajon = null;
    for (const m of store.muebles || []) {
      const found = (m.cajones || []).find((c) => c.id === target.cajonId);
      if (found) {
        targetCajon = found;
        break;
      }
    }

    await nextTick();
    const cellEl = document.getElementById(`cajon-cell-${target.cajonId}`);
    if (cellEl) {
      cellEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    $q.notify({
      type: 'info',
      icon: 'my_location',
      color: 'primary',
      textColor: 'white',
      position: 'top',
      message: `¡Localizado! Expediente de ${target.nombre || 'Personal'} en la gaveta señalada.`,
      timeout: 4500
    });

    // Abrir automáticamente el panel lateral de la gaveta tras 1.2s
    setTimeout(() => {
      if (targetCajon) {
        selectedDrawer.value = targetCajon;
        highlightedKardexId.value = target.empleadoId;
        drawerPanelOpen.value = true;
      }
    }, 1200);

    // Desactivar el pulso visual después de 6 segundos
    setTimeout(() => {
      targetedCajonId.value = null;
      store.clearLocatorTarget();
    }, 6000);
  }
};

watch(
  () => store.locatorTarget,
  (target) => {
    if (!target) return;
    handleSpotlightLocator(target);
  },
  { deep: true, immediate: true }
);

// Lifecycle
onMounted(() => {
  store.fetchCatalogos();
  store.fetchMuebles();
});
</script>

<style scoped>
.kardex-page-canvas {
  background: radial-gradient(circle at top right, #ffffff 0%, #f8fafc 45%, #f1f5f9 100%);
  min-height: 100vh;
  overflow-x: hidden;
  max-width: 100%;
  box-sizing: border-box;
}

.mueble-ghost {
  opacity: 0.35 !important;
  transform: scale(0.97);
  box-shadow: 0 0 0 2px #2563eb, 0 16px 32px rgba(37, 99, 235, 0.25) !important;
  border-radius: 16px;
}

.separation-dock {
  background: linear-gradient(135deg, #1e40af 0%, #1e293b 100%);
  border: 2px dashed rgba(255, 255, 255, 0.85);
  border-radius: 16px;
  min-width: 440px;
  transition: all 0.25s ease;
  user-select: none;
  box-shadow: 0 20px 30px -10px rgba(37, 99, 235, 0.35);
}

.dropzone-active {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important;
  border-color: #93c5fd !important;
  transform: scale(1.05);
  box-shadow: 0 20px 35px -5px rgba(37, 99, 235, 0.45) !important;
}

/* SWITCHER DE APARTADOS (AMIGABLE Y MODERNO) */
.view-tabs-bar {
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
}

.view-segmented-pills {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 3px;
  border-radius: 12px;
  display: inline-flex;
}

.view-pill-btn {
  border: none;
  background: transparent;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  border-radius: 9px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.view-pill-btn:hover {
  color: #0f172a;
}

.view-pill-btn-active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.view-pill-count {
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  margin-left: 5px;
}

.view-pill-btn-active .view-pill-count {
  background: #eff6ff;
  color: #2563eb;
}

.view-pill-count-alert {
  background: #dc2626 !important;
  color: #ffffff !important;
}
</style>
