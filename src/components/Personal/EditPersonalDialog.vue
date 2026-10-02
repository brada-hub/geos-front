<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 540px; max-width: 640px; border-radius: 14px;">
      <q-card-section class="bg-primary text-white row items-center justify-between">
        <div class="row items-center q-gutter-sm">
          <q-icon name="manage_accounts" size="26px" />
          <div>
            <div class="text-h6 font-weight-bold">Modificar Ficha de Personal</div>
            <div class="text-caption text-blue-grey-1">{{ persona?.codigo_archivo }} • {{ persona?.documento_identidad }}</div>
          </div>
        </div>
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pa-md" style="max-height: 75vh; overflow-y: auto;">
        <q-form @submit="handleSubmit" class="q-gutter-y-sm">
          <!-- DATOS PERSONALES -->
          <div class="text-caption text-weight-bolder text-primary q-mb-xs">
            DATOS PERSONALES
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.nombres"
                outlined
                dense
                label="Nombres *"
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.primer_apellido"
                outlined
                dense
                label="Primer Apellido *"
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.segundo_apellido"
                outlined
                dense
                label="Segundo Apellido"
                placeholder="Opcional"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.documento_identidad"
                outlined
                dense
                label="Documento de Identidad (CI) *"
                :rules="[val => !!val || 'Requerido']"
              />
            </div>
          </div>

          <div class="row q-col-gutter-sm items-center">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.fecha_nacimiento"
                outlined
                dense
                type="date"
                label="Fecha de Nacimiento"
                stack-label
              />
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-7 q-mb-xs">Sexo (3FN):</div>
              <q-btn-toggle
                v-model="form.sexo_id"
                spread
                no-caps
                dense
                unelevated
                toggle-color="primary"
                color="grey-3"
                text-color="dark"
                :options="sexosOptions"
              />
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <!-- SEDE, RÉGIMEN CONTRACTUAL Y CARGO -->
          <div class="text-caption text-weight-bolder text-primary q-mb-xs">
            SEDE, RÉGIMEN CONTRACTUAL Y CARGO
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-4">
              <q-select
                v-model="form.sede_id"
                :options="store.sedes"
                option-label="nombre"
                option-value="id"
                emit-value
                map-options
                outlined
                dense
                label="Sede *"
                :rules="[val => !!val || 'Requerido']"
              >
                <template v-slot:prepend>
                  <q-icon name="apartment" size="18px" color="primary" />
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-4">
              <q-select
                v-model="form.tipo_contrato_id"
                :options="tiposContrato"
                option-label="nombre"
                option-value="id"
                emit-value
                map-options
                outlined
                dense
                label="Tipo de Contrato *"
                :rules="[val => !!val || 'Requerido']"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-badge :color="scope.opt.color || 'primary'" rounded />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.nombre }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-4">
              <q-select
                v-model="selectedCargo"
                :options="cargoOptions"
                use-input
                new-value-mode="add-unique"
                outlined
                dense
                label="Cargo *"
                placeholder="Escribe o selecciona un cargo"
                @filter="filterCargo"
              >
                <template v-slot:prepend>
                  <q-icon name="work" size="18px" color="primary" />
                </template>
              </q-select>
            </div>
          </div>

          <div v-if="isContratoCambiado" class="bg-amber-1 q-pa-sm rounded-borders text-caption text-amber-10 q-mb-xs row items-center q-gutter-xs">
            <q-icon name="info" size="18px" />
            <span>Se registrará en el historial el cambio de régimen contractual.</span>
          </div>

          <q-separator class="q-my-sm" />

          <!-- TRASLADO / UBICACIÓN FÍSICA -->
          <div class="text-caption text-weight-bolder text-primary q-mb-xs row items-center justify-between">
            <span>UBICACIÓN FÍSICA EN ARCHIVADOR</span>
            <q-btn
              v-if="form.cajon_id"
              flat
              dense
              color="deep-purple-8"
              icon="cloud_queue"
              label="Mover a Gaveta Virtual"
              size="xs"
              @click="desasignarGaveta"
            />
          </div>

          <div v-if="!form.cajon_id" class="q-pa-xs bg-purple-1 rounded-borders text-caption text-deep-purple-9 q-mb-xs row items-center q-gutter-xs">
            <q-icon name="all_inbox" size="18px" />
            <span>Este expediente se encuentra actualmente en la <strong>Gaveta Virtual (Sin Asignar)</strong>.</span>
          </div>

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-md-6">
              <q-select
                v-model="selectedMueble"
                :options="muebles"
                option-label="nombre"
                outlined
                dense
                clearable
                label="Archivador / Mueble"
                @update:model-value="val => { if (!val) form.cajon_id = null; }"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-if="selectedMueble"
                v-model="form.cajon_id"
                :options="selectedMueble.cajones"
                option-value="id"
                :option-label="formatDrawerLabel"
                emit-value
                map-options
                outlined
                dense
                clearable
                label="Gaveta de destino"
              />
              <div v-else class="text-caption text-grey-6 q-pt-sm">
                Selecciona un archivador para ubicar físicamente el expediente.
              </div>
            </div>
          </div>

          <div class="q-mt-sm">
            <q-input
              v-model="form.comentario"
              outlined
              dense
              label="Motivo del cambio / Observaciones para el Historial"
              placeholder="Ej: Ascenso a indefinido, traslado por reorganización"
            />
          </div>

          <div class="row justify-end q-gutter-sm q-pt-md">
            <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
            <q-btn unelevated color="primary" icon="save" label="Guardar Cambios" type="submit" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';

const $q = useQuasar();
const store = useGeosStore();

const props = defineProps({
  modelValue: Boolean,
  persona: Object,
});

const emit = defineEmits(['update:modelValue', 'updated']);

const muebles = computed(() => store.muebles);
const tiposContrato = computed(() => store.tiposContrato);
const selectedMueble = ref(null);
const selectedCargo = ref(null);
const cargoOptions = ref([]);
const loading = ref(false);

const sexosOptions = computed(() => {
  if (store.sexos && store.sexos.length > 0) {
    return store.sexos.map(s => ({
      label: s.nombre.charAt(0) + s.nombre.slice(1).toLowerCase(),
      value: s.id,
      icon: s.codigo === 'M' ? 'male' : (s.codigo === 'F' ? 'female' : 'person')
    }));
  }
  return [
    { label: 'Masculino', value: 1, icon: 'male' },
    { label: 'Femenino', value: 2, icon: 'female' }
  ];
});

const form = reactive({
  nombres: '',
  primer_apellido: '',
  segundo_apellido: '',
  documento_identidad: '',
  fecha_nacimiento: '',
  sexo_id: 1,
  sede_id: null,
  tipo_contrato_id: null,
  cargo_id: null,
  cargo_nombre: '',
  codigo_archivo: '',
  numero_unico: '',
  cajon_id: null,
  comentario: ''
});

const isContratoCambiado = computed(() => {
  return props.persona && form.tipo_contrato_id !== props.persona.tipo_contrato_id;
});

const desasignarGaveta = () => {
  form.cajon_id = null;
  selectedMueble.value = null;
  $q.notify({
    type: 'info',
    icon: 'all_inbox',
    message: 'El expediente se moverá a la Gaveta Virtual (Sin Asignar) al guardar.'
  });
};

const formatDrawerLabel = (opt) => {
  const colLetter = String.fromCharCode(64 + opt.columna);
  const base = opt.columna === 1 ? `Gaveta ${opt.fila}` : `Col ${colLetter} - Gaveta ${opt.fila}`;
  const etiq = opt.etiqueta ? ` (${opt.etiqueta})` : '';
  let reglas = '';
  if (opt.tipos_contrato_permitidos && opt.tipos_contrato_permitidos.length > 0) {
    reglas = ` [Contratos: ${opt.tipos_contrato_permitidos.map(t => t.codigo || t.nombre).join(', ')}]`;
  }
  let reglasSedes = '';
  if (opt.sedes_permitidas && opt.sedes_permitidas.length > 0) {
    reglasSedes = ` [Sedes: ${opt.sedes_permitidas.map(s => s.nombre).join(', ')}]`;
  }
  return `${base}${etiq}${reglas}${reglasSedes}`;
};

const filterCargo = (val, update) => {
  update(() => {
    const list = store.cargos.map(c => c.nombre);
    if (!val) {
      cargoOptions.value = list;
    } else {
      const needle = val.toLowerCase();
      cargoOptions.value = list.filter(v => v.toLowerCase().indexOf(needle) > -1);
    }
  });
};

watch(() => props.persona, (newVal) => {
  if (newVal) {
    form.nombres = newVal.nombres || '';
    form.primer_apellido = newVal.primer_apellido || '';
    form.segundo_apellido = newVal.segundo_apellido || '';
    form.documento_identidad = newVal.documento_identidad || '';
    form.fecha_nacimiento = newVal.fecha_nacimiento || '';
    form.sexo_id = newVal.sexo_id || 1;
    form.sede_id = newVal.sede_id || newVal.sede?.id || null;
    form.tipo_contrato_id = newVal.tipo_contrato_id || null;
    form.cargo_id = newVal.cargo_id || null;
    form.cargo_nombre = newVal.cargo || '';
    form.codigo_archivo = newVal.codigo_archivo || '';
    form.numero_unico = newVal.numero_unico || '';
    form.cajon_id = newVal.cajon_id || null;
    form.comentario = '';

    selectedCargo.value = newVal.cargo || null;

    // Buscar el mueble actual
    if (newVal.cajon && newVal.cajon.mueble_id) {
      selectedMueble.value = store.muebles.find(m => m.id === newVal.cajon.mueble_id) || null;
    } else {
      selectedMueble.value = null;
    }
  }
}, { immediate: true });

const handleSubmit = async () => {
  loading.value = true;

  if (selectedCargo.value) {
    if (typeof selectedCargo.value === 'object' && selectedCargo.value.id) {
      form.cargo_id = selectedCargo.value.id;
      form.cargo_nombre = selectedCargo.value.nombre;
    } else if (typeof selectedCargo.value === 'string') {
      const existing = store.cargos.find(c => c.nombre.toLowerCase() === selectedCargo.value.trim().toLowerCase());
      if (existing) {
        form.cargo_id = existing.id;
        form.cargo_nombre = existing.nombre;
      } else {
        form.cargo_id = null;
        form.cargo_nombre = selectedCargo.value.trim();
      }
    }
  }

  const res = await store.updatePersonal(props.persona.id, { ...form });
  loading.value = false;

  if (res.success) {
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: 'Ficha de personal actualizada correctamente'
    });
    emit('updated');
    emit('update:modelValue', false);
  } else {
    $q.notify({
      type: 'negative',
      icon: 'warning',
      message: res.message || 'Error al actualizar información'
    });
  }
};
</script>
