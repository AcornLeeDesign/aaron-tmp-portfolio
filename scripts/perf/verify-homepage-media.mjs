import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3000'
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  // Verify desktop autoplay without providing any gesture.
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const checks = []
const errors = []
const isAudioRequest = url => /\/audio\/|\.(m4a|mp3|aac|ogg|wav)(?:[?#]|$)/i.test(url)

async function waitForAudioPlayback(page) {
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio')
    return audio && !audio.paused && !audio.muted && audio.readyState >= 3 && audio.currentTime > 0
  })
  const time = await page.locator('audio').evaluate(audio => audio.currentTime)
  await page.waitForFunction(previousTime => document.querySelector('audio').currentTime > previousTime + 0.1, time)
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.on('pageerror', error => errors.push(error.message))
  const requests = []
  let firstSongRequest
  page.on('request', request => {
    requests.push(request.url())
    if (request.url().includes('ylang-ylang-quiet')) firstSongRequest ??= request
  })
  // Streaming audio can keep a request open throughout playback; do not wait for networkidle.
  await page.goto(base, { waitUntil: 'load' })
  const songRequests = () => requests.filter(url => url.includes('ylang-ylang-quiet'))
  await waitForAudioPlayback(page)
  assert.ok(songRequests().some(url => url.endsWith('/audio/ylang-ylang-quiet.m4a')))
  const timing = await page.evaluate(audioStart => ({
    load: performance.getEntriesByType('navigation')[0].loadEventEnd,
    audio: audioStart - performance.timeOrigin,
  }), firstSongRequest.timing().startTime)
  assert.ok(timing.load > 0 && timing.audio >= timing.load, JSON.stringify(timing))
  // Lazy videos may start after load; the song still autoplays after load.
  checks.push('Desktop requests the M4A after window load and autoplays with advancing playback time')
  assert.equal(requests.some(url => /fonts\.(googleapis|gstatic)\.com/.test(url)), false)
  assert.equal(requests.some(url => /\/(doordash|nuance)\.[^/]+\.css/.test(url)), false)
  assert.equal(requests.some(url => /fig-1-clouds\.jpg|iphone-16-pro\.png/.test(url)), false)
  assert.equal(requests.filter(url => /fig-1-clouds-\d+\.webp/.test(url)).length, 1)
  assert.equal(await page.locator('link[rel=preload][as=image]').getAttribute('fetchpriority'), 'high')
  checks.push('No remote font CSS, original oversized images, or case-study CSS; one responsive cloud request')
  await page.locator('.sound-gradient__credit').click()
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true)
  await page.keyboard.press('b')
  await page.mouse.click(20, 300)
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true)
  await page.locator('.sound-gradient__credit').click()
  await waitForAudioPlayback(page)
  const desktopAudio = await page.locator('audio').elementHandle()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForFunction(() => !document.querySelector('audio'))
  assert.equal(await desktopAudio.evaluate(audio => audio.paused && !audio.hasAttribute('src')), true)
  await desktopAudio.dispose()
  checks.push('Mute stays muted after interactions; toggle resumes; mobile stops and removes audio')

  // Remove picture sources to exercise the JPEG/PNG fallback rendering.
  await page.setViewportSize({ width: 1440, height: 1000 })
  await waitForAudioPlayback(page)
  await page.locator('#project-1 picture source').evaluateAll(sources => sources.forEach(source => source.remove()))
  await page.waitForFunction(() => [...document.querySelectorAll('#project-1 img')]
    .every(image => image.complete && image.naturalWidth > 0 && /\.(jpg|png)$/.test(image.currentSrc)))
  checks.push('Cloud JPEG and alpha PNG fallbacks decode')

  // The same SPA must load route styles when the user actually navigates.
  await page.locator('#project-13').evaluate(link => link.click())
  await page.waitForURL('**/doordash')
  await page.waitForFunction(() => !!document.querySelector('.doordash-case'))
  assert.ok(requests.some(url => /\/doordash\.[^/]+\.css/.test(url)))
  await page.goto(`${base}/nuance`, { waitUntil: 'load' })
  await page.locator('.case-media-placeholder--fig-one .case-clouds').scrollIntoViewIfNeeded()
  assert.equal(await page.locator('.case-media-placeholder--fig-one .case-clouds').evaluate(image => image.naturalWidth >= image.clientWidth), true)
  checks.push('DoorDash CSS loads on SPA navigation; Nuance keeps a full-resolution cloud candidate')
  await page.close()

  for (const width of [390, 639, 640]) {
    const fresh = await browser.newPage({ viewport: { width, height: 1000 } })
    fresh.on('pageerror', error => errors.push(error.message))
    const fetched = []
    fresh.on('request', request => fetched.push(request.url()))
    await fresh.goto(base, { waitUntil: 'load' })
    if (width < 640) {
      assert.equal(await fresh.locator('audio').count(), 0)
      await fresh.mouse.click(20, 300)
      await fresh.keyboard.press('a')
      await fresh.waitForTimeout(2200)
      assert.equal(fetched.some(url => /ylang-ylang-quiet|fig-1-clouds|iphone-16-pro/.test(url)), false)
      await fresh.locator('#project-1').scrollIntoViewIfNeeded()
      await fresh.waitForFunction(() => document.querySelector('#project-1 video')?.poster.endsWith('asl-feature-mobile.jpg'))
      assert.equal(await fresh.locator('audio').count(), 0)
      assert.equal(fetched.filter(isAudioRequest).length, 0)
    } else {
      await waitForAudioPlayback(fresh)
      assert.ok(fetched.some(url => /ylang-ylang-quiet/.test(url)))
    }
    await fresh.close()
  }
  checks.push('390px/639px: zero audio requests or elements, including after gestures; mobile poster retained; 640px autoplays')

  const blockedBrowser = await chromium.launch({
    executablePath: process.env.CHROME_PATH,
    args: ['--no-sandbox', '--autoplay-policy=user-gesture-required'],
  })
  try {
    for (const interaction of ['pointerup', 'keydown']) {
      const blocked = await blockedBrowser.newPage({ viewport: { width: 1440, height: 1000 } })
      blocked.on('pageerror', error => errors.push(error.message))
      await blocked.goto(base, { waitUntil: 'load' })
      // Let the idle attempt finish before evaluating JS: DevTools evaluations can
      // grant user activation and accidentally make the autoplay attempt succeed.
      await blocked.waitForTimeout(2500)
      assert.equal(await blocked.locator('audio').getAttribute('src'), '/audio/ylang-ylang-quiet.m4a')
      assert.equal(await blocked.locator('audio').evaluate(audio => audio.paused), true)
      // Modified/repeated keys must not consume the fallback listener.
      await blocked.evaluate(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }))
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', repeat: true }))
      })
      if (interaction === 'pointerup') {
        await blocked.mouse.move(20, 300)
        await blocked.mouse.down()
        await blocked.mouse.up()
      } else {
        await blocked.keyboard.press('a')
      }
      await waitForAudioPlayback(blocked)
      await blocked.close()
    }
  } finally {
    await blockedBrowser.close()
  }
  checks.push('Blocked desktop autoplay recovers on the first pointerup or keydown, preserving main’s fallback')
  assert.deepEqual(errors, [])
  console.log(checks.join('\n'))
} finally {
  await browser.close()
}
