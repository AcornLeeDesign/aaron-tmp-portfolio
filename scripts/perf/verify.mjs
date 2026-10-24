import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3000'
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const checks = []
const cacheResponse = await browser.newContext()
const response = await cacheResponse.request.head(`${base}/videos/asl-feature-mobile.mp4`)
assert.match(response.headers()['cache-control'], /max-age=31536000.*immutable/)
await cacheResponse.close()
checks.push('Video responses carry immutable one-year cache headers')
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
  isMobile: true, hasTouch: true })
const page = await context.newPage()
const errors = []
page.on('pageerror', error => errors.push(error.message))
await page.goto(`${base}/`, { waitUntil: 'load' })
assert.equal(await page.locator('video').evaluateAll(videos => videos.every(v => v.poster && v.getAttribute('loading') === 'lazy')), true)
checks.push('Initial homepage SSR posters use native lazy loading')
const first = page.locator('#project-1 video')
await page.locator('#project-1').scrollIntoViewIfNeeded()
await page.waitForFunction(() => {
  const video = document.querySelector('#project-1 video')
  return video && !video.paused && video.currentTime > 0 && video.videoWidth === 1280
}, null, { timeout: 20000 })
assert.match(await first.evaluate(video => video.currentSrc), /\/asl-feature-mobile\.mp4$/)
checks.push('Mobile selects only the 1280px ASL MP4 and plays')
await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
await page.waitForTimeout(3200)
assert.equal(await first.locator('source').count(), 0)
assert.equal(await first.evaluate(video => video.paused), true)
checks.push('Offscreen source children detach and playback pauses within 3.2 seconds')
await page.locator('#project-1').scrollIntoViewIfNeeded()
await page.waitForFunction(() => {
  const video = document.querySelector('#project-1 video')
  return video && !video.paused && video.currentTime > 0
}, null, { timeout: 20000 })
checks.push('Video reattaches and resumes after scrolling back')
await first.evaluate(video => { window.__oldVideo = video })
// Exercise Nuxt SPA unmount cleanup instead of a full document navigation.
await page.locator('#project-13').evaluate(link => link.click())
await page.waitForURL('**/doordash')
await page.waitForFunction(() => !window.__oldVideo.isConnected)
assert.deepEqual(await page.evaluate(() => ({ paused: window.__oldVideo.paused,
  sources: window.__oldVideo.querySelectorAll('source[src]').length })), { paused: true, sources: 0 })
checks.push('SPA navigation pauses detached video and clears every source URL')
await page.locator('.first-prototype').scrollIntoViewIfNeeded()
await page.waitForFunction(() => {
  const video = document.querySelector('.first-prototype video')
  return video && !video.paused && video.currentTime > 0
}, null, { timeout: 20000 })
checks.push('DoorDash case-study video starts after buffering')
assert.equal(await page.locator('video').evaluateAll(videos => videos.filter(v => !v.paused).length) <= 1, true)
await page.locator('.alert-comparison').scrollIntoViewIfNeeded()
await page.waitForFunction(() => [...document.querySelectorAll('.alert-comparison image')]
  .every(image => image.getAttribute('href')?.endsWith('.lossless.webp')))
checks.push('Lazy SVG screenshots select the verified lossless assets')

const fallback = await context.newPage()
await fallback.route('**/doordash.lossless.webp', route => route.abort())
await fallback.goto(`${base}/`, { waitUntil: 'load' })
await fallback.waitForFunction(() => {
  const image = document.querySelector('#project-13 img')
  return image?.currentSrc.endsWith('/images/doordash.png') && image.naturalWidth === 1024
})
checks.push('Failed/unsupported WebP falls back to the original PNG')
assert.deepEqual(errors, [])
// Fresh production contexts need no saved session state to access any case study.
for (const route of ['doordash', 'nova', 'nuance']) {
  const publicPage = await browser.newPage()
  const response = await publicPage.goto(`${base}/${route}`, { waitUntil: 'load' })
  assert.equal(response.status(), 200)
  assert.equal(await publicPage.locator('main h1').count() > 0, true)
  assert.equal(await publicPage.locator('video').count() > 0, true)
  await publicPage.close()
}
checks.push('All three case studies open in fresh production sessions')

for (const width of [640, 1023, 1024]) {
  const tablet = await browser.newPage({ viewport: { width, height: 900 } })
  await tablet.goto(`${base}/`, { waitUntil: 'load' })
  assert.equal(await tablet.locator('.carousel-track__sticky').evaluate(el => getComputedStyle(el).position),
    width < 1024 ? 'relative' : 'sticky')
  await tablet.close()
}
checks.push('640px / 1023px stay linear; 1024px retains desktop sticky carousel')
await browser.close()
await writeFile('claude-docs/perf-data/verification-slow4g.json', `${JSON.stringify({ checks, errors }, null, 2)}\n`)
console.log(checks.join('\n'))
