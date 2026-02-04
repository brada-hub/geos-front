<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 350px">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Nuevo Mueble</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="form.nombre"
            outlined
            label="Nombre del mueble"
            :rules="[val => !!val || 'Requerido']"
          />
          <div class="row q-col-gutter-sm">
            <q-input
              v-model.number="form.filas"
              type="number"
              outlined
              label="Filas"
              class="col-6"
            />
            <q-input
              v-model.number="form.columnas"
              type="number"
              outlined
              label="Columnas"
              class="col-6"
            />
          </div>
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancelar" @click="$emit('update:modelValue', false)" />
            <q-btn color="primary" label="Crear" type="submit" :loading="loading" />
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
  columnas: 5,
  sede_id: 1
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  const success = await store.createMueble({ ...form });
  loading.value = false;
  if (success) {
    $q.notify({ type: 'positive', message: 'Mueble creado correctamente' });
    emit('update:modelValue', false);
    // Reset form
    form.nombre = '';
    form.filas = 4;
    form.columnas = 5;
  }
};
</script>
