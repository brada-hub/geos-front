<template>
  <div class="search-container">
    <q-input
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      outlined
      :placeholder="placeholder"
      clearable
      @focus="showResults = true"
      @blur="hideResultsDelayed"
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
      <template v-slot:append v-if="resultCount > 0">
        <q-badge color="primary">{{ resultCount }} encontrados</q-badge>
      </template>
    </q-input>

    <!-- RESULTADOS DROPDOWN -->
    <q-card
      v-if="showResults && searchResults.length > 0"
      class="search-results-dropdown"
    >
      <q-list separator>
        <q-item
          v-for="(result, index) in searchResults.slice(0, 10)"
          :key="index"
          clickable
          @click="selectResult(result)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="getEstadoColor(result.empleado.estado)"
              text-color="white"
              size="40px"
            >
              {{ result.empleado.numero_unico || result.empleado.id }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">
              {{ result.empleado.nombre_completo }}
            </q-item-label>
            <q-item-label caption>
              <q-icon name="folder" size="12px" class="q-mr-xs" />
              {{ result.ubicacion }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="arrow_forward" color="primary" />
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-section v-if="searchResults.length > 10" class="text-center text-grey-6 q-py-sm">
        ... y {{ searchResults.length - 10 }} más
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  modelValue: String,
  placeholder: {
    type: String,
    default: 'Buscar expediente por nombre o código...'
  },
  resultCount: {
    type: Number,
    default: 0
  },
  searchResults: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'select-result']);

const showResults = ref(false);

const hideResultsDelayed = () => {
  // Delay to allow click event to fire first
  setTimeout(() => {
    showResults.value = false;
  }, 200);
};

const selectResult = (result) => {
  showResults.value = false;
  emit('select-result', result);
};

const getEstadoColor = (estado) => {
  const colors = { 0: 'green', 1: 'red', 2: 'orange' };
  return colors[estado] ?? 'grey';
};
</script>

<style scoped>
.search-container {
  position: relative;
  margin-bottom: 16px;
}

.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 400px;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  border-radius: 8px;
  margin-top: 4px;
}
</style>
