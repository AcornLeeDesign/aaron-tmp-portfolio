import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'
const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3000'
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const page = await context.newPage()
await page.goto(`${base}/doordash`, { waitUntil: 'networkidle' })
const cdp = await context.newCDPSession(page)
await cdp.send('Network.enable')
await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100,
  downloadThroughput: 65536, uploadThroughput: 131072 })
const tracked = new Map()
cdp.on('Network.requestWillBeSent', event => {
  if (event.request.url.includes('/legacy-feature-flag-mobile.mp4')) tracked.set(event.requestId, { url: event.request.url, bytes: 0 })
})
cdp.on('Network.dataReceived', event => {
  const request = tracked.get(event.requestId)
  if (request) request.bytes += event.dataLength
})
cdp.on('Network.loadingFailed', event => {
  const request = tracked.get(event.requestId)
  if (request) request.failure = event.errorText
})
const video = page.locator('.extra-legacy video')
await video.scrollIntoViewIfNeeded()
await video.locator('source').waitFor({ state: 'attached' })
// Chromium can batch Media dataReceived events until a range completes.
// Observe the initiated request, then cancel while the throttled range is pending.
for (let i = 0; i < 50 && tracked.size === 0; i++) await page.waitForTimeout(100)
assert.equal(tracked.size > 0, true, 'Throttled video request started')
await page.waitForTimeout(1000)
const complete = await video.evaluate(v => Number.isFinite(v.duration) && v.buffered.length && v.buffered.end(0) >= v.duration - .1)
assert.equal(Boolean(complete), false, 'Request remains unfinished')
const start = Date.now()
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
await video.locator('source').waitFor({ state: 'detached', timeout: 4500 })
const detachMs = Date.now() - start
await page.waitForTimeout(1000)
assert.equal(await video.evaluate(v => v.paused), true)
assert.equal([...tracked.values()].some(r => r.failure === 'net::ERR_ABORTED'), true)
const result = { downloadBytesPerSecond: 65536, detachMs, requests: [...tracked.values()],
  checks: ['Unfinished MP4 more than two screens away detaches after the retention delay', 'Browser cancels the active network request', 'Deselected video remains paused'] }
await writeFile('claude-docs/perf-data/cancellation-slow4g.json', JSON.stringify(result, null, 2) + '\n')
await browser.close()
console.log(result)
