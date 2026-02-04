<template>
  <q-card flat bordered>
    <q-card-section class="bg-primary text-white">
      <div class="row items-center justify-between">
        <div class="text-h6">{{ mueble.nombre }}</div>
        <q-badge color="white" text-color="primary">{{ mueble.filas }} x {{ mueble.columnas }}</q-badge>
      </div>
    </q-card-section>

    <q-card-section>
      <div
        class="mueble-grid"
        :style="`grid-template-columns: repeat(${mueble.columnas}, 1fr);`"
      >
        <KardexDrawer
          v-for="cajon in mueble.cajones"
          :key="cajon.id"
          :cajon="cajon"
          :is-highlighted="highlightedCajones.has(cajon.id)"
          @open="$emit('open-drawer', cajon)"
          @drag-change="(evt, id) => $emit('drag-change', evt, id)"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import KardexDrawer from './KardexDrawer.vue';

defineProps({
  mueble: {
    type: Object,
    required: true
  },
  highlightedCajones: {
    type: Set,
    default: () => new Set()
  }
});

defineEmits(['open-drawer', 'drag-change']);
</script>

<style scoped>
.mueble-grid {
  display: grid;
  gap: 12px;
  background: linear-gradient(145deg, #455a64 0%, #37474f 50%, #263238 100%);
  padding: 20px;
  border-radius: 12px;
  box-shadow:
    inset 0 2px 4px rgba(255,255,255,0.1),
    inset 0 -4px 8px rgba(0,0,0,0.3),
    0 8px 24px rgba(0,0,0,0.4);
}
</style>
