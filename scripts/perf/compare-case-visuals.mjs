import { chromium } from 'playwright'
import sharp from 'sharp'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'

const [before = 'http://127.0.0.1:4201', after = 'http://127.0.0.1:4202'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--no-sandbox'] })
const results = []
try {
  for (const width of [1440, 390]) for (const [route, selectors] of [
    ['nova', ['.research-figure img', '.problem-media-story img']],
    ['nuance', ['.phone-placeholders', '.expression-media', '.case-media-placeholder--mood-colors']],
  ]) {
    const captures = []
    for (const base of [before, after]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } })
      // Freeze videos on the unchanged source-derived posters.
      await page.addInitScript(() => { HTMLMediaElement.prototype.play = async function () {} })
      await page.goto(`${base}/${route}`, { waitUntil: 'load' })
      await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' })
      const shots = []
      for (const selector of selectors) {
        const element = page.locator(selector).first()
        await element.scrollIntoViewIfNeeded()
        await page.waitForFunction(selector => {
          const el = document.querySelector(selector)
          const images = el.tagName === 'IMG' ? [el] : [...el.querySelectorAll('img')]
          return images.every(i => i.complete && i.naturalWidth > 0)
        }, selector)
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(500)
        const buffer = await page.screenshot({ clip: await element.boundingBox(), animations: 'disabled', timeout: 60000 })
        shots.push(await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true }))
      }
      captures.push(shots)
      await page.close()
    }
    for (let i = 0; i < selectors.length; i++) {
      const [a, b] = [captures[0][i], captures[1][i]]
      assert.equal(a.info.width, b.info.width, `${width} ${selectors[i]} width`)
      assert.equal(a.info.height, b.info.height, `${width} ${selectors[i]} height`)
      let different = 0, totalDifference = 0
      for (let p = 0; p < a.data.length; p += 4) {
        let delta = 0
        for (let c = 0; c < 3; c++) delta += Math.abs(a.data[p+c] - b.data[p+c])
        if (delta) different++
        totalDifference += delta
      }
      results.push({ route, width, selector: selectors[i], imageWidth: a.info.width, imageHeight: a.info.height,
        differingPixels: different, meanChannelDifference: totalDifference / (a.data.length / 4 * 3) })
    }
  }
  await writeFile('claude-docs/perf-data/case-load/visual-comparison.json', JSON.stringify(results, null, 2) + '\n')
  console.log(results)
} finally { await browser.close() }
