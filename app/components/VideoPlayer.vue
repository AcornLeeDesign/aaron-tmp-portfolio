<script lang="ts">
interface VideoRegistration {
  id: number
  caseStudy: boolean
  userPaused: boolean
  prepare: (load: boolean, active: boolean) => void
  onPause: () => void
  onPlay: () => void
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

const MAX_PLAYING_VIDEOS = 2
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

function bufferedAhead(video: HTMLVideoElement) {
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= video.currentTime && video.buffered.end(i) > video.currentTime) {
      return video.buffered.end(i) - video.currentTime
    }
  }
  return 0
}

function hasStartupBuffer(video: HTMLVideoElement) {
  return Number.isFinite(video.duration)
    && bufferedAhead(video) >= Math.min(3, Math.max(0, video.duration - video.currentTime - 0.1))
}

function fullyBuffered(video: HTMLVideoElement) {
  return Number.isFinite(video.duration) && video.buffered.length > 0
    && video.buffered.start(0) === 0 && video.buffered.end(0) >= video.duration - 0.1
}

function playVideo(registration: VideoRegistration) {
  if (
    registration.playPending
    || registration.userPaused
    || (registration.caseStudy && !hasStartupBuffer(registration.video))
    || !registration.wantsPlayback
    || document.visibilityState !== 'visible'
    || !registration.video.isConnected
    || registration.video.querySelector('source') === null
    || !registration.video.paused
  ) {
    return
  }

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
          && (registration.caseStudy || registration.video.querySelector('source') !== null)
        )
        .sort((a, b) =>
          b.visibilityRatio - a.visibilityRatio
          || a.viewportTop - b.viewportTop
          || a.id - b.id
        )
        .slice(0, [...videoRegistrations.values()].some(item => item.caseStudy) ? 1 : MAX_PLAYING_VIDEOS)
    : []

  // Explicit comparison groups may play together while both are visible.
  const group = candidates[0]?.video.dataset.playbackGroup
  if (group) {
    const partner = [...videoRegistrations.values()].find(item =>
      item !== candidates[0] && item.video.dataset.playbackGroup === group
      && item.video.isConnected && viewportVisibilityRatio(item.video) > 0
    )
    if (partner) candidates.push(partner)
  }

  // Prepare only the nearest upcoming case-study video, and only once the
  // current clip is fully buffered so it does not compete with initial playback.
  const active = candidates[0]
  const upcoming = document.visibilityState === 'visible' && candidates.every(item => fullyBuffered(item.video))
    ? [...videoRegistrations.values()]
        .filter(item => item.caseStudy && item !== active
          && item.video.getBoundingClientRect().top >= window.innerHeight
          && item.video.getBoundingClientRect().top < window.innerHeight * 2)
        .sort((a, b) => a.video.getBoundingClientRect().top - b.video.getBoundingClientRect().top)[0]
    : undefined

  for (const item of videoRegistrations.values()) {
    if (item.caseStudy) item.prepare(candidates.includes(item) || item === upcoming, candidates.includes(item))
  }

  const selectedIds = new Set(candidates.map(registration => registration.id))

  // Pause deselected videos before starting replacements so the cap is never exceeded.
  for (const registration of videoRegistrations.values()) {
    if (!selectedIds.has(registration.id)) {
      pauseVideo(registration)
    }
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
    userPaused: false,
    onPause: () => {
      if (registration.caseStudy && registration.wantsPlayback && video.controls) registration.userPaused = true
    },
    onPlay: () => { registration.userPaused = false },
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
    },
  }

  videoRegistrations.set(registration.id, registration)
  video.addEventListener('canplay', registration.onCanPlay)
  video.addEventListener('progress', registration.onCanPlay)
  video.addEventListener('pause', registration.onPause)
  video.addEventListener('play', registration.onPlay)
  video.addEventListener('playing', registration.onPlaying)
  attachCoordinatorListeners()
  return registration
}

function unregisterVideo(registration: VideoRegistration) {
  pauseVideo(registration)
  registration.video.removeEventListener('canplay', registration.onCanPlay)
  registration.video.removeEventListener('progress', registration.onCanPlay)
  registration.video.removeEventListener('pause', registration.onPause)
  registration.video.removeEventListener('play', registration.onPlay)
  registration.video.removeEventListener('playing', registration.onPlaying)
  videoRegistrations.delete(registration.id)

  if (videoRegistrations.size > 0) {
    schedulePlaybackSync()
  }

  detachCoordinatorListeners()
}
</script>

<script setup lang="ts">
const props = defineProps<{
  src: string
  poster?: string
  caseStudy?: boolean
  playbackGroup?: string
  /** `name-mobile.mp4/.webm` and `posters/name-mobile.jpg` exist for the mobile breakpoint. */
  mobileVariant?: boolean
}>()

/* Browsers that ignore <source media> fall through to the first, full-resolution source. */
const DESKTOP_SOURCE_MEDIA = '(min-width: 640px)'
const MOBILE_VIEWPORT = '(max-width: 639px)'
/* Phones and tablets release offscreen decoders sooner to limit memory pressure. */
const COMPACT_VIEWPORT = '(max-width: 1023px)'

const videoRef = ref<HTMLVideoElement | null>(null)
const sourcesAttached = ref(false)
/* Case-study posters are full-resolution, so fetch them only once the video is near the viewport. */
const posterReady = ref(!props.caseStudy)
const isMobileViewport = ref(false)
let isCompactViewport = false
const preload = ref<'none' | 'metadata' | 'auto'>('none')
const showControls = ref(false)
let slowLoadTimer: number | undefined

function clearSlowLoadTimer() {
  if (slowLoadTimer === undefined) return
  window.clearTimeout(slowLoadTimer)
  slowLoadTimer = undefined
}

function prepareCaseStudy(load: boolean, active: boolean) {
  preload.value = load ? 'auto' : 'none'
  if (load) attachSources()
  if (active && videoRef.value?.paused && !showControls.value) {
    if (slowLoadTimer === undefined) {
      slowLoadTimer = window.setTimeout(() => {
        slowLoadTimer = undefined
        if (videoRef.value?.paused) showControls.value = true
      }, 8000)
    }
  } else {
    clearSlowLoadTimer()
  }
}
const mobileSrc = computed(() => props.src.replace(/\.mp4$/, '-mobile.mp4'))
const sources = computed(() => {
  const webm = (src: string) => src.replace(/\.mp4$/, '.webm')
  if (!props.mobileVariant) {
    return [{ src: props.src, type: 'video/mp4' }, { src: webm(props.src), type: 'video/webm' }]
  }
  return [
    { src: props.src, type: 'video/mp4', media: DESKTOP_SOURCE_MEDIA },
    { src: mobileSrc.value, type: 'video/mp4' },
    { src: webm(props.src), type: 'video/webm', media: DESKTOP_SOURCE_MEDIA },
    { src: webm(mobileSrc.value), type: 'video/webm' },
  ]
})
const posterSrc = computed(() => {
  if (!posterReady.value) return undefined
  if (props.poster) return props.poster
  const src = props.mobileVariant && isMobileViewport.value ? mobileSrc.value : props.src
  return src.replace(/\.mp4$/, '.jpg').replace('/videos/', '/videos/posters/')
})

let sourceObserver: IntersectionObserver | undefined
let viewportObserver: IntersectionObserver | undefined
let registration: VideoRegistration | undefined
let sourceReleaseTimer: number | undefined
let isWithinSourceRange = false
let sourceTransition = 0

const SOURCE_RELEASE_DELAY = 2500
const CASE_STUDY_RELEASE_DELAY = 30000
const CASE_STUDY_COMPACT_RELEASE_DELAY = 5000

function clearSourceRelease() {
  if (sourceReleaseTimer === undefined) return
  window.clearTimeout(sourceReleaseTimer)
  sourceReleaseTimer = undefined
}

function attachSources() {
  const video = videoRef.value
  if (!video || (!props.caseStudy && !isWithinSourceRange) || sourcesAttached.value) return

  clearSourceRelease()
  const transition = ++sourceTransition
  sourcesAttached.value = true
  if (!props.caseStudy) preload.value = 'metadata'

  nextTick(() => {
    if (transition !== sourceTransition || !sourcesAttached.value) return
    video.load()
    schedulePlaybackSync()
  })
}

function releaseSources() {
  const video = videoRef.value
  if (!video || isWithinSourceRange || !sourcesAttached.value) return

  if (registration) pauseVideo(registration)
  const transition = ++sourceTransition
  sourcesAttached.value = false
  showControls.value = false
  if (registration) registration.userPaused = false

  nextTick(() => {
    if (transition !== sourceTransition || sourcesAttached.value) return
    video.load()
    schedulePlaybackSync()
  })
}

function scheduleSourceRelease() {
  if (!sourcesAttached.value || sourceReleaseTimer !== undefined) return
  const caseStudyDelay = isCompactViewport ? CASE_STUDY_COMPACT_RELEASE_DELAY : CASE_STUDY_RELEASE_DELAY
  sourceReleaseTimer = window.setTimeout(() => {
    sourceReleaseTimer = undefined
    releaseSources()
  }, props.caseStudy ? caseStudyDelay : SOURCE_RELEASE_DELAY)
}

onMounted(() => {
  const video = videoRef.value
  if (!video) return

  isMobileViewport.value = window.matchMedia(MOBILE_VIEWPORT).matches
  isCompactViewport = window.matchMedia(COMPACT_VIEWPORT).matches
  registration = registerVideo(video, Boolean(props.caseStudy), prepareCaseStudy)

  sourceObserver = new IntersectionObserver(
    ([entry]) => {
      isWithinSourceRange = Boolean(entry?.isIntersecting)

      if (isWithinSourceRange) {
        posterReady.value = true
        clearSourceRelease()
        if (!props.caseStudy) attachSources()
      } else {
        scheduleSourceRelease()
      }
      schedulePlaybackSync()
    },
    { rootMargin: props.caseStudy ? '100% 0px' : '200px 75%' }
  )

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

  sourceObserver.observe(video)
  viewportObserver.observe(video)
})

onBeforeUnmount(() => {
  isWithinSourceRange = false
  sourceTransition += 1
  clearSourceRelease()
  clearSlowLoadTimer()
  sourceObserver?.disconnect()
  viewportObserver?.disconnect()

  if (registration) {
    unregisterVideo(registration)
  }
})
</script>

<template>
  <video
    ref="videoRef"
    :data-playback-group="playbackGroup"
    loop
    muted
    playsinline
    :aria-hidden="showControls ? undefined : true"
    :aria-label="showControls ? 'Case study video' : undefined"
    :controls="showControls"
    :preload="preload"
    @playing="clearSlowLoadTimer"
    :poster="posterSrc"
  >
    <template v-if="sourcesAttached">
      <source v-for="source in sources" :key="source.src" :src="source.src" :type="source.type" :media="source.media" />
    </template>
  </video>
</template>
