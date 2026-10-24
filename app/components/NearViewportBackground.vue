<script setup lang="ts">
const props = defineProps<{ src: string }>()
const { target, ready } = useNearViewport()
</script>

<template>
  <div ref="target" :style="ready ? { backgroundImage: `url(${JSON.stringify(props.src)})` } : undefined">
    <slot />
  </div>
</template>
