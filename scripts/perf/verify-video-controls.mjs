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
    const toast = page.getByRole('button', { name: "Video didn't load due to poor connection, Press play", exact: true })
    await toast.waitFor({ state: 'visible' })
    const presentation = await toast.evaluate(button => {
      const style = getComputedStyle(button)
      const rect = button.getBoundingClientRect()
      const video = button.parentElement.querySelector('video').getBoundingClientRect()
      const sheet = document.createElement('div')
      sheet.style.background = 'var(--overlay-sheet-background)'
      document.body.append(sheet)
      const background = getComputedStyle(sheet).backgroundColor
      sheet.remove()
      return {
        text: button.textContent, width: rect.width, background: style.backgroundColor === background,
        pointerEvents: style.pointerEvents, fontSize: style.fontSize, fontWeight: style.fontWeight,
        centered: Math.abs(rect.x + rect.width / 2 - video.x - video.width / 2) < 1
          && Math.abs(rect.y + rect.height / 2 - video.y - video.height / 2) < 1,
      }
    })
    assert.deepEqual(presentation, {
      text: "Video didn't load due to poor connection, Press play", width: 200, background: true,
      pointerEvents: 'auto', fontSize: '14px', fontWeight: '400', centered: true,
    })
    // Activation must invoke play synchronously even with no future media data.
    await prototype.evaluate(video => {
      const play = video.play.bind(video)
      video.play = () => { window.__toastPlayCalls = (window.__toastPlayCalls ?? 0) + 1; return play() }
    })
    if (width === 390) await toast.tap()
    else {
      await toast.focus()
      assert.equal(await toast.evaluate(button => button === document.activeElement && button.tabIndex === 0), true)
      await page.keyboard.press('Enter')
    }
    assert.equal(await page.evaluate(() => window.__toastPlayCalls), 1)
    await toast.waitFor({ state: 'detached' })
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

    await waitForPlayback(page.locator('.logical-prototype__video video'))
    await assertPresentationMedia(page)
    assert.equal(await page.locator('video').evaluateAll(videos => videos.filter(video => !video.paused).length), 1)

    for (const route of ['nova', 'nuance', '']) {
      // Each case-study path gets the fallback; the homepage never does.
      let release
      const gate = new Promise(resolve => { release = resolve })
      await page.unrouteAll({ behavior: 'wait' })
      await page.route(/\.mp4(?:\?.*)?$/, async request => { await gate; await request.continue() })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(`${base}/${route}`, { waitUntil: 'domcontentloaded' })
      const video = page.locator('video').first()
      await video.scrollIntoViewIfNeeded()
      await video.locator('source').waitFor({ state: 'attached' })
      await page.waitForTimeout(9000)
      assert.equal(await toast.count(), route ? 1 : 0)
      if (route) {
        assert.equal(await toast.evaluate(button => getComputedStyle(button).transitionDuration), '0s')
        // Center remains inside the visible phone crop on Nuance.
        assert.equal(await toast.evaluate(button => {
          const r = button.getBoundingClientRect()
          return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === button
        }), true)
      }
      release()
      await waitForPlayback(video)
      await toast.waitFor({ state: 'detached' })
      await assertPresentationMedia(page)
    }
    await context.close()
  }
  assert.deepEqual(errors, [])
  console.log('Desktop/mobile: stalled toast, tap/keyboard retry, playback dismissal, reduced motion, no native controls, one-player playback and homepage exclusion passed across DoorDash, Nova and Nuance')
} finally {
  await browser.close()
}
