<script setup lang="ts">
const track = ref<HTMLElement | null>(null)
const thumbHeight = ref(0)
const thumbTop = ref(0)
const progress = ref(0)
const hasOverflow = ref(false)
const active = ref(false)
const hovered = ref(false)
const focused = ref(false)
const dragging = ref(false)
const route = useRoute()
let hideTimer: ReturnType<typeof setTimeout> | undefined
let frame: number | undefined
let observer: ResizeObserver | undefined
let dragOffset = 0
let maxScroll = 0
let travel = 0

function reveal() {
  active.value = true
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => { active.value = false }, 1100)
}

function measure() {
  frame = undefined
  const el = track.value
  if (!el) return
  const height = el.clientHeight
  const pageHeight = document.documentElement.scrollHeight
  maxScroll = Math.max(0, pageHeight - window.innerHeight)
  hasOverflow.value = maxScroll > 1
  const minimum = parseFloat(getComputedStyle(el).getPropertyValue('--scrollbar-thumb-min-height'))
  thumbHeight.value = Math.min(height, Math.max(minimum, height * window.innerHeight / pageHeight))
  travel = height - thumbHeight.value
  progress.value = maxScroll ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0
  thumbTop.value = progress.value * travel
}

function scheduleMeasure() {
  if (frame === undefined) frame = requestAnimationFrame(measure)
}

function onScroll() {
  reveal()
  scheduleMeasure()
}

function scrollFromPointer(event: PointerEvent) {
  if (!track.value || !travel) return
  const position = event.clientY - track.value.getBoundingClientRect().top - dragOffset
  window.scrollTo({ top: Math.min(1, Math.max(0, position / travel)) * maxScroll, behavior: 'instant' })
}

function startDrag(event: PointerEvent) {
  if (event.button !== 0) return
  event.preventDefault()
  measure()
  const top = track.value!.getBoundingClientRect().top
  const localY = event.clientY - top
  dragOffset = localY >= thumbTop.value && localY <= thumbTop.value + thumbHeight.value
    ? localY - thumbTop.value : thumbHeight.value / 2
  dragging.value = true
  track.value!.setPointerCapture(event.pointerId)
  reveal()
  scrollFromPointer(event)
}

function endDrag() {
  dragging.value = false
  reveal()
}

function onKeydown(event: KeyboardEvent) {
  const pageStep = window.innerHeight * 0.9
  const targets: Record<string, number> = {
    ArrowDown: window.scrollY + window.innerHeight * 0.05,
    ArrowUp: window.scrollY - window.innerHeight * 0.05,
    PageDown: window.scrollY + pageStep,
    PageUp: window.scrollY - pageStep,
    Home: 0,
    End: maxScroll,
  }
  if (!(event.key in targets)) return
  event.preventDefault()
  window.scrollTo({ top: targets[event.key], behavior: 'instant' })
  reveal()
}

watch(() => route.path, () => { scheduleMeasure(); reveal() })
onMounted(() => {
  measure()
  reveal()
  observer = new ResizeObserver(scheduleMeasure)
  observer.observe(document.body)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', scheduleMeasure, { passive: true })
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(hideTimer)
  if (frame !== undefined) cancelAnimationFrame(frame)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', scheduleMeasure)
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="track"
      class="case-scrollbar"
      :class="{ 'case-scrollbar--visible': hasOverflow && (active || hovered || focused || dragging), 'case-scrollbar--empty': !hasOverflow }"
      role="scrollbar"
      aria-label="Case study scroll position"
      aria-controls="main-content"
      aria-orientation="vertical"
      :aria-valuenow="Math.round(progress * 100)"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :tabindex="hasOverflow ? 0 : -1"
      @pointerenter="hovered = true"
      @pointerleave="hovered = false"
      @pointerdown="startDrag"
      @pointermove="dragging && scrollFromPointer($event)"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @lostpointercapture="dragging = false"
      @focus="focused = true"
      @blur="focused = false"
      @keydown="onKeydown"
    >
      <span class="case-scrollbar__thumb" :style="{ height: `${thumbHeight}px`, transform: `translateY(${thumbTop}px)` }" />
    </div>
  </Teleport>
</template>

<style scoped>
.case-scrollbar {
  --scrollbar-thumb-min-height: var(--space-8);
  position: fixed;
  z-index: 30;
  top: var(--space-xxs);
  right: 0;
  bottom: var(--space-xxs);
  width: var(--space-s);
  opacity: 0;
  touch-action: none;
  user-select: none;
  transition: opacity var(--transition-base);
}
.case-scrollbar--visible { opacity: 1; }
.case-scrollbar--empty { pointer-events: none; }
.case-scrollbar:focus-visible { outline: 1px solid var(--color-subdued); outline-offset: -1px; }
.case-scrollbar__thumb {
  display: block;
  width: var(--scrollbar-height);
  margin-inline: auto;
  border-radius: var(--radius-pill);
  background: var(--color-subdued);
}
@media (prefers-reduced-motion: reduce) {
  .case-scrollbar { transition: none; }
}
</style>
