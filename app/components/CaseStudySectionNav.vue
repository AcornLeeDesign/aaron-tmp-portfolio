<script setup lang="ts" generic="T extends string">
import { ChevronUpIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  sections: Array<{ id: T, label: string }>
  activeSection: T
  label: string
}>()
const emit = defineEmits<{ select: [id: T] }>()
const navRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const panelId = useId()
const activeLabel = computed(() => props.sections.find(section => section.id === props.activeSection)?.label ?? 'Sections')

function close(restoreFocus = false) {
  isOpen.value = false
  if (restoreFocus) navRef.value?.querySelector<HTMLButtonElement>('button')?.focus()
}

async function openWithKeyboard() {
  isOpen.value = true
  await nextTick()
  const panel = navRef.value?.querySelector('nav')
  ;(panel?.querySelector<HTMLAnchorElement>('[aria-current]') ?? panel?.querySelector('a'))?.focus()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    close(true)
    return
  }
  if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const links = Array.from(navRef.value?.querySelectorAll<HTMLAnchorElement>('nav a') ?? [])
  const index = links.indexOf(document.activeElement as HTMLAnchorElement)
  if (index < 0) { void openWithKeyboard(); return }
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1
    : (index + (event.key === 'ArrowUp' ? -1 : 1) + links.length) % links.length
  links[next]?.focus()
}

function handleOutsidePointer(event: PointerEvent) {
  if (!navRef.value?.contains(event.target as Node)) close()
}

function handleFocusout(event: FocusEvent) {
  if (!navRef.value?.contains(event.relatedTarget as Node | null)) close()
}

function selectSection(id: T) {
  emit('select', id)
  close(true)
}

onMounted(() => document.addEventListener('pointerdown', handleOutsidePointer))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleOutsidePointer))
</script>

<template>
  <Teleport to="body">
    <div ref="navRef" class="case-section-nav" @keydown="handleKeydown" @focusout="handleFocusout">
      <Transition name="section-menu">
        <nav v-if="isOpen" :id="panelId" class="case-section-nav__links" :aria-label="label">
          <HeaderNavButton
            as="a"
            v-for="section in sections"
            :key="section.id"
            :href="`#${section.id}`"
            class="case-section-nav__link"
            :aria-current="activeSection === section.id ? 'location' : undefined"
            @click="selectSection(section.id)"
          >
            {{ section.label }}
          </HeaderNavButton>
        </nav>
      </Transition>
      <HeaderNavButton
        as="button"
        type="button"
        class="case-section-nav__trigger"
        :aria-expanded="isOpen"
        :aria-controls="panelId"
        :aria-label="`${label}: ${activeLabel}`"
        @click="isOpen = !isOpen"
      >
        <span class="case-section-nav__trigger-content">
          {{ activeLabel }}
          <ChevronUpIcon class="case-section-nav__chevron" :class="{ 'case-section-nav__chevron--open': isOpen }" aria-hidden="true" />
        </span>
      </HeaderNavButton>
    </div>
  </Teleport>
</template>

<style scoped>
.case-section-nav {
  --control-height: var(--space-8);
  position: fixed;
  z-index: 4;
  /* Same edge offsets as the homepage sound control. */
  bottom: var(--layout-footer-bottom);
  left: var(--layout-content-edge);
  max-width: calc(100vw - var(--layout-content-edge) * 2);
}

.case-section-nav .case-section-nav__trigger,
.case-section-nav .case-section-nav__link {
  font-size: var(--font-size-xs);
  padding-block: var(--space-xxs);
}

.case-section-nav__trigger {
  --header-nav-button-background: var(--color-nav-surface-translucent);
  padding-left: var(--space-m);
  padding-right: var(--space-m);
  -webkit-backdrop-filter: blur(var(--blur-nav-surface));
  backdrop-filter: blur(var(--blur-nav-surface));
}

.case-section-nav .case-section-nav__trigger:hover,
.case-section-nav .case-section-nav__link:hover {
  background-color: var(--color-nav-surface-hover-translucent);
}

.case-section-nav__trigger-content {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.case-section-nav__chevron {
  width: var(--icon-size-xs);
  height: var(--icon-size-xs);
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}
.case-section-nav__chevron--open { transform: rotate(180deg); }
.case-section-nav__trigger:focus-visible { outline: 1px solid currentColor; outline-offset: var(--space-xxs); }

.case-section-nav__links {
  position: absolute;
  bottom: calc(100% + var(--space-xxs));
  left: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  width: max-content;
  min-width: 100%;
  max-width: calc(100vw - var(--layout-content-edge) * 2);
  max-height: calc(100dvh - var(--layout-header-clearance) - var(--layout-footer-bottom) - var(--control-height) - var(--space-m));
  overflow-y: auto;
  padding: var(--space-xxs);
  border-radius: var(--radius-panel);
  background: var(--color-nav-surface-translucent);
  -webkit-backdrop-filter: blur(var(--blur-nav-surface));
  backdrop-filter: blur(var(--blur-nav-surface));
  transform-origin: bottom left;
}

.case-section-nav__link {
  --header-nav-button-background: transparent;
  flex-shrink: 0;
  justify-content: flex-start;
}
.case-section-nav .case-section-nav__link[aria-current="location"] { background: var(--color-nav-surface-hover-translucent); }
.case-section-nav__link:focus-visible { outline: 1px solid currentColor; outline-offset: -1px; }

.section-menu-enter-active,
.section-menu-leave-active { transition: opacity var(--transition-fast), transform var(--transition-fast); }
.section-menu-enter-from,
.section-menu-leave-to { opacity: 0; transform: translateY(var(--space-xs)) scale(.98); }
.section-menu-leave-active { pointer-events: none; }

@media (prefers-reduced-motion: reduce) {
  .case-section-nav__chevron,
  .section-menu-enter-active,
  .section-menu-leave-active { transition: none; }
}
</style>
