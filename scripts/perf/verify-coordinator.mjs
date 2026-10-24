import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3000'
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const results = []
for (const width of [390, 640, 1023, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await context.newPage()
  const failures = []
  page.on('pageerror', e => failures.push(e.message))
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) failures.push(`${response.status()} ${response.url()}`) })
  await page.addInitScript(() => {
    window.__peakPlaying = 0
    window.__violations = []
    document.addEventListener('playing', () => {
      const playing = [...document.querySelectorAll('video')].filter(v => !v.paused)
      window.__peakPlaying = Math.max(window.__peakPlaying, playing.length)
      if (playing.length > 1) window.__violations.push(playing.map(v => v.currentSrc))
    }, true)
  })
  await page.goto(`${base}/doordash`, { waitUntil: 'networkidle' })
  const comparison = page.locator('.prototype').filter({ has: page.locator('video[data-playback-group="status-explorations"]') }).first()
  await comparison.scrollIntoViewIfNeeded()
  await page.waitForFunction(() => [...document.querySelectorAll('video[data-playback-group="status-explorations"]')].some(v => !v.paused && v.currentTime > 0))
  await page.waitForTimeout(3000)
  const selected = await page.locator('video').evaluateAll(videos => videos.filter(v => !v.paused).map(v => v.currentSrc))
  assert.equal(selected.length, 1)
  assert.equal(selected[0].includes('-mobile.mp4'), width <= 639)
  // A coordinator-selected video remains loaded after the source-release delay.
  await page.waitForTimeout(3000)
  assert.equal(await page.locator('video').evaluateAll(videos => videos.filter(v => !v.paused).length), 1)
  assert.deepEqual(await page.evaluate(() => window.__violations), [])
  // Switching breakpoints must replace the rendition without retaining its old source.
  await page.setViewportSize({ width: width <= 639 ? 1440 : 390, height: 900 })
  await comparison.scrollIntoViewIfNeeded()
  await page.waitForFunction(mobile => [...document.querySelectorAll('video')].some(v => !v.paused && v.currentSrc.includes('-mobile.mp4') === mobile), width > 639)
  assert.deepEqual(await page.evaluate(() => window.__violations), [])
  assert.deepEqual(failures, [])
  results.push({ width, selected, peakPlaying: await page.evaluate(() => window.__peakPlaying), failures })
  await context.close()
}
await browser.close()
await mkdir('claude-docs/perf-data', { recursive: true })
await writeFile('claude-docs/perf-data/coordinator-slow4g.json', JSON.stringify(results, null, 2) + '\n')
console.log(results)
