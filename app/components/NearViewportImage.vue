<script setup lang="ts">
// Keep the original URL, attributes, dimensions and CSS rendering.
const props = defineProps<{ src: string }>()
const { target, ready } = useNearViewport()
</script>

<template>
  <img ref="target" :src="ready ? props.src : undefined" :data-deferred-src="props.src" loading="lazy" />
</template>
