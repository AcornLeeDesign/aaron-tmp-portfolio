<script setup lang="ts">
const renders = [5, 7, 3, 4, 8]
const track = ref<HTMLElement | null>(null)
const active = ref(0)
function updateActive() {
  if (!track.value) return
  const bounds = track.value.getBoundingClientRect()
  const slides = Array.from(track.value.children) as HTMLElement[]
  active.value = slides.reduce((closest, slide, index) =>
    Math.abs(slide.getBoundingClientRect().left - bounds.left) < Math.abs(slides[closest]!.getBoundingClientRect().left - bounds.left) ? index : closest, 0)
}
function goTo(index: number) {
  const el = track.value
  const slide = el?.children[index] as HTMLElement | undefined
  if (!el || !slide) return
  el.scrollBy({ left: slide.getBoundingClientRect().left - el.getBoundingClientRect().left, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}
</script>

<template>
  <figure class="art-carousel" aria-label="DoorDash art direction renders" aria-roledescription="carousel">
    <div ref="track" class="art-carousel__track" tabindex="0" aria-label="Scroll through five renders" @scroll.passive="updateActive" @keydown.right.prevent="goTo(Math.min(active + 1, renders.length - 1))" @keydown.left.prevent="goTo(Math.max(active - 1, 0))">
      <div v-for="(render, index) in renders" :key="render" class="art-carousel__slide" role="group" aria-roledescription="slide" :aria-label="`${index + 1} of ${renders.length}`">
        <CaseStudyImage :src="`/images/case-studies/doordash/art-direction/render_${render}.png`" :alt="`DoorDash POS art direction — Blender render ${render}`" :width="render === 5 ? 2560 : 2160" :height="render === 5 ? 1920 : 2700" loading="lazy" />
      </div>
    </div>
    <figcaption class="art-carousel__footer">
      <span class="art-carousel__caption">Fig. 17. Art direction explorations in Blender.</span>
      <div class="art-carousel__controls">
        <HeaderNavButton as="button" type="button" class="art-carousel__button" aria-label="Previous render" :disabled="active === 0" @click="goTo(active - 1)"><span class="art-carousel__arrow art-carousel__arrow--back" /></HeaderNavButton>
        <span aria-live="polite">{{ active + 1 }} / {{ renders.length }}</span>
        <HeaderNavButton as="button" type="button" class="art-carousel__button" aria-label="Next render" :disabled="active === renders.length - 1" @click="goTo(active + 1)"><span class="art-carousel__arrow" /></HeaderNavButton>
      </div>
    </figcaption>
  </figure>
</template>

<style scoped>
.art-carousel { width: 100%; min-width: 0; }
.art-carousel__track { display: flex; --art-carousel-gap: var(--space-xl); gap: var(--art-carousel-gap); overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: thin; padding-bottom: var(--space-m); }
.art-carousel__slide { flex: 0 0 auto; scroll-snap-align: start; }
/* Consistent image height keeps both portrait and landscape compositions uncropped. */
.art-carousel__slide img { display: block; height: min(65svh, 60vw); width: auto; border-radius: var(--case-study-surface-radius); }
.art-carousel__track::after { content: ''; flex: 0 0 max(0px, calc(100% - min(65svh, 60vw) * .8 - var(--art-carousel-gap))); }
.art-carousel__footer { display: flex; align-items: center; justify-content: space-between; gap: var(--space-m); width: min(var(--content-copy-width), 100%); margin: var(--space-xs) auto 0; line-height: var(--line-height-body); color: var(--color-subdued); font-family: var(--font-mono-ui); font-size: var(--font-size-s); }
.art-carousel__caption { flex: 1; min-width: 0; }
.art-carousel__controls { display: flex; align-items: center; gap: var(--space-s); flex-shrink: 0; }
.art-carousel__button { width: var(--control-height); padding: 0; }
.art-carousel__button:disabled { opacity: .3; cursor: default; pointer-events: none; }
.art-carousel__arrow { display: block; width: var(--icon-size-m); height: var(--icon-size-m); background: currentColor; mask: url('/images/case-studies/doordash/arrow-thin.svg') center / contain no-repeat; }
.art-carousel__arrow--back { transform: rotate(180deg); }
.art-carousel__track:focus-visible, .art-carousel__button:focus-visible { outline: 1px solid var(--color-text); outline-offset: var(--space-1); }
@media (max-width: 639px) { .art-carousel__track { --art-carousel-gap: var(--space-m); } }
</style>
