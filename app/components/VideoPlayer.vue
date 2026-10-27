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
  retryDelay: number
  retryTimer: number | undefined
  onCanPlay: () => void
  onPlaying: () => void
}

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

function pauseVideo(registration: VideoRegistration) {
  registration.wantsPlayback = false
  clearPlaybackRetry(registration)

  if (!registration.video.paused) {
    registration.video.pause()
  }
}

function playVideo(registration: VideoRegistration) {
  if (
    registration.playPending
    || (registration.caseStudy && registration.video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA)
    || !registration.wantsPlayback
    || document.visibilityState !== 'visible'
    || !registration.video.isConnected
    || registration.video.querySelector('source') === null
    || !registration.video.paused
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

function registerVideo(video: HTMLVideoElement, caseStudy: boolean, prepare: VideoRegistration['prepare']) {
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
    retryDelay: 250,
    retryTimer: undefined,
    onCanPlay: schedulePlaybackSync,
    onPlaying: () => {
      if (!registration.wantsPlayback || document.visibilityState !== 'visible') {
        video.pause()
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
  if (!sourcesAttached.value || !videoRef.value) return
  if (registration) pauseVideo(registration)
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
  registration = registerVideo(video, Boolean(props.caseStudy), prepareMedia)

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
  <video
    v-bind="$attrs"
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
</template>

<style scoped>
/* Let touch gestures scroll the page without invoking native video UI. */
video { pointer-events: none; }
</style>
