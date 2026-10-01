<script setup lang="ts">
import { animate, springValue, type MotionValue } from 'motion'

type HeaderNavPhase = 'expanded' | 'collapsing' | 'collapsed' | 'expanding' | 'settling'
type BlobCoreController = {
  x: MotionValue<number>
  y: MotionValue<number>
  scaleX: MotionValue<number>
  scaleY: MotionValue<number>
  unsubscribers: Array<() => void>
  renderFrame?: number
}

const route = useRoute()
const aboutSheet = ref<{ open: () => void } | null>(null)
const workSheet = ref<{ open: () => void } | null>(null)
const isCaseStudy = computed(() => route.path === '/nuance' || route.path === '/nova')
const pacificTime = ref('--:--:-- PST')
const headerNavPhase = ref<HeaderNavPhase>('expanded')
const headerNavRef = ref<HTMLElement | null>(null)
const headerNavItemsRef = ref<HTMLElement | null>(null)
const headerNavLiquidRef = ref<SVGSVGElement | null>(null)
const isHeaderNavUnavailable = computed(() => headerNavPhase.value !== 'expanded')
let clockTimer: ReturnType<typeof setInterval> | undefined
let blobIdleTimer: ReturnType<typeof setTimeout> | undefined
let previousScrollY = 0
let navScrollFrame: number | undefined
let pointerFrame: number | undefined
let latestPointerX = 0
let latestPointerY = 0
let isPointerNearBlob = false
let blobIdleStep = 0
const blobCoreControllers = new WeakMap<SVGGElement, BlobCoreController>()
const activeBlobCoreControllers = new Set<BlobCoreController>()
let prefersReducedMotion = false
let desktopNavQuery: MediaQueryList | undefined
let navAnimationVersion = 0
const navAnimations = new Set<{ stop: () => void }>()

function syncNavBreakpoint() {
  navAnimationVersion += 1
  navAnimations.forEach(animation => animation.stop())
  navAnimations.clear()
  clearBlobIdleTimer()
  isPointerNearBlob = false
  returnBlobCoresToRest()
  headerNavPhase.value = 'expanded'
  getNavContentElements().forEach(element => { element.style.opacity = '1' })
  previousScrollY = Math.max(window.scrollY, 0)
}

function updatePacificTime() {
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())

  pacificTime.value = `${time} PST`
}

function readPixelToken(token: string, fallback: number) {
  const rawValue = window.getComputedStyle(document.documentElement).getPropertyValue(token)
  const parsedValue = Number.parseFloat(rawValue)

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

function getNavShapeElements() {
  return Array.from(
    headerNavItemsRef.value?.querySelectorAll<HTMLElement>('[data-nav-blob]') ?? [],
  )
}

function getLiquidBlobs() {
  return Array.from(
    headerNavLiquidRef.value?.querySelectorAll<SVGGElement>('.header__nav-blob') ?? [],
  )
}

function getLiquidBlobCores() {
  return Array.from(
    headerNavLiquidRef.value?.querySelectorAll<SVGGElement>('.header__nav-blob-core') ?? [],
  )
}

function getNavContentElements() {
  return Array.from(
    headerNavItemsRef.value?.querySelectorAll<HTMLElement>('[data-nav-content]') ?? [],
  )
}

function renderBlobCore(core: SVGGElement, controller: BlobCoreController) {
  controller.renderFrame = undefined
  const shape = core.querySelector<SVGRectElement>('.header__nav-blob-shape')
  if (!shape) return

  const x = Number(shape.getAttribute('x') ?? 0)
  const y = Number(shape.getAttribute('y') ?? 0)
  const width = Number(shape.getAttribute('width') ?? 0)
  const height = Number(shape.getAttribute('height') ?? 0)
  const centerX = x + width / 2
  const centerY = y + height / 2

  core.setAttribute(
    'transform',
    `translate(${centerX + controller.x.get()} ${centerY + controller.y.get()}) scale(${controller.scaleX.get()} ${controller.scaleY.get()}) translate(${-centerX} ${-centerY})`,
  )
}

function getBlobCoreController(core: SVGGElement) {
  const existingController = blobCoreControllers.get(core)
  if (existingController) return existingController

  const springOptions = {
    stiffness: 260,
    damping: 34,
    mass: 0.85,
  }
  const controller: BlobCoreController = {
    x: springValue(0, springOptions),
    y: springValue(0, springOptions),
    scaleX: springValue(1, springOptions),
    scaleY: springValue(1, springOptions),
    unsubscribers: [],
  }
  const scheduleRender = () => {
    if (controller.renderFrame !== undefined) return
    controller.renderFrame = window.requestAnimationFrame(() => renderBlobCore(core, controller))
  }

  controller.unsubscribers = [controller.x, controller.y, controller.scaleX, controller.scaleY]
    .map(value => value.on('change', scheduleRender))
  blobCoreControllers.set(core, controller)
  activeBlobCoreControllers.add(controller)

  return controller
}

function destroyBlobCoreControllers() {
  activeBlobCoreControllers.forEach((controller) => {
    controller.unsubscribers.forEach(unsubscribe => unsubscribe())
    if (controller.renderFrame !== undefined) {
      window.cancelAnimationFrame(controller.renderFrame)
    }
    controller.x.destroy()
    controller.y.destroy()
    controller.scaleX.destroy()
    controller.scaleY.destroy()
  })
  activeBlobCoreControllers.clear()
}

function clearBlobIdleTimer() {
  if (blobIdleTimer !== undefined) {
    window.clearTimeout(blobIdleTimer)
    blobIdleTimer = undefined
  }
}

function animateBlobCores(
  targets: Array<{ x: number, y: number, scaleX: number, scaleY: number }>,
) {
  getLiquidBlobCores().forEach((core, index) => {
    const controller = getBlobCoreController(core)
    const target = targets[index] ?? { x: 0, y: 0, scaleX: 1, scaleY: 1 }

    controller.x.set(target.x)
    controller.y.set(target.y)
    controller.scaleX.set(target.scaleX)
    controller.scaleY.set(target.scaleY)
  })
}

function returnBlobCoresToRest() {
  animateBlobCores(getLiquidBlobCores().map(() => ({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
  })))
}

function scheduleBlobIdle(delay = 900) {
  clearBlobIdleTimer()

  if (prefersReducedMotion || headerNavPhase.value !== 'collapsed' || isPointerNearBlob) return

  blobIdleTimer = window.setTimeout(() => {
    if (headerNavPhase.value !== 'collapsed' || isPointerNearBlob) return

    blobIdleStep += 1
    const direction = blobIdleStep % 2 === 0 ? 1 : -1
    const maxX = readPixelToken('--header-nav-cursor-pull-x', 8)
    const maxY = readPixelToken('--header-nav-cursor-pull-y', 4)

    animateBlobCores([
      { x: -maxX * 0.16 * direction, y: maxY * 0.12, scaleX: 1.015, scaleY: 0.99 },
      { x: maxX * 0.05 * direction, y: -maxY * 0.1, scaleX: 1.01, scaleY: 1.01 },
      { x: maxX * 0.18 * direction, y: maxY * 0.08, scaleX: 1.02, scaleY: 0.99 },
    ])

    scheduleBlobIdle(1800)
  }, delay)
}

function measureLiquidBlobs() {
  const nav = headerNavRef.value
  const shapes = getNavShapeElements()
  const blobs = getLiquidBlobs()

  if (!nav || shapes.length !== blobs.length) return false

  const navRect = nav.getBoundingClientRect()
  const targetWidth = readPixelToken('--header-nav-collapsed-width', 72)
  const targetHeight = readPixelToken('--header-nav-collapsed-height', 12)
  const targetCenterX = navRect.width / 2
  const targetCenterY = navRect.height / 2

  shapes.forEach((shape, index) => {
    const shapeRect = shape.getBoundingClientRect()
    const blob = blobs[index]
    const blobShape = blob?.querySelector<SVGRectElement>('.header__nav-blob-shape')
    if (!blob || !blobShape) return

    const left = shapeRect.left - navRect.left
    const top = shapeRect.top - navRect.top

    blobShape.setAttribute('x', String(left))
    blobShape.setAttribute('y', String(top))
    blobShape.setAttribute('width', String(shapeRect.width))
    blobShape.setAttribute('height', String(shapeRect.height))
    blobShape.setAttribute('rx', String(shapeRect.height / 2))
    blob.dataset.sourceX = String(left)
    blob.dataset.sourceY = String(top)
    blob.dataset.sourceWidth = String(shapeRect.width)
    blob.dataset.sourceHeight = String(shapeRect.height)
    blob.dataset.targetX = String(targetCenterX - targetWidth / 2)
    blob.dataset.targetY = String(targetCenterY - targetHeight / 2)
    blob.dataset.targetWidth = String(targetWidth)
    blob.dataset.targetHeight = String(targetHeight)
    blob.dataset.progress = '0'
  })

  return true
}

function renderLiquidBlob(blob: SVGGElement, progress: number) {
  const shape = blob.querySelector<SVGRectElement>('.header__nav-blob-shape')
  if (!shape) return

  const sourceX = Number(blob.dataset.sourceX ?? 0)
  const sourceY = Number(blob.dataset.sourceY ?? 0)
  const sourceWidth = Number(blob.dataset.sourceWidth ?? 0)
  const sourceHeight = Number(blob.dataset.sourceHeight ?? 0)
  const targetX = Number(blob.dataset.targetX ?? sourceX)
  const targetY = Number(blob.dataset.targetY ?? sourceY)
  const targetWidth = Number(blob.dataset.targetWidth ?? sourceWidth)
  const targetHeight = Number(blob.dataset.targetHeight ?? sourceHeight)
  const interpolate = (from: number, to: number) => from + (to - from) * progress
  const width = interpolate(sourceWidth, targetWidth)
  const height = interpolate(sourceHeight, targetHeight)

  shape.setAttribute('x', String(interpolate(sourceX, targetX)))
  shape.setAttribute('y', String(interpolate(sourceY, targetY)))
  shape.setAttribute('width', String(width))
  shape.setAttribute('height', String(height))
  shape.setAttribute('rx', String(height / 2))
  blob.dataset.progress = String(progress)
}

function animateLiquidBlob(blob: SVGGElement, progress: number, expanding = false) {
  const state = { progress: Number(blob.dataset.progress ?? (expanding ? 1 : 0)) }

  const animation = animate(state, { progress }, {
    type: 'spring',
    stiffness: expanding ? 210 : 190,
    damping: expanding ? 29 : 26,
    mass: expanding ? 0.95 : 1.05,
    onUpdate: () => renderLiquidBlob(blob, state.progress),
  })
  navAnimations.add(animation)
  return animation
}

async function collapseHeaderNav() {
  if (!desktopNavQuery?.matches) return
  if (headerNavPhase.value !== 'expanded' || !measureLiquidBlobs()) return

  const version = navAnimationVersion
  headerNavPhase.value = 'collapsing'
  await nextTick()
  if (version !== navAnimationVersion) return

  const blobs = getLiquidBlobs()
  const content = getNavContentElements()

  if (prefersReducedMotion) {
    blobs.forEach((blob) => {
      renderLiquidBlob(blob, 1)
    })
    content.forEach((element) => {
      element.style.opacity = '0'
    })
    headerNavPhase.value = 'collapsed'
    return
  }

  const morphAnimations = blobs.map(blob => animateLiquidBlob(blob, 1))

  content.forEach((element) => {
    navAnimations.add(animate(element, { opacity: 0 }, { duration: 0.16, ease: 'easeOut' }))
  })

  await Promise.all(morphAnimations)
  if (version !== navAnimationVersion) return
  navAnimations.clear()
  headerNavPhase.value = 'collapsed'
  scheduleBlobIdle()
}

async function expandHeaderNav() {
  if (!desktopNavQuery?.matches) return
  if (headerNavPhase.value !== 'collapsed') return

  const version = navAnimationVersion
  clearBlobIdleTimer()
  isPointerNearBlob = false
  returnBlobCoresToRest()
  headerNavPhase.value = 'expanding'

  const blobs = getLiquidBlobs()
  const content = getNavContentElements()

  if (prefersReducedMotion) {
    blobs.forEach((blob) => {
      renderLiquidBlob(blob, 0)
    })
    content.forEach((element) => {
      element.style.opacity = '1'
    })
    headerNavPhase.value = 'expanded'
    previousScrollY = Math.max(window.scrollY, 0)
    return
  }

  const morphAnimations = blobs.map(blob => animateLiquidBlob(blob, 0, true))

  await Promise.all(morphAnimations)
  if (version !== navAnimationVersion) return
  headerNavPhase.value = 'settling'
  await nextTick()
  if (version !== navAnimationVersion) return

  const contentAnimations = content.map(element => animate(
    element,
    { opacity: 1 },
    { duration: 0.16, ease: 'easeOut' },
  ))
  contentAnimations.forEach(animation => navAnimations.add(animation))

  await Promise.all(contentAnimations)
  if (version !== navAnimationVersion) return
  navAnimations.clear()
  headerNavPhase.value = 'expanded'
  previousScrollY = Math.max(window.scrollY, 0)
}

function syncBlobToPointer() {
  pointerFrame = undefined

  const nav = headerNavRef.value
  if (!nav || headerNavPhase.value !== 'collapsed' || prefersReducedMotion) return

  const navRect = nav.getBoundingClientRect()
  const centerX = navRect.left + navRect.width / 2
  const centerY = navRect.top + navRect.height / 2
  const deltaX = latestPointerX - centerX
  const deltaY = latestPointerY - centerY
  const distance = Math.hypot(deltaX, deltaY)
  const radius = readPixelToken('--header-nav-cursor-radius', 200)
  const exitRadius = radius * 1.08

  if (distance >= (isPointerNearBlob ? exitRadius : radius)) {
    if (isPointerNearBlob) {
      isPointerNearBlob = false
      returnBlobCoresToRest()
      scheduleBlobIdle()
    }
    return
  }

  isPointerNearBlob = true
  clearBlobIdleTimer()

  const proximity = Math.max(0, 1 - distance / radius)
  const maxX = readPixelToken('--header-nav-cursor-pull-x', 8)
  const maxY = readPixelToken('--header-nav-cursor-pull-y', 4)
  const pullStrengths = [0.42, 0.72, 1]
  const smoothPullX = Math.max(-1, Math.min(1, (deltaX / radius) * proximity * 3))
  const smoothPullY = Math.max(-1, Math.min(1, (deltaY / radius) * proximity * 3))

  animateBlobCores(pullStrengths.map((strength, index) => ({
    x: smoothPullX * maxX * strength,
    y: smoothPullY * maxY * strength,
    scaleX: 1 + proximity * (0.02 + index * 0.012),
    scaleY: 1 + proximity * (0.008 + index * 0.004),
  })))
}

function handlePointerMove(event: PointerEvent) {
  if (!desktopNavQuery?.matches) return
  latestPointerX = event.clientX
  latestPointerY = event.clientY

  if (pointerFrame !== undefined || headerNavPhase.value !== 'collapsed') return
  pointerFrame = window.requestAnimationFrame(syncBlobToPointer)
}

function syncHeaderNavToScroll() {
  navScrollFrame = undefined
  const nextScrollY = Math.max(window.scrollY, 0)

  if (nextScrollY > previousScrollY && headerNavPhase.value === 'expanded') {
    void collapseHeaderNav()
  } else if (nextScrollY < previousScrollY && headerNavPhase.value === 'collapsed') {
    void expandHeaderNav()
  }

  previousScrollY = nextScrollY
}

function handleHeaderNavWheel(event: WheelEvent) {
  if (!desktopNavQuery?.matches) return
  if (event.deltaY > 0 && headerNavPhase.value === 'expanded') {
    void collapseHeaderNav()
  } else if (event.deltaY < 0 && headerNavPhase.value === 'collapsed') {
    void expandHeaderNav()
  }
}

function scheduleHeaderNavSync() {
  if (!desktopNavQuery?.matches) return
  if (navScrollFrame !== undefined) return
  navScrollFrame = window.requestAnimationFrame(syncHeaderNavToScroll)
}

onMounted(() => {
  updatePacificTime()
  desktopNavQuery = window.matchMedia('(min-width: 1024px)')
  desktopNavQuery.addEventListener('change', syncNavBreakpoint)
  syncNavBreakpoint()
  previousScrollY = Math.max(window.scrollY, 0)
  prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  clockTimer = window.setInterval(updatePacificTime, 1000)
  window.addEventListener('scroll', scheduleHeaderNavSync, { passive: true })
  window.addEventListener('wheel', handleHeaderNavWheel, { passive: true })
  window.addEventListener('pointermove', handlePointerMove, { passive: true })
})

onBeforeUnmount(() => {
  desktopNavQuery?.removeEventListener('change', syncNavBreakpoint)
  navAnimationVersion += 1
  navAnimations.forEach(animation => animation.stop())
  navAnimations.clear()
  window.removeEventListener('scroll', scheduleHeaderNavSync)
  window.removeEventListener('wheel', handleHeaderNavWheel)
  window.removeEventListener('pointermove', handlePointerMove)
  clearBlobIdleTimer()
  destroyBlobCoreControllers()

  if (navScrollFrame !== undefined) {
    window.cancelAnimationFrame(navScrollFrame)
  }

  if (pointerFrame !== undefined) {
    window.cancelAnimationFrame(pointerFrame)
  }

  if (clockTimer !== undefined) {
    window.clearInterval(clockTimer)
  }
})
</script>

<template>
  <div class="site" :class="{ 'site--case-study': isCaseStudy }">
    <header class="header">
      <div v-if="!isCaseStudy" class="header__info">
        <div class="header__identity text-primary">
          <span>Aaron Lee</span>
          <span class="header__subdued">Product designer, digital artist</span>
        </div>
        <div class="header__location text-primary">
          <time class="header__time" aria-label="Current Pacific time">
            {{ pacificTime }}
          </time>
          <span class="header__subdued">Los Angeles, San Francisco</span>
        </div>
      </div>

      <nav
        ref="headerNavRef"
        class="header__nav"
        :class="`header__nav--${headerNavPhase}`"
        aria-label="Primary navigation"
      >
        <svg
          ref="headerNavLiquidRef"
          class="header__nav-liquid"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="header-nav-goo"
              x="-50%"
              y="-100%"
              width="200%"
              height="300%"
              color-interpolation-filters="sRGB"
            >
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0
                        0 1 0 0 0
                        0 0 1 0 0
                        0 0 0 18 -7"
                result="goo"
              />
            </filter>
          </defs>
          <g filter="url(#header-nav-goo)">
            <g v-for="index in 3" :key="index" class="header__nav-blob">
              <g class="header__nav-blob-core">
                <rect class="header__nav-blob-shape" />
              </g>
            </g>
          </g>
        </svg>

        <div
          id="primary-nav-items"
          ref="headerNavItemsRef"
          class="header__nav-items"
          :aria-hidden="isHeaderNavUnavailable"
        >
          <NuxtLink
            to="/"
            class="header__mark-link"
            data-nav-blob
            aria-label="Aaron Lee home"
            :tabindex="isHeaderNavUnavailable ? -1 : undefined"
          >
            <img src="/icons/header-mark.svg" alt="" data-nav-content />
          </NuxtLink>
          <HeaderNavButton
            as="button"
            type="button"
            aria-haspopup="dialog"
            aria-controls="work-sheet"
            @click="workSheet?.open()"
            data-nav-blob
            :tabindex="isHeaderNavUnavailable ? -1 : undefined"
          >
            Work
          </HeaderNavButton>
          <HeaderNavButton
            as="button"
            type="button"
            aria-haspopup="dialog"
            aria-controls="about-sheet"
            @click="aboutSheet?.open()"
            data-nav-blob
            :tabindex="isHeaderNavUnavailable ? -1 : undefined"
          >
            About
          </HeaderNavButton>
        </div>

        <button
          class="header__nav-restore"
          type="button"
          aria-label="Show primary navigation"
          aria-controls="primary-nav-items"
          :aria-expanded="headerNavPhase === 'expanded'"
          :aria-hidden="headerNavPhase !== 'collapsed'"
          :tabindex="headerNavPhase === 'collapsed' ? 0 : -1"
          @click="expandHeaderNav"
        />
      </nav>

      <address v-if="!isCaseStudy" class="header__contacts text-primary" aria-label="Contact Aaron Lee">
        <a href="mailto:alee9193@usc.edu">alee9193@usc.edu</a>
        <a href="https://x.com/acorn_lee_" target="_blank" rel="noopener noreferrer">X</a>
        <a href="https://www.linkedin.com/in/aaaronlee/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </address>
    </header>

    <main class="main">
      <slot />
    </main>

    <ProgressiveBottomBlur v-if="isCaseStudy" />
    <SoundGradientStrip v-if="!isCaseStudy" />
    <AboutSheet ref="aboutSheet" />
    <WorkSheet ref="workSheet" />
  </div>
</template>

<style scoped>
.site {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

.header {
  position: fixed;
  z-index: 2147483647;
  top: var(--space-m);
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0 var(--layout-content-edge);
  background-color: transparent;
  pointer-events: none;
}

.header__info {
  display: contents;
}

.header__nav {
  position: relative;
  display: flex;
  height: var(--control-height);
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.header__nav-items {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  pointer-events: auto;
}

.header__nav--collapsing .header__nav-items,
.header__nav--collapsed .header__nav-items,
.header__nav--expanding .header__nav-items,
.header__nav--settling .header__nav-items {
  pointer-events: none;
}

.header__nav-liquid {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--transition-fast);
}

.header__nav--collapsing .header__nav-liquid,
.header__nav--collapsed .header__nav-liquid,
.header__nav--expanding .header__nav-liquid,
.header__nav--settling .header__nav-liquid {
  opacity: 1;
}

.header__nav-blob {
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform;
}

.header__nav-blob-core {
  transform-box: fill-box;
  transform-origin: center;
  will-change: transform;
}

.header__nav-blob-shape {
  fill: var(--color-nav-surface);
  transition: fill var(--transition-fast);
}

.header__nav--collapsing .header__mark-link,
.header__nav--collapsed .header__mark-link,
.header__nav--expanding .header__mark-link,
.header__nav--collapsing :deep(.header-nav-button),
.header__nav--collapsed :deep(.header-nav-button),
.header__nav--expanding :deep(.header-nav-button) {
  background-color: transparent;
}

.header__nav-restore {
  position: absolute;
  z-index: 3;
  top: 50%;
  left: 50%;
  display: grid;
  width: var(--header-nav-collapsed-width);
  height: var(--control-height);
  padding: 0;
  border: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
  opacity: 0;
  place-items: center;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.header__nav--collapsed .header__nav-restore {
  opacity: 1;
  pointer-events: auto;
}

.header__nav:has(.header__nav-restore:hover) .header__nav-blob-shape,
.header__nav:has(.header__nav-restore:focus-visible) .header__nav-blob-shape {
  fill: var(--color-nav-surface-hover);
}

.header__nav-restore:focus-visible {
  outline: 1px solid var(--color-text);
  outline-offset: var(--space-xxs);
}

.header__identity,
.header__location {
  position: fixed;
  top: var(--space-m);
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  white-space: nowrap;
}

.header__identity {
  left: var(--layout-content-edge);
  align-items: flex-start;
  text-align: left;
}

.header__location {
  right: var(--layout-content-edge);
  align-items: flex-end;
  text-align: right;
}

.header__time {
  font-variant-numeric: tabular-nums;
}

.header__subdued {
  color: var(--color-subdued);
  transition: color var(--transition-theme);
}

.header__mark-link {
  display: flex;
  height: var(--control-height);
  align-items: center;
  justify-content: center;
  padding: var(--space-xs) var(--space-l);
  border-radius: var(--radius-pill);
  background-color: var(--color-nav-surface);
  transition:
    background-color var(--transition-fast),
    transform 100ms ease-out;
}

.header__mark-link img {
  filter: invert(1);
  transition: filter var(--transition-theme);
}

.header__mark-link:hover {
  background-color: var(--color-nav-surface-hover);
}

.header__mark-link:active {
  transform: scale(0.97);
}

.header__contacts {
  position: fixed;
  right: var(--layout-content-edge);
  bottom: var(--layout-footer-bottom);
  min-height: var(--layout-footer-control-height);
  display: flex;
  align-items: center;
  gap: var(--space-m);
  font-size: var(--font-size-s);
  font-style: normal;
  font-weight: var(--font-weight-heading);
  line-height: var(--line-height-body);
  color: var(--color-sound-overlay-text);
  pointer-events: auto;
  white-space: nowrap;
}

.header__contacts a {
  transition: opacity var(--transition-fast);
}

.header__contacts a:hover {
  opacity: 0.5;
}

.main {
  position: relative;
  z-index: 0;
  isolation: isolate;
  flex: 1;
}

@media (max-width: 767px) {
  .header {
    top: calc(var(--space-xxxl) + var(--space-xl));
  }

  .site--case-study .header {
    top: var(--space-m);
  }

  .header__identity,
  .header__location {
    font-size: var(--font-size-xs);
  }
}

@media (max-width: 359px) {
  .header__identity,
  .header__location {
    font-size: var(--font-size-xxs);
  }
}

@media (max-width: 1023px) {
  .header__contacts {
    gap: var(--space-xs);
  }
}

@media (max-width: 639px) {
  /* Let the nav stick against the whole page, not a short header wrapper. */
  .site:not(.site--case-study) .header {
    display: contents;
  }

  .header__info {
    position: relative;
    display: flex;
    justify-content: space-between;
    gap: var(--space-s);
    padding: var(--space-m) var(--layout-content-edge) 0;
  }

  .header__identity,
  .header__location {
    position: relative;
    inset: auto;
  }

  .site:not(.site--case-study) .header__nav {
    position: sticky;
    z-index: 2147483647;
    top: var(--space-m);
    width: fit-content;
    margin: var(--space-xl) auto 0;
  }

  .header__contacts {
    z-index: 2147483647;
    left: auto;
    right: var(--layout-content-edge);
    justify-content: flex-end;
    text-align: right;
    color: var(--color-text);
  }
}

@media (prefers-reduced-motion: reduce) {
  .header__nav-liquid,
  .header__nav-blob-shape {
    transition: none;
  }
}
</style>
