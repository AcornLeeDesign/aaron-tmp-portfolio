<script setup lang="ts">
import { projects } from '~/data/projects'

useHead({ title: 'Aaron Lee Tmp Portfolio' })

const carouselRef = ref<HTMLElement | null>(null)
const scrollSectionRef = ref<HTMLElement | null>(null)
const aboutRef = ref<HTMLElement | null>(null)
const carouselScrollHeight = ref('100svh')
const aboutContentHeight = ref('220px')
const currentProject = ref(0)
const isCarouselActive = ref(false)
let scrollFrame: number | undefined
let carouselResizeObserver: ResizeObserver | undefined
let aboutResizeObserver: ResizeObserver | undefined

function updateAboutLayout() {
  const about = aboutRef.value
  if (!about) return
  aboutContentHeight.value = `${Math.ceil(about.getBoundingClientRect().height)}px`
  nextTick(updateAboutPosition)
}

function updateAboutPosition() {
  const about = aboutRef.value
  const section = scrollSectionRef.value
  if (!about || !section) return

  const finalTop = Number.parseFloat(window.getComputedStyle(about).top) || 0
  const centeredTop = Math.max(finalTop, (window.innerHeight - about.offsetHeight) / 2)
  const startingOffset = centeredTop - finalTop
  const sectionBounds = section.getBoundingClientRect()
  const sectionTop = window.scrollY + sectionBounds.top
  const progress = sectionTop > 0
    ? Math.min(Math.max(window.scrollY / sectionTop, 0), 1)
    : 1

  isCarouselActive.value = sectionBounds.top <= 0
  about.style.setProperty('--about-parallax-y', `${startingOffset * (1 - progress)}px`)
}

function updateCarouselState() {
  const carousel = carouselRef.value
  if (!carousel) return

  const cards = [...carousel.querySelectorAll<HTMLElement>('.project-card')]
  const carouselLeft = carousel.getBoundingClientRect().left
  currentProject.value = cards.reduce((closestIndex, card, index) => {
    const closestDistance = Math.abs(cards[closestIndex]!.getBoundingClientRect().left - carouselLeft)
    const distance = Math.abs(card.getBoundingClientRect().left - carouselLeft)
    return distance < closestDistance ? index : closestIndex
  }, 0)
}

function moveCarousel(direction: -1 | 1) {
  const carousel = carouselRef.value
  const section = scrollSectionRef.value
  if (!carousel || !section) return

  const cards = [...carousel.querySelectorAll<HTMLElement>('.project-card')]
  const targetIndex = Math.min(
    Math.max(currentProject.value + direction, 0),
    cards.length - 1
  )
  const target = cards[targetIndex]
  if (!target) return

  const targetLeft = target.getBoundingClientRect().left
    - carousel.getBoundingClientRect().left
    + carousel.scrollLeft
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const sectionTop = window.scrollY + section.getBoundingClientRect().top
  window.scrollTo({
    top: sectionTop + targetLeft,
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
}

function syncCarouselToPage() {
  scrollFrame = undefined
  updateAboutPosition()
  const carousel = carouselRef.value
  const section = scrollSectionRef.value
  if (!carousel || !section) return

  const maxScroll = Math.max(0, carousel.scrollWidth - carousel.clientWidth)
  const sectionTop = window.scrollY + section.getBoundingClientRect().top
  const progress = Math.min(Math.max(window.scrollY - sectionTop, 0), maxScroll)

  if (Math.abs(carousel.scrollLeft - progress) > 0.5) {
    carousel.scrollLeft = progress
  }
  updateCarouselState()
}

function scheduleCarouselSync() {
  if (scrollFrame !== undefined) return
  scrollFrame = window.requestAnimationFrame(syncCarouselToPage)
}

function updateCarouselLayout() {
  const carousel = carouselRef.value
  if (!carousel) return

  const horizontalDistance = Math.max(0, carousel.scrollWidth - carousel.clientWidth)
  carouselScrollHeight.value = `${horizontalDistance + window.innerHeight}px`
  nextTick(() => {
    updateAboutPosition()
    scheduleCarouselSync()
  })
}

onMounted(() => {
  nextTick(() => {
    updateAboutLayout()
    if (aboutRef.value) {
      aboutResizeObserver = new ResizeObserver(updateAboutLayout)
      aboutResizeObserver.observe(aboutRef.value)
    }

    updateCarouselLayout()
    if (carouselRef.value) {
      carouselResizeObserver = new ResizeObserver(updateCarouselLayout)
      carouselResizeObserver.observe(carouselRef.value)
    }
  })
  window.addEventListener('scroll', scheduleCarouselSync, { passive: true })
  window.addEventListener('resize', updateCarouselLayout)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleCarouselSync)
  window.removeEventListener('resize', updateCarouselLayout)
  carouselResizeObserver?.disconnect()
  aboutResizeObserver?.disconnect()
  if (scrollFrame !== undefined) {
    window.cancelAnimationFrame(scrollFrame)
  }
})
</script>

<template>
  <section class="home">
    <div
      id="about"
      class="home-about-row"
      :style="{ '--about-content-height': aboutContentHeight }"
    >
      <div
        ref="aboutRef"
        class="home-about text-primary"
        :class="{ 'home-about--behind-carousel': isCarouselActive }"
      >
        <p class="home-about__statement">Design is the intentional creation of systems for intelligent beings to operate in and understand the world. When design is the focus, experiments scale beyond scraps to people.</p>
        <p class="home-about__bio">Aaron is a product designer that builds surfaces and systems for scaling complex technologies, allowing products to change lives sustainably</p>
        <div class="home-about__status">
          <p class="home-about__status-label">Currently</p>
          <p>Open to work</p>
        </div>
      </div>
    </div>

    <div
      ref="scrollSectionRef"
      id="work"
      class="carousel-scroll"
      :style="{ height: carouselScrollHeight }"
    >
      <div class="carousel-scroll__sticky">
        <div
          ref="carouselRef"
          class="project-carousel"
          role="region"
          aria-label="Selected projects carousel"
          tabindex="0"
          @keydown.left.prevent="moveCarousel(-1)"
          @keydown.right.prevent="moveCarousel(1)"
        >
          <article v-for="project in projects" :key="project.id" class="project-card">
            <component
              :is="project.href ? 'a' : 'div'"
              :id="`project-${project.id}`"
              :href="project.href || undefined"
              :target="project.href ? '_blank' : undefined"
              :rel="project.href ? 'noopener noreferrer' : undefined"
              :aria-label="project.href ? project.title : undefined"
              class="project-card__media"
              :class="{
                'project-card__media--bordered': project.border,
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
                class="project-card__asset"
              />
              <VideoPlayer v-else :src="project.src" />
            </component>
            <div class="project-card__details">
              <h2 class="text-primary">{{ project.title }}</h2>
              <div class="project-card__metadata">
                <p
                  v-for="discipline in project.description"
                  :key="discipline"
                  class="project-card__description"
                >
                  {{ discipline }}
                </p>
                <time class="project-card__duration">{{ project.duration }}</time>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.home {
  --preview-radius: var(--radius-xs);
  padding-top: var(--layout-header-clearance);
  padding-inline: var(--page-padding);
  color: var(--color-text);
}

.home-about {
  position: fixed;
  z-index: 0;
  top: calc(var(--layout-header-clearance) + var(--space-xxl));
  left: 50%;
  display: flex;
  width: min(calc(100vw - (var(--page-padding) * 2)), 640px);
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xl);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
  pointer-events: none;
  filter: blur(0);
  transform: translate3d(-50%, var(--about-parallax-y, 0px), 0);
  transition: filter 240ms ease-out;
  will-change: transform, filter;
}

.home-about--behind-carousel {
  filter: blur(12px);
}

.home-about p {
  margin: 0;
}

.home-about__statement {
  width: 100%;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-align: justify;
}

.home-about__bio {
  width: 100%;
}

.home-about__status {
  width: min(100%, 260px);
}

.home-about__status-label {
  font-weight: var(--font-weight-semibold);
}

.home-about-row {
  width: 100%;
  min-height: max(
    calc(100svh - var(--layout-header-clearance)),
    calc(
      var(--space-xxl)
      + var(--about-content-height, 220px)
      + clamp(64px, 8vw, 96px)
      + 100px
    )
  );
  scroll-margin-top: var(--layout-anchor-offset);
}

.carousel-scroll {
  position: relative;
  z-index: 1;
  margin-inline: calc(var(--page-padding) * -1);
  scroll-margin-top: 0;
}

.carousel-scroll__sticky {
  position: sticky;
  top: 0;
  display: flex;
  height: 100svh;
  align-items: flex-end;
  overflow: hidden;
  padding-bottom: 110px;
}

.project-carousel {
  display: flex;
  width: 100%;
  align-items: flex-end;
  gap: var(--space-xl);
  padding-inline: var(--page-padding);
  overflow: hidden;
  scrollbar-width: none;
}

.project-carousel::-webkit-scrollbar {
  display: none;
}

.project-carousel:focus-visible {
  outline: 1px solid var(--color-text);
  outline-offset: 4px;
}

.project-card {
  display: flex;
  flex: 0 0 clamp(320px, 40vw, 605px);
  min-width: 0;
  flex-direction: column;
  gap: var(--space-s);
}

.project-card__media {
  position: relative;
  display: block;
  width: 100%;
  max-height: calc(100svh - 200px);
  border-radius: var(--preview-radius);
  background-color: transparent;
  overflow: hidden;
}

a.project-card__media {
  cursor: pointer;
}

.project-card__media--bordered {
  border: 1px solid var(--color-border);
}

.project-card__asset {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.project-card__media :deep(video) {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  clip-path: inset(0 round var(--preview-radius));
  object-fit: cover;
  object-position: center bottom;
  display: block;
}

/* Keep the subject centered when the portrait Haven render is cropped to 3:4. */
#project-2 :deep(video),
#project-4 :deep(video) {
  object-position: center center;
}

/* Push Rabbithole's captured right-edge line outside the clipped frame. */
#project-8 :deep(video) {
  width: calc(100% + 4px);
  max-width: none;
}

/* Overscan Nova just enough to remove the captured black bottom edge. */
#project-6 :deep(video) {
  width: calc(100% + 4px);
  max-width: none;
  height: calc(100% + 4px);
}

.project-card__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-xxs);
  overflow-wrap: anywhere;
}

.project-card__details h2 {
  width: 100%;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0;
  line-height: 1.2;
}

.project-card__metadata {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  font-size: var(--font-size-s);
  line-height: 1.4;
}

.project-card__description {
  width: 100%;
  margin: 0;
  font-weight: var(--font-weight-regular);
  color: #808080;
}

.project-card__duration {
  width: 100%;
  color: var(--color-text);
  font-family: var(--font-duration);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
  opacity: 0.5;
}

@media (max-width: 639px) {
  .home-about-row {
    min-height: max(
      calc(100svh - var(--layout-header-clearance)),
      calc(
        var(--space-xxl)
        + var(--about-content-height, 220px)
        + var(--space-xxl)
        + 100px
      )
    );
  }

  .project-card {
    flex-basis: calc(100vw - (var(--page-padding) * 2) - 28px);
  }

  .carousel-scroll__sticky {
    padding-bottom: 110px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-about {
    transition: none;
  }
}
</style>
