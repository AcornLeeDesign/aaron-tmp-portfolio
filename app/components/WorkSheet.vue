<script setup lang="ts">
import { projects } from '~/data/projects'

interface WorkEntry {
  year: string
  name: string
  role: string
  continuation?: boolean
  soon?: boolean
  project?: string
  instagram?: boolean
}

const sheet = ref<{ open: () => void } | null>(null)
const sections: { title: string, entries: WorkEntry[] }[] = [
  { title: 'Work', entries: [
    { year: '2026', name: 'DoorDash', role: 'Product design intern', soon: true },
    { year: '2026', name: 'Fleetline', role: 'Product designer', soon: true },
    { year: '2026', name: 'Innovative Design @ USC', role: 'Co president', instagram: true },
    { year: '2025', name: 'Innovative Design @ USC', role: 'VP of Design', continuation: true },
    { year: '2025', name: 'LavaLab @ USC', role: 'Designer' },
    { year: '2025', name: 'Guardian', role: 'Product designer [Haven]' },
    { year: '2024', name: 'Guardian', role: 'Product designer, 3D designer [Nova]', continuation: true, project: 'Nova' },
    { year: '2023', name: 'Raconteur Animation', role: '3D design intern' },
  ] },
  { title: 'Projects', entries: [
    { year: '2025', name: 'Rabbithole', role: 'Product designer', soon: true },
    { year: '2025', name: 'Chewsy', role: 'Product designer' },
    { year: '2025', name: 'Nuance', role: 'Product designer, 3D artist', project: 'Nuance' },
    { year: '2025', name: 'Code the Change', role: 'Product designer' },
    { year: '2025', name: 'Manta', role: '3D artist, ThreeJS', project: 'Manta' },
    { year: '2025', name: 'Gameboy', role: '3D artist, ThreeJS', project: 'Gameboy' },
  ] },
  { title: 'Experiments', entries: [
    { year: '2026', name: 'Wiggle', role: 'Rive, Framer', project: 'Wiggle' },
    { year: '2025', name: 'Pen', role: 'Rive' },
  ] },
]

// Keep destinations in sync with the homepage project cards.
const linkedSections = sections.map(section => ({
  ...section,
  entries: section.entries.map((entry) => {
    const project = projects.find(project => project.title === entry.project)
    const to = project?.to
    const href = entry.instagram ? 'https://www.instagram.com/innodatusc/' : project?.href
    const label = entry.instagram ? 'Instagram' : to ? 'Case study' : href ? 'Live demo' : undefined
    const icon = entry.instagram ? 'instagram' : to ? 'case-study' : 'demo'
    return { ...entry, to, href, label, icon }
  }),
}))

defineExpose({ open: () => sheet.value?.open() })
</script>

<template>
  <OverlaySheet id="work-sheet" ref="sheet" v-slot="{ close }" label="Work, projects, and experiments" close-label="Close Work">
    <section v-for="section in linkedSections" :key="section.title" class="work-sheet__section" :aria-label="section.title">
      <h2>{{ section.title }}</h2>
      <ul class="work-sheet__entries">
        <li v-for="(entry, index) in section.entries" :key="`${entry.name}-${entry.year}`">
          <img v-if="index > 0 && !entry.continuation" class="work-sheet__divider" src="/images/work/divider.svg" alt="" aria-hidden="true" />
          <div class="work-sheet__row">
            <span class="work-sheet__year">{{ entry.year }}</span>
            <span class="work-sheet__name" :class="{ 'work-sheet__name--continued': entry.continuation }">{{ entry.name }}</span>
            <span class="work-sheet__role">{{ entry.role }}</span>
            <NuxtLink
              v-if="entry.to"
              :to="entry.to"
              class="work-sheet__link work-sheet__link--case-study"
              :aria-label="`View ${entry.project} case study`"
              @click="close"
            >
              <span class="work-sheet__label-full">{{ entry.label }}</span>
              <span class="work-sheet__label-mobile">Case</span>
              <img :src="`/images/work/arrow-${entry.icon}.svg`" alt="" aria-hidden="true" />
            </NuxtLink>
            <a
              v-else-if="entry.href"
              :href="entry.href"
              target="_blank"
              rel="noopener noreferrer"
              class="work-sheet__link"
              :class="{ 'work-sheet__link--instagram': entry.instagram }"
              :aria-label="entry.instagram ? 'Innovative Design at USC on Instagram (new tab)' : `Open ${entry.project} live demo (new tab)`"
              @click="close"
            >
              <span class="work-sheet__label-full">{{ entry.label }}</span>
              <span class="work-sheet__label-mobile">{{ entry.instagram ? 'Insta' : 'Demo' }}</span>
              <img :src="`/images/work/arrow-${entry.icon}.svg`" alt="" aria-hidden="true" />
            </a>
            <span v-else-if="entry.soon" class="work-sheet__soon">Soon</span>
          </div>
        </li>
      </ul>
    </section>
  </OverlaySheet>
</template>

<style scoped>
.work-sheet__section {
  /* Figma's role column width, shared by all three lists. */
  --work-role-width: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--space-m);
}

.work-sheet__section h2 {
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-tight);
}

.work-sheet__entries {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.work-sheet__divider { margin-bottom: var(--space-xs); }

.work-sheet__row {
  display: grid;
  grid-template-columns: var(--space-10) minmax(0, 1fr) var(--work-role-width) var(--space-24);
  align-items: center;
  gap: var(--space-m);
}

.work-sheet__year {
  color: var(--color-subdued);
  font-family: var(--font-mono-ui);
  font-variant-numeric: tabular-nums;
}
.work-sheet__name--continued { visibility: hidden; }
.work-sheet__soon { color: var(--color-subdued); }

.work-sheet__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  border-radius: var(--radius-xs);
  transition: background-color var(--transition-fast);
}

.work-sheet__link img { flex-shrink: 0; }
.work-sheet__label-mobile { display: none; }
.work-sheet__link--case-study { color: var(--color-link-case-study); }
.work-sheet__link--instagram { color: var(--color-link-instagram); }
.work-sheet__link:hover { text-decoration: underline; text-underline-offset: var(--space-xxs); }
.work-sheet__link:focus-visible { outline: 1px solid currentColor; outline-offset: var(--space-xxs); }

@media (max-width: 1023px) {
  .work-sheet__entries { gap: var(--space-s); }
  .work-sheet__divider { margin-bottom: var(--space-s); }
  .work-sheet__name--continued { visibility: visible; }
  .work-sheet__label-full { display: none; }
  .work-sheet__label-mobile { display: inline; }
  .work-sheet__row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    min-height: var(--space-12);
    gap: var(--space-xxs) var(--space-s);
  }
  .work-sheet__year,
  .work-sheet__soon { display: none; }
  .work-sheet__name { grid-column: 1; grid-row: 1; }
  .work-sheet__role { grid-column: 1; grid-row: 2; color: var(--color-subdued); }
  .work-sheet__link {
    grid-column: 2;
    grid-row: 1 / 3;
    justify-self: end;
    justify-content: flex-end;
    min-height: var(--space-12);
    width: fit-content;
    white-space: nowrap;
  }
}
</style>
