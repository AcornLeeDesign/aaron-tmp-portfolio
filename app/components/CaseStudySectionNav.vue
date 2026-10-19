<script setup lang="ts" generic="T extends string">
defineProps<{
  sections: Array<{ id: T, label: string }>
  activeSection: T
  label: string
}>()
const emit = defineEmits<{ select: [id: T] }>()
const navRef = ref<HTMLElement | null>(null)
const glowStyle = ref<Record<string, string>>({})
let pointerX = 0
let pointerY = 0
let hasPointer = false
let frame: number | undefined
let hoverQuery: MediaQueryList | undefined

function updateGlow() {
  frame = undefined
  const nav = navRef.value
  if (!nav || !hasPointer || !hoverQuery?.matches) {
    glowStyle.value = { opacity: '0' }
    return
  }
  const bounds = nav.getBoundingClientRect()
  const reach = Number.parseFloat(getComputedStyle(nav).getPropertyValue('--case-section-nav-proximity'))
  const dx = Math.max(bounds.left - pointerX, 0, pointerX - bounds.right)
  const dy = Math.max(bounds.top - pointerY, 0, pointerY - bounds.bottom)
  const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / reach)
  glowStyle.value = {
    '--case-nav-pointer-x': `${pointerX}px`,
    '--case-nav-pointer-y': `${pointerY}px`,
    opacity: String(proximity * proximity * (3 - 2 * proximity)),
  }
}

function scheduleGlow() {
  if (frame === undefined) frame = requestAnimationFrame(updateGlow)
}

function trackPointer(event: PointerEvent) {
  hasPointer = event.pointerType !== 'touch'
  pointerX = event.clientX
  pointerY = event.clientY
  scheduleGlow()
}

function hideGlow() {
  hasPointer = false
  scheduleGlow()
}

onMounted(() => {
  hoverQuery = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
  hoverQuery.addEventListener('change', hideGlow)
  window.addEventListener('pointermove', trackPointer, { passive: true })
  window.addEventListener('scroll', scheduleGlow, { passive: true })
  window.addEventListener('resize', scheduleGlow, { passive: true })
  window.addEventListener('blur', hideGlow)
  document.documentElement.addEventListener('pointerleave', hideGlow)
})

onBeforeUnmount(() => {
  hoverQuery?.removeEventListener('change', hideGlow)
  window.removeEventListener('pointermove', trackPointer)
  window.removeEventListener('scroll', scheduleGlow)
  window.removeEventListener('resize', scheduleGlow)
  window.removeEventListener('blur', hideGlow)
  document.documentElement.removeEventListener('pointerleave', hideGlow)
  if (frame !== undefined) cancelAnimationFrame(frame)
})
</script>

<template>
  <Teleport to="body">
    <div class="case-section-nav-glow" :style="glowStyle" aria-hidden="true" />
    <div ref="navRef" class="case-section-nav">
      <nav class="case-section-nav__links" :aria-label="label">
        <a
          v-for="section in sections"
          :key="section.id"
          :href="`#${section.id}`"
          class="case-section-nav__link"
          :aria-current="activeSection === section.id ? 'location' : undefined"
          @click="emit('select', section.id)"
        >
          {{ section.label }}
        </a>
      </nav>
    </div>
  </Teleport>
</template>

<style scoped>
.case-section-nav-glow { display: none; }

@media (min-width: 1024px) and (hover: hover) and (pointer: fine) {
  .case-section-nav-glow {
    /* Outside the scrolling, difference-blended nav so the white glow stays white. */
    --case-section-nav-glow-size: calc(var(--pointer-glow-size) * 1.6);
    display: block;
    position: fixed;
    z-index: 3;
    left: var(--case-nav-pointer-x, 0);
    top: var(--case-nav-pointer-y, 0);
    width: var(--case-section-nav-glow-size);
    height: var(--case-section-nav-glow-size);
    background-color: var(--color-text);
    background-image: var(--pointer-glow-texture);
    background-size: var(--space-16) var(--space-16);
    background-blend-mode: multiply;
    -webkit-mask-image: var(--pointer-glow-mask);
    mask-image: var(--pointer-glow-mask);
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -50%);
    transition: opacity var(--transition-fast);
  }
}

.case-section-nav {
  /* Equal 32px inset from the bottom and left edges. */
  --case-section-nav-edge: var(--space-8);
  --case-section-nav-proximity: var(--space-24);
  --case-section-nav-active-offset: var(--space-2);
  position: fixed;
  z-index: 4;
  bottom: var(--case-section-nav-edge);
  left: var(--case-section-nav-edge);
  /* Reserve room for the active link inside the scroll container. */
  width: calc(var(--project-metadata-width) + var(--case-section-nav-active-offset));
  max-height: calc(100dvh - var(--layout-header-clearance) - var(--space-m) - var(--case-section-nav-edge));
  overflow-y: auto;
  scrollbar-width: none;
  /* Blend against page media, matching the carousel hover cursor. */
  mix-blend-mode: difference;
}

.case-section-nav::-webkit-scrollbar { display: none; }

.case-section-nav__links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xs);
}

.case-section-nav__link {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  /* White gives difference blending the strongest inversion. */
  color: var(--color-text);
  opacity: 0.85;
  font-family: var(--font-sans);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  white-space: nowrap;
  transform: translateX(0);
  transition:
    opacity var(--transition-fast),
    transform var(--transition-base),
    font-size var(--transition-base),
    font-weight var(--transition-base),
    line-height var(--transition-base);
}

.case-section-nav__link:hover,
.case-section-nav__link:focus-visible,
.case-section-nav__link[aria-current="location"] { opacity: 1; }
.case-section-nav__link[aria-current="location"] {
  transform: translateX(var(--case-section-nav-active-offset));
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
}
.case-section-nav__link:focus-visible { outline: 1px solid currentColor; outline-offset: var(--space-xxs); }

@media (max-width: 1023px) {
  .case-section-nav { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .case-section-nav__link,
  .case-section-nav-glow { transition: none; }
}
</style>
