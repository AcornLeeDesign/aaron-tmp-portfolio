import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'

const label = process.argv[2] ?? 'after'
const base = process.env.AUDIT_URL ?? 'http://127.0.0.1:3000'
const output = `claude-docs/perf-data/${label}`
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ args: ['--no-sandbox'] })
for (const route of ['doordash', 'homepage']) {
  for (const [device, viewport, dpr] of [
    ['desktop', { width: 1440, height: 900 }, 1],
    ['mobile', { width: 390, height: 844 }, 3],
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: dpr,
      isMobile: device === 'mobile', hasTouch: device === 'mobile' })
    const page = await context.newPage()
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.enable')
    const requests = new Map()
    const errors = []
    let peakDownloads = 0
    let peakVideoDownloads = 0
    const isMedia = r => /^(Image|Media)$/.test(r.type) || /\.(mp4|webm|jpg|png|webp|avif|svg|m4a)(\?|$)/.test(r.url)
    const isVideo = r => /\.(mp4|webm)(\?|$)/.test(r.url)
    cdp.on('Network.requestWillBeSent', e => {
      requests.set(e.requestId, { url: e.request.url, type: e.type, bytes: 0, pending: true })
      const pending = [...requests.values()].filter(r => r.pending && isMedia(r))
      peakDownloads = Math.max(peakDownloads, pending.length)
      peakVideoDownloads = Math.max(peakVideoDownloads, pending.filter(isVideo).length)
    })
    cdp.on('Network.responseReceived', e => {
      const r = requests.get(e.requestId)
      if (r) Object.assign(r, { type: e.type, status: e.response.status, mime: e.response.mimeType,
        cached: Boolean(e.response.fromDiskCache || e.response.fromServiceWorker) })
    })
    cdp.on('Network.dataReceived', e => {
      const r = requests.get(e.requestId)
      if (r) r.bytes += e.encodedDataLength
    })
    cdp.on('Network.loadingFinished', e => {
      const r = requests.get(e.requestId)
      if (r) Object.assign(r, { bytes: e.encodedDataLength, pending: false })
    })
    cdp.on('Network.loadingFailed', e => {
      const r = requests.get(e.requestId)
      if (r) Object.assign(r, { pending: false, failure: e.errorText })
    })
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(() => {
      window.__mediaSamples = []
      setInterval(() => {
        const videos = [...document.querySelectorAll('video')]
        window.__mediaSamples.push({ time: Math.round(performance.now()), y: Math.round(scrollY),
          mounted: videos.length,
          attached: videos.filter(v => v.querySelector('source')).length,
          playing: videos.filter(v => !v.paused).length,
          offscreenPlaying: videos.filter(v => { const r = v.getBoundingClientRect();
            return !v.paused && (r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth)
          }).length,
        })
      }, 100)
    })
    await page.goto(`${base}/${route === 'homepage' ? '' : route}`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)
    const totals = () => {
      const media = [...requests.values()].filter(isMedia)
      return { totalBytes: [...requests.values()].reduce((n, r) => n + r.bytes, 0), mediaBytes: media.reduce((n, r) => n + r.bytes, 0),
        videoBytes: media.filter(isVideo).reduce((n, r) => n + r.bytes, 0),
        imageBytes: media.filter(r => !isVideo(r)).reduce((n, r) => n + r.bytes, 0),
        requests: media.length }
    }
    const initial = totals()
    await page.screenshot({ path: `${output}/${route}-${device}-initial.png` })
    const mediaStates = new Map()
    const snapshot = async () => {
      const states = await page.evaluate(() => [...document.querySelectorAll('video, img, svg image')].map((el, i) => {
        const r = el.getBoundingClientRect()
        return { id: i, tag: el.tagName, src: el.currentSrc || el.getAttribute('src') || el.getAttribute('href'),
          sources: [...el.querySelectorAll('source')].map(s => ({ src: s.src, media: s.media, type: s.type })),
          poster: el.poster, preload: el.preload, paused: el.paused, readyState: el.readyState,
          width: el.videoWidth || el.naturalWidth, height: el.videoHeight || el.naturalHeight,
          renderedWidth: r.width, renderedHeight: r.height, loading: el.loading,
          visible: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth }
      }))
      for (const state of states) {
        const old = mediaStates.get(state.id)
        if (!old || state.visible || (!old.src && state.src)) mediaStates.set(state.id, state)
      }
    }
    await snapshot()
    // Small overlapping steps traverse the desktop scroll-driven carousel too.
    for (let step = 0; step < 160; step++) {
      const atBottom = await page.evaluate(stepSize => {
        const bottom = document.documentElement.scrollHeight - innerHeight
        if (scrollY >= bottom - 2) return true
        window.scrollTo({ top: Math.min(bottom, scrollY + stepSize), behavior: 'instant' })
        return false
      }, Math.round(viewport.height * 0.7))
      if (atBottom) break
      await page.waitForTimeout(1500)
      await snapshot()
    }
    // Include all five art-direction slides, not only the first visible slide.
    if (route === 'doordash') {
      const track = page.locator('.art-carousel__track')
      for (let i = 0; i < 5; i++) {
        await track.evaluate((el, index) => el.scrollTo({ left: el.children[index].offsetLeft - el.offsetLeft, behavior: 'instant' }), i)
        await page.waitForTimeout(1500)
        await snapshot()
      }
    }
    await page.waitForTimeout(5000)
    const fullScroll = totals()
    await page.screenshot({ path: `${output}/${route}-${device}-end.png` })
    // Release check is separate from transfer measurements.
    await page.waitForTimeout(31000)
    const samples = await page.evaluate(() => window.__mediaSamples)
    const result = { route, device, viewport, dpr, browser: browser.version(), initial, fullScroll,
      peakDownloads, peakVideoDownloads, peakPlaying: Math.max(...samples.map(s => s.playing)),
      peakAttached: Math.max(...samples.map(s => s.attached)), finalSample: samples.at(-1), errors,
      media: [...mediaStates.values()], requests: [...requests.values()].filter(isMedia), samples }
    await writeFile(`${output}/${route}-${device}.json`, `${JSON.stringify(result, null, 2)}\n`)
    console.log(JSON.stringify({ route, device, initial, fullScroll, peakDownloads, peakVideoDownloads,
      peakPlaying: result.peakPlaying, peakAttached: result.peakAttached, finalSample: result.finalSample, errors }))
    await context.close()
  }
}
await browser.close()
