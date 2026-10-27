<script setup lang="ts">
import images from '~/data/caseStudyImages.json'

const props = defineProps<{ src: string, deferred?: boolean, sizes?: string }>()
const { target, ready } = useNearViewport()
const failedSource = ref<string>()
const asset = computed(() => images[props.src as keyof typeof images])
const enabled = computed(() => !props.deferred || ready.value)
const fallback = computed(() => failedSource.value === props.src)
const source = computed(() => fallback.value ? asset.value?.src ?? props.src : asset.value?.webpSrc ?? props.src)
const sourceSet = computed(() => fallback.value ? asset.value?.fallback : asset.value?.webp)

onMounted(() => {
  // Eager SSR images can fail before hydration installs the error handler.
  const image = target.value as HTMLImageElement | undefined
  if (image?.getAttribute('src') && image.complete && image.naturalWidth === 0) failedSource.value = props.src
})
</script>

<template>
  <!-- Keep img as the root to preserve the existing grid, crop and scoped CSS.
       Failed/unsupported WebP switches both src and srcset to JPEG/PNG. -->
  <img
    ref="target"
    :src="enabled ? source : undefined"
    :srcset="enabled ? sourceSet : undefined"
    :sizes="sizes ?? asset?.sizes"
    :width="asset?.width"
    :height="asset?.height"
    :data-deferred-src="deferred ? asset?.src ?? src : undefined"
    @error="failedSource = src"
  />
</template>

<style scoped>
/* Intrinsic dimensions reserve the aspect ratio without making a responsive
   image keep its HTML height. Existing cover/frame/carousel rules take priority. */
:where(img) { height: auto; }
</style>
