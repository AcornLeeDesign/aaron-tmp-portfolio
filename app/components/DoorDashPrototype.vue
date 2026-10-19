<script setup lang="ts">
defineProps<{
  clip?: string
  screenImage?: string
  screenAlt?: string
  screenViewBox?: string
  caption: string
  hideCaption?: boolean
  playbackGroup?: string
}>()
</script>

<template>
  <figure class="prototype" :class="{ 'prototype--current': (clip && clip !== 'before') || screenImage?.endsWith('/alert-after.png') }">
    <div class="prototype__stage">
      <div class="prototype__device">
        <img class="prototype__shell" src="/images/case-studies/doordash/pos-mockup-transparent.svg" alt="" loading="lazy" width="1530" height="1008" />
        <div v-if="clip" class="prototype__screen prototype__screen--video">
          <div class="prototype__video-content">
            <VideoPlayer case-study :playback-group="playbackGroup" class="prototype__video" :src="`/videos/doordash/${clip}.mp4`" :aria-label="caption" />
          </div>
        </div>
        <!-- Display the screen region of the original export without its baked-in white surround. -->
        <svg v-else-if="screenImage" class="prototype__screen" :viewBox="screenViewBox" preserveAspectRatio="none" role="img" :aria-label="screenAlt || caption">
          <image :href="screenImage" width="920" height="638" />
        </svg>
      </div>
    </div>
    <figcaption v-if="!hideCaption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.prototype {
  /* Match the opaque background in the original Figma mockup export. */
  --prototype-background: #191919;
  --prototype-screen-background: #000;
  --prototype-inset: var(--space-12);
  /* Reserve space for site navigation, the stage inset, and the caption. */
  --prototype-device-height: max(var(--space-24), calc(100svh - var(--layout-header-clearance) - var(--space-24) - var(--prototype-inset)));
  width: 100%;
  margin: 0;
}
.prototype--current { --prototype-background: #f7f7f7; }
.prototype__stage { display: flex; justify-content: center; padding: var(--prototype-inset) var(--prototype-inset) 0; overflow: hidden; background: var(--prototype-background); border-radius: var(--case-study-surface-radius); }
.prototype__device { position: relative; width: min(100%, calc(var(--prototype-device-height) * 1530 / 1008)); }
.prototype__shell { width: 100%; height: auto; }
/* Screen aperture measured from the exported Figma mockup, node 22216:14933.
   Percentage geometry keeps the original bezel and stand intact at every size. */
.prototype__screen { position: absolute; left: 1.634%; top: 5.555%; width: 96.732%; height: 82.54%; object-fit: fill; }
.prototype__screen--video { display: flex; align-items: center; overflow: hidden; background: var(--prototype-screen-background); }
.prototype__video-content { position: relative; width: 100%; height: 100%; overflow: hidden; }
.prototype__video { display: block; width: 100%; height: 100%; object-fit: contain; }
figcaption { width: min(var(--content-copy-width), 100%); margin: var(--space-xs) auto 0; color: var(--color-subdued); font-family: var(--font-mono-ui); font-size: var(--font-size-s); line-height: var(--line-height-body); text-align: left; }
@media (max-width: 639px) { .prototype { --prototype-inset: var(--space-s); } }
</style>
