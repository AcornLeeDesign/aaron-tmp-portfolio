import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { transformSync } from 'esbuild'
import vm from 'node:vm'
import { setTimeout as delay } from 'node:timers/promises'

// Exercise the real component's shared coordinator with controllable media states.
const source = readFileSync(new URL('../app/components/VideoPlayer.vue', import.meta.url), 'utf8')
const script = source.match(/<script lang="ts">([\s\S]*?)<\/script>/)[1]
function setup() {
  const context = vm.createContext({
    window: { innerWidth: 1440, innerHeight: 900, setTimeout, clearTimeout, addEventListener() {}, removeEventListener() {} },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} },
    HTMLMediaElement: { HAVE_FUTURE_DATA: 3 },
  })
  vm.runInContext(transformSync(script, { loader: 'ts' }).code + '\nthis.api = { registerVideo, unregisterVideo, syncPlayback };', context)
  const api = context.api
  const registered = []
  function video(top, ready = 3) {
    const loads = []
    const events = new EventTarget()
    const media = {
      top, readyState: ready, paused: true, isConnected: true, controls: false,
      muted: false, defaultMuted: false, playsInline: false,
      duration: 30, currentTime: 0, buffered: { length: 1, start: () => 0, end: () => 1.8 },
      getBoundingClientRect() { return { top: this.top, bottom: this.top + 400, left: 0, right: 800, width: 800, height: 400 } },
      addEventListener: events.addEventListener.bind(events),
      removeEventListener: events.removeEventListener.bind(events),
      dispatchEvent: events.dispatchEvent.bind(events), querySelector: () => ({}),
      play() { this.paused = false; return Promise.resolve() }, pause() { this.paused = true },
    }
    const registration = api.registerVideo(media, true, load => loads.push({ load }))
    registered.push(registration)
    return { media, registration, loads }
  }
  return { ...api, video, context, cleanup: () => registered.forEach(api.unregisterVideo) }
}

test('canplay starts a paused clip with less than three buffered seconds', async () => {
  const c = setup()
  try {
    const { media } = c.video(100, 2)
    c.syncPlayback()
    assert.equal(media.paused, true)
    media.readyState = 3
    media.dispatchEvent(new Event('canplay'))
    await delay(10)
    assert.equal(media.paused, false)
    assert.ok(media.buffered.end(0) < 3)
  } finally { c.cleanup() }
})

test('next clip preloads during playback, before the current clip finishes buffering', async () => {
  const c = setup()
  try {
    const current = c.video(100)
    const next = c.video(1100)
    const far = c.video(2100)
    c.syncPlayback()
    assert.equal(next.loads.at(-1).load, false)
    await Promise.resolve()
    c.syncPlayback()
    assert.equal(next.loads.at(-1).load, true)
    assert.equal(far.loads.at(-1).load, false)
    assert.equal(current.media.paused, false)
  } finally { c.cleanup() }
})

test('selection pauses the old clip first, recovers browser pauses and respects hidden tabs', async () => {
  const c = setup()
  try {
    const first = c.video(100)
    const second = c.video(1000)
    c.syncPlayback()
    await Promise.resolve()
    first.media.top = -1000
    second.media.top = 100
    second.media.play = () => {
      assert.equal(first.media.paused, true)
      second.media.paused = false
      return Promise.resolve()
    }
    c.syncPlayback()
    await Promise.resolve()
    assert.equal(second.media.paused, false)
    second.media.pause()
    second.media.dispatchEvent(new Event('pause'))
    await delay(10)
    assert.equal(second.media.paused, false)
    c.context.document.visibilityState = 'hidden'
    c.syncPlayback()
    assert.equal(first.media.paused && second.media.paused, true)
  } finally { c.cleanup() }
})

test('progress retries a rejected play without enabling controls or requiring a tap', async () => {
  const c = setup()
  try {
    const { media } = c.video(100)
    let attempts = 0
    media.play = () => {
      attempts++
      assert.equal(media.muted && media.defaultMuted && media.playsInline, true)
      assert.equal(media.controls, false)
      if (attempts === 1) return Promise.reject(new Error('Temporary playback interruption'))
      media.paused = false
      return Promise.resolve()
    }
    c.syncPlayback()
    await delay(10)
    assert.equal(media.paused, true)
    media.dispatchEvent(new Event('progress'))
    await delay(10)
    assert.equal(attempts, 2)
    assert.equal(media.paused, false)
  } finally { c.cleanup() }
})

test('timer retries playback without another media event', async () => {
  const c = setup()
  try {
    const { media, registration } = c.video(100)
    registration.retryDelay = 5
    let attempts = 0
    media.play = () => {
      if (++attempts === 1) return Promise.reject(new Error('Temporary playback interruption'))
      media.paused = false
      return Promise.resolve()
    }
    c.syncPlayback()
    await delay(40)
    assert.equal(attempts, 2)
    assert.equal(media.paused, false)
  } finally { c.cleanup() }
})

test('a pending play resolving after deselection cannot exceed the one-player cap', async () => {
  const c = setup()
  try {
    const first = c.video(100)
    const second = c.video(1100)
    let finishPlay
    first.media.play = () => new Promise(resolve => {
      finishPlay = () => { first.media.paused = false; resolve() }
    })
    c.syncPlayback()
    first.media.top = -1000
    second.media.top = 100
    c.syncPlayback()
    finishPlay()
    await Promise.resolve()
    assert.equal(first.media.paused, true)
    assert.equal(second.media.paused, false)
  } finally { c.cleanup() }
})
