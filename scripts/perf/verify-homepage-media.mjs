import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3000'
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  // Even when autoplay is allowed, mounting must never fetch the song.
  args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
})
const checks = []
const errors = []
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  page.on('pageerror', error => errors.push(error.message))
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await page.goto(base, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const songRequests = () => requests.filter(url => url.includes('ylang-ylang-quiet'))
  assert.equal(songRequests().length, 0)
  assert.equal(await page.locator('audio').getAttribute('src'), null)
  assert.equal(requests.some(url => /fonts\.(googleapis|gstatic)\.com/.test(url)), false)
  assert.equal(requests.some(url => /\/(doordash|nuance)\.[^/]+\.css/.test(url)), false)
  assert.equal(requests.some(url => /fig-1-clouds\.jpg|iphone-16-pro\.png/.test(url)), false)
  assert.equal(requests.filter(url => /fig-1-clouds-\d+\.webp/.test(url)).length, 1)
  assert.equal(await page.locator('link[rel=preload][as=image]').getAttribute('fetchpriority'), 'high')
  checks.push('No mount-time audio, remote font CSS, original oversized images, or case-study CSS; one responsive cloud request')

  await page.evaluate(() => {
    document.body.click()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))
    document.querySelector('.sound-gradient__credit').click()
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.setViewportSize({ width: 1440, height: 1000 })
  assert.equal(songRequests().length, 0)
  assert.equal(await page.locator('audio').getAttribute('src'), null)
  checks.push('Synthetic clicks/keypresses and viewport changes cannot unlock audio')

  await page.keyboard.press('a')
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio')
    return !audio.paused && audio.currentTime > 0
  })
  assert.ok(songRequests().length > 0)
  await page.locator('.sound-gradient__credit').click()
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true)
  await page.keyboard.press('b')
  assert.equal(await page.locator('audio').evaluate(audio => audio.paused), true)
  await page.locator('.sound-gradient__credit').click()
  await page.waitForFunction(() => !document.querySelector('audio').paused)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForFunction(() => document.querySelector('audio').paused)
  checks.push('Trusted keypress starts audio; mute stays muted, toggle resumes, mobile stops playback')

  // Remove picture sources to exercise the JPEG/PNG fallback rendering.
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.locator('#project-1 picture source').evaluateAll(sources => sources.forEach(source => source.remove()))
  await page.waitForFunction(() => [...document.querySelectorAll('#project-1 img')]
    .every(image => image.complete && image.naturalWidth > 0 && /\.(jpg|png)$/.test(image.currentSrc)))
  checks.push('Cloud JPEG and alpha PNG fallbacks decode')

  // The same SPA must load route styles when the user actually navigates.
  await page.locator('#project-13').evaluate(link => link.click())
  await page.waitForURL('**/doordash')
  await page.waitForFunction(() => !!document.querySelector('.doordash-case'))
  assert.ok(requests.some(url => /\/doordash\.[^/]+\.css/.test(url)))
  await page.goto(`${base}/nuance`, { waitUntil: 'networkidle' })
  await page.locator('.case-clouds').scrollIntoViewIfNeeded()
  assert.equal(await page.locator('.case-clouds').evaluate(image => image.naturalWidth >= image.clientWidth), true)
  checks.push('DoorDash CSS loads on SPA navigation; Nuance keeps a full-resolution cloud candidate')
  await page.close()

  for (const width of [390, 1440]) {
    const fresh = await browser.newPage({ viewport: { width, height: 1000 } })
    const fetched = []
    fresh.on('request', request => fetched.push(request.url()))
    await fresh.goto(base, { waitUntil: 'networkidle' })
    await fresh.mouse.click(20, 300)
    if (width < 640) {
      await fresh.waitForTimeout(400)
      assert.equal(fetched.some(url => /ylang-ylang-quiet|fig-1-clouds|iphone-16-pro/.test(url)), false)
      await fresh.locator('#project-1').scrollIntoViewIfNeeded()
      await fresh.waitForFunction(() => document.querySelector('#project-1 video')?.poster.endsWith('asl-feature-mobile.jpg'))
    } else {
      await fresh.waitForFunction(() => !document.querySelector('audio').paused)
      assert.ok(fetched.some(url => /ylang-ylang-quiet/.test(url)))
    }
    await fresh.close()
  }
  checks.push('Trusted click starts desktop audio; mobile gestures fetch no audio or hidden frames and retain the mobile poster')
  assert.deepEqual(errors, [])
  console.log(checks.join('\n'))
} finally {
  await browser.close()
}
