<script setup lang="ts">
import { ArrowRightIcon, ArrowUpRightIcon, NoSymbolIcon } from '@heroicons/vue/24/outline'
import { projects } from '~/data/projects'

useHead({
  title: 'Aaron Lee',
  htmlAttrs: { class: 'home-viewport' },
})

const carouselRef = ref<HTMLElement | null>(null)
const carouselTrackRef = ref<HTMLElement | null>(null)
const homeIntroRef = ref<HTMLElement | null>(null)
const carouselScrollDistance = ref('0px')
const isDesktopCarousel = ref(false)
const cursorLabel = ref('')
const cursorActive = ref(false)
const cursorIconOnly = ref(false)
const cursorX = ref(0)
const cursorY = ref(0)
const NuxtLink = resolveComponent('NuxtLink')
let carouselResizeObserver: ResizeObserver | undefined
let carouselScrollFrame: number | undefined
let carouselMaxScroll = 0
let carouselTrackTop = 0
let cursorFrame: number | undefined
let cursorCurrentX = 0
let cursorCurrentY = 0
let cursorTargetX = 0
let cursorTargetY = 0
let canUseProjectCursor = false
let finePointerQuery: MediaQueryList | undefined
let reducedMotionQuery: MediaQueryList | undefined
let desktopCarouselQuery: MediaQueryList | undefined

const CURSOR_FOLLOW_STRENGTH = 0.24
const CURSOR_SETTLE_THRESHOLD = 0.1

function getPageScrollTop() {
  return Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  )
}

function moveCarousel(direction: -1 | 1) {
  const carousel = carouselRef.value
  if (!carousel || !isDesktopCarousel.value) return

  const cards = [...carousel.querySelectorAll<HTMLElement>('.project-card')]
  if (cards.length === 0) return

  const carouselLeft = carousel.getBoundingClientRect().left
  const currentIndex = cards.reduce((closestIndex, card, index) => {
    const closestDistance = Math.abs(cards[closestIndex]!.getBoundingClientRect().left - carouselLeft)
    const distance = Math.abs(card.getBoundingClientRect().left - carouselLeft)
    return distance < closestDistance ? index : closestIndex
  }, 0)
  const targetIndex = Math.min(
    Math.max(currentIndex + direction, 0),
    cards.length - 1
  )
  const target = cards[targetIndex]
  if (!target) return

  const targetLeft = target.getBoundingClientRect().left
    - carousel.getBoundingClientRect().left
    + carousel.scrollLeft
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  window.scrollTo({
    top: carouselTrackTop + targetLeft,
    behavior: reduceMotion ? 'auto' : 'smooth',
  })
}

function projectCursorText(project: (typeof projects)[number]) {
  if (project.to) return 'View case'
  if (project.href) return 'Live demo'
  if (project.soon) return 'Coming soon'
  return ''
}

function isPortraitProject(project: (typeof projects)[number]) {
  const [width = 1, height = 1] = project.aspect
    .split('/')
    .map(value => Number.parseFloat(value.trim()))

  return width / height < 1
}

function projectFrameAspect(project: (typeof projects)[number]) {
  return isPortraitProject(project) ? '3 / 4' : '4 / 3'
}

function projectMediaStyle(project: (typeof projects)[number]) {
  return {
    '--project-media-background-color': project.mediaBackgroundColor
      ?? 'var(--color-media-background)',
    '--project-media-background-image': project.mediaBackgroundImage
      ? `url("${project.mediaBackgroundImage}")`
      : 'none',
    '--project-media-background-brightness': project.mediaBackgroundBrightness ?? 1,
    '--project-source-aspect': project.id === 1 ? '2914 / 1902' : projectContentAspect(project),
    aspectRatio: projectFrameAspect(project),
  }
}

function projectContentAspect(project: (typeof projects)[number]) {
  return project.contentAspect ?? project.aspect
}

function projectMediaInsetStyle(project: (typeof projects)[number]) {
  const aspect = projectContentAspect(project)
  const [width = 1, height = 1] = aspect
    .split('/')
    .map(value => Number.parseFloat(value.trim()))

  return {
    '--project-media-ratio': width / height,
    aspectRatio: aspect,
  }
}

function syncProjectMediaAspect(event: Event) {
  const media = event.currentTarget
  if (!(media instanceof HTMLImageElement || media instanceof HTMLVideoElement)) return

  const width = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth
  const height = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight
  if (width <= 0 || height <= 0) return

  media.closest<HTMLElement>('.project-card__media')
    ?.style.setProperty('--project-source-aspect', `${width} / ${height}`)
  // Nuance uses its own phone framing and mobile portrait crop.
  if (media.classList.contains('project-card__phone-video')) return

  const inset = media.closest<HTMLElement>('.project-card__media-inset')
  if (!inset || width <= 0 || height <= 0) return

  inset.style.setProperty('--project-media-ratio', `${width / height}`)
  inset.style.aspectRatio = `${width} / ${height}`
}

function projectAriaLabel(project: (typeof projects)[number]) {
  if (project.to) return `View ${project.title} case study`
  if (project.href) return `Visit ${project.title} demo site`
  return undefined
}

function renderProjectCursor() {
  const distanceX = cursorTargetX - cursorCurrentX
  const distanceY = cursorTargetY - cursorCurrentY

  cursorCurrentX += distanceX * CURSOR_FOLLOW_STRENGTH
  cursorCurrentY += distanceY * CURSOR_FOLLOW_STRENGTH
  cursorX.value = cursorCurrentX
  cursorY.value = cursorCurrentY

  if (
    Math.abs(distanceX) > CURSOR_SETTLE_THRESHOLD
    || Math.abs(distanceY) > CURSOR_SETTLE_THRESHOLD
  ) {
    cursorFrame = window.requestAnimationFrame(renderProjectCursor)
  } else {
    cursorCurrentX = cursorTargetX
    cursorCurrentY = cursorTargetY
    cursorX.value = cursorTargetX
    cursorY.value = cursorTargetY
    cursorFrame = undefined
  }
}

function scheduleProjectCursor() {
  if (cursorFrame === undefined) {
    cursorFrame = window.requestAnimationFrame(renderProjectCursor)
  }
}

function updateProjectCursorPosition(event: PointerEvent, immediate = false) {
  cursorTargetX = event.clientX
  cursorTargetY = event.clientY

  if (immediate) {
    cursorCurrentX = cursorTargetX
    cursorCurrentY = cursorTargetY
    cursorX.value = cursorTargetX
    cursorY.value = cursorTargetY
  }

  scheduleProjectCursor()
}

function showProjectCursor(event: PointerEvent, label: string, iconOnly: boolean) {
  if (!canUseProjectCursor) return

  cursorLabel.value = label
  cursorIconOnly.value = iconOnly
  updateProjectCursorPosition(event, !cursorActive.value)
  cursorActive.value = true
}

function moveProjectCursor(event: PointerEvent) {
  if (!cursorActive.value) return
  updateProjectCursorPosition(event)
}

function hideProjectCursor() {
  cursorActive.value = false
}

function syncProjectCursorAvailability() {
  canUseProjectCursor = Boolean(
    finePointerQuery?.matches && !reducedMotionQuery?.matches,
  )

  if (!canUseProjectCursor) hideProjectCursor()
}

function syncCarouselToPage() {
  const carousel = carouselRef.value
  if (!carousel) return

  if (!isDesktopCarousel.value) {
    if (carousel.scrollLeft !== 0) carousel.scrollLeft = 0
    return
  }

  const pageScrollTop = getPageScrollTop()
  const horizontalProgress = Math.min(
    Math.max(pageScrollTop - carouselTrackTop, 0),
    carouselMaxScroll,
  )

  if (Math.abs(carousel.scrollLeft - horizontalProgress) > 0.5) {
    carousel.scrollLeft = horizontalProgress
  }
}

function scheduleCarouselSync() {
  if (carouselScrollFrame !== undefined) return

  carouselScrollFrame = window.requestAnimationFrame(() => {
    carouselScrollFrame = undefined
    syncCarouselToPage()
  })
}

function updateCarouselLayout() {
  const carousel = carouselRef.value
  const carouselTrack = carouselTrackRef.value
  if (!carousel || !carouselTrack) return

  carouselTrackTop = getPageScrollTop() + carouselTrack.getBoundingClientRect().top

  if (!isDesktopCarousel.value) {
    carouselMaxScroll = 0
    carouselScrollDistance.value = '0px'
    carousel.scrollLeft = 0
    return
  }

  carouselMaxScroll = Math.max(0, carousel.scrollWidth - carousel.clientWidth)
  carouselScrollDistance.value = `${carouselMaxScroll}px`
  nextTick(scheduleCarouselSync)
}

function syncCarouselMode() {
  isDesktopCarousel.value = Boolean(desktopCarouselQuery?.matches)
  nextTick(updateCarouselLayout)
}

onMounted(() => {
  finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
  reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  desktopCarouselQuery = window.matchMedia('(min-width: 1024px)')
  syncProjectCursorAvailability()
  syncCarouselMode()
  finePointerQuery.addEventListener('change', syncProjectCursorAvailability)
  reducedMotionQuery.addEventListener('change', syncProjectCursorAvailability)
  desktopCarouselQuery.addEventListener('change', syncCarouselMode)
  nextTick(() => {
    updateCarouselLayout()
    if (carouselRef.value) {
      carouselResizeObserver = new ResizeObserver(updateCarouselLayout)
      carouselResizeObserver.observe(carouselRef.value)
      if (homeIntroRef.value) {
        carouselResizeObserver.observe(homeIntroRef.value)
      }
      carouselRef.value.querySelectorAll('.project-card').forEach((card) => {
        carouselResizeObserver?.observe(card)
      })
    }
  })
  window.addEventListener('scroll', scheduleCarouselSync, { passive: true })
  document.addEventListener('scroll', scheduleCarouselSync, { passive: true, capture: true })
  window.addEventListener('resize', updateCarouselLayout)
  window.addEventListener('blur', hideProjectCursor)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', scheduleCarouselSync)
  document.removeEventListener('scroll', scheduleCarouselSync, { capture: true })
  window.removeEventListener('resize', updateCarouselLayout)
  window.removeEventListener('blur', hideProjectCursor)
  finePointerQuery?.removeEventListener('change', syncProjectCursorAvailability)
  reducedMotionQuery?.removeEventListener('change', syncProjectCursorAvailability)
  desktopCarouselQuery?.removeEventListener('change', syncCarouselMode)
  carouselResizeObserver?.disconnect()
  if (carouselScrollFrame !== undefined) {
    window.cancelAnimationFrame(carouselScrollFrame)
  }
  if (cursorFrame !== undefined) {
    window.cancelAnimationFrame(cursorFrame)
  }
})
</script>

<template>
  <section
    class="home"
    :style="{
      '--carousel-scroll-distance': carouselScrollDistance,
    }"
  >
    <div ref="homeIntroRef" class="home__intro">
      <div
        id="about"
        class="home-about text-primary"
      >
        <p class="home-about__statement">Design scales experiments from scraps to people. It is the intentional creation of systems for intelligent beings to operate within and understand the world.</p>
        <p class="home-about__bio">Aaron is a product designer that builds surfaces and systems for scaling complex technologies, allowing products to change lives sustainably</p>
        <div class="home-about__status">
          <p class="home-about__status-label">Currently</p>
          <p>Open to work</p>
        </div>
      </div>
    </div>

    <div
      id="work"
      ref="carouselTrackRef"
      class="carousel-track"
    >
      <div class="carousel-track__sticky">
        <div
          class="carousel-scroll"
        >
          <div
            ref="carouselRef"
            class="project-carousel"
            role="region"
            :aria-label="isDesktopCarousel ? 'Selected projects carousel' : 'Selected projects'"
            :tabindex="isDesktopCarousel ? 0 : undefined"
            @keydown.left.prevent="moveCarousel(-1)"
            @keydown.right.prevent="moveCarousel(1)"
          >
            <article
              v-for="project in projects"
              :key="project.id"
              class="project-card"
              :class="{ 'project-card--portrait': isPortraitProject(project) }"
            >
              <component
                :is="project.to ? NuxtLink : project.href ? 'a' : 'div'"
                :id="`project-${project.id}`"
                :to="project.to || undefined"
                :href="project.href || undefined"
                :target="project.href ? '_blank' : undefined"
                :rel="project.href ? 'noopener noreferrer' : undefined"
                :aria-label="projectAriaLabel(project)"
                class="project-card__media project-card__media--cursor"
                :class="{
                  'project-card__media--interactive': project.to || project.href,
                  'project-card__media--blurred-background': project.mediaBackgroundBlur,
                  'project-card__media--compact-padding': project.compactMediaPadding,
                }"
                :style="projectMediaStyle(project)"
                @pointerenter="showProjectCursor(
                  $event,
                  projectCursorText(project),
                  !project.to && !project.href && !project.soon,
                )"
                @pointermove="moveProjectCursor"
                @pointerleave="hideProjectCursor"
                @pointercancel="hideProjectCursor"
              >
                <div
                  class="project-card__media-inset"
                  :style="projectMediaInsetStyle(project)"
                >
                  <template v-if="project.id === 1">
                    <div class="project-card__phone-screen">
                      <div class="project-card__phone-video-crop">
                        <VideoPlayer
                          class="project-card__phone-video"
                          :src="project.src"
                          @loadedmetadata="syncProjectMediaAspect"
                        />
                      </div>
                    </div>
                    <img
                      class="project-card__phone-frame"
                      src="/images/case-studies/nuance/iphone-16-pro.png"
                      alt=""
                      aria-hidden="true"
                      loading="eager"
                      decoding="async"
                    />
                  </template>
                  <img
                    v-else-if="project.type === 'image'"
                    :src="project.src"
                    :alt="project.title"
                    :loading="project.id === 13 ? 'eager' : 'lazy'"
                    :fetchpriority="project.id === 13 ? 'high' : 'auto'"
                    decoding="async"
                    class="project-card__asset"
                    @load="syncProjectMediaAspect"
                  />
                  <VideoPlayer
                    v-else
                    :src="project.src"
                    @loadedmetadata="syncProjectMediaAspect"
                  />
                </div>
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
              <HeaderNavButton
                v-if="project.to || project.href"
                :to="project.to || undefined"
                :as="project.to ? undefined : 'a'"
                :href="project.href || undefined"
                :target="project.href ? '_blank' : undefined"
                :rel="project.href ? 'noopener noreferrer' : undefined"
                :aria-label="projectAriaLabel(project)"
                class="project-card__action"
                :class="{ 'project-card__action--case-study': project.to }"
              >
                <span class="project-card__action-label">
                  <span class="project-card__action-text">{{ projectCursorText(project) }}</span>
                  <component
                    :is="project.to ? ArrowRightIcon : ArrowUpRightIcon"
                    class="project-card__action-icon"
                    aria-hidden="true"
                  />
                </span>
              </HeaderNavButton>
              <HeaderNavButton
                v-else
                as="button"
                type="button"
                disabled
                :aria-label="project.soon ? `${project.title}: coming soon` : `${project.title}: no case study or live demo available`"
                class="project-card__action project-card__action--disabled"
                :class="{ 'project-card__action--soon': project.soon, 'project-card__action--unavailable': !project.soon }"
              >
                <span v-if="project.soon">Soon</span>
                <NoSymbolIcon v-else class="project-card__action-icon" aria-hidden="true" />
              </HeaderNavButton>
            </article>
          </div>
        </div>
      </div>
    </div>

    <ProjectHoverCursor
      :active="cursorActive"
      :icon-only="cursorIconOnly"
      :label="cursorLabel"
      :x="cursorX"
      :y="cursorY"
    />
  </section>
</template>

<style scoped>
.home {
  --home-about-start-offset: var(--space-8);
  --home-intro-content-gap: var(--space-8);
  position: relative;
  color: var(--color-text);
}

.home__intro {
  position: relative;
  padding-top: var(--layout-header-clearance);
  padding-bottom: calc(
    var(--home-about-start-offset)
    + var(--home-intro-content-gap)
  );
  padding-inline: var(--layout-content-edge);
}

.home-about {
  position: relative;
  z-index: 0;
  display: flex;
  width: min(calc(100vw - (var(--page-padding) * 2)), var(--intro-content-width));
  margin-inline: auto;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-xl);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: 1.4;
  pointer-events: none;
  transform: translate3d(
    0,
    var(--home-about-start-offset),
    0
  );
}

.home-about p {
  margin: 0;
}

.home-about__statement {
  width: 100%;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-heading);
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-align: left;
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

.carousel-track {
  position: relative;
  height: calc(100svh + var(--carousel-scroll-distance, 0px));
  scroll-margin-top: 0;
}

.carousel-track__sticky {
  position: sticky;
  top: 0;
  display: flex;
  height: 100svh;
  align-items: center;
  overflow: hidden;
}

.carousel-scroll {
  position: relative;
  z-index: 1;
  width: 100vw;
}

.project-carousel {
  display: flex;
  width: 100%;
  align-items: flex-end;
  gap: var(--space-xxxl);
  padding-right: var(--layout-content-edge);
  padding-left: var(--intro-content-edge);
  overflow-x: hidden;
  overflow-y: hidden;
  scrollbar-width: none;
  touch-action: pan-y;
}

.project-carousel::-webkit-scrollbar {
  display: none;
}

.project-carousel:focus-visible {
  outline: 1px solid var(--color-text);
  outline-offset: var(--space-xxs);
}

.project-card {
  display: flex;
  flex: 0 0 clamp(320px, 40vw, 605px);
  min-width: 0;
  flex-direction: column;
  gap: var(--space-s);
}

.project-card--portrait {
  flex-basis: clamp(240px, 30vw, 454px);
}

.project-card__media {
  position: relative;
  display: grid;
  width: 100%;
  place-items: center;
  padding: var(--project-media-padding, var(--space-10));
  border-radius: var(--case-study-surface-radius);
  background-color: var(
    --project-media-background-color,
    var(--color-media-background)
  );
  overflow: hidden;
  isolation: isolate;
  container-type: size;
  -webkit-mask-image: -webkit-radial-gradient(white, black);
}

.project-card__media::before {
  position: absolute;
  z-index: 0;
  inset: 0;
  background-image: var(--project-media-background-image, none);
  background-position: center;
  background-size: cover;
  content: '';
  pointer-events: none;
}

.project-card__media--blurred-background::before {
  inset: calc(var(--space-l) * -1);
  filter:
    blur(var(--space-l))
    brightness(var(--project-media-background-brightness, 1));
}

.project-card__media--compact-padding {
  --project-media-padding: var(--space-xl);
}

.project-card__media-inset {
  position: relative;
  z-index: 1;
  width: min(100%, calc(100cqh * var(--project-media-ratio)));
  height: auto;
  max-height: 100%;
  overflow: hidden;
  isolation: isolate;
  border-radius: var(--case-study-surface-radius);
  clip-path: inset(0 round var(--case-study-surface-radius));
  -webkit-mask-image: -webkit-radial-gradient(white, black);
}

/* Subtle separation for dark media against dark card surfaces. */
#project-3 .project-card__media-inset::after,
#project-4::after,
#project-7::after {
  position: absolute;
  z-index: 2;
  inset: 0;
  border: 1px solid var(--color-border);
  border-radius: inherit;
  content: '';
  pointer-events: none;
}

.project-card__media--interactive {
  cursor: pointer;
}

.project-card__asset {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--case-study-surface-radius);
  clip-path: inset(0 round var(--case-study-surface-radius));
  object-fit: contain;
  object-position: center;
}

.project-card__media :deep(video) {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: var(--case-study-surface-radius);
  clip-path: inset(0 round var(--case-study-surface-radius));
  object-fit: contain;
  object-position: center;
}

/* Reuse the Nuance Figure 1 phone crop and frame treatment. */
#project-1 {
  padding: 0;
}

#project-1 .project-card__media-inset {
  width: auto;
  height: 88%;
  max-height: none;
  overflow: visible;
  border-radius: 0;
  clip-path: none;
  -webkit-mask-image: none;
}

.project-card__phone-screen {
  position: absolute;
  top: 2.5%;
  left: 50%;
  width: auto;
  height: 95%;
  aspect-ratio: 402 / 874;
  overflow: hidden;
  border-radius: 13.68% / 6.29%;
  background: #080c0f;
  transform: translateX(-50%);
}

.project-card__phone-video-crop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: inherit;
}

#project-1 :deep(.project-card__phone-video) {
  position: absolute;
  top: -9.667%;
  left: -149.758%;
  width: 399.517%;
  max-width: none;
  height: 120%;
  border-radius: 0;
  clip-path: none;
  object-fit: fill;
}

.project-card__phone-frame {
  position: absolute;
  z-index: 1;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  user-select: none;
}

/* Remove Chewsy's source-canvas dead space while preserving the framed clip. */
#project-12 .project-card__media-inset {
  --chewsy-preview-scale: 2;
  border-radius: calc(
    var(--case-study-surface-radius) / var(--chewsy-preview-scale)
  );
  transform: scale(var(--chewsy-preview-scale));
}

#project-12 :deep(video) {
  border-radius: inherit;
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
  width: 100%;
  align-self: stretch;
  flex-direction: column;
  gap: var(--space-xxs);
  padding-inline: 0;
  overflow-wrap: anywhere;
  text-align: left;
}

.project-card__details h2 {
  width: 100%;
  font-size: var(--font-size-m);
  font-weight: var(--font-weight-heading);
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
  color: var(--color-subdued);
  transition: color var(--transition-theme);
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

.project-card__action {
  --header-nav-button-background: transparent;
  --header-nav-button-color: var(--color-text);
  display: none;
  align-self: flex-start;
  border: 1px solid currentColor;
}

.project-card__action--case-study {
  --header-nav-button-color: var(--color-link-case-study);
}

.project-card__action--disabled {
  --header-nav-button-color: var(--color-subdued);
  cursor: default;
}

.project-card__action--disabled:hover,
.project-card__action--disabled:active {
  background-color: transparent;
  transform: none;
}

.project-card__action--unavailable {
  width: var(--control-height);
  padding: 0;
}

.project-card__action--unavailable :deep(.header-nav-button__label) {
  display: flex;
}

.project-card__action:focus-visible {
  outline: 1px solid currentColor;
  outline-offset: var(--space-xxs);
}

.project-card__action-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
}

.project-card__action-icon {
  width: var(--icon-size-s);
  height: var(--icon-size-s);
}

@media (max-width: 639px) {
  .home-about__statement {
    font-size: var(--font-size-l);
  }

  .project-card__action {
    width: var(--control-height);
    padding: 0;
  }

  .project-card__action--soon {
    width: auto;
    padding-inline: var(--space-l);
  }

  .project-card__action :deep(.header-nav-button__label),
  .project-card__action-label {
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  .project-card__action-text {
    display: none;
  }

  .home__intro {
    /* The mobile identity row and sticky nav now reserve their own space. */
    padding-top: 0;
  }
}

@media (max-width: 1023px) {
  .project-card__action {
    display: inline-flex;
    grid-column: 2;
    grid-row: 2;
    justify-self: end;
  }

  .carousel-track {
    height: auto;
  }

  .carousel-track__sticky {
    position: relative;
    top: auto;
    display: block;
    height: auto;
    overflow: visible;
  }

  .carousel-scroll {
    width: 100%;
  }

  .project-carousel {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: initial;
    gap: var(--space-16);
    padding-right: var(--layout-content-edge);
    padding-bottom: var(--layout-carousel-bottom-clearance);
    padding-left: var(--layout-content-edge);
    overflow: visible;
    touch-action: auto;
  }

  .project-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    width: 100%;
    min-width: 0;
    flex: none;
  }

  .project-card--portrait {
    flex-basis: auto;
  }

  .project-card__media {
    --project-media-padding: var(--space-xl);
    grid-column: 1 / -1;
  }

  .project-card__details {
    grid-column: 1;
    grid-row: 2;
    min-width: 0;
  }

  .project-card__details:last-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 639px) {
  .project-card__media {
    display: block;
    padding: 0;
    aspect-ratio: auto !important;
    background: none;
    container-type: normal;
  }

  .project-card__media::before,
  #project-3 .project-card__media-inset::after,
  #project-4::after,
  #project-7::after,
  .project-card__phone-frame {
    display: none;
  }

  .project-card__media-inset,
  #project-1 .project-card__media-inset,
  #project-12 .project-card__media-inset,
  .project-card__phone-screen,
  .project-card__phone-video-crop {
    display: contents;
  }

  .project-card__asset,
  .project-card__media :deep(video),
  #project-1 :deep(.project-card__phone-video),
  #project-6 :deep(video),
  #project-8 :deep(video) {
    position: static;
    width: 100%;
    height: auto;
    max-width: 100%;
    aspect-ratio: auto var(--project-source-aspect);
    object-fit: contain;
    transform: none;
  }

  #project-1 {
    /* Crop the source video's side margins into a taller mobile preview. */
    --nuance-preview-aspect: 3 / 4;
  }

  #project-1 :deep(.project-card__phone-video) {
    aspect-ratio: var(--nuance-preview-aspect);
    object-fit: cover;
    object-position: center;
    border-radius: var(--case-study-surface-radius);
  }
}

@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  .project-card__media--cursor {
    cursor: none;
  }
}

</style>
