<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card style="min-width: 580px; max-width: 680px; border-radius: 16px; overflow: hidden;" v-if="cajon">
      <!-- HEADER -->
      <q-card-section class="bg-dark-slate text-white row items-center justify-between q-py-md q-px-lg">
        <div class="row items-center q-gutter-sm">
          <div class="dialog-icon-badge flex flex-center">
            <q-icon name="tune" size="20px" color="white" />
          </div>
          <div>
            <div class="text-subtitle1 text-weight-bolder text-slate-100">Configuración de Gaveta</div>
            <div class="text-caption text-slate-400">
              {{ drawerTitle }} • {{ cajon.mueble?.nombre || 'Archivador' }}
            </div>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="grey-4" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-md q-gutter-y-md" style="max-height: 80vh; overflow-y: auto;">
        <!-- ETIQUETA / NOMBRE PERSONALIZADO -->
        <div>
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
            Etiqueta / Rótulo de la Gaveta:
          </div>
          <div class="row q-col-gutter-sm items-center">
            <div class="col">
              <q-input
                v-model="localEtiqueta"
                outlined
                dense
                placeholder="Ej: Contabilidad - Gerencia"
              />
            </div>
            <div class="col-auto">
              <q-btn
                unelevated
                color="secondary"
                icon="check"
                label="Guardar Rótulo"
                size="sm"
                :loading="savingEtiqueta"
                @click="saveEtiqueta"
              />
            </div>
          </div>
        </div>

        <q-separator />

        <!-- 1. RÉGIMEN DE CONTRATOS -->
        <div>
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
            1. Régimen de Contratos Permitidos:
          </div>
          <div class="q-gutter-md row items-center q-mb-xs">
            <q-radio
              v-model="ruleMode"
              val="libre"
              label="Libre (Cualquier contrato)"
              color="positive"
              dense
            />
            <q-radio
              v-model="ruleMode"
              val="restringida"
              label="Restringido a seleccionados"
              color="amber-9"
              dense
            />
          </div>
          <div v-if="ruleMode === 'restringida'" class="q-pa-sm bg-grey-1 rounded-borders">
            <div class="row q-gutter-md">
              <q-checkbox
                v-for="tc in store.tiposContrato"
                :key="tc.id"
                v-model="selectedReglaContratoIds"
                :val="tc.id"
                :label="tc.nombre"
                class="text-weight-bold"
                dense
              />
            </div>
          </div>
        </div>

        <q-separator />

        <!-- 2. SEDES ADMITIDAS -->
        <div>
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs">
            2. Sedes Admitidas en esta Gaveta:
          </div>
          <div class="q-gutter-md row items-center q-mb-xs">
            <q-radio
              v-model="ruleSedeMode"
              val="libre"
              label="Libre (Admite personal de cualquier sede)"
              color="teal-8"
              dense
            />
            <q-radio
              v-model="ruleSedeMode"
              val="restringida"
              label="Restringida a sedes seleccionadas"
              color="purple-8"
              dense
            />
          </div>
          <div v-if="ruleSedeMode === 'restringida'" class="q-pa-sm bg-grey-1 rounded-borders">
            <div class="row q-gutter-md">
              <q-checkbox
                v-for="s in store.sedes"
                :key="s.id"
                v-model="selectedReglaSedesIds"
                :val="s.id"
                :label="s.nombre"
                class="text-weight-bold"
                dense
              />
            </div>
          </div>
        </div>

        <q-separator />

        <!-- 3. RANGO ALFABÉTICO DE APELLIDOS -->
        <div>
          <div class="text-caption text-weight-bold text-grey-8 q-mb-xs row items-center q-gutter-xs">
            <q-icon name="sort_by_alpha" color="indigo-8" size="18px" />
            <span>3. Rango Alfabético de Apellidos (De qué apellido a qué apellido):</span>
          </div>
          <div class="q-gutter-md row items-center q-mb-xs">
            <q-radio
              v-model="ruleApellidoMode"
              val="libre"
              label="Libre (Todos los apellidos de la A a la Z)"
              color="blue-8"
              dense
            />
            <q-radio
              v-model="ruleApellidoMode"
              val="rango"
              label="Restringido por rango alfabético"
              color="indigo-9"
              dense
            />
          </div>

          <div v-if="ruleApellidoMode === 'rango'" class="q-pa-sm bg-blue-1 rounded-borders q-gutter-y-sm">
            <!-- BOTONES DE ATAJOS -->
            <div class="row items-center q-gutter-xs">
              <span class="text-caption text-weight-bold text-grey-7 q-mr-xs">Atajos rápidos:</span>
              <q-btn dense outline size="xs" color="indigo-9" label="A - F" @click="aplicarPreset('A', 'F')" />
              <q-btn dense outline size="xs" color="indigo-9" label="G - M" @click="aplicarPreset('G', 'M')" />
              <q-btn dense outline size="xs" color="indigo-9" label="N - S" @click="aplicarPreset('N', 'S')" />
              <q-btn dense outline size="xs" color="indigo-9" label="T - Z" @click="aplicarPreset('T', 'Z')" />
              <q-btn dense outline size="xs" color="indigo-9" label="A - Z" @click="aplicarPreset('A', 'Z')" />
            </div>

            <div class="row q-col-gutter-sm items-center">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="apellidoDesde"
                  outlined
                  dense
                  bg-color="white"
                  label="Desde Apellido / Letra *"
                  placeholder="Ej: A o ALONZO"
                  class="text-uppercase"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="apellidoHasta"
                  outlined
                  dense
                  bg-color="white"
                  label="Hasta Apellido / Letra *"
                  placeholder="Ej: M o MAMANI"
                  class="text-uppercase"
                />
              </div>
            </div>
            <div class="text-caption text-grey-7" style="font-size: 11px;">
              Solo se admitirán personas cuyo primer apellido comience o esté comprendido entre <b>{{ apellidoDesde || 'A' }}</b> y <b>{{ apellidoHasta || 'Z' }}</b>.
            </div>
          </div>
        </div>

        <!-- BOTONES DE GUARDADO Y AUTO-SINCRONIZACIÓN -->
        <div class="q-pa-sm bg-grey-2 rounded-borders">
          <div class="row items-center justify-between q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-toggle
                v-model="autoSincronizarAlGuardar"
                label="Auto-sincronizar gaveta al guardar"
                color="primary"
                dense
              >
                <q-tooltip>Mete expedientes que coincidan y expulsa a la Gaveta Virtual los que no cumplan</q-tooltip>
              </q-toggle>
            </div>
            <div class="col-12 col-sm-6 row justify-end q-gutter-xs">
              <q-btn
                outline
                color="deep-purple-9"
                icon="sync"
                label="Auto-Organizar Ahora"
                size="sm"
                :loading="sincronizandoGaveta"
                @click="sincronizarGavetaManual"
              >
                <q-tooltip>Aplica las reglas inmediatamente: absorbe de la Gaveta Virtual y expulsa los no válidos</q-tooltip>
              </q-btn>
              <q-btn
                unelevated
                color="primary"
                icon="save"
                label="Guardar Reglas"
                size="sm"
                :loading="savingReglas"
                @click="saveReglas"
              />
            </div>
          </div>
        </div>

        <q-separator />

        <!-- 4. ASIGNACIÓN MASIVA POR SEDE EN 1 CLIC -->
        <div class="q-pa-sm bg-purple-1 rounded-borders">
          <div class="text-caption text-weight-bold text-purple-10 q-mb-xs row items-center q-gutter-xs">
            <q-icon name="flash_on" color="amber-9" size="18px" />
            <span>Asignación Masiva en 1 Clic desde Gaveta Virtual:</span>
          </div>
          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-sm-7">
              <q-select
                v-model="selectedBulkSedeId"
                :options="store.sedes"
                option-label="nombre"
                option-value="id"
                emit-value
                map-options
                outlined
                dense
                bg-color="white"
                label="Selecciona Sede para absorber expedientes"
              />
            </div>
            <div class="col-12 col-sm-5">
              <q-btn
                unelevated
                color="deep-purple-8"
                icon="system_update_alt"
                label="Meter Todo de esta Sede"
                class="full-width"
                size="sm"
                :disable="!selectedBulkSedeId"
                :loading="loadingBulkAssign"
                @click="executeBulkAssign"
              />
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="bg-grey-2 q-pa-sm border-top">
        <q-btn flat label="Cerrar" color="grey-8" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  cajon: {
    type: Object,
    default: null,
  },
});

defineEmits(['update:modelValue']);

const $q = useQuasar();
const store = useGeosStore();

const localEtiqueta = ref('');
const savingEtiqueta = ref(false);

const ruleMode = ref('libre');
const selectedReglaContratoIds = ref([]);
const ruleSedeMode = ref('libre');
const selectedReglaSedesIds = ref([]);
const ruleApellidoMode = ref('libre');
const apellidoDesde = ref('');
const apellidoHasta = ref('');
const autoSincronizarAlGuardar = ref(true);

const savingReglas = ref(false);
const sincronizandoGaveta = ref(false);
const selectedBulkSedeId = ref(null);
const loadingBulkAssign = ref(false);

const drawerTitle = computed(() => {
  if (!props.cajon) return '';
  return props.cajon.columna === 1
    ? `Gaveta ${props.cajon.fila}`
    : `Col ${String.fromCharCode(64 + props.cajon.columna)} - Gaveta ${props.cajon.fila}`;
});

const aplicarPreset = (desde, hasta) => {
  ruleApellidoMode.value = 'rango';
  apellidoDesde.value = desde;
  apellidoHasta.value = hasta;
};

const syncFromCajon = (d) => {
  if (!d) return;
  localEtiqueta.value = d.etiqueta || '';

  // Contratos
  const permitidos = d.tipos_contrato_permitidos || [];
  if (permitidos.length > 0) {
    ruleMode.value = 'restringida';
    selectedReglaContratoIds.value = permitidos.map(p => p.id);
  } else {
    ruleMode.value = 'libre';
    selectedReglaContratoIds.value = [];
  }

  // Sedes
  const permitidasSedes = d.sedes_permitidas || [];
  if (permitidasSedes.length > 0) {
    ruleSedeMode.value = 'restringida';
    selectedReglaSedesIds.value = permitidasSedes.map(s => s.id);
    selectedBulkSedeId.value = permitidasSedes[0].id;
  } else {
    ruleSedeMode.value = 'libre';
    selectedReglaSedesIds.value = [];
    selectedBulkSedeId.value = store.sedes && store.sedes.length > 0 ? store.sedes[0].id : null;
  }

  // Apellidos
  if (d.apellido_desde || d.apellido_hasta) {
    ruleApellidoMode.value = 'rango';
    apellidoDesde.value = d.apellido_desde || '';
    apellidoHasta.value = d.apellido_hasta || '';
  } else {
    ruleApellidoMode.value = 'libre';
    apellidoDesde.value = '';
    apellidoHasta.value = '';
  }
};

watch(() => props.cajon, (newCajon) => {
  syncFromCajon(newCajon);
}, { immediate: true });

const saveEtiqueta = async () => {
  if (!props.cajon) return;
  savingEtiqueta.value = true;
  await store.updateCajon(props.cajon.id, { etiqueta: localEtiqueta.value });
  await store.fetchMuebles();
  savingEtiqueta.value = false;
  $q.notify({ type: 'positive', message: 'Rótulo de gaveta guardado' });
};

const saveReglas = async () => {
  if (!props.cajon) return;
  savingReglas.value = true;
  const contratoIds = ruleMode.value === 'libre' ? [] : selectedReglaContratoIds.value;
  const sedesIds = ruleSedeMode.value === 'libre' ? [] : selectedReglaSedesIds.value;

  if (ruleMode.value === 'restringida' && contratoIds.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Debes seleccionar al menos un tipo de contrato permitido o elegir "Admisión Libre".'
    });
    savingReglas.value = false;
    return;
  }

  if (ruleSedeMode.value === 'restringida' && sedesIds.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Debes seleccionar al menos una sede permitida o elegir "Cualquier Sede".'
    });
    savingReglas.value = false;
    return;
  }

  const apDesde = ruleApellidoMode.value === 'rango' ? apellidoDesde.value.trim() : null;
  const apHasta = ruleApellidoMode.value === 'rango' ? apellidoHasta.value.trim() : null;

  const res = await store.updateCajonReglas(props.cajon.id, {
    tiposContratoIds: contratoIds,
    sedesIds: sedesIds,
    apellidoDesde: apDesde,
    apellidoHasta: apHasta,
    autoSincronizar: autoSincronizarAlGuardar.value,
  });
  savingReglas.value = false;

  if (res && res.success) {
    let msg = 'Reglas de admisión guardadas exitosamente.';
    if (res.data?.sync) {
      msg += ` Auto-organizado: +${res.data.sync.asignados} asignados, -${res.data.sync.expulsados} devueltos a Gaveta Virtual.`;
    }
    $q.notify({
      type: 'positive',
      icon: 'verified_user',
      message: msg
    });
  } else {
    $q.notify({
      type: 'negative',
      message: res?.message || 'Error al actualizar las reglas'
    });
  }
};

const sincronizarGavetaManual = async () => {
  if (!props.cajon) return;
  sincronizandoGaveta.value = true;
  const res = await store.sincronizarCajon(props.cajon.id);
  sincronizandoGaveta.value = false;
  if (res && res.success) {
    $q.notify({
      type: 'positive',
      icon: 'sync',
      message: res.message || 'Gaveta sincronizada con éxito'
    });
  } else {
    $q.notify({
      type: 'negative',
      message: res?.message || 'Error al sincronizar la gaveta'
    });
  }
};

const executeBulkAssign = async () => {
  if (!props.cajon || !selectedBulkSedeId.value) return;
  loadingBulkAssign.value = true;
  const res = await store.asignarPorSede(props.cajon.id, selectedBulkSedeId.value);
  loadingBulkAssign.value = false;
  if (res && res.success) {
    $q.notify({
      type: 'positive',
      icon: 'all_inbox',
      message: res.message || 'Expedientes asignados exitosamente'
    });
  } else {
    $q.notify({
      type: 'negative',
      message: res?.message || 'Error al asignar expedientes'
    });
  }
};
</script>

<style scoped>
.bg-dark-slate {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.dialog-icon-badge {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(99, 102, 241, 0.3);
  border: 1px solid rgba(165, 180, 252, 0.4);
}

.text-slate-100 { color: #f1f5f9; }
.text-slate-400 { color: #94a3b8; }

.border-top {
  border-top: 1px solid #e0e0e0;
}
</style>
