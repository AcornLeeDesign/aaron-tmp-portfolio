import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3000'
const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const errors = []
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  page.on('pageerror', e => errors.push(e.message))
  const requested = []
  page.on('request', r => requested.push(r.url()))
  const response = await page.goto(`${base}/nova`, { waitUntil: 'load' })
  const html = await response.text()
  assert.match(html, /poster="\/videos\/posters\/nova_walkthrough.jpg"/)
  assert.match(html, /loading="lazy"[^>]*poster=/)
  assert.doesNotMatch(html, /<source[^>]+src="[^"]+\.mp4/)
  const hero = page.locator('video').first()
  await page.waitForFunction(() => document.querySelector('video').currentTime > .1)
  assert.equal(requested.some(u => u.includes('computer-lab.jpg')), false)
  assert.equal(requested.some(u => /\/_nuxt\/index\.[^/]+\.css/.test(u)), false)
  assert.equal(await page.locator('video').evaluateAll(vs => vs.every(v => v.poster && v.getAttribute('loading') === 'lazy')), true)

  // Hold the same element and track load() calls: nearby scroll reversal must
  // preserve an unfinished buffer, not reset/recreate the source.
  await hero.evaluate(v => {
    window.retainedVideo = v
    window.videoLoads = 0
    const original = v.load.bind(v)
    v.load = () => { window.videoLoads++; original() }
    window.sourceNode = v.querySelector('source')
  })
  await hero.evaluate(v => window.scrollTo({ top: v.getBoundingClientRect().bottom + scrollY + 100, behavior: 'instant' }))
  await page.waitForTimeout(2800)
  assert.equal(await hero.evaluate(v => v.paused && v.querySelector('source') === window.sourceNode), true)
  assert.equal(await page.evaluate(() => window.videoLoads), 0)
  await hero.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => !window.retainedVideo.paused)
  assert.equal(await page.evaluate(() => window.videoLoads), 0)

  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(3000)
  assert.equal(await hero.locator('source').count(), 0)
  await hero.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => !window.retainedVideo.paused && window.retainedVideo.currentTime > .1)
  assert.equal(await hero.locator('source').count(), 1)
  // One-screen source attachment must happen even before a video is visible.
  const next = page.locator('video').nth(1)
  await next.evaluate(v => window.scrollTo({ top: v.getBoundingClientRect().top + scrollY - innerHeight * 1.5, behavior: 'instant' }))
  await page.waitForFunction(() => !!document.querySelectorAll('video')[1].querySelector('source'))
  assert.equal(await next.evaluate(v => v.getBoundingClientRect().top >= innerHeight && v.paused), true)
  await page.close()

  const nuance = await context.newPage()
  const nuanceRequests = []
  nuance.on('request', r => nuanceRequests.push(r.url()))
  const nuanceResponse = await nuance.goto(`${base}/nuance`, { waitUntil: 'load' })
  assert.doesNotMatch(await nuanceResponse.text(), /rel="prefetch"[^>]+(?:captionmate|innocaption|live-caption)/)
  await nuance.waitForFunction(() => document.querySelector('video').currentTime > .1)
  assert.equal(nuanceRequests.some(u => /captionmate|innocaption|live-caption|mood-colors-clouds|avatar-listening/.test(u)), false)
  await nuance.locator('.phone-placeholders').scrollIntoViewIfNeeded()
  await nuance.waitForFunction(() => [...document.querySelectorAll('.phone-placeholder')].every(i => i.complete && i.naturalWidth > 0))
  assert.equal(await nuance.locator('.phone-placeholder').first().evaluate(i => getComputedStyle(i).objectFit), 'cover')
  assert.equal(nuanceRequests.some(u => /\/_nuxt\/.*(?:captionmate|innocaption|live-caption)/.test(u)), false)
  await context.close()

  // Real throttled startup and retention, with an incomplete MP4 buffer.
  const slow = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const slowPage = await slow.newPage()
  const cdp = await slow.newCDPSession(slowPage)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375 })
  await slowPage.goto(`${base}/nova`, { waitUntil: 'domcontentloaded' })
  await slowPage.waitForFunction(() => document.querySelector('video')?.currentTime > .1, null, { timeout: 45000 })
  const state = await slowPage.locator('video').first().evaluate(v => ({ time: v.currentTime, duration: v.duration, buffered: v.buffered.end(v.buffered.length - 1) }))
  assert.ok(state.buffered < state.duration, JSON.stringify(state))
  await slowPage.locator('video').first().evaluate(v => {
    window.partialSource = v.querySelector('source')
    window.scrollTo({ top: v.getBoundingClientRect().bottom + scrollY + 100, behavior: 'instant' })
  })
  await slowPage.waitForTimeout(2800)
  assert.equal(await slowPage.locator('video').first().evaluate(v => v.querySelector('source') === window.partialSource), true)
  await slow.close()
  assert.deepEqual(errors, [])
  console.log('SSR lazy posters; bounded images; canplay startup on Slow 4G; near retention; far release; re-entry; one-screen preparation passed')
} finally { await browser.close() }
