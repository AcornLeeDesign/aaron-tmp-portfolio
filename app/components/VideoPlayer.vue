<script lang="ts">
interface VideoRegistration {
  id: number
  caseStudy: boolean
  prepare: (load: boolean) => void
  onPause: () => void
  video: HTMLVideoElement
  visibilityRatio: number
  viewportTop: number
  wantsPlayback: boolean
  playPending: boolean
  playbackStarted: boolean
  stalledTimer: number | undefined
  onFallback: (visible: boolean) => void
  retryDelay: number
  retryTimer: number | undefined
  onCanPlay: () => void
  onPlaying: () => void
}

const STALLED_PLAYBACK_DELAY = 8000
const MAX_PLAYING_VIDEOS = 1
const videoRegistrations = new Map<number, VideoRegistration>()
let nextRegistrationId = 0
let playbackTimer: number | undefined
let coordinatorListenersAttached = false

function viewportVisibilityRatio(video: HTMLVideoElement) {
  const rect = video.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return 0

  const visibleWidth = Math.max(
    0,
    Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0)
  )
  const visibleHeight = Math.max(
    0,
    Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0)
  )

  return (visibleWidth * visibleHeight) / (rect.width * rect.height)
}

function schedulePlaybackSync() {
  if (playbackTimer !== undefined) return

  playbackTimer = window.setTimeout(() => {
    playbackTimer = undefined
    syncPlayback()
  }, 0)
}

function clearPlaybackRetry(registration: VideoRegistration) {
  if (registration.retryTimer === undefined) return
  window.clearTimeout(registration.retryTimer)
  registration.retryTimer = undefined
}

function clearStalledFallback(registration: VideoRegistration) {
  window.clearTimeout(registration.stalledTimer)
  registration.stalledTimer = undefined
  registration.onFallback(false)
}

function playbackStarted(registration: VideoRegistration) {
  registration.playbackStarted = true
  clearStalledFallback(registration)
}

function watchStalledPlayback(registration: VideoRegistration) {
  if (!registration.caseStudy || registration.playbackStarted || registration.stalledTimer !== undefined) return
  // Retain the handle until reset so syncs do not rearm a visible toast.
  registration.stalledTimer = window.setTimeout(() => {
    // Recheck selection and geometry, including scrolls before the next sync.
    syncPlayback()
    if (registration.wantsPlayback && !registration.playbackStarted) {
      registration.onFallback(true)
    }
  }, STALLED_PLAYBACK_DELAY)
}

function playFromFallback(registration: VideoRegistration) {
  // Keep the play call in the user gesture, but revalidate the one-player selection.
  syncPlayback()
  if (!registration.wantsPlayback) return
  clearStalledFallback(registration)
  watchStalledPlayback(registration)
  playVideo(registration, true)
}

function pauseVideo(registration: VideoRegistration) {
  registration.wantsPlayback = false
  registration.playbackStarted = false
  clearStalledFallback(registration)
  clearPlaybackRetry(registration)

  if (!registration.video.paused) {
    registration.video.pause()
  }
}

function playVideo(registration: VideoRegistration, userInitiated = false) {
  if (
    (!userInitiated && registration.playPending)
    || (!userInitiated && registration.caseStudy && registration.video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)
    || !registration.wantsPlayback
    || document.visibilityState !== 'visible'
    || !registration.video.isConnected
    || registration.video.querySelector('source') === null
    || (!userInitiated && !registration.video.paused)
  ) {
    return
  }

  clearPlaybackRetry(registration)
  // Set the DOM properties before every attempt, including delayed retries.
  registration.video.muted = true
  registration.video.defaultMuted = true
  registration.video.playsInline = true
  registration.video.controls = false
  registration.playPending = true
  const playAttempt = registration.video.play()

  playAttempt.then(() => {
    registration.playPending = false
    registration.retryDelay = 250

    if (!registration.wantsPlayback || document.visibilityState !== 'visible') {
      registration.video.pause()
    } else {
      playbackStarted(registration)
    }
  }).catch(() => {
    registration.playPending = false

    if (!registration.wantsPlayback || registration.retryTimer !== undefined) {
      return
    }

    registration.retryTimer = window.setTimeout(() => {
      registration.retryTimer = undefined
      registration.retryDelay = Math.min(registration.retryDelay * 2, 2000)
      schedulePlaybackSync()
    }, registration.retryDelay)
  })
}

function syncPlayback() {
  const candidates = document.visibilityState === 'visible'
    ? [...videoRegistrations.values()]
        .map(registration => {
          registration.visibilityRatio = viewportVisibilityRatio(registration.video)
          registration.viewportTop = registration.video.getBoundingClientRect().top
          return registration
        })
        .filter(registration =>
          registration.visibilityRatio > 0
          && registration.video.isConnected
        )
        .sort((a, b) =>
          b.visibilityRatio - a.visibilityRatio
          || a.viewportTop - b.viewportTop
          || a.id - b.id
        )
        .slice(0, MAX_PLAYING_VIDEOS)
    : []

  // Preload the next clip as soon as playback starts. Waiting for the entire
  // current file to buffer stalls prefetch on slow connections.
  const active = candidates[0]
  const upcoming = document.visibilityState === 'visible' && candidates.length <= MAX_PLAYING_VIDEOS
    && active && !active.video.paused && active.video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
    ? [...videoRegistrations.values()]
        .filter(item => item.caseStudy && item !== active
          && item.video.getBoundingClientRect().top >= window.innerHeight
          && item.video.getBoundingClientRect().top < window.innerHeight * 2)
        .sort((a, b) => a.video.getBoundingClientRect().top - b.video.getBoundingClientRect().top)[0]
    : undefined

  const selectedIds = new Set(candidates.map(registration => registration.id))

  // Pause deselected videos before starting replacements so the cap is never exceeded.
  for (const registration of videoRegistrations.values()) {
    if (!selectedIds.has(registration.id)) {
      pauseVideo(registration)
    }
  }

  for (const item of videoRegistrations.values()) {
    item.prepare(candidates.includes(item) || item === upcoming)
  }

  for (const registration of candidates) {
    registration.wantsPlayback = true
    watchStalledPlayback(registration)
    playVideo(registration)
  }
}

function handleVisibilityChange() {
  // Pause synchronously when the browser hides the page.
  syncPlayback()
}

function attachCoordinatorListeners() {
  if (coordinatorListenersAttached) return
  coordinatorListenersAttached = true
  document.addEventListener('visibilitychange', handleVisibilityChange)
  document.addEventListener('scroll', schedulePlaybackSync, { capture: true, passive: true })
  window.addEventListener('scroll', schedulePlaybackSync, { passive: true })
  window.addEventListener('resize', schedulePlaybackSync)
}

function detachCoordinatorListeners() {
  if (!coordinatorListenersAttached || videoRegistrations.size > 0) return
  coordinatorListenersAttached = false
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  document.removeEventListener('scroll', schedulePlaybackSync, { capture: true })
  window.removeEventListener('scroll', schedulePlaybackSync)
  window.removeEventListener('resize', schedulePlaybackSync)

  if (playbackTimer !== undefined) {
    window.clearTimeout(playbackTimer)
    playbackTimer = undefined
  }
}

function registerVideo(
  video: HTMLVideoElement,
  caseStudy: boolean,
  prepare: VideoRegistration['prepare'],
  onFallback: VideoRegistration['onFallback'] = () => {},
) {
  const registration: VideoRegistration = {
    id: nextRegistrationId++,
    caseStudy,
    prepare,
    onPause: () => {
      // Presentation media has no manual pause UI. Recover from browser pauses
      // while leaving offscreen/hidden videos under coordinator control.
      if (registration.wantsPlayback) schedulePlaybackSync()
    },
    video,
    visibilityRatio: 0,
    viewportTop: Number.POSITIVE_INFINITY,
    wantsPlayback: false,
    playPending: false,
    playbackStarted: false,
    stalledTimer: undefined,
    onFallback,
    retryDelay: 250,
    retryTimer: undefined,
    onCanPlay: schedulePlaybackSync,
    onPlaying: () => {
      if (!registration.wantsPlayback || document.visibilityState !== 'visible') {
        video.pause()
      } else {
        playbackStarted(registration)
      }
      schedulePlaybackSync()
    },
  }

  videoRegistrations.set(registration.id, registration)
  video.addEventListener('canplay', registration.onCanPlay)
  video.addEventListener('progress', registration.onCanPlay)
  video.addEventListener('pause', registration.onPause)
  video.addEventListener('playing', registration.onPlaying)
  attachCoordinatorListeners()
  return registration
}

function unregisterVideo(registration: VideoRegistration) {
  pauseVideo(registration)
  registration.video.removeEventListener('canplay', registration.onCanPlay)
  registration.video.removeEventListener('progress', registration.onCanPlay)
  registration.video.removeEventListener('pause', registration.onPause)
  registration.video.removeEventListener('playing', registration.onPlaying)
  videoRegistrations.delete(registration.id)

  if (videoRegistrations.size > 0) {
    schedulePlaybackSync()
  }

  detachCoordinatorListeners()
}
</script>

<script setup lang="ts">
// Apply caller attributes first so they cannot enable native media controls.
defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  src: string
  poster?: string
  caseStudy?: boolean
  playbackGroup?: string
  /** Set false only when a media asset has no mobile rendition. */
  mobileVariant?: boolean
}>(), { mobileVariant: true })

const videoRef = ref<HTMLVideoElement | null>(null)
const showStalledToast = ref(false)
const attrs = useAttrs()
// Layout classes belong to the case-study frame; media events stay on the video.
const videoAttrs = () => props.caseStudy
  ? Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'))
  : attrs

function retryFromToast() {
  if (registration) playFromFallback(registration)
}
const sourcesAttached = ref(false)
const preload = ref<'none' | 'metadata' | 'auto'>('none')
let wantsLoad = false
const isMobileViewport = ref(false)
let mobileQuery: MediaQueryList | undefined

function prepareMedia(load: boolean) {
  wantsLoad = load
  const video = videoRef.value
  const rect = video?.getBoundingClientRect()
  // Retain partial buffers for two viewport heights in either direction.
  // Recheck geometry here (and in the timer) to avoid stale observer releases.
  const nearby = rect && rect.bottom >= -window.innerHeight * 2
    && rect.top <= window.innerHeight * 3
  preload.value = load ? 'auto' : isWithinSourceRange ? 'metadata' : 'none'
  if (load || isWithinSourceRange) {
    clearSourceRelease()
    attachSources()
  } else if (nearby) {
    clearSourceRelease()
  } else if (sourcesAttached.value) {
    scheduleSourceRelease()
  }
}
// Select in JS so the browser never fetches both desktop and mobile sources.
const activeSrc = computed(() => props.mobileVariant !== false && isMobileViewport.value
  ? props.src.replace(/\.mp4$/, '-mobile.mp4') : props.src)

watch(activeSrc, () => {
  if (registration) pauseVideo(registration)
  if (!sourcesAttached.value || !videoRef.value) return
  nextTick(() => {
    videoRef.value?.load()
    schedulePlaybackSync()
  })
})

function syncViewportQuery() {
  isMobileViewport.value = mobileQuery?.matches ?? false
}
const posterSrc = computed(() => {
  if (props.poster) return props.poster
  // Preserve the separate mobile crop and custom posters.
  if (activeSrc.value === '/videos/asl-feature.mp4') return '/videos/posters/asl-feature.webp'
  return activeSrc.value.replace(/\.mp4$/, '.jpg').replace('/videos/', '/videos/posters/')
})

let sourceObserver: IntersectionObserver | undefined
let viewportObserver: IntersectionObserver | undefined
let registration: VideoRegistration | undefined
let sourceReleaseTimer: number | undefined
let isWithinSourceRange = false
let sourceTransition = 0

const SOURCE_RELEASE_DELAY = 2500

function clearSourceRelease() {
  if (sourceReleaseTimer === undefined) return
  window.clearTimeout(sourceReleaseTimer)
  sourceReleaseTimer = undefined
}

function attachSources() {
  const video = videoRef.value
  if (!video || sourcesAttached.value) return

  clearSourceRelease()
  const transition = ++sourceTransition
  sourcesAttached.value = true

  nextTick(() => {
    if (transition !== sourceTransition || !sourcesAttached.value) return
    video.load()
    schedulePlaybackSync()
  })
}

function releaseSources() {
  const video = videoRef.value
  if (!video || wantsLoad || !sourcesAttached.value) return
  const rect = video.getBoundingClientRect()
  if (rect.bottom >= -window.innerHeight * 2 && rect.top <= window.innerHeight * 3) return

  if (registration) pauseVideo(registration)
  const transition = ++sourceTransition
  sourcesAttached.value = false
  preload.value = 'none'

  nextTick(() => {
    if (transition !== sourceTransition || sourcesAttached.value) return
    video.load()
    schedulePlaybackSync()
  })
}

function scheduleSourceRelease() {
  if (wantsLoad || !sourcesAttached.value || sourceReleaseTimer !== undefined) return
  sourceReleaseTimer = window.setTimeout(() => {
    sourceReleaseTimer = undefined
    releaseSources()
  }, SOURCE_RELEASE_DELAY)
}

function observeSourceRange() {
  sourceObserver?.disconnect()
  sourceObserver = new IntersectionObserver(
    ([entry]) => {
      isWithinSourceRange = Boolean(entry?.isIntersecting)
      schedulePlaybackSync()
    },
    // IO percentages resolve against width, not height. Pixels give one actual
    // screen ahead on both tall phones and wide desktop viewports.
    { rootMargin: `${window.innerHeight}px 0px` }
  )
  if (videoRef.value) sourceObserver.observe(videoRef.value)
}

onMounted(() => {
  const video = videoRef.value
  if (!video) return

  mobileQuery = window.matchMedia('(max-width: 639px)')
  syncViewportQuery()
  mobileQuery.addEventListener('change', syncViewportQuery)
  registration = registerVideo(video, Boolean(props.caseStudy), prepareMedia, visible => {
    showStalledToast.value = visible
  })

  observeSourceRange()
  window.addEventListener('resize', observeSourceRange)

  viewportObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry || !registration) return
      schedulePlaybackSync()
    },
    {
      rootMargin: '0px',
      threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1],
    }
  )

  viewportObserver.observe(video)
})

onBeforeUnmount(() => {
  wantsLoad = false
  mobileQuery?.removeEventListener('change', syncViewportQuery)
  isWithinSourceRange = false
  sourceTransition += 1
  clearSourceRelease()
  sourceObserver?.disconnect()
  window.removeEventListener('resize', observeSourceRange)
  viewportObserver?.disconnect()

  if (registration) {
    unregisterVideo(registration)
  }
  // A detached element can otherwise keep downloading after route navigation.
  const video = videoRef.value
  if (video) {
    video.querySelectorAll('source').forEach(source => source.removeAttribute('src'))
    video.removeAttribute('src')
    video.load()
  }
})
</script>

<template>
  <div
    class="video-player"
    :class="caseStudy ? ['video-player--case-study', $attrs.class] : undefined"
    :style="caseStudy ? $attrs.style : undefined"
  >
    <video
      v-bind="videoAttrs()"
      ref="videoRef"
      :data-playback-group="playbackGroup"
      loop
      muted
      playsinline
      aria-hidden="true"
      tabindex="-1"
      :controls="false"
      disableremoteplayback
      disablepictureinpicture
      controlslist="nodownload nofullscreen noremoteplayback"
      :preload="preload"
      @click.prevent
      @contextmenu.prevent
      loading="lazy"
      :poster="posterSrc"
    >
      <template v-if="sourcesAttached">
        <source :src="activeSrc" type="video/mp4" />
      </template>
    </video>
    <Transition name="video-toast">
      <button
        v-if="caseStudy && showStalledToast"
        class="video-player__toast"
        type="button"
        aria-label="Video didn't load due to poor connection, Press play"
        @click.stop="retryFromToast"
      >Video didn't load due to poor connection, Press play</button>
    </Transition>
  </div>
</template>

<style scoped>
/* Homepage media keeps its existing layout; case studies need an overlay frame. */
.video-player { display: contents; }
.video-player.video-player--case-study {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  position: relative;
  max-width: 100%;
}
.video-player--case-study > video {
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
  max-height: inherit;
  border-radius: inherit;
  object-fit: inherit;
  object-position: inherit;
}
.video-player__toast {
  position: absolute;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  width: 320px;
  max-width: calc(100% - var(--space-m) * 2);
  padding: var(--space-s) var(--space-m);
  border: 0;
  border-radius: var(--radius-m);
  background: var(--overlay-sheet-background);
  color: var(--color-text);
  font-family: var(--font-sans);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  text-align: center;
  cursor: pointer;
  pointer-events: auto;
}
.video-player__toast:focus-visible {
  outline: 1px solid var(--color-text);
  outline-offset: var(--space-1);
}
.video-toast-enter-active,
.video-toast-leave-active {
  transition: opacity var(--transition-base), transform var(--transition-base);
}
.video-toast-enter-from { opacity: 0; transform: translateY(var(--space-1)); }
.video-toast-leave-to { opacity: 0; }
.video-toast-leave-active { pointer-events: none; }
@media (prefers-reduced-motion: reduce) {
  .video-toast-enter-active,
  .video-toast-leave-active { transition: none; }
  .video-toast-enter-from { transform: none; }
}
/* Let touch gestures scroll the page without invoking native video UI. */
video { pointer-events: none; }
</style>
