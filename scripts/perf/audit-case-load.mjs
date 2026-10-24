import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const [label = 'after', base = 'http://127.0.0.1:4202'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] })
const results = []
try {
  for (const route of ['nova', 'nuance']) for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: width === 390 ? 3 : 1, isMobile: width === 390 })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375 })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
    const requests = new Map()
    cdp.on('Network.requestWillBeSent', e => requests.set(e.requestId, { url: e.request.url.replace(base, ''), type: e.type, bytes: 0 }))
    cdp.on('Network.dataReceived', e => { const r = requests.get(e.requestId); if (r) r.bytes += e.encodedDataLength })
    cdp.on('Network.loadingFinished', e => { const r = requests.get(e.requestId); if (r) { r.bytes = Math.max(r.bytes, e.encodedDataLength); r.finished = true } })
    await page.addInitScript(() => {
      window.metrics = { fcp: null, lcp: null, firstPlaying: null, longtasks: [] }
      new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.name === 'first-contentful-paint') metrics.fcp = e.startTime }).observe({ type: 'paint', buffered: true })
      new PerformanceObserver(list => { for (const e of list.getEntries()) metrics.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
      new PerformanceObserver(list => { for (const e of list.getEntries()) metrics.longtasks.push(e.duration) }).observe({ type: 'longtask', buffered: true })
      document.addEventListener('playing', e => { if (e.target.tagName === 'VIDEO') metrics.firstPlaying ??= performance.now() }, true)
    })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto(`${base}/${route}`, { waitUntil: 'load', timeout: 180000 })
    const load = await page.evaluate(() => performance.getEntriesByType('navigation')[0].loadEventEnd)
    let idleCapped = false
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => { idleCapped = true })
    await page.waitForTimeout(5000)
    const metrics = await page.evaluate(() => ({ ...window.metrics, measuredAt: performance.now(),
      images: [...document.images].map(i => ({ src: i.currentSrc, top: i.getBoundingClientRect().top, loading: i.loading, naturalWidth: i.naturalWidth, width: i.width })),
      videos: [...document.querySelectorAll('video')].map(v => ({ src: v.currentSrc, top: v.getBoundingClientRect().top, ready: v.readyState, time: v.currentTime })) }))
    const result = { route, width, load, idleCapped, ...metrics, errors, requests: [...requests.values()].sort((a,b) => b.bytes-a.bytes) }
    results.push(result)
    console.log(JSON.stringify({ route, width, load, fcp: metrics.fcp, lcp: metrics.lcp, measuredAt: metrics.measuredAt, firstPlaying: metrics.firstPlaying, bytes: result.requests.reduce((s,r) => s+r.bytes, 0) }))
    await mkdir('claude-docs/perf-data/case-load', { recursive: true })
    await writeFile(`claude-docs/perf-data/case-load/${label}.json`, JSON.stringify(results, null, 2) + '\n')
    await context.close()
  }
} finally { await browser.close() }
