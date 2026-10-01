<script lang="ts">
interface VideoRegistration {
  id: number
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

function playVideo(registration: VideoRegistration) {
  if (
    registration.playPending
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
          && registration.video.querySelector('source') !== null
        )
        .sort((a, b) =>
          b.visibilityRatio - a.visibilityRatio
          || a.viewportTop - b.viewportTop
          || a.id - b.id
        )
        .slice(0, MAX_PLAYING_VIDEOS)
    : []

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

function registerVideo(video: HTMLVideoElement) {
  const registration: VideoRegistration = {
    id: nextRegistrationId++,
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
  video.addEventListener('playing', registration.onPlaying)
  attachCoordinatorListeners()
  return registration
}

function unregisterVideo(registration: VideoRegistration) {
  pauseVideo(registration)
  registration.video.removeEventListener('canplay', registration.onCanPlay)
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
}>()

const videoRef = ref<HTMLVideoElement | null>(null)
const sourcesAttached = ref(false)
const webmSrc = computed(() => props.src.replace(/\.mp4$/, '.webm'))
const posterSrc = computed(() =>
  props.poster ?? props.src.replace(/\.mp4$/, '.jpg').replace('/videos/', '/videos/posters/')
)

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
  if (!video || !isWithinSourceRange || sourcesAttached.value) return

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
  if (!video || isWithinSourceRange || !sourcesAttached.value) return

  if (registration) pauseVideo(registration)
  const transition = ++sourceTransition
  sourcesAttached.value = false

  nextTick(() => {
    if (transition !== sourceTransition || sourcesAttached.value) return
    video.load()
    schedulePlaybackSync()
  })
}

function scheduleSourceRelease() {
  if (!sourcesAttached.value || sourceReleaseTimer !== undefined) return
  sourceReleaseTimer = window.setTimeout(() => {
    sourceReleaseTimer = undefined
    releaseSources()
  }, SOURCE_RELEASE_DELAY)
}

onMounted(() => {
  const video = videoRef.value
  if (!video) return

  registration = registerVideo(video)

  sourceObserver = new IntersectionObserver(
    ([entry]) => {
      isWithinSourceRange = Boolean(entry?.isIntersecting)

      if (isWithinSourceRange) {
        clearSourceRelease()
        attachSources()
      } else {
        scheduleSourceRelease()
      }
    },
    { rootMargin: '200px 75%' }
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
    loop
    muted
    playsinline
    aria-hidden="true"
    :preload="sourcesAttached ? 'metadata' : 'none'"
    :poster="posterSrc"
  >
    <template v-if="sourcesAttached">
      <source :src="src" type="video/mp4" />
      <source :src="webmSrc" type="video/webm" />
    </template>
  </video>
</template>
