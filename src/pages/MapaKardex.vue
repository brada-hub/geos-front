<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- HEADER -->
    <KardexHeader
      @add-mueble="muebleDialog = true"
      @add-empleado="empleadoDialog = true"
    />

    <!-- BUSCADOR -->
    <KardexSearchBar
      v-model="searchQuery"
      :result-count="resultCount"
      :search-results="searchResults"
      @select-result="navigateToResult"
    />

    <!-- LOADING -->
    <div v-if="loading && muebles.length === 0" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="48px" />
    </div>

    <!-- MUEBLES -->
    <div v-else class="row q-col-gutter-lg">
      <div v-for="mueble in muebles" :key="mueble.id" class="col-12">
        <KardexMueble
          :mueble="mueble"
          :highlighted-cajones="highlightedCajones"
          @open-drawer="openDrawer"
          @drag-change="onDragChange"
        />
      </div>
    </div>

    <!-- PANEL DE DETALLE DE GAVETA -->
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
    />

    <!-- HISTORIAL DE KARDEX -->
    <KardexHistoryDialog
      v-model="kardexDialog"
      :kardex="selectedKardex"
    />

    <!-- DIALOGS DE CREACIÓN -->
    <NewMuebleDialog v-model="muebleDialog" />
    <NewEmpleadoDialog v-model="empleadoDialog" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useGeosStore } from 'src/stores/geosStore';

// Composables
import { useKardexDrag } from 'src/composables/useKardexDrag';
import { useKardexSearch } from 'src/composables/useKardexSearch';

// Components
import KardexHeader from 'src/components/Kardex/KardexHeader.vue';
import KardexSearchBar from 'src/components/Kardex/KardexSearchBar.vue';
import KardexMueble from 'src/components/Kardex/KardexMueble.vue';
import KardexDetailPanel from 'src/components/Kardex/KardexDetailPanel.vue';
import KardexHistoryDialog from 'src/components/Kardex/KardexHistoryDialog.vue';
import NewMuebleDialog from 'src/components/Kardex/NewMuebleDialog.vue';
import NewEmpleadoDialog from 'src/components/Kardex/NewEmpleadoDialog.vue';

// Store
const store = useGeosStore();
const muebles = computed(() => store.muebles);
const loading = computed(() => store.loading);

// Composables
const { isDragging, onDragStart, onDragEnd, onDragChange } = useKardexDrag();
const { searchQuery, searchResults, highlightedCajones, resultCount } = useKardexSearch(muebles);

// State for dialogs/panels
const muebleDialog = ref(false);
const empleadoDialog = ref(false);
const drawerPanelOpen = ref(false);
const kardexDialog = ref(false);

const selectedDrawer = ref(null);
const selectedKardex = ref(null);
const highlightedKardexId = ref(null);

// Actions
const openDrawer = (cajon) => {
  selectedDrawer.value = cajon;
  highlightedKardexId.value = null;
  drawerPanelOpen.value = true;
};

const openKardex = (kardex) => {
  selectedKardex.value = kardex;
  kardexDialog.value = true;
};

// Navegar al resultado de búsqueda
const navigateToResult = (result) => {
  // Abrir la gaveta del resultado
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

// Lifecycle
onMounted(() => {
  store.fetchMuebles();
});
</script>
