<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="min-width: 400px">
      <q-card-section class="bg-secondary text-white">
        <div class="text-h6">Nuevo Expediente</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="handleSubmit" class="q-gutter-md">
          <q-input
            v-model="form.numero_unico"
            outlined
            label="Número único (ID)"
            placeholder="Ej: 001"
          />
          <q-input
            v-model="form.codigo_archivo"
            outlined
            label="Código de archivo"
            :rules="[val => !!val || 'Requerido']"
          />
          <q-input
            v-model="form.nombre_completo"
            outlined
            label="Nombre completo"
            :rules="[val => !!val || 'Requerido']"
          />
          <q-select
            v-model="selectedMueble"
            :options="muebles"
            option-label="nombre"
            outlined
            label="Mueble"
          />
          <q-select
            v-if="selectedMueble"
            v-model="form.cajon_id"
            :options="selectedMueble.cajones"
            option-value="id"
            :option-label="opt => `F${opt.fila} C${opt.columna}`"
            emit-value
            map-options
            outlined
            label="Gaveta"
          />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancelar" @click="$emit('update:modelValue', false)" />
            <q-btn color="secondary" label="Registrar" type="submit" :loading="loading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useGeosStore } from 'src/stores/geosStore';

const $q = useQuasar();
const store = useGeosStore();

defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

const muebles = computed(() => store.muebles);
const selectedMueble = ref(null);

const form = reactive({
  numero_unico: '',
  codigo_archivo: '',
  nombre_completo: '',
  cargo: '',
  cajon_id: null
});

const loading = ref(false);

const handleSubmit = async () => {
  loading.value = true;
  const success = await store.createEmpleado({ ...form });
  loading.value = false;
  if (success) {
    $q.notify({ type: 'positive', message: 'Expediente registrado' });
    emit('update:modelValue', false);
    // Reset form
    form.numero_unico = '';
    form.codigo_archivo = '';
    form.nombre_completo = '';
    form.cajon_id = null;
    selectedMueble.value = null;
  }
};
</script>
