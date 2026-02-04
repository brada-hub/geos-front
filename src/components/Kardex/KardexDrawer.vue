<template>
  <draggable
    v-model="localEmpleados"
    group="expedientes"
    item-key="id"
    class="cajon-cell"
    :class="{ 'cajon-highlighted': isHighlighted }"
    @change="handleChange"
    @click="$emit('open')"
  >
    <template #item="{ element }">
      <div class="hidden">{{ element.nombre_completo }}</div>
    </template>

    <template #header>
      <div class="cajon-content">
        <div class="text-caption text-white text-weight-bold">F{{ cajon.fila }}-C{{ cajon.columna }}</div>
        <div v-if="cajon.etiqueta" class="cajon-etiqueta">{{ cajon.etiqueta }}</div>
        <q-badge
          :color="empleadosCount > 0 ? 'light-blue' : 'grey-6'"
          text-color="white"
          class="q-mt-xs"
        >
          {{ empleadosCount }} archivo(s)
        </q-badge>
      </div>
    </template>
  </draggable>
</template>

<script setup>
import { computed } from 'vue';
import draggable from 'vuedraggable';

const props = defineProps({
  cajon: {
    type: Object,
    required: true
  },
  isHighlighted: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['open', 'drag-change', 'update:empleados']);

// Use getter only - mutations go through events
const localEmpleados = computed({
  get: () => props.cajon.empleados || [],
  set: (val) => {
    emit('update:empleados', val);
  }
});

const empleadosCount = computed(() => (props.cajon.empleados || []).length);

const handleChange = (evt) => {
  emit('drag-change', evt, props.cajon.id);
};
</script>

<style scoped>
.cajon-cell {
  background: linear-gradient(180deg, #90a4ae 0%, #78909c 30%, #607d8b 70%, #546e7a 100%);
  border: none;
  border-radius: 6px;
  padding: 0;
  min-height: 100px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  transform-style: preserve-3d;
  transform: perspective(500px) rotateX(2deg);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,0.3),
    inset 0 -3px 0 #455a64,
    inset 3px 0 0 rgba(255,255,255,0.1),
    inset -3px 0 0 rgba(0,0,0,0.1),
    0 6px 0 #37474f,
    0 8px 16px rgba(0,0,0,0.5);
}

.cajon-cell::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.1) 100%);
  border-radius: 6px;
  pointer-events: none;
}

.cajon-cell::after {
  content: '';
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 60px; height: 12px;
  background: linear-gradient(180deg, #cfd8dc 0%, #b0bec5 40%, #90a4ae 100%);
  border-radius: 3px;
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.2), 0 3px 6px rgba(0,0,0,0.4);
}

.cajon-cell:hover {
  transform: perspective(500px) rotateX(2deg) translateY(-4px) translateZ(10px);
  box-shadow:
    inset 0 2px 0 rgba(255,255,255,0.3),
    inset 0 -3px 0 #455a64,
    0 12px 0 #37474f,
    0 16px 32px rgba(0,0,0,0.6);
}

.cajon-highlighted {
  background: linear-gradient(180deg, #64b5f6 0%, #42a5f5 30%, #2196f3 70%, #1e88e5 100%);
}

.cajon-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  text-align: center;
  height: 100%;
  padding: 8px;
  padding-top: 45px;
  color: white;
  position: relative;
  z-index: 1;
}

.cajon-etiqueta {
  max-width: 95%;
  min-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #ffeb3b;
  color: #000 !important;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  margin-top: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  border: 2px solid #fbc02d;
}

.hidden { display: none; }
</style>
