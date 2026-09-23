<script setup lang="ts">
import {
  YLANG_YLANG_PROFILE,
  YLANG_YLANG_SAMPLE_COUNT,
  YLANG_YLANG_SAMPLE_INTERVAL_MS,
} from '~/data/ylangYlangProfile'

type SoundSample = {
  amplitude: number
  frequency: number
}

type RgbColor = {
  red: number
  green: number
  blue: number
}

type FrequencyColorStop = {
  position: number
  color: RgbColor
}

type YouTubePlayer = {
  destroy: () => void
  mute: () => void
  pauseVideo: () => void
  playVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  unMute: () => void
}

type YouTubePlayerEvent = {
  target: YouTubePlayer
}

type YouTubePlayerOptions = {
  height: string
  width: string
  videoId: string
  playerVars: Record<string, number | string>
  events: {
    onReady: (event: YouTubePlayerEvent) => void
    onAutoplayBlocked: () => void
  }
}

type YouTubeApi = {
  Player: new (element: HTMLElement, options: YouTubePlayerOptions) => YouTubePlayer
}

declare global {
  interface Window {
    YT?: YouTubeApi
    onYouTubeIframeAPIReady?: () => void
  }
}

const MAX_SOUND_HEIGHT = 60
const DRAWING_HEIGHT = MAX_SOUND_HEIGHT
const MIN_SOUND_HEIGHT = 40
const SAMPLE_WIDTH = 4
const MAX_GRADIENT_STOPS = 96
const AMPLITUDE_SMOOTHING_RADIUS = 8
const RAW_AMPLITUDE_MIX = 0.18
const YOUTUBE_VIDEO_ID = 'EfgAd6iHApE'
const BLUE_COLOR: RgbColor = { red: 164, green: 202, blue: 250 }
const GREEN_COLOR: RgbColor = { red: 202, green: 242, blue: 222 }
const PINK_COLOR: RgbColor = { red: 248, green: 205, blue: 232 }
const YELLOW_COLOR: RgbColor = { red: 255, green: 239, blue: 166 }
const FREQUENCY_COLOR_STOPS: FrequencyColorStop[] = [
  { position: 0, color: BLUE_COLOR },
  { position: 0.5, color: BLUE_COLOR },
  { position: 0.62, color: GREEN_COLOR },
  { position: 0.72, color: BLUE_COLOR },
  { position: 0.82, color: PINK_COLOR },
  { position: 0.9, color: YELLOW_COLOR },
  { position: 1, color: BLUE_COLOR },
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
const playerHostRef = ref<HTMLElement | null>(null)
const isAudioEnabled = ref(false)

let context: CanvasRenderingContext2D | null = null
let animationFrame = 0
let motionPreference: MediaQueryList | undefined
let youtubePlayer: YouTubePlayer | undefined
let isYouTubePlayerReady = false
let decodedProfile = new Uint8Array()
let smoothedAmplitudeProfile = new Float32Array()
let history: SoundSample[] = []
let profileIndex = 0
let lastSampleTime = 0

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)

  return new Promise<YouTubeApi>((resolve) => {
    const previousReadyHandler = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previousReadyHandler?.()
      if (window.YT) resolve(window.YT)
    }

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.append(script)
    }
  })
}

function currentProfileTime() {
  const intervalProgress = lastSampleTime > 0
    ? Math.min(YLANG_YLANG_SAMPLE_INTERVAL_MS, performance.now() - lastSampleTime)
    : 0
  const duration = YLANG_YLANG_SAMPLE_COUNT * YLANG_YLANG_SAMPLE_INTERVAL_MS
  return ((profileIndex * YLANG_YLANG_SAMPLE_INTERVAL_MS + intervalProgress) % duration) / 1000
}

function applyAudioState() {
  if (!youtubePlayer || !isYouTubePlayerReady) return

  if (isAudioEnabled.value) {
    youtubePlayer.seekTo(currentProfileTime(), true)
    youtubePlayer.unMute()
    youtubePlayer.playVideo()
    return
  }

  youtubePlayer.mute()
  youtubePlayer.pauseVideo()
}

function toggleAudio() {
  isAudioEnabled.value = !isAudioEnabled.value
  applyAudioState()
}

async function setupYouTubePlayer() {
  const playerHost = playerHostRef.value
  if (!playerHost) return

  const youtubeApi = await loadYouTubeApi()
  if (!playerHostRef.value) return

  youtubePlayer = new youtubeApi.Player(playerHost, {
    height: '200',
    width: '200',
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      loop: 1,
      modestbranding: 1,
      origin: window.location.origin,
      playlist: YOUTUBE_VIDEO_ID,
      playsinline: 1,
    },
    events: {
      onReady: ({ target }) => {
        youtubePlayer = target
        isYouTubePlayerReady = true
        target.mute()
        applyAudioState()
      },
      onAutoplayBlocked: () => {
        isAudioEnabled.value = false
        youtubePlayer?.mute()
        youtubePlayer?.pauseVideo()
      },
    },
  })
}

function decodeProfile() {
  const binary = window.atob(YLANG_YLANG_PROFILE)
  decodedProfile = Uint8Array.from(binary, character => character.charCodeAt(0))
  smoothedAmplitudeProfile = new Float32Array(YLANG_YLANG_SAMPLE_COUNT)

  for (let sampleIndex = 0; sampleIndex < YLANG_YLANG_SAMPLE_COUNT; sampleIndex += 1) {
    let weightedAmplitude = 0
    let totalWeight = 0

    for (
      let offset = -AMPLITUDE_SMOOTHING_RADIUS;
      offset <= AMPLITUDE_SMOOTHING_RADIUS;
      offset += 1
    ) {
      const wrappedIndex = (
        (sampleIndex + offset) % YLANG_YLANG_SAMPLE_COUNT
        + YLANG_YLANG_SAMPLE_COUNT
      ) % YLANG_YLANG_SAMPLE_COUNT
      const distance = offset / (AMPLITUDE_SMOOTHING_RADIUS / 2)
      const weight = Math.exp(-0.5 * distance * distance)
      weightedAmplitude += ((decodedProfile[wrappedIndex * 2] ?? 0) / 255) * weight
      totalWeight += weight
    }

    const rawAmplitude = (decodedProfile[sampleIndex * 2] ?? 0) / 255
    const rollingAmplitude = weightedAmplitude / totalWeight
    smoothedAmplitudeProfile[sampleIndex] = rollingAmplitude * (1 - RAW_AMPLITUDE_MIX)
      + rawAmplitude * RAW_AMPLITUDE_MIX
  }
}

function readSample(index: number): SoundSample {
  const wrappedIndex = ((index % YLANG_YLANG_SAMPLE_COUNT) + YLANG_YLANG_SAMPLE_COUNT)
    % YLANG_YLANG_SAMPLE_COUNT
  const offset = wrappedIndex * 2

  return {
    amplitude: smoothedAmplitudeProfile[wrappedIndex] ?? 0,
    frequency: (decodedProfile[offset + 1] ?? 0) / 255,
  }
}

function mixColor(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return {
    red: Math.round(from.red + (to.red - from.red) * amount),
    green: Math.round(from.green + (to.green - from.green) * amount),
    blue: Math.round(from.blue + (to.blue - from.blue) * amount),
  }
}

function colorForFrequency(frequency: number) {
  // Use the track's 5th–95th percentile range so every pastel stays present.
  const palettePosition = Math.max(0, Math.min(1, (frequency - 0.22) / 0.3))
  const upperStopIndex = FREQUENCY_COLOR_STOPS.findIndex(
    stop => stop.position >= palettePosition,
  )
  const upperStop = FREQUENCY_COLOR_STOPS[
    upperStopIndex < 0 ? FREQUENCY_COLOR_STOPS.length - 1 : upperStopIndex
  ]!
  const lowerStop = FREQUENCY_COLOR_STOPS[Math.max(0, upperStopIndex - 1)]!
  const stopRange = upperStop.position - lowerStop.position
  const color = mixColor(
    lowerStop.color,
    upperStop.color,
    stopRange === 0 ? 0 : (palettePosition - lowerStop.position) / stopRange,
  )

  return `rgb(${color.red} ${color.green} ${color.blue})`
}

function topForAmplitude(amplitude: number) {
  const dramaticAmplitude = amplitude ** 1.4
  const soundHeight = MIN_SOUND_HEIGHT
    + dramaticAmplitude * (MAX_SOUND_HEIGHT - MIN_SOUND_HEIGHT)
  return DRAWING_HEIGHT - soundHeight
}

function interpolateSample(from: SoundSample, to: SoundSample, amount: number): SoundSample {
  return {
    amplitude: from.amplitude + (to.amplitude - from.amplitude) * amount,
    frequency: from.frequency + (to.frequency - from.frequency) * amount,
  }
}

function rebuildHistory(width: number) {
  const requiredSamples = Math.ceil(width / SAMPLE_WIDTH) + 4
  history = Array.from(
    { length: requiredSamples },
    (_, index) => readSample(profileIndex - requiredSamples + index + 1),
  )
}

function resizeCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return

  const bounds = canvas.getBoundingClientRect()
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(bounds.width * pixelRatio))
  canvas.height = Math.round(DRAWING_HEIGHT * pixelRatio)
  context = canvas.getContext('2d')
  context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  rebuildHistory(bounds.width)
  drawStrip(0)
}

function drawStrip(progress: number) {
  const canvas = canvasRef.value
  if (!canvas || !context || history.length === 0) return

  const width = canvas.getBoundingClientRect().width
  const latestSample = history[history.length - 1]!
  const nextSample = readSample(profileIndex + 1)
  const edgeSample = interpolateSample(latestSample, nextSample, progress)
  const points = history.map((sample, index) => ({
    ...sample,
    x: width - (history.length - index - 1) * SAMPLE_WIDTH - progress * SAMPLE_WIDTH,
  }))
  points.push({ ...edgeSample, x: width })

  context.clearRect(0, 0, width, DRAWING_HEIGHT)

  const gradient = context.createLinearGradient(0, 0, width, 0)
  const visiblePoints = points.filter(point => point.x >= 0 && point.x <= width)
  const stopStride = Math.max(1, Math.ceil(visiblePoints.length / MAX_GRADIENT_STOPS))
  gradient.addColorStop(0, colorForFrequency(visiblePoints[0]?.frequency ?? 0.5))

  for (let index = stopStride; index < visiblePoints.length - 1; index += stopStride) {
    const point = visiblePoints[index]!
    gradient.addColorStop(point.x / width, colorForFrequency(point.frequency))
  }

  gradient.addColorStop(1, colorForFrequency(edgeSample.frequency))

  const firstPoint = points[0]!
  const lastPoint = points[points.length - 1]!
  context.beginPath()
  context.moveTo(firstPoint.x, DRAWING_HEIGHT)
  context.lineTo(firstPoint.x, topForAmplitude(firstPoint.amplitude))

  for (let index = 1; index < points.length; index += 1) {
    const previousPoint = points[index - 1]!
    const point = points[index]!
    const midpointX = (previousPoint.x + point.x) / 2
    const midpointY = (
      topForAmplitude(previousPoint.amplitude)
      + topForAmplitude(point.amplitude)
    ) / 2
    context.quadraticCurveTo(
      previousPoint.x,
      topForAmplitude(previousPoint.amplitude),
      midpointX,
      midpointY,
    )
  }

  context.quadraticCurveTo(
    lastPoint.x,
    topForAmplitude(lastPoint.amplitude),
    lastPoint.x,
    topForAmplitude(lastPoint.amplitude),
  )
  context.lineTo(lastPoint.x, DRAWING_HEIGHT)
  context.closePath()
  context.fillStyle = gradient
  context.fill()
}

function advanceProfile(sampleCount: number) {
  if (sampleCount <= 0) return

  profileIndex = (profileIndex + sampleCount) % YLANG_YLANG_SAMPLE_COUNT
  const requiredSamples = history.length

  if (sampleCount >= requiredSamples) {
    rebuildHistory(canvasRef.value?.getBoundingClientRect().width ?? window.innerWidth)
    return
  }

  for (let index = sampleCount - 1; index >= 0; index -= 1) {
    history.push(readSample(profileIndex - index))
  }
  history.splice(0, sampleCount)
}

function animate(timestamp: number) {
  const elapsed = timestamp - lastSampleTime
  const elapsedSamples = Math.floor(elapsed / YLANG_YLANG_SAMPLE_INTERVAL_MS)

  if (elapsedSamples > 0) {
    advanceProfile(elapsedSamples)
    lastSampleTime += elapsedSamples * YLANG_YLANG_SAMPLE_INTERVAL_MS
  }

  const progress = Math.min(
    1,
    (timestamp - lastSampleTime) / YLANG_YLANG_SAMPLE_INTERVAL_MS,
  )
  drawStrip(progress)
  animationFrame = window.requestAnimationFrame(animate)
}

function startAnimation() {
  window.cancelAnimationFrame(animationFrame)

  if (motionPreference?.matches) {
    drawStrip(0)
    return
  }

  lastSampleTime = performance.now()
  animationFrame = window.requestAnimationFrame(animate)
}

function handleResize() {
  resizeCanvas()
}

onMounted(() => {
  decodeProfile()
  setupYouTubePlayer()
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', startAnimation)
  window.addEventListener('resize', handleResize)
  resizeCanvas()
  startAnimation()
})

onBeforeUnmount(() => {
  youtubePlayer?.destroy()
  youtubePlayer = undefined
  isYouTubePlayerReady = false
  window.cancelAnimationFrame(animationFrame)
  window.removeEventListener('resize', handleResize)
  motionPreference?.removeEventListener('change', startAnimation)
})
</script>

<template>
  <div class="sound-gradient">
    <canvas ref="canvasRef" class="sound-gradient__canvas" aria-hidden="true" />
  </div>
  <button
    type="button"
    class="sound-gradient__credit"
    :aria-label="isAudioEnabled ? 'Mute Ylang Ylang by FKJ' : 'Play Ylang Ylang by FKJ'"
    :aria-pressed="isAudioEnabled"
    @click="toggleAudio"
  >
    <svg class="sound-gradient__icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3.25 8h3l4-3.25v10.5L6.25 12h-3z" />
      <template v-if="!isAudioEnabled">
        <path d="m13.25 7.25 4.5 5.5" />
        <path d="m17.75 7.25-4.5 5.5" />
      </template>
      <template v-else>
        <path d="M13 7.25a4 4 0 0 1 0 5.5" />
        <path d="M15.25 5a7 7 0 0 1 0 10" />
      </template>
    </svg>
    <span>Sound: FKJ — Ylang Ylang</span>
  </button>
  <div class="sound-gradient__player" aria-hidden="true">
    <div ref="playerHostRef" />
  </div>
</template>

<style scoped>
.sound-gradient {
  position: fixed;
  z-index: -1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 92px;
  overflow: hidden;
  background: linear-gradient(
    to bottom,
    rgb(255 255 255 / 0%),
    rgb(255 255 255 / 92%) 60%,
    #ffffff 100%
  );
  pointer-events: none;
}

.sound-gradient::after {
  position: absolute;
  z-index: 2;
  right: -20%;
  bottom: -50%;
  left: -20%;
  height: 200%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='4' seed='7' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='.82'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 128px 128px;
  mix-blend-mode: overlay;
  opacity: 0.42;
  filter: contrast(1.3);
  animation: sound-gradient-grain 500ms steps(2, end) infinite;
  content: '';
  -webkit-mask-image: linear-gradient(to bottom, transparent 18%, black 62%);
  mask-image: linear-gradient(to bottom, transparent 18%, black 62%);
  pointer-events: none;
}

.sound-gradient::before {
  position: absolute;
  z-index: 1;
  right: 0;
  bottom: 0;
  left: 0;
  height: 64px;
  background: rgb(255 255 255 / 0.1%);
  -webkit-backdrop-filter: saturate(2);
  backdrop-filter: saturate(2);
  content: '';
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 75%);
  mask-image: linear-gradient(to bottom, transparent, black 75%);
  pointer-events: none;
}

.sound-gradient__canvas {
  position: absolute;
  z-index: 0;
  right: -20px;
  bottom: 0;
  left: -20px;
  width: calc(100% + 40px);
  height: 60px;
  max-width: none;
  filter: blur(16px) saturate(1.35);
}

@keyframes sound-gradient-grain {
  0% { transform: translate3d(-3%, -4%, 0); }
  25% { transform: translate3d(4%, 2%, 0); }
  50% { transform: translate3d(-1%, 5%, 0); }
  75% { transform: translate3d(3%, -2%, 0); }
  100% { transform: translate3d(-3%, -4%, 0); }
}

.sound-gradient__credit {
  position: fixed;
  z-index: 2147483647;
  bottom: var(--space-m);
  left: var(--layout-content-edge);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  color: inherit;
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transition: opacity var(--transition-fast);
}

.sound-gradient__player {
  position: fixed;
  top: 0;
  left: -10000px;
  width: 200px;
  height: 200px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.sound-gradient__icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
}

.sound-gradient__icon path {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.5;
}

.sound-gradient__credit:hover {
  opacity: 0.5;
}

.sound-gradient__credit:focus-visible {
  border-radius: 2px;
  outline: 1px solid currentColor;
  outline-offset: 3px;
}

@media (max-width: 767px) {
  .sound-gradient__credit {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sound-gradient::after {
    animation: none;
  }
}
</style>
