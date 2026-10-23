import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { transformSync } from 'esbuild'
import vm from 'node:vm'

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
    const media = {
      top, readyState: ready, paused: true, isConnected: true, controls: false,
      duration: 30, currentTime: 0, buffered: { length: 1, start: () => 0, end: () => 1.8 },
      getBoundingClientRect() { return { top: this.top, bottom: this.top + 400, left: 0, right: 800, width: 800, height: 400 } },
      addEventListener() {}, removeEventListener() {}, querySelector: () => ({}),
      play() { this.paused = false; return Promise.resolve() }, pause() { this.paused = true },
    }
    const registration = api.registerVideo(media, true, (load, active) => loads.push({ load, active }))
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
    c.syncPlayback()
    await Promise.resolve()
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
    assert.equal(next.loads.at(-1).active, false)
    assert.equal(far.loads.at(-1).load, false)
    assert.equal(current.media.paused, false)
  } finally { c.cleanup() }
})

test('selection pauses the old clip before playback and respects manual pause / hidden tab', async () => {
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
    second.media.controls = true
    second.media.pause()
    second.registration.onPause()
    c.syncPlayback()
    assert.equal(second.media.paused, true)
    c.context.document.visibilityState = 'hidden'
    c.syncPlayback()
    assert.equal(first.media.paused || second.media.paused, true)
  } finally { c.cleanup() }
})
