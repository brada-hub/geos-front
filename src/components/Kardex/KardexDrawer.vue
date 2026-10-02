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
        <!-- TIRADOR DE ALUMINIO MODERNO -->
        <div class="drawer-handle-bar"></div>

        <!-- FILA SUPERIOR: NÚMERO DE GAVETA Y BOTÓN CONFIGURACIÓN -->
        <div class="row items-center justify-between no-wrap full-width q-px-xs">
          <div class="row items-center q-gutter-xs">
            <q-icon name="inbox" size="13px" color="slate-400" />
            <span class="drawer-number-text">
              {{ cajon.columna === 1 ? `Gaveta ${cajon.fila}` : `Col ${String.fromCharCode(64 + cajon.columna)} • Gav ${cajon.fila}` }}
            </span>
          </div>

          <!-- BOTÓN DE CONFIGURACIÓN DE GAVETA -->
          <q-btn
            flat
            round
            dense
            size="xs"
            icon="settings"
            class="cajon-config-btn"
            @click.stop="$emit('configure', cajon)"
          >
            <q-tooltip anchor="top middle" self="bottom middle">
              Configurar gaveta: Reglas, Sedes y Rango de Apellidos
            </q-tooltip>
          </q-btn>
        </div>

        <!-- RÓTULO / ETIQUETA ARCHIVADORA (TIPO PLACA ELEGANTE) -->
        <div v-if="cajon.etiqueta" class="drawer-label-badge" :title="cajon.etiqueta">
          {{ cajon.etiqueta }}
        </div>
        <div v-else class="drawer-label-placeholder"></div>

        <!-- CONTEO DE EXPEDIENTES -->
        <div class="row items-center justify-center q-mt-xs">
          <span class="count-pill" :class="{ 'count-pill-active': empleadosCount > 0 }">
            <q-icon name="folder" size="12px" class="q-mr-xs" />
            {{ empleadosCount }} {{ empleadosCount === 1 ? 'exp.' : 'exp.' }}
          </span>
        </div>

        <!-- CONTRATOS PRESENTES (MICRO-PILLS) -->
        <div v-if="contratosPresentes.length > 0" class="row items-center justify-center q-gutter-xs q-mt-xs">
          <span
            v-for="c in contratosPresentes"
            :key="c.id"
            class="badge-contrato-item"
            :title="`Contiene personal: ${c.nombre}`"
          >
            {{ c.codigo || c.nombre }}
          </span>
        </div>

        <!-- MICRO-TAGS DE REGLAS (ARMONIOSOS Y COMPACTOS) -->
        <div class="rules-container row items-center justify-center q-gutter-xs q-mt-xs">
          <!-- Regla de Contrato -->
          <span
            v-if="isRestringido"
            class="rule-pill pill-contrato-rule"
            :title="`Solo admite: ${reglasPermitidas.map(r => r.nombre).join(' + ')}`"
          >
            <q-icon name="lock" size="10px" />
            SOLO: {{ reglasPermitidas.map(r => r.codigo || r.nombre).join('+') }}
          </span>

          <!-- Regla de Sede -->
          <span
            v-if="sedesRestringidas.length > 0"
            class="rule-pill pill-sede-rule"
            :title="`Solo admite: ${sedesRestringidas.map(s => s.nombre).join(', ')}`"
          >
            <q-icon name="place" size="10px" />
            {{ sedesRestringidas.map(s => s.nombre).join('+') }}
          </span>

          <!-- Rango Alfabético -->
          <span
            v-if="props.cajon.apellido_desde || props.cajon.apellido_hasta"
            class="rule-pill pill-rango-rule"
            :title="`Rango: ${props.cajon.apellido_desde || 'A'} hasta ${props.cajon.apellido_hasta || 'Z'}`"
          >
            <q-icon name="sort_by_alpha" size="10px" />
            [{{ props.cajon.apellido_desde || 'A' }} - {{ props.cajon.apellido_hasta || 'Z' }}]
          </span>
        </div>
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

const emit = defineEmits(['open', 'configure', 'drag-change', 'update:empleados']);

// Use getter only - mutations go through events
const localEmpleados = computed({
  get: () => props.cajon.empleados || [],
  set: (val) => {
    emit('update:empleados', val);
  }
});

const empleadosCount = computed(() => (props.cajon.empleados || []).length);

const contratosPresentes = computed(() => {
  if (!props.cajon.empleados || props.cajon.empleados.length === 0) return [];
  const map = new Map();
  props.cajon.empleados.forEach(emp => {
    if (emp.tipo_contrato) {
      map.set(emp.tipo_contrato.id, emp.tipo_contrato);
    }
  });
  return Array.from(map.values());
});

const reglasPermitidas = computed(() => {
  return props.cajon.tipos_contrato_permitidos || [];
});

const isRestringido = computed(() => reglasPermitidas.value.length > 0);

const sedesRestringidas = computed(() => {
  return props.cajon.sedes_permitidas || [];
});

const handleChange = (evt) => {
  emit('drag-change', evt, props.cajon.id);
};
</script>

<style scoped>
.cajon-cell {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 8px 8px 10px 8px;
  min-height: 116px;
  cursor: pointer;
  position: relative;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
}

.cajon-cell:hover {
  transform: translateY(-2px);
  border-color: #818cf8;
  box-shadow: 0 10px 20px -4px rgba(99, 102, 241, 0.16), 0 4px 6px -2px rgba(15, 23, 42, 0.04);
}

.cajon-highlighted {
  border-color: #4f46e5 !important;
  background: #f5f3ff !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
}

.cajon-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.drawer-handle-bar {
  width: 34px;
  height: 4px;
  background: #cbd5e1;
  border-radius: 999px;
  margin-bottom: 6px;
  transition: all 0.2s ease;
}

.cajon-cell:hover .drawer-handle-bar {
  background: #818cf8;
  width: 44px;
}

.drawer-number-text {
  font-size: 11px;
  font-weight: 800;
  color: #475569;
  letter-spacing: 0.02em;
}

.cajon-config-btn {
  opacity: 0.45;
  color: #64748b;
  transition: all 0.2s ease;
}

.cajon-cell:hover .cajon-config-btn {
  opacity: 1;
  color: #4f46e5;
  background: #f1f5f9;
}

.drawer-label-badge {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  padding: 3px 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 4px;
  max-width: 95%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(245, 158, 11, 0.1);
  text-align: center;
}

.drawer-label-placeholder {
  height: 4px;
}

.count-pill {
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 700;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 9999px;
  transition: all 0.2s ease;
}

.count-pill-active {
  color: #1d4ed8;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.badge-contrato-item {
  font-size: 8.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.rules-container {
  min-height: 18px;
  max-width: 100%;
}

.rule-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 5px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pill-contrato-rule {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.pill-sede-rule {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
}

.pill-rango-rule {
  background: #f8fafc;
  color: #334155;
  border: 1px solid #cbd5e1;
}

.hidden { display: none; }
</style>
