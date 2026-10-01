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
  position: fixed;
  z-index: 4;
  top: calc(var(--layout-header-clearance) + var(--space-m));
  left: calc(var(--layout-content-edge) + var(--space-s));
  width: var(--project-metadata-width);
  max-height: calc(100dvh - var(--layout-header-clearance) - var(--space-m) * 2);
  overflow-y: auto;
  scrollbar-width: none;
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
  color: var(--color-subdued);
  font-family: var(--font-sans);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  white-space: nowrap;
  transition: color var(--transition-fast);
}

.case-section-nav__link:hover,
.case-section-nav__link[aria-current="location"] { color: var(--color-text); }
.case-section-nav__link:focus-visible { outline: 1px solid currentColor; outline-offset: var(--space-xxs); }

@media (max-width: 1023px) {
  .case-section-nav { display: none; }
}
</style>
