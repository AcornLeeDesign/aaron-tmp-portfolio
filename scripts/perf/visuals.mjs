import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
const label = process.argv[2] ?? 'after'
const dir = `claude-docs/perf-data/${label}`
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ args: ['--no-sandbox'] })
for (const [device, viewport, deviceScaleFactor] of [
  ['desktop', { width: 1440, height: 900 }, 1], ['mobile', { width: 390, height: 844 }, 3],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor })
  await page.goto('http://127.0.0.1:3000/doordash', { waitUntil: 'networkidle' })
  for (const [name, selector] of [
    ['alerts', '.alert-comparison'], ['illustrations', '.status-actions--illustrations'],
    ['art', '.art-carousel__slide:first-child'],
  ]) {
    const el = page.locator(selector)
    await el.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)
    await el.screenshot({ path: `${dir}/${device}-${name}.png`, animations: 'disabled' })
  }
  await page.close()
}
await browser.close()
