<script setup lang="ts">
useHead({ title: 'Aaron Lee Tmp Portfolio' })

interface Tag {
  label: string
  icon?: 'deployment'
}

interface Project {
  id: number
  title: string
  aspect: string
  src: string
  type?: 'image'
  border?: boolean
  tag?: Tag
  href?: string
}

// Three columns with varying heights to create the waterfall effect
// Video items use aspect ratio from actual video dimensions
const columns: Project[][] = [
  [
    { id: 13, title: 'DoorDash', aspect: '1024 / 607', src: '/images/doordash.png', type: 'image', tag: { label: 'Case study soon' } },
    { id: 8, title: 'Rabbithole', aspect: '2256 / 1464', src: '/videos/rabbithole.mp4', tag: { label: 'Case study soon' } },
    { id: 2, title: 'Haven 3D', aspect: '9 / 16', src: '/videos/haven_3d.mp4' },
    { id: 9, title: 'eVTOL', aspect: '3274 / 1454', src: '/images/evtol.png', type: 'image' },
  ],
  [
    { id: 1, title: 'Nuance Pure', aspect: '1 / 1', src: '/videos/nuance_pure.mp4', tag: { label: 'Case study soon' } },
    { id: 3, title: 'Manta', aspect: '3418 / 2032', src: '/videos/manta.mp4', tag: { label: 'Demo', icon: 'deployment' }, href: 'https://manta-one.vercel.app/' },
    { id: 4, title: 'Gameboy', aspect: '1158 / 1578', src: '/videos/gameboy.mp4', tag: { label: 'Demo', icon: 'deployment' }, href: 'https://gameboy-basic.vercel.app/' },
    { id: 10, title: 'Haven', aspect: '1678 / 1080', src: '/images/haven.png', type: 'image' },
  ],
  [
    { id: 14, title: 'Fleetline', aspect: '2984 / 2056', src: '/videos/fleetline.mp4', tag: { label: 'Case study soon' } },
    { id: 6, title: 'Nova Practice', aspect: '1588 / 1288', src: '/videos/nova_practice_V.mp4', border: true, tag: { label: 'Case study soon' } },
    { id: 5, title: 'Wiggle', aspect: '1738 / 1000', src: '/videos/wiggle.mp4', border: true, tag: { label: 'Demo', icon: 'deployment' }, href: 'https://wiggle.framer.website/' },
    { id: 7, title: 'Pen', aspect: '2038 / 1008', src: '/videos/pen.mp4' },
    { id: 11, title: 'Watch', aspect: '1920 / 1080', src: '/images/watch_3_4_view.png', type: 'image', border: true },
    { id: 12, title: 'Chewsy', aspect: '1 / 1', src: '/videos/chewsy_createsc.mp4' },
  ],
]

const isMobile = ref(false)
let mobileMediaQuery: MediaQueryList | undefined

const mobileProjects = computed(() => [
  ...columns
    .map(column => column[0])
    .filter((project): project is Project => project !== undefined),
  ...columns.flatMap(column => column.slice(1)),
])

const renderedColumns = computed(() => isMobile.value ? [mobileProjects.value] : columns)

function syncMobileLayout(event: MediaQueryList | MediaQueryListEvent) {
  isMobile.value = event.matches
}

onMounted(() => {
  mobileMediaQuery = window.matchMedia('(max-width: 639px)')
  syncMobileLayout(mobileMediaQuery)
  mobileMediaQuery.addEventListener('change', syncMobileLayout)
})

onBeforeUnmount(() => {
  mobileMediaQuery?.removeEventListener('change', syncMobileLayout)
})
</script>

<template>
  <section class="waterfall">
    <div class="home-about-row">
      <div class="home-about">
        <p>Aaron Lee is a product designer and digital artist based in Los Angeles and San Francisco. He's constantly learning about systems design and organizational psychology. God designed him with fingers and so his fingers will be designing too.</p>
        <p>Open to opportunities</p>

        <div class="home-socials" aria-label="Social links">
          <a
            class="home-socials__link"
            href="https://x.com/acorn_lee_"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            title="X"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/>
            </svg>
          </a>
          <a
            class="home-socials__link"
            href="https://www.linkedin.com/in/aaaronlee/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            title="LinkedIn"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.1 20.45H3.54V8.98H7.1v11.47Z"/>
            </svg>
          </a>
          <a
            class="home-socials__link"
            href="mailto:alee9193@usc.edu"
            aria-label="Email"
            title="Email"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3.75 5.25h16.5c.83 0 1.5.67 1.5 1.5v10.5c0 .83-.67 1.5-1.5 1.5H3.75c-.83 0-1.5-.67-1.5-1.5V6.75c0-.83.67-1.5 1.5-1.5Z" fill="none" stroke="currentColor" stroke-width="1.75"/>
              <path d="m3 6 9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </div>

    <div class="waterfall__columns">
      <div
        v-for="(column, colIndex) in renderedColumns"
        :key="colIndex"
        class="waterfall__col"
      >
        <component
          :is="project.href ? 'a' : 'div'"
          v-for="project in column"
          :key="project.id"
          :href="project.href || undefined"
          :target="project.href ? '_blank' : undefined"
          :rel="project.href ? 'noopener noreferrer' : undefined"
          class="waterfall__item"
          :class="{
            'waterfall__item--bordered': project.border,
            'waterfall__item--demo': project.tag?.label === 'Demo',
          }"
          :style="{ aspectRatio: project.aspect }"
        >
          <img
            v-if="project.type === 'image'"
            :src="project.src"
            :alt="project.title"
            :loading="project.id === 13 ? 'eager' : 'lazy'"
            :fetchpriority="project.id === 13 ? 'high' : 'auto'"
            decoding="async"
            class="waterfall__image"
          />
          <VideoPlayer v-else :src="project.src" />
          <div v-if="project.tag" class="waterfall__tag">
            <span>{{ project.tag.label }}</span>
            <!-- External link icon (Deployment) -->
            <svg v-if="project.tag.icon === 'deployment'" width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 6H5.25C4.00736 6 3 7.00736 3 8.25V18.75C3 19.9926 4.00736 21 5.25 21H15.75C16.9926 21 18 19.9926 18 18.75V10.5M7.5 16.5L21 3M21 3L15.75 3M21 3V8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </component>
      </div>
    </div>
  </section>
</template>

<style scoped>
.waterfall {
  --preview-radius: 8px;
  --tag-edge-offset: 4px;
  padding-inline: var(--page-padding);
  padding-bottom: 3rem;
}

.waterfall__columns {
  display: flex;
  gap: var(--waterfall-column-gap);
}

.waterfall__col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--waterfall-column-gap);
  min-width: 0;
}

.home-about {
  width: calc(
    (100% - (var(--waterfall-column-gap) * (var(--waterfall-column-count) - 1)))
    / var(--waterfall-column-count)
  );
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text);
}

.home-about p + p {
  margin-top: 1em;
}

.home-socials {
  display: flex;
  gap: 4px;
  margin-top: 16px;
}

.home-socials__link {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  background-color: var(--color-surface);
  color: #ffffff;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    transform 100ms ease-out;
}

.home-socials__link svg {
  width: 20px;
  height: 20px;
}

.home-socials__link:hover {
  background-color: rgb(108, 108, 108);
}

.home-socials__link:active {
  transform: scale(0.909);
}

.home-about-row {
  width: 100%;
  padding-block: 40px;
}

.waterfall__item {
  position: relative;
  border-radius: var(--preview-radius);
  background-color: #000;
  width: 100%;
  flex-shrink: 0;
  overflow: hidden;
  display: block;
}

a.waterfall__item {
  cursor: pointer;
}

.waterfall__item--demo {
  transition: transform 150ms ease;
  transform-origin: center;
}

@media (hover: hover) {
  .waterfall__item--demo:hover {
    transform: scale(0.9756);
  }
}

.waterfall__item--demo:active {
  transform: scale(0.9524);
}

.waterfall__tag {
  position: absolute;
  top: var(--tag-edge-offset);
  right: var(--tag-edge-offset);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background-color: color-mix(in srgb, var(--color-surface) 50%, transparent);
  border-radius: max(0px, calc(var(--preview-radius) - var(--tag-edge-offset)));
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0;
  transition: opacity var(--transition-fast);
  pointer-events: none;
}

.waterfall__tag svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.waterfall__item:hover .waterfall__tag {
  opacity: 1;
}

.waterfall__item--bordered {
  border: 1px solid var(--color-border);
}

/* Crop bottom 4px of Nova video to hide recording artifact */
#player-6 :deep(video) {
  height: calc(100% + 4px);
}

.waterfall__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.waterfall__item :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Mobile and tablet: show tags by default */
@media (max-width: 1023px) {
  .waterfall__tag {
    opacity: 1;
  }
}

/* Mobile: stack into a single column */
@media (max-width: 639px) {
  .waterfall__columns {
    flex-direction: column;
  }

  .home-about {
    width: 100%;
  }
}

</style>
