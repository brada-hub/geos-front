<template>
  <div
    class="carpeta-item cursor-move"
    :class="{
      'carpeta-matched': isMatched,
      'carpeta-highlighted': isHighlighted
    }"
    @click="$emit('click')"
  >
    <div class="carpeta-tab" :class="estadoClass">
      {{ kardex.numero_unico || kardex.id }}
    </div>
    <div class="carpeta-body">
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-subtitle2 text-weight-bold text-grey-9 ellipsis">
            {{ kardex.nombre_completo }}
          </div>
          <div class="text-caption text-grey-6">{{ kardex.codigo_archivo }}</div>
        </div>
        <q-chip
          :color="estadoColor"
          text-color="white"
          size="sm"
          dense
        >
          {{ estadoLabel }}
        </q-chip>
        <q-icon name="drag_indicator" color="grey-4" size="20px" class="q-ml-sm" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  kardex: {
    type: Object,
    required: true
  },
  isMatched: {
    type: Boolean,
    default: false
  },
  isHighlighted: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click']);

// Estados numéricos: 0 = Presente, 1 = Ausente, 2 = Prestado
const estadoColors = {
  0: 'green',
  1: 'red',
  2: 'orange'
};

const estadoLabels = {
  0: 'PRESENTE',
  1: 'AUSENTE',
  2: 'PRESTADO'
};

const estadoClasses = {
  0: 'estado-presente',
  1: 'estado-ausente',
  2: 'estado-prestado'
};

const estadoColor = computed(() => estadoColors[props.kardex.estado] ?? 'grey');
const estadoLabel = computed(() => estadoLabels[props.kardex.estado] ?? 'N/A');
const estadoClass = computed(() => estadoClasses[props.kardex.estado] ?? 'estado-presente');
</script>

<style scoped>
.carpeta-item {
  display: flex;
  align-items: stretch;
  background: #f5e6c8;
  border-radius: 0 8px 8px 0;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  margin-left: 40px;
  position: relative;
}

.carpeta-item:hover {
  transform: translateX(-5px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.2);
}

.carpeta-matched {
  background: #e3f2fd;
  box-shadow: 0 0 0 2px #2196f3;
}

/* HIGHLIGHTED - Efecto de pulso para llamar la atención */
.carpeta-highlighted {
  background: #fff9c4;
  box-shadow: 0 0 0 3px #ffc107, 0 0 20px rgba(255, 193, 7, 0.5);
  animation: pulse-highlight 1s ease-in-out infinite;
  transform: translateX(-10px);
}

@keyframes pulse-highlight {
  0%, 100% {
    box-shadow: 0 0 0 3px #ffc107, 0 0 20px rgba(255, 193, 7, 0.5);
  }
  50% {
    box-shadow: 0 0 0 5px #ffb300, 0 0 30px rgba(255, 193, 7, 0.8);
  }
}

.carpeta-tab {
  position: absolute;
  left: -40px;
  top: 0;
  width: 40px;
  height: 100%;
  background: #4caf50;
  color: white;
  font-size: 14px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px 0 0 8px;
  box-shadow: inset -2px 0 4px rgba(0,0,0,0.1);
}

.carpeta-body {
  flex: 1;
  padding: 12px 16px;
  background: linear-gradient(180deg, #fffdf5 0%, #f5e6c8 100%);
  border-left: 3px solid rgba(0,0,0,0.1);
}

.estado-presente { background: #4caf50 !important; }
.estado-ausente { background: #f44336 !important; }
.estado-prestado { background: #ff9800 !important; }
</style>
