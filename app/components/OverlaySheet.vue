<script setup lang="ts">
import { XMarkIcon } from '@heroicons/vue/24/outline'

defineProps<{ id: string, label: string, closeLabel: string }>()

const dialog = ref<HTMLDialogElement | null>(null)
const scroller = ref<HTMLElement | null>(null)
const content = ref<HTMLElement | null>(null)
const clippedAbove = ref(false)
const clippedBelow = ref(false)
const pointerInput = ref(false)
const route = useRoute()
let resizeObserver: ResizeObserver | undefined
let previousOverflow: string | undefined
let opener: HTMLElement | null = null
let pointerStartedOutside = false

function onPointerInput() {
  pointerInput.value = true
}

function onKeyboardInput(event: KeyboardEvent) {
  if (event.metaKey || event.altKey || event.ctrlKey) return
  pointerInput.value = false
}

function updateClipping() {
  const element = scroller.value
  if (!dialog.value?.open || !element) return
  // Allow for fractional scroll positions and rounded scrollHeight values.
  clippedAbove.value = element.scrollTop > 1
  clippedBelow.value = element.scrollHeight - element.clientHeight - element.scrollTop > 1
}

function open() {
  if (!dialog.value || dialog.value.open) return
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.documentElement.style.overflow
  document.documentElement.style.overflow = 'hidden'
  dialog.value.showModal()
  if (scroller.value) scroller.value.scrollTop = 0
  updateClipping()
}

function restorePage() {
  if (previousOverflow === undefined) return
  document.documentElement.style.overflow = previousOverflow
  previousOverflow = undefined
  opener?.focus({ preventScroll: true })
  opener = null
}

function close() {
  dialog.value?.close()
  restorePage()
}

function isOutside(event: PointerEvent | MouseEvent) {
  if (event.target !== dialog.value || !dialog.value) return false
  const rect = dialog.value.getBoundingClientRect()
  return event.clientX < rect.left || event.clientX > rect.right
    || event.clientY < rect.top || event.clientY > rect.bottom
}

function onBackdropClick(event: MouseEvent) {
  if (pointerStartedOutside && isOutside(event)) close()
  pointerStartedOutside = false
}

watch(() => route.fullPath, close)
onMounted(() => {
  // Track the opener's input too: Safari shows :focus-visible on dialog
  // autofocus even after a tap. Keep focus, but hide its ring for pointer input.
  document.addEventListener('pointerdown', onPointerInput, true)
  document.addEventListener('keydown', onKeyboardInput, true)
  resizeObserver = new ResizeObserver(updateClipping)
  if (scroller.value) resizeObserver.observe(scroller.value)
  if (content.value) resizeObserver.observe(content.value)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerInput, true)
  document.removeEventListener('keydown', onKeyboardInput, true)
  resizeObserver?.disconnect()
  restorePage()
})
defineExpose({ open })
</script>

<template>
  <Teleport to="body">
    <dialog
      :id="id"
      ref="dialog"
      class="overlay-sheet"
      :class="{ 'overlay-sheet--pointer-input': pointerInput }"
      :aria-label="label"
      @close="restorePage"
      @cancel.prevent="close"
      @pointerdown="pointerStartedOutside = isOutside($event)"
      @click="onBackdropClick"
    >
      <button class="overlay-sheet__close" type="button" :aria-label="closeLabel" autofocus @click="close">
        <XMarkIcon aria-hidden="true" />
      </button>
      <div ref="scroller" class="overlay-sheet__scroller" tabindex="0" :aria-label="`${label} content`" @scroll.passive="updateClipping">
        <div ref="content" class="overlay-sheet__content">
          <slot :close="close" />
        </div>
      </div>
      <div class="overlay-sheet__fade overlay-sheet__fade--top" :class="{ 'overlay-sheet__fade--visible': clippedAbove }" aria-hidden="true" />
      <div class="overlay-sheet__fade overlay-sheet__fade--bottom" :class="{ 'overlay-sheet__fade--visible': clippedBelow }" aria-hidden="true" />
    </dialog>
  </Teleport>
</template>

<style scoped>
.overlay-sheet {
  width: min(var(--overlay-sheet-width), calc(100% - var(--space-m) * 2));
  max-width: none;
  max-height: calc(100dvh - var(--space-m) * 2);
  margin: auto;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-xs);
  background: var(--overlay-sheet-background);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
}

.overlay-sheet[open] {
  display: flex;
  flex-direction: column;
  animation: overlay-sheet-enter 250ms ease-out;
}

.overlay-sheet__scroller {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.overlay-sheet__scroller::-webkit-scrollbar { display: none; }
.overlay-sheet__scroller:focus-visible { outline: 1px solid var(--color-subdued); outline-offset: -1px; }

.overlay-sheet__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-10);
  padding: var(--space-10);
}

.overlay-sheet__fade {
  position: absolute;
  z-index: 1;
  right: 0;
  left: 0;
  height: var(--space-10);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
}

.overlay-sheet__fade--top {
  top: 0;
  background: linear-gradient(to bottom, var(--overlay-sheet-background), transparent);
}

.overlay-sheet__fade--bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--overlay-sheet-background), transparent);
}

.overlay-sheet__fade--visible { opacity: 1; }

.overlay-sheet::backdrop {
  /* Older browsers do not inherit custom properties into ::backdrop. */
  --overlay-sheet-backdrop: rgb(0 0 0 / 65%);
  background: var(--overlay-sheet-backdrop);
  animation: overlay-backdrop-enter 250ms ease-out;
}

.overlay-sheet__close {
  position: absolute;
  z-index: 2;
  top: var(--space-xs);
  right: var(--space-xs);
  display: grid;
  place-items: center;
  width: var(--control-height);
  height: var(--control-height);
  padding: 0;
  border: 0;
  border-radius: var(--radius-xs);
  background: var(--overlay-sheet-background);
  color: inherit;
  cursor: pointer;
}

.overlay-sheet__close svg { width: var(--icon-size-m); height: var(--icon-size-m); }
.overlay-sheet__close:hover { background: var(--color-nav-surface-hover); }
.overlay-sheet__close:focus-visible { outline: 1px solid currentColor; }
.overlay-sheet--pointer-input .overlay-sheet__close:focus { outline: none; }
@media (max-width: 639px) {
  .overlay-sheet__content { padding: var(--space-10) var(--space-xl) var(--space-xl); }
}

@keyframes overlay-sheet-enter {
  from { opacity: 0; transform: translateY(var(--space-xl)); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes overlay-backdrop-enter { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .overlay-sheet[open], .overlay-sheet::backdrop { animation: none; }
  .overlay-sheet__fade { transition: none; }
}
</style>
