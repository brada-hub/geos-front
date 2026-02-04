<template>
  <div class="kardex-header row items-center justify-between q-mb-lg">
    <div class="col">
      <div class="text-h4 text-weight-bold text-grey-9">Mapa de Kardex</div>
      <div class="text-caption text-grey-6">Sistema de Gestión Documental</div>
    </div>

    <div class="col-auto row q-gutter-sm">
      <q-btn color="primary" icon="add" label="Nuevo Mueble" @click="$emit('add-mueble')" />
      <q-btn color="secondary" icon="person_add" label="Nuevo Registro" @click="$emit('add-empleado')" />
    </div>
  </div>
</template>

<script setup>
defineEmits(['add-mueble', 'add-empleado']);
</script>
