<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

onMounted(() => {
  const savedDarkMode = localStorage.getItem('docus_dark_mode');
  if (savedDarkMode !== null) {
    $q.dark.set(savedDarkMode === 'true');
  }
});
</script>
