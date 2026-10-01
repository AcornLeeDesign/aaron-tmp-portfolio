<script setup lang="ts">
import { NuxtLink } from '#components'

withDefaults(defineProps<{
  to?: string
  as?: string
}>(), {
  as: 'span',
})
</script>

<template>
  <component
    :is="to ? NuxtLink : as"
    :to="to || undefined"
    class="header-nav-button"
  >
    <span class="header-nav-button__label" data-nav-content>
      <slot />
    </span>
  </component>
</template>

<style scoped>
.header-nav-button {
  display: inline-flex;
  height: var(--control-height);
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-l);
  border: 0;
  cursor: pointer;
  border-radius: var(--radius-pill);
  background-color: var(--header-nav-button-background, var(--color-nav-surface));
  color: var(--header-nav-button-color, var(--color-text));
  font-family: var(--font-mono-ui);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-button-label);
  line-height: var(--line-height-body);
  white-space: nowrap;
  transition:
    background-color var(--transition-fast),
    color var(--transition-theme),
    transform 100ms ease-out;
}

.header-nav-button:hover {
  background-color: var(--color-nav-surface-hover);
}

.header-nav-button:active {
  transform: scale(0.97);
}
</style>
