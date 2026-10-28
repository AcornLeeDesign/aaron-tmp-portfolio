<script setup lang="ts">
import images from '~/data/losslessImages.json'

const props = defineProps<{ src: string }>()
const imageRef = ref<HTMLImageElement>()
const failedSource = ref<string>()
const asset = computed(() => images[props.src as keyof typeof images])
const source = computed(() => failedSource.value === props.src ? props.src : asset.value?.src ?? props.src)

onMounted(() => {
  // An eager SSR image can fail before hydration attaches the error listener.
  if (imageRef.value?.complete && imageRef.value.naturalWidth === 0) failedSource.value = props.src
})
</script>

<template>
  <!-- Keep the original PNG as a fallback; all WebPs preserve the exact RGBA pixels. -->
  <img ref="imageRef" :src="source" :width="asset?.width" :height="asset?.height" @error="failedSource = src" />
</template>
