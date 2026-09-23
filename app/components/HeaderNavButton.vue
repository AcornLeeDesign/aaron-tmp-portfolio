<script setup lang="ts">
defineProps<{
  to: string
}>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="header-nav-button"
  >
    <slot />
  </NuxtLink>
</template>

<style scoped>
.header-nav-button {
  display: inline-flex;
  height: var(--control-height);
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-l);
  border-radius: var(--radius-pill);
  background-color: var(--color-nav-surface);
  color: var(--color-text);
  font-family: var(--font-mono-ui);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-heading);
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
