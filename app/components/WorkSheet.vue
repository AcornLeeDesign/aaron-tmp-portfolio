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
const glowActive = ref(false)
const glowStyle = ref<Record<string, string>>({})

function trackLinkPointer(event: PointerEvent) {
  if (event.pointerType === 'touch'
    || !window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)').matches) return
  const link = event.currentTarget as HTMLElement
  const bounds = link.closest('dialog')?.getBoundingClientRect()
  if (!bounds) return
  glowStyle.value = {
    '--work-link-pointer-x': `${event.clientX - bounds.left}px`,
    '--work-link-pointer-y': `${event.clientY - bounds.top}px`,
    '--work-link-color': getComputedStyle(link).getPropertyValue('--work-link-color'),
  }
  glowActive.value = true
}

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

defineExpose({ open: () => {
  glowActive.value = false
  sheet.value?.open()
} })
</script>

<template>
  <OverlaySheet id="work-sheet" ref="sheet" label="Work, projects, and experiments" close-label="Close Work">
    <template #decoration>
      <div class="work-sheet__glow" :class="{ 'work-sheet__glow--active': glowActive }" :style="glowStyle" aria-hidden="true" />
    </template>
    <template #default="{ close }">
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
                @pointerenter="trackLinkPointer"
                @pointermove="trackLinkPointer"
                @pointerleave="glowActive = false"
                @click="glowActive = false; close()"
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
                @pointerenter="trackLinkPointer"
                @pointermove="trackLinkPointer"
                @pointerleave="glowActive = false"
                @click="glowActive = false; close()"
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
    </template>
  </OverlaySheet>
</template>

<style scoped>
.work-sheet__section {
  /* Figma's role column width, shared by all three lists. */
  --work-role-width: 240px;
  --work-link-hover-color: #000;
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
  --work-link-color: var(--color-text);
  position: relative;
  color: var(--work-link-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  border-radius: var(--radius-xs);
  transition: background-color var(--transition-fast);
}

.work-sheet__link img { flex-shrink: 0; }
.work-sheet__label-mobile { display: none; }
.work-sheet__link--case-study { --work-link-color: var(--color-link-case-study); }
.work-sheet__link--instagram { --work-link-color: var(--color-link-instagram); }
.work-sheet__link:hover { text-decoration: underline; text-underline-offset: var(--space-xxs); }
.work-sheet__link:focus-visible { outline: 1px solid currentColor; outline-offset: var(--space-xxs); }

.work-sheet__glow { display: none; }

@media (min-width: 1024px) {
  .work-sheet__link {
    /* Use the existing space up to each divider without increasing row height. */
    align-self: stretch;
    margin-block: calc(-1 * var(--space-xs));
    padding-block: var(--space-xs);
  }
}

@media (min-width: 1024px) and (hover: hover) and (pointer: fine) {
  .work-sheet__glow {
    /* Twice the original diameter, beneath all scrolling content. */
    --work-link-glow-size: calc(var(--space-30) * 4);
    /* Compact opaque center with a long, eased falloff instead of a solid disk. */
    --work-link-glow-mask: radial-gradient(circle closest-side,
      #000 0%,
      rgb(0 0 0 / 98%) 8%,
      rgb(0 0 0 / 88%) 20%,
      rgb(0 0 0 / 60%) 38%,
      rgb(0 0 0 / 28%) 56%,
      rgb(0 0 0 / 9%) 74%,
      rgb(0 0 0 / 2%) 88%,
      transparent 100%);
    display: block;
    position: absolute;
    z-index: -1;
    left: var(--work-link-pointer-x, 50%);
    top: var(--work-link-pointer-y, 50%);
    width: var(--work-link-glow-size);
    height: var(--work-link-glow-size);
    background-color: var(--work-link-color);
    /* Higher-contrast monochrome grain shares the glow's fade. */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.72' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='3' intercept='-1'/%3E%3CfeFuncG type='linear' slope='3' intercept='-1'/%3E%3CfeFuncB type='linear' slope='3' intercept='-1'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='.55'/%3E%3C/svg%3E");
    background-blend-mode: multiply;
    -webkit-mask-image: var(--work-link-glow-mask);
    mask-image: var(--work-link-glow-mask);
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
    transition: transform var(--transition-base), opacity var(--transition-fast);
  }

  .work-sheet__link:hover { color: var(--work-link-hover-color); text-decoration: none; }
  .work-sheet__link:hover img { filter: brightness(0); }
  .work-sheet__glow--active {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-sheet__glow { transition: none; }
}

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
