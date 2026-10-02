<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 380px; max-width: 440px; border-radius: 12px">
      <q-card-section class="bg-primary text-white row items-center justify-between">
        <div class="row items-center q-gutter-sm">
          <q-icon name="view_week" size="24px" />
          <div class="text-h6 font-weight-bold">Nuevo Archivador</div>
        </div>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="form.nombre"
            outlined
            dense
            label="Nombre o Etiqueta del archivador"
            placeholder="Ej: Archivador 1, Torre A, Gabetero RRHH"
            hint="Nombre visible para identificar este mueble"
            :rules="[val => !!val && val.trim().length > 0 || 'Debes ingresar un nombre']"
            autofocus
          >
            <template v-slot:prepend>
              <q-icon name="badge" color="primary" />
            </template>
          </q-input>

          <div>
            <div class="text-caption text-weight-medium text-grey-8 q-mb-xs">
              Número de Gavetas (Cajones verticales):
            </div>
            <div class="row q-gutter-xs q-mb-sm">
              <q-btn
                v-for="n in [2, 3, 4, 5]"
                :key="n"
                :label="`${n} Gavetas`"
                :color="form.filas === n ? 'primary' : 'grey-3'"
                :text-color="form.filas === n ? 'white' : 'dark'"
                unelevated
                dense
                class="col"
                @click="form.filas = n"
              />
            </div>
          </div>

          <!-- Mini previsualización de la torre de gavetas -->
          <div class="q-pa-sm bg-grey-2 rounded-borders text-center">
            <div class="text-caption text-grey-7 q-mb-xs">Previsualización (Torre de {{ form.filas }} gavetas)</div>
            <div class="column q-gutter-xs items-center">
              <div
                v-for="i in form.filas"
                :key="i"
                class="bg-blue-grey-8 text-white text-caption row items-center justify-center rounded-borders"
                style="width: 140px; height: 26px; border: 1px solid #1c2833; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2)"
              >
                <div style="width: 20px; height: 3px; background: #cfd8dc; border-radius: 2px" class="q-mr-xs"></div>
                Gaveta {{ i }}
              </div>
            </div>
          </div>

          <!-- Opciones avanzadas (oculto por defecto) -->
          <q-expansion-item
            dense
            dense-toggle
            expand-separator
            icon="settings"
            label="Opciones avanzadas (Columnas)"
            header-class="text-caption text-grey-7"
          >
            <div class="row q-col-gutter-sm q-pt-sm">
              <q-input
                v-model.number="form.filas"
                type="number"
                outlined
                dense
                label="Filas (Gavetas)"
                class="col-6"
                min="1"
                max="10"
              />
              <q-input
                v-model.number="form.columnas"
                type="number"
                outlined
                dense
                label="Columnas"
                class="col-6"
                min="1"
                max="5"
                hint="1 para torre vertical"
              />
            </div>
          </q-expansion-item>

          <div class="row justify-end q-gutter-sm q-pt-sm">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn
              color="primary"
              icon="add"
              label="Crear Archivador"
              type="submit"
              :loading="loading"
              unelevated
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';

const $q = useQuasar();
const store = useGeosStore();

defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

const form = reactive({
  nombre: '',
  filas: 4,
  columnas: 1,
  sede_id: 1
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  const success = await store.createMueble({ ...form });
  loading.value = false;
  if (success) {
    $q.notify({
      type: 'positive',
      icon: 'check_circle',
      message: `Archivador "${form.nombre}" creado con ${form.filas} gavetas.`
    });
    emit('update:modelValue', false);
    // Reset form
    form.nombre = '';
    form.filas = 4;
    form.columnas = 1;
  } else {
    $q.notify({
      type: 'negative',
      message: 'Error al crear el archivador. Revisa que el backend esté funcionando.'
    });
  }
};
</script>
