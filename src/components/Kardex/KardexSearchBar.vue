<template>
  <div class="search-container">
    <q-input
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event)"
      outlined
      :placeholder="placeholder"
      clearable
      bg-color="white"
      class="search-input"
      @focus="showResults = true"
      @blur="hideResultsDelayed"
    >
      <template v-slot:prepend>
        <q-icon name="search" color="indigo" size="22px" />
      </template>
      <template v-slot:append>
        <q-badge v-if="resultCount > 0" class="search-counter-badge">
          {{ resultCount }} coincidencia(s)
        </q-badge>
        <div v-else class="search-hint text-grey-5 text-caption q-mr-xs">
          Búsqueda global
        </div>
      </template>
    </q-input>

    <!-- RESULTADOS DROPDOWN -->
    <q-card
      v-if="showResults && searchResults.length > 0"
      class="search-results-dropdown shadow-10"
    >
      <q-list separator>
        <q-item
          v-for="(result, index) in searchResults.slice(0, 10)"
          :key="index"
          clickable
          class="search-result-item"
          @click="selectResult(result)"
        >
          <q-item-section avatar>
            <q-avatar
              :color="getEstadoColor(result.empleado.estado)"
              text-color="white"
              size="42px"
              class="result-avatar"
            >
              {{ result.empleado.numero_unico || result.empleado.id }}
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <!-- NOMBRE COMPLETO SIN COMAS: PRIMER APELLIDO, SEGUNDO APELLIDO, NOMBRES -->
            <div class="row items-center q-gutter-xs q-mb-xs">
              <span class="text-weight-bolder text-subtitle2 text-slate-900">
                {{ formatNombre(result.empleado) }}
              </span>
              <q-badge
                v-if="result.empleado.tipo_contrato?.nombre"
                :class="getContratoBadgeClass(result.empleado.tipo_contrato.nombre)"
                class="text-weight-bold"
              >
                {{ result.empleado.tipo_contrato.nombre }}
              </q-badge>
              <q-badge
                v-if="result.empleado.sede?.nombre"
                class="sede-badge text-weight-bold"
              >
                <q-icon name="place" size="11px" class="q-mr-xs" />
                {{ result.empleado.sede.nombre }}
              </q-badge>
              <span v-if="result.empleado.cargo" class="text-caption text-slate-500 q-ml-xs">
                • {{ result.empleado.cargo }}
              </span>
            </div>

            <!-- UBICACIÓN EXACTA: MUEBLE, NÚMERO DE GAVETA, FILA Y NOMBRE/ETIQUETA DE LA GAVETA -->
            <div class="row items-center q-gutter-xs">
              <template v-if="result.isVirtual">
                <q-badge class="badge-virtual text-weight-bold">
                  <q-icon name="cloud_off" size="13px" class="q-mr-xs" />
                  🗃️ Gaveta Virtual (Bandeja de Entrada - Sin archivar)
                </q-badge>
              </template>
              <template v-else>
                <!-- Archivador / Mueble -->
                <q-badge class="badge-mueble text-weight-bold">
                  <q-icon name="inventory_2" size="12px" class="q-mr-xs" />
                  Archivador {{ result.muebleNombre }}
                </q-badge>

                <!-- Número de gaveta y fila -->
                <q-badge class="badge-gaveta text-weight-bold">
                  <q-icon name="inbox" size="12px" class="q-mr-xs" />
                  {{ result.gavetaNumero }}
                </q-badge>

                <!-- Nombre o etiqueta de la gaveta -->
                <q-badge
                  v-if="result.gavetaEtiqueta"
                  class="badge-etiqueta text-weight-bolder"
                >
                  <q-icon name="label" size="12px" class="q-mr-xs" />
                  Gaveta: "{{ result.gavetaEtiqueta }}"
                </q-badge>
                <span v-else class="text-caption text-slate-400 italic q-ml-xs" style="font-size: 11px;">
                  (Sin etiqueta asignada)
                </span>
              </template>
            </div>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" color="indigo" size="24px" />
          </q-item-section>
        </q-item>
      </q-list>
      <q-card-section v-if="searchResults.length > 10" class="text-center text-slate-500 q-py-sm text-caption">
        ... y <b>{{ searchResults.length - 10 }}</b> resultados más
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
    default: 'Buscar expediente por apellido, nombre, código, CI o sede...'
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
  setTimeout(() => {
    showResults.value = false;
  }, 250);
};

const selectResult = (result) => {
  showResults.value = false;
  emit('select-result', result);
};

const getEstadoColor = (estado) => {
  const colors = { 0: 'emerald-6', 1: 'rose-6', 2: 'amber-7' };
  return colors[estado] ?? 'slate-6';
};

const getContratoBadgeClass = (contrato) => {
  const c = (contrato || '').toUpperCase();
  if (c.includes('INDEFINIDO')) return 'badge-indefinido';
  if (c.includes('PLAZO')) return 'badge-plazofijo';
  if (c.includes('PRESTACI')) return 'badge-prestacion';
  return 'badge-default';
};

const formatNombre = (emp) => {
  if (!emp) return '';
  const pAp = emp.primer_apellido ? emp.primer_apellido.trim() : '';
  const sAp = emp.segundo_apellido ? emp.segundo_apellido.trim() : '';
  const nom = emp.nombres ? emp.nombres.trim() : '';
  const apellidos = [pAp, sAp].filter(Boolean).join(' ');
  if (apellidos && nom) return `${apellidos} ${nom}`;
  return (emp.nombre_completo || [apellidos, nom].filter(Boolean).join(' ') || 'Sin Nombre').replace(/,/g, '');
};
</script>

<style scoped>
.search-container {
  position: relative;
  margin-bottom: 20px;
}

.search-input :deep(.q-field__control) {
  border-radius: 14px;
  box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.search-input:focus-within :deep(.q-field__control) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.search-counter-badge {
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 700;
  border-radius: 8px;
  padding: 4px 8px;
}

.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 420px;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  margin-top: 6px;
  background: #ffffff;
}

.search-result-item {
  transition: background 0.15s ease;
  padding: 10px 14px;
}

.search-result-item:hover {
  background: #f8fafc;
}

.result-avatar {
  border-radius: 10px;
  font-weight: 800;
  font-size: 14px;
}

.text-slate-900 { color: #0f172a; }
.text-slate-500 { color: #64748b; }
.text-slate-400 { color: #94a3b8; }

.badge-indefinido {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.badge-plazofijo {
  background: #fffbeb;
  color: #b45309;
  border: 1px solid #fde68a;
}

.badge-prestacion {
  background: #faf5ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}

.badge-default {
  background: #f1f5f9;
  color: #475569;
}

.sede-badge {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
}

.badge-mueble {
  background: #0f172a;
  color: #ffffff;
  padding: 2px 7px;
  font-size: 11px;
}

.badge-gaveta {
  background: #4f46e5;
  color: #ffffff;
  padding: 2px 7px;
  font-size: 11px;
}

.badge-etiqueta {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
  padding: 2px 7px;
  font-size: 11px;
}

.badge-virtual {
  background: #fdf2f8;
  color: #be185d;
  border: 1px solid #fbcfe8;
  padding: 2px 7px;
  font-size: 11px;
}
</style>
