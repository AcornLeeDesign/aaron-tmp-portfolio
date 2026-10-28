import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { readFile, writeFile, mkdir } from 'node:fs/promises'

const images = JSON.parse(await readFile('app/data/caseStudyImages.json', 'utf8'))
const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:4300'
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const errors = []
const results = []
const screenshots = process.env.IMAGE_SCREENSHOTS
if (screenshots) await mkdir(screenshots, { recursive: true })

try {
  for (const [width, dpr] of [[390, 2], [768, 2], [1440, 1]]) {
    for (const route of ['nova', 'nuance', 'doordash']) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: dpr })
      page.on('pageerror', error => errors.push(error.message))
      const requests = []
      page.on('request', request => requests.push(new URL(request.url()).pathname))
      const response = await page.goto(`${base}/${route}`, { waitUntil: 'load' })
      assert.equal(response.status(), 200)
      // Both src and srcset must stay absent until the bounded observer fires.
      const deferred = await page.locator('img[data-deferred-src]').evaluateAll(elements => elements
        .filter(image => image.getBoundingClientRect().top > innerHeight * 1.5)
        .map(image => ({ src: image.getAttribute('src'), srcset: image.getAttribute('srcset') })))
      assert.ok(deferred.every(image => !image.src && !image.srcset))
      for (const [original, asset] of Object.entries(images).filter(([path]) => path.includes(`/${route}/`))) {
        const candidates = [asset.webpSrc, asset.src]
        const locator = page.locator('img').filter({ visible: true })
        const index = await locator.evaluateAll((elements, candidates) => elements.findIndex(image =>
          candidates.includes(image.getAttribute('src')) || candidates.includes(image.dataset.deferredSrc)), candidates)
        assert.ok(index >= 0, `Missing image: ${original}`)
        const image = locator.nth(index)
        if (screenshots && width === 1440 && original.includes('/art-direction/')) {
          // Avoid a pending snap animation clipping the comparison screenshot.
          await image.evaluate(image => { image.closest('.art-carousel__track').style.scrollSnapType = 'none' })
        }
        await image.scrollIntoViewIfNeeded()
        await image.evaluate(image => new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Image did not load')), 15000)
          const poll = () => {
            if (image.complete && image.naturalWidth > 0) { clearTimeout(timer); resolve() }
            else setTimeout(poll, 50)
          }
          poll()
        }))
        const state = await image.evaluate(image => ({ src: new URL(image.currentSrc).pathname,
          width: image.clientWidth, height: image.clientHeight, loading: image.loading,
          fit: getComputedStyle(image).objectFit }))
        assert.ok(asset.webp.includes(state.src), `${original}: unexpected ${state.src}`)
        assert.equal(state.loading, 'lazy')
        assert.ok(state.width > 0 && state.height > 0)
        if (original.includes('avatar-listening')) assert.ok(Math.abs(state.width - state.height) <= 1, 'Avatar must remain square')
        results.push({ viewport: width, dpr, original, ...state })
        // Capture identical CSS boxes with the delivered image and original for
        // visual review. Videos are outside these image-only screenshots.
        if (screenshots && width === 1440 && !/iphone-16-pro|clouds/.test(original)) {
          const name = original.split('/').at(-1).replace(/\.(png|jpg)$/, '')
          await image.evaluate(async image => {
            await image.decode()
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
          })
          // Hide fixed navigation and the scroll-edge blur while comparing media.
          const style = 'header, nav, .progressive-bottom-blur { visibility: hidden !important; }'
          await image.screenshot({ path: `${screenshots}/${name}-optimized.png`, style, animations: 'disabled' })
          await image.evaluate((image, original) => {
            image.removeAttribute('srcset')
            image.src = original
          }, original)
          await image.evaluate(image => image.decode())
          await image.screenshot({ path: `${screenshots}/${name}-original.png`, style, animations: 'disabled' })
          await image.evaluate((image, asset) => { image.srcset = asset.webp; image.src = asset.webpSrc }, asset)
        }
      }
      if (!screenshots || width !== 1440) {
        assert.deepEqual(requests.filter(path => images[path]), [], 'An archival original was fetched')
      }
      await page.close()
    }
  }

  // Network failures exercise the same JPEG/PNG path as unsupported WebP.
  for (const route of ['nova', 'nuance', 'doordash']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    await page.route(/\/images\/case-studies\/.*-\d+\.webp$/, request => request.abort())
    await page.goto(`${base}/${route}`, { waitUntil: 'load' })
    for (const [original, asset] of Object.entries(images).filter(([path]) => path.includes(`/${route}/`))) {
      const index = await page.locator('img').evaluateAll((elements, asset) => elements.findIndex(image =>
        [asset.webpSrc, asset.src].includes(image.getAttribute('src')) || image.dataset.deferredSrc === asset.src), asset)
      assert.ok(index >= 0, original)
      const image = page.locator('img').nth(index)
      await image.scrollIntoViewIfNeeded()
      await page.waitForFunction(element => element.complete && element.naturalWidth > 0 && /\.(png|jpg)$/.test(element.currentSrc), await image.elementHandle())
      assert.ok((asset.fallback || asset.src).includes(await image.evaluate(image => new URL(image.currentSrc).pathname)))
    }
    await page.close()
  }
  assert.deepEqual(errors, [])
  await writeFile('claude-docs/perf-data/case-study-image-browser.json', JSON.stringify({ results, errors,
    checks: ['390px DPR2, 768px DPR2, 1440px DPR1: responsive WebP decodes',
      'Offscreen src and srcset stay deferred', 'No archival originals requested',
      'JPEG/PNG fallback decodes when WebP fails', 'No browser page errors'] }, null, 2) + '\n')
  console.log('Responsive images, viewport deferral, original-request exclusion, and JPEG/PNG fallback passed')
} finally {
  await browser.close()
}
