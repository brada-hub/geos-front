<template>
  <q-item
    clickable
    :tag="props.link.startsWith('http') ? 'a' : 'div'"
    :target="props.link.startsWith('http') ? '_blank' : undefined"
    :href="props.link.startsWith('http') ? props.link : undefined"
    :to="!props.link.startsWith('http') ? props.link : undefined"
  >
    <q-item-section v-if="props.icon" avatar>
      <q-icon :name="props.icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ props.title }}</q-item-label>
      <q-item-label caption>{{ props.caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },

  caption: {
    type: String,
    default: '',
  },

  link: {
    type: String,
    default: '#',
  },

  icon: {
    type: String,
    default: '',
  },
})
</script>
