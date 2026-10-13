<script setup lang="ts" generic="T extends string">
defineProps<{
  sections: Array<{ id: T, label: string }>
  activeSection: T
  label: string
}>()
const emit = defineEmits<{ select: [id: T] }>()
</script>

<template>
  <Teleport to="body">
    <div class="case-section-nav">
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
.case-section-nav {
  /* Equal 32px inset from the bottom and left edges. */
  --case-section-nav-edge: var(--space-8);
  position: fixed;
  z-index: 4;
  bottom: var(--case-section-nav-edge);
  left: var(--case-section-nav-edge);
  width: var(--project-metadata-width);
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
  transition:
    opacity var(--transition-fast),
    font-size var(--transition-base),
    font-weight var(--transition-base),
    line-height var(--transition-base);
}

.case-section-nav__link:hover,
.case-section-nav__link:focus-visible,
.case-section-nav__link[aria-current="location"] { opacity: 1; }
.case-section-nav__link[aria-current="location"] {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-medium);
}
.case-section-nav__link:focus-visible { outline: 1px solid currentColor; outline-offset: var(--space-xxs); }

@media (max-width: 1023px) {
  .case-section-nav { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .case-section-nav__link { transition: none; }
}
</style>
