import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:4300'
// Use the browser's normal autoplay policy; no gesture-bypass launch flag.
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const errors = []

async function assertPresentationMedia(page) {
  assert.equal(await page.locator('video').evaluateAll(videos => videos.length > 0 && videos.every(video =>
    !video.controls && !video.hasAttribute('controls') && video.muted && video.playsInline && video.loop
    && video.disableRemotePlayback && video.disablePictureInPicture && video.tabIndex === -1
    && getComputedStyle(video).pointerEvents === 'none'
  )), true)
  assert.equal(await page.evaluate(() => window.__controlsAppeared), false)
}

async function waitForPlayback(video) {
  await video.scrollIntoViewIfNeeded()
  await video.evaluate(video => new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000
    const check = () => {
      if (!video.paused && video.currentTime > .1) resolve()
      else if (Date.now() > deadline) reject(new Error('Video did not autoplay'))
      else setTimeout(check, 50)
    }
    check()
  }))
}

try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 },
      isMobile: width === 390, hasTouch: width === 390 })
    await context.addInitScript(() => {
      window.__controlsAppeared = false
      new MutationObserver(records => {
        if (records.some(record => record.target instanceof HTMLVideoElement
          && (record.oldValue !== null || record.target.controls))) window.__controlsAppeared = true
      }).observe(document, { subtree: true, attributes: true, attributeFilter: ['controls'], attributeOldValue: true })
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))

    // Withhold media beyond the former eight-second native-controls fallback.
    let releaseMedia
    const mediaGate = new Promise(resolve => { releaseMedia = resolve })
    await page.route(/\.mp4(?:\?.*)?$/, async route => {
      await mediaGate
      await route.continue()
    })
    await page.goto(`${base}/doordash`, { waitUntil: 'domcontentloaded' })
    const prototype = page.locator('.prototype video').first()
    await prototype.scrollIntoViewIfNeeded()
    await prototype.locator('source').waitFor({ state: 'attached' })
    await page.waitForTimeout(9000)
    assert.equal(await prototype.evaluate(video => video.paused), true)
    await assertPresentationMedia(page)
    releaseMedia()
    await waitForPlayback(prototype)
    await assertPresentationMedia(page)

    // Physical taps/clicks hit the page, and synthetic media gestures are canceled.
    const box = await prototype.boundingBox()
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName === 'VIDEO', point), false)
    if (width === 390) await page.touchscreen.tap(point.x, point.y)
    else await page.mouse.click(point.x, point.y)
    assert.equal(await prototype.evaluate(video => ['click', 'contextmenu'].every(type =>
      !video.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }))
    )), true)
    await assertPresentationMedia(page)

    await waitForPlayback(page.locator('.logical-prototype__video'))
    await assertPresentationMedia(page)
    assert.equal(await page.locator('video').evaluateAll(videos => videos.filter(video => !video.paused).length), 1)

    for (const route of ['nova', 'nuance', '']) {
      await page.goto(`${base}/${route}`, { waitUntil: 'load' })
      await waitForPlayback(page.locator('video').first())
      await assertPresentationMedia(page)
    }
    await context.close()
  }
  assert.deepEqual(errors, [])
  console.log('Desktop/mobile: no controls after 9s media delay or gestures; tap-free recovery; DoorDash prototype/direct, Nova, Nuance and homepage autoplay passed')
} finally {
  await browser.close()
}
