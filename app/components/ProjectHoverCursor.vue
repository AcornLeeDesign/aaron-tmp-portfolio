<script setup lang="ts">
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  NoSymbolIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  active: boolean
  iconOnly: boolean
  label: string
  x: number
  y: number
}>()

const cursorStyle = computed(() => ({
  '--project-cursor-x': `${props.x}px`,
  '--project-cursor-y': `${props.y}px`,
}))
</script>

<template>
  <Teleport to="body">
    <div
      class="project-hover-cursor"
      :class="{ 'project-hover-cursor--active': active }"
      :style="cursorStyle"
      aria-hidden="true"
    >
      <HeaderNavButton
        as="span"
        class="project-hover-cursor__button"
        :class="{ 'project-hover-cursor__button--icon': iconOnly }"
      >
        <NoSymbolIcon
          v-if="iconOnly"
          class="project-hover-cursor__icon"
        />
        <span v-else class="project-hover-cursor__label">
          {{ label }}
          <ArrowUpRightIcon
            v-if="label === 'Live demo'"
            class="project-hover-cursor__label-icon"
          />
          <ArrowRightIcon
            v-else-if="label === 'View case'"
            class="project-hover-cursor__label-icon"
          />
        </span>
      </HeaderNavButton>
    </div>
  </Teleport>
</template>

<style scoped>
.project-hover-cursor {
  position: fixed;
  z-index: 1000;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
  transform: translate3d(
    var(--project-cursor-x, 0),
    var(--project-cursor-y, 0),
    0
  );
  transition: opacity var(--transition-fast);
  mix-blend-mode: difference;
  will-change: transform, opacity;
}

.project-hover-cursor--active {
  opacity: 1;
}

.project-hover-cursor__button {
  --header-nav-button-background: var(--color-text);
  --header-nav-button-color: var(--color-bg);

  transform: translate(-50%, -50%) scale(0.94);
  transition:
    background-color var(--transition-fast),
    color var(--transition-theme),
    transform var(--transition-base);
}

.project-hover-cursor--active .project-hover-cursor__button {
  transform: translate(-50%, -50%) scale(1);
}

.project-hover-cursor__button--icon {
  width: var(--control-height);
  padding: 0;
}

.project-hover-cursor__icon {
  width: var(--icon-size-m);
  height: var(--icon-size-m);
}

.project-hover-cursor__label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.project-hover-cursor__label-icon {
  width: var(--icon-size-s);
  height: var(--icon-size-s);
}

@media (hover: none), (pointer: coarse), (prefers-reduced-motion: reduce) {
  .project-hover-cursor {
    display: none;
  }
}
</style>
