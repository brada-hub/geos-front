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
      <div class="row items-center justify-between no-wrap">
        <div class="col ellipsis q-pr-sm">
          <div class="text-subtitle2 text-weight-bolder text-grey-9 ellipsis">
            {{ nombreOrdenado }}
          </div>
          <div class="row items-center q-gutter-x-xs text-caption text-grey-7 q-mt-xs">
            <span class="text-weight-medium">{{ kardex.codigo_archivo }}</span>
            <span v-if="kardex.documento_identidad" class="text-grey-6">• CI: {{ kardex.documento_identidad }}</span>
            <span v-if="kardex.cargo" class="text-primary text-weight-medium ellipsis">• {{ kardex.cargo }}</span>
          </div>
        </div>

        <div class="column items-end q-gutter-xs">
          <div class="row items-center q-gutter-xs">
            <!-- BADGE TIPO DE CONTRATO (3FN) -->
            <q-badge
              v-if="kardex.tipo_contrato"
              :color="kardex.tipo_contrato.color || 'indigo-9'"
              text-color="white"
              class="q-px-xs text-weight-bold"
              style="font-size: 10px;"
            >
              {{ kardex.tipo_contrato.nombre }}
            </q-badge>

            <!-- ESTADO EXPEDIENTE -->
            <q-chip
              :color="estadoColor"
              text-color="white"
              size="xs"
              dense
              class="text-weight-bold"
            >
              {{ estadoLabel }}
            </q-chip>
          </div>
        </div>

        <q-icon name="drag_indicator" color="grey-5" size="20px" class="q-ml-xs" />
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
  0: 'green-8',
  1: 'red-8',
  2: 'orange-8'
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

const nombreOrdenado = computed(() => {
  const pAp = props.kardex.primer_apellido ? props.kardex.primer_apellido.trim() : '';
  const sAp = props.kardex.segundo_apellido ? props.kardex.segundo_apellido.trim() : '';
  const nom = props.kardex.nombres ? props.kardex.nombres.trim() : '';
  const apellidos = [pAp, sAp].filter(Boolean).join(' ');
  if (apellidos && nom) {
    return `${apellidos} ${nom}`;
  }
  return props.kardex.nombre_completo || [apellidos, nom].filter(Boolean).join(' ') || 'Sin Nombre';
});
</script>

<style scoped>
.carpeta-item {
  display: flex;
  align-items: stretch;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0 10px 10px 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  margin-left: 42px;
  position: relative;
}

.carpeta-item:hover {
  transform: translateX(-4px);
  box-shadow: 0 8px 18px -2px rgba(15, 23, 42, 0.1);
  border-color: #cbd5e1;
}

.carpeta-matched {
  background: #eff6ff;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.4);
}

/* HIGHLIGHTED - Efecto de pulso suave */
.carpeta-highlighted {
  background: #fefce8;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.35);
  animation: pulse-highlight 1.2s ease-in-out infinite;
  transform: translateX(-8px);
}

@keyframes pulse-highlight {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.35);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.6);
  }
}

.carpeta-tab {
  position: absolute;
  left: -42px;
  top: 0;
  width: 42px;
  height: 100%;
  color: white;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px 0 0 10px;
  box-shadow: inset -2px 0 4px rgba(0,0,0,0.06);
}

.carpeta-body {
  flex: 1;
  padding: 10px 16px;
  background: #ffffff;
  border-radius: 0 10px 10px 0;
}

.estado-presente { background: #10b981 !important; }
.estado-ausente { background: #ef4444 !important; }
.estado-prestado { background: #f59e0b !important; }
</style>
