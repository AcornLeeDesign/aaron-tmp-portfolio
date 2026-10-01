<script setup lang="ts">
import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/vue/24/outline'
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

const MAX_SOUND_HEIGHT = 60
const DRAWING_HEIGHT = MAX_SOUND_HEIGHT
const MIN_SOUND_HEIGHT = 40
const SAMPLE_WIDTH = 4
const AMPLITUDE_SMOOTHING_RADIUS = 8
const RAW_AMPLITUDE_MIX = 0.18
const FREQUENCY_SMOOTHING_RADIUS = 10
const RAW_FREQUENCY_MIX = 0.04
const BLUE_COLOR: RgbColor = { red: 164, green: 202, blue: 250 }
const PINK_COLOR: RgbColor = { red: 248, green: 205, blue: 232 }
const YELLOW_COLOR: RgbColor = { red: 255, green: 239, blue: 166 }
const FREQUENCY_COLOR_STOPS: FrequencyColorStop[] = [
  { position: 0, color: BLUE_COLOR },
  { position: 0.28, color: BLUE_COLOR },
  { position: 0.58, color: PINK_COLOR },
  { position: 0.78, color: YELLOW_COLOR },
  { position: 1, color: BLUE_COLOR },
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)
const isAudioEnabled = ref(false)

let context: CanvasRenderingContext2D | null = null
let animationFrame = 0
let motionPreference: MediaQueryList | undefined
let playbackRequest = 0
let isPlaybackPending = false
let decodedProfile = new Uint8Array()
let smoothedAmplitudeProfile = new Float32Array()
let smoothedFrequencyProfile = new Float32Array()
let pixelBuffer: HTMLCanvasElement | undefined
let pixelBufferContext: CanvasRenderingContext2D | null = null
let profileIndex = 0
let lastSampleTime = 0

function currentProfileTime() {
  const intervalProgress = lastSampleTime > 0
    ? Math.min(YLANG_YLANG_SAMPLE_INTERVAL_MS, performance.now() - lastSampleTime)
    : 0
  const duration = YLANG_YLANG_SAMPLE_COUNT * YLANG_YLANG_SAMPLE_INTERVAL_MS
  return ((profileIndex * YLANG_YLANG_SAMPLE_INTERVAL_MS + intervalProgress) % duration) / 1000
}

function removePlaybackFallback() {
  window.removeEventListener('pointerup', startAudioOnInteraction)
  window.removeEventListener('keydown', startAudioOnInteraction)
}

async function playAudio() {
  const audio = audioRef.value
  if (!audio) return

  const request = ++playbackRequest
  isPlaybackPending = true
  // The asset is attenuated by 18 dB, including on devices that ignore volume.
  if (Number.isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = currentProfileTime() % audio.duration
  }

  try {
    await audio.play()
    if (request !== playbackRequest) return
    isAudioEnabled.value = true
    removePlaybackFallback()
  } catch {
    if (request === playbackRequest) isAudioEnabled.value = false
  } finally {
    if (request === playbackRequest) isPlaybackPending = false
  }
}

function startAudioOnInteraction(event: Event) {
  // Let the sound button's click handler handle its own gesture.
  if (event.target instanceof Element && event.target.closest('.sound-gradient__credit')) return
  if (event instanceof KeyboardEvent && (event.repeat || event.metaKey || event.ctrlKey || event.altKey)) return
  removePlaybackFallback()
  void playAudio()
}

function toggleAudio() {
  removePlaybackFallback()
  if (isAudioEnabled.value || isPlaybackPending) {
    playbackRequest += 1
    isPlaybackPending = false
    audioRef.value?.pause()
    isAudioEnabled.value = false
    return
  }
  void playAudio()
}

function decodeProfile() {
  const binary = window.atob(YLANG_YLANG_PROFILE)
  decodedProfile = Uint8Array.from(binary, character => character.charCodeAt(0))
  smoothedAmplitudeProfile = new Float32Array(YLANG_YLANG_SAMPLE_COUNT)
  smoothedFrequencyProfile = new Float32Array(YLANG_YLANG_SAMPLE_COUNT)

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

    let weightedFrequency = 0
    let totalFrequencyWeight = 0

    for (
      let offset = -FREQUENCY_SMOOTHING_RADIUS;
      offset <= FREQUENCY_SMOOTHING_RADIUS;
      offset += 1
    ) {
      const wrappedIndex = (
        (sampleIndex + offset) % YLANG_YLANG_SAMPLE_COUNT
        + YLANG_YLANG_SAMPLE_COUNT
      ) % YLANG_YLANG_SAMPLE_COUNT
      const distance = offset / (FREQUENCY_SMOOTHING_RADIUS / 2)
      const weight = Math.exp(-0.5 * distance * distance)
      weightedFrequency += ((decodedProfile[wrappedIndex * 2 + 1] ?? 0) / 255) * weight
      totalFrequencyWeight += weight
    }

    const rawFrequency = (decodedProfile[sampleIndex * 2 + 1] ?? 0) / 255
    const rollingFrequency = weightedFrequency / totalFrequencyWeight
    smoothedFrequencyProfile[sampleIndex] = rollingFrequency * (1 - RAW_FREQUENCY_MIX)
      + rawFrequency * RAW_FREQUENCY_MIX
  }
}

function readSample(index: number): SoundSample {
  const wrappedIndex = ((index % YLANG_YLANG_SAMPLE_COUNT) + YLANG_YLANG_SAMPLE_COUNT)
    % YLANG_YLANG_SAMPLE_COUNT
  const offset = wrappedIndex * 2

  return {
    amplitude: smoothedAmplitudeProfile[wrappedIndex] ?? 0,
    frequency: smoothedFrequencyProfile[wrappedIndex]
      ?? (decodedProfile[offset + 1] ?? 0) / 255,
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
  const linearMix = stopRange === 0
    ? 0
    : (palettePosition - lowerStop.position) / stopRange
  const easedMix = linearMix * linearMix * (3 - 2 * linearMix)
  const color = mixColor(
    lowerStop.color,
    upperStop.color,
    easedMix,
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

function drawSampleColumn(
  target: CanvasRenderingContext2D,
  sample: SoundSample,
  x: number,
  width: number,
) {
  const top = topForAmplitude(sample.amplitude)
  target.fillStyle = colorForFrequency(sample.frequency)
  target.fillRect(x, top, width, DRAWING_HEIGHT - top)
}

function rebuildPixelBuffer(width: number) {
  pixelBuffer = document.createElement('canvas')
  pixelBuffer.width = Math.max(1, Math.ceil(width))
  pixelBuffer.height = DRAWING_HEIGHT
  pixelBufferContext = pixelBuffer.getContext('2d', { willReadFrequently: true })
  if (!pixelBufferContext) return

  const columnCount = Math.ceil(pixelBuffer.width / SAMPLE_WIDTH) + 1
  for (let sampleOffset = columnCount - 1; sampleOffset >= 0; sampleOffset -= 1) {
    const x = pixelBuffer.width - (sampleOffset + 1) * SAMPLE_WIDTH
    drawSampleColumn(
      pixelBufferContext,
      readSample(profileIndex - sampleOffset),
      x,
      SAMPLE_WIDTH + 1,
    )
  }
}

function appendSampleToPixelBuffer(sample: SoundSample) {
  if (!pixelBuffer || !pixelBufferContext) return

  const shiftedWidth = pixelBuffer.width - SAMPLE_WIDTH
  if (shiftedWidth <= 0) {
    rebuildPixelBuffer(pixelBuffer.width)
    return
  }

  // Move already-rendered colors as pixels so their hue cannot be reinterpreted later.
  const shiftedPixels = pixelBufferContext.getImageData(
    SAMPLE_WIDTH,
    0,
    shiftedWidth,
    DRAWING_HEIGHT,
  )
  pixelBufferContext.clearRect(0, 0, pixelBuffer.width, DRAWING_HEIGHT)
  pixelBufferContext.putImageData(shiftedPixels, 0, 0)
  drawSampleColumn(
    pixelBufferContext,
    sample,
    pixelBuffer.width - SAMPLE_WIDTH,
    SAMPLE_WIDTH + 1,
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
  rebuildPixelBuffer(bounds.width)
  drawStrip(0)
}

function drawStrip(progress: number) {
  const canvas = canvasRef.value
  if (!canvas || !context || !pixelBuffer) return

  const width = canvas.getBoundingClientRect().width
  const offset = Math.min(SAMPLE_WIDTH, progress * SAMPLE_WIDTH)
  const latestSample = readSample(profileIndex)
  const nextSample = readSample(profileIndex + 1)
  const edgeSample = interpolateSample(latestSample, nextSample, progress)

  context.clearRect(0, 0, width, DRAWING_HEIGHT)
  context.drawImage(pixelBuffer, -offset, 0)

  if (offset > 0) {
    drawSampleColumn(context, edgeSample, width - offset - 1, offset + 2)
  }
}

function advanceProfile(sampleCount: number) {
  if (sampleCount <= 0) return

  profileIndex = (profileIndex + sampleCount) % YLANG_YLANG_SAMPLE_COUNT
  const visibleColumnCount = pixelBuffer
    ? Math.ceil(pixelBuffer.width / SAMPLE_WIDTH) + 1
    : 0

  if (sampleCount >= visibleColumnCount) {
    rebuildPixelBuffer(canvasRef.value?.getBoundingClientRect().width ?? window.innerWidth)
    return
  }

  for (let index = sampleCount - 1; index >= 0; index -= 1) {
    appendSampleToPixelBuffer(readSample(profileIndex - index))
  }
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
  window.addEventListener('pointerup', startAudioOnInteraction)
  window.addEventListener('keydown', startAudioOnInteraction)
  void playAudio()
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  motionPreference.addEventListener('change', startAnimation)
  window.addEventListener('resize', handleResize)
  resizeCanvas()
  startAnimation()
})

onBeforeUnmount(() => {
  removePlaybackFallback()
  playbackRequest += 1
  audioRef.value?.pause()
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
    <SpeakerWaveIcon v-if="isAudioEnabled" class="sound-gradient__icon" aria-hidden="true" />
    <SpeakerXMarkIcon v-else class="sound-gradient__icon" aria-hidden="true" />
    <span>FKJ</span>
  </button>
  <audio
    ref="audioRef"
    src="/audio/ylang-ylang-quiet.m4a"
    preload="metadata"
    loop
    @playing="isAudioEnabled = true"
    @pause="isAudioEnabled = false"
    @error="isAudioEnabled = false"
  />
</template>

<style scoped>
.sound-gradient {
  position: fixed;
  z-index: -1;
  right: 0;
  bottom: 0;
  left: 0;
  height: var(--sound-gradient-strip-height);
  overflow: visible;
  background: transparent;
  pointer-events: none;
  transition: height var(--transition-theme);
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
  animation: sound-gradient-grain 4s linear infinite;
  content: '';
  -webkit-mask-image: linear-gradient(to bottom, transparent 18%, black 62%);
  mask-image: linear-gradient(to bottom, transparent 18%, black 62%);
  pointer-events: none;
}

.sound-gradient__canvas {
  --canvas-bottom-overscan: var(--space-l);
  position: absolute;
  z-index: 0;
  right: calc(var(--space-l) * -1);
  bottom: calc(var(--canvas-bottom-overscan) * -1);
  left: calc(var(--space-l) * -1);
  width: calc(100% + var(--space-xxxl));
  height: calc(var(--sound-gradient-wave-height) + var(--canvas-bottom-overscan));
  max-width: none;
  filter:
    blur(16px)
    saturate(var(--sound-gradient-saturation))
    brightness(var(--sound-gradient-brightness));
  transition:
    filter var(--transition-theme),
    height var(--transition-theme);
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
  bottom: var(--layout-footer-bottom);
  min-height: var(--layout-footer-control-height);
  padding: 0;
  left: var(--layout-content-edge);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-s);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-body);
  color: var(--color-sound-overlay-text);
  border: 0;
  background: transparent;
  cursor: pointer;
  pointer-events: auto;
  transition: opacity var(--transition-fast);
}

.sound-gradient__icon {
  width: var(--space-5);
  height: var(--space-5);
  flex: 0 0 var(--space-5);
}

.sound-gradient__credit:hover {
  opacity: 0.5;
}

.sound-gradient__credit:focus-visible {
  border-radius: 2px;
  outline: 1px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .sound-gradient::after {
    animation: none;
  }
}
</style>
