<template>
  <div
    class="carpeta-item"
    :class="{
      'carpeta-matched': isMatched,
      'carpeta-highlighted': isHighlighted,
      'is-ausente': kardex.estado === 1,
      'is-prestado': kardex.estado === 2,
      'is-updating': isUpdating
    }"
    v-touch-swipe.mouse.horizontal="handleSwipe"
    @click="$emit('click')"
  >
    <!-- TAB LATERAL IZQUIERDO (NÚMERO DE EXPEDIENTE) -->
    <!-- Clic directo en el número alterna rápidamente el estado Presente / Ausente -->
    <div
      class="carpeta-tab"
      :class="estadoClass"
      @click.stop="toggleEstadoRapido"
    >
      <span class="tab-number">{{ kardex.numero_unico || kardex.id }}</span>
      <q-icon
        :name="kardex.estado === 1 ? 'close' : (kardex.estado === 2 ? 'schedule' : 'check')"
        size="12px"
        class="tab-icon q-mt-xs"
      />
      <q-tooltip anchor="top middle" self="bottom middle" :offset="[0, 8]">
        Clic o desliza para cambiar estado ({{ estadoLabel }})
      </q-tooltip>
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
          <div class="row items-center q-gutter-xs no-wrap">
            <!-- BADGE TIPO DE CONTRATO (3FN) -->
            <q-badge
              v-if="kardex.tipo_contrato"
              :color="kardex.tipo_contrato.color || 'primary'"
              text-color="white"
              class="q-px-xs text-weight-bold"
              style="font-size: 10px;"
            >
              {{ kardex.tipo_contrato.nombre }}
            </q-badge>

            <!-- ESTADO EXPEDIENTE INTERACTIVO (CLIC PARA MENÚ RÁPIDO) -->
            <q-chip
              :color="estadoColor"
              text-color="white"
              size="xs"
              dense
              clickable
              class="text-weight-bold cursor-pointer estado-chip"
              @click.stop
            >
              {{ estadoLabel }}
              <q-icon name="arrow_drop_down" size="14px" class="q-ml-xs" />

              <q-menu auto-close anchor="bottom right" self="top right" class="shadow-4 rounded-borders">
                <q-list dense style="min-width: 140px">
                  <q-item clickable @click="setEstado(0)" :active="kardex.estado === 0">
                    <q-item-section avatar class="q-pr-xs" style="min-width: 24px">
                      <q-icon name="check_circle" color="primary" size="18px" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium text-caption">Presente</q-item-section>
                  </q-item>
                  <q-item clickable @click="setEstado(1)" :active="kardex.estado === 1">
                    <q-item-section avatar class="q-pr-xs" style="min-width: 24px">
                      <q-icon name="cancel" color="negative" size="18px" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium text-caption">Ausente</q-item-section>
                  </q-item>
                  <q-item clickable @click="setEstado(2)" :active="kardex.estado === 2">
                    <q-item-section avatar class="q-pr-xs" style="min-width: 24px">
                      <q-icon name="schedule" color="grey-7" size="18px" />
                    </q-item-section>
                    <q-item-section class="text-weight-medium text-caption">Prestado</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-chip>
          </div>
        </div>

        <!-- DRAG HANDLE PARA REORDENAR DENTRO DEL CAJÓN -->
        <q-icon
          name="drag_indicator"
          color="grey-5"
          size="22px"
          class="drag-handle q-ml-xs cursor-move"
          @click.stop
        >
          <q-tooltip>Arrastrar para reordenar en la gaveta</q-tooltip>
        </q-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useQuasar, TouchSwipe } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';

const vTouchSwipe = TouchSwipe;

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

const $q = useQuasar();
const store = useGeosStore();
const isUpdating = ref(false);

// Estados numéricos: 0 = Presente, 1 = Ausente, 2 = Prestado
const estadoColors = {
  0: 'primary',
  1: 'negative',
  2: 'grey-8'
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

async function setEstado(nuevoEstado) {
  if (isUpdating.value || props.kardex.estado === nuevoEstado) return;
  isUpdating.value = true;

  const labels = { 0: 'PRESENTE', 1: 'AUSENTE', 2: 'PRESTADO' };
  const num = props.kardex.numero_unico || props.kardex.id;

  try {
    const ok = await store.cambiarEstadoExpediente(props.kardex.id, nuevoEstado);
    if (ok) {
      $q.notify({
        type: nuevoEstado === 0 ? 'positive' : nuevoEstado === 1 ? 'negative' : 'info',
        message: `#${num} marcado como ${labels[nuevoEstado]}`,
        position: 'bottom',
        timeout: 1300,
        dense: true
      });
    } else {
      $q.notify({
        type: 'negative',
        message: 'No se pudo actualizar el estado',
        timeout: 1500
      });
    }
  } catch (e) {
    console.error('Error al cambiar estado:', e);
  } finally {
    isUpdating.value = false;
  }
}

async function toggleEstadoRapido() {
  // Clic en la pestaña: si está presente pasa a ausente; si está ausente/prestado pasa a presente
  const nuevo = props.kardex.estado === 0 ? 1 : 0;
  await setEstado(nuevo);
}

function handleSwipe({ direction }) {
  if (direction === 'right') {
    // Deslizar a la derecha:
    // Si estaba ausente o prestado -> pasa a Presente
    // Si ya estaba presente -> pasa a Ausente
    const nuevo = props.kardex.estado === 0 ? 1 : 0;
    setEstado(nuevo);
  } else if (direction === 'left') {
    // Deslizar a la izquierda: marcar como Ausente
    if (props.kardex.estado !== 1) {
      setEstado(1);
    }
  }
}
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
  touch-action: pan-y; /* Permite scroll vertical fluido y captura swipes horizontales */
  user-select: none;
}

.carpeta-item:hover {
  transform: translateX(-4px);
  box-shadow: 0 8px 18px -2px rgba(15, 23, 42, 0.1);
  border-color: #cbd5e1;
}

.carpeta-item.is-ausente {
  border-color: #fca5a5;
  background: #fff8f8;
  opacity: 0.88;
}

.carpeta-item.is-prestado {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.carpeta-item.is-updating {
  opacity: 0.6;
  pointer-events: none;
}

.carpeta-matched {
  background: #eff6ff;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.4);
}

/* HIGHLIGHTED - Efecto de pulso suave */
.carpeta-highlighted {
  background: #eff6ff;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);
  animation: pulse-highlight 1.2s ease-in-out infinite;
  transform: translateX(-8px);
}

@keyframes pulse-highlight {
  0%, 100% {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.35);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.6);
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px 0 0 10px;
  box-shadow: inset -2px 0 4px rgba(0,0,0,0.06);
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, filter 0.15s ease, background-color 0.25s ease;
}

.carpeta-tab:hover {
  filter: brightness(1.12);
  transform: scale(1.05);
}

.carpeta-tab:active {
  transform: scale(0.95);
}

.tab-number {
  line-height: 1;
}

.tab-icon {
  opacity: 0.85;
}

.carpeta-body {
  flex: 1;
  padding: 10px 16px;
  background: #ffffff;
  border-radius: 0 10px 10px 0;
  cursor: pointer;
}

.estado-presente { background: #2563eb !important; }
.estado-ausente { background: #dc2626 !important; }
.estado-prestado { background: #475569 !important; }

.drag-handle {
  opacity: 0.45;
  transition: opacity 0.2s, transform 0.2s;
}
.drag-handle:hover {
  opacity: 1;
  transform: scale(1.15);
}

.estado-chip {
  transition: transform 0.15s ease;
}
.estado-chip:hover {
  transform: scale(1.05);
}

/* Modo oscuro */
body.body--dark .carpeta-item {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}
body.body--dark .carpeta-body {
  background: transparent;
}
body.body--dark .carpeta-item.is-ausente {
  background: #2a1818;
  border-color: #7f1d1d;
}
body.body--dark .carpeta-item.is-prestado {
  background: #2b2214;
  border-color: #78350f;
}
body.body--dark .text-grey-9 {
  color: #f1f5f9 !important;
}
body.body--dark .text-grey-7 {
  color: #94a3b8 !important;
}
</style>
