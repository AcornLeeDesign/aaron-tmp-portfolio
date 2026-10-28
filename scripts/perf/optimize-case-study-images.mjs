// npm-installed sharp + system ffmpeg; originals remain untouched.
// Quality is measured against the original at the intended CSS display width.
import sharp from 'sharp'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, stat, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

// Candidate paths are overwritten while searching quality levels; don't reuse
// libvips' file-loader cache for an earlier encoding at the same path.
sharp.cache(false)

const copySizes = '(min-width: 640px) 600px, calc(100vw - 32px)'
const wideSizes = '(min-width: 1832px) 1800px, calc(100vw - 32px)'
const allJobs = [
  ['nova/computer-lab.jpg', [1200, 1800], 600, copySizes],
  ['nova/field-research-blurred.png', [800, 1200, 1800], 1200, copySizes],
  ['nova/figma/design-image-1-transparent.png', [640, 1254], 600, '(min-width: 640px) 230px, 60vw'],
  ['nova/nova-hardware.png', [920], 400, '(min-width: 640px) 400px, 60vw'],
  ['nova/oLkabsfhAzIBPjfCo4MF1C9NrqQ-transparent.png', [800, 1200, 1800], 1800, wideSizes],
  ['nova/u4vE6oS3396MmsZs0nLjVr396d8.png', [1200], 600, copySizes],
  ...['blue', 'pink'].map(color => [`nuance/avatar-listening-${color}.png`, [640, 1040], 520, '(min-width: 640px) 300px, 40vw']),
  // Account for object-fit: cover: the landscape Live Caption source is wider
  // than its visible phone column, so it needs a larger source than the box.
  ['nuance/captionmate-call-history.png', [640, 900], 300, '(min-width: 640px) 300px, 45vw'],
  ['nuance/innocaption-call-upscaled.png', [320, 640, 900], 200, '(min-width: 640px) 200px, 33vw'],
  ['nuance/live-caption-call-upscaled.png', [320, 640, 900], 430, '(min-width: 640px) 430px, 70vw'],
  ['nuance/mood-colors-clouds.jpg', [800, 1200, 1800], 1800, wideSizes],
  ...['printer-illustrations', 'status-actions'].map(name =>
    [`doordash/${name}.png`, [800, 1920], 1040, '(min-width: 1136px) 1040px, calc(100vw - 96px)']),
  ...[3, 4, 5, 7, 8].map(number => [`doordash/art-direction/render_${number}.png`,
    number === 5 ? [800, 1200, 1920] : [640, 960, 1440], number === 5 ? 960 : 640,
    number === 5 ? 'min(86.667svh, 80vw)' : 'min(52svh, 48vw)']),
]
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7).split(',')
const jobs = only ? allJobs.filter(([relative]) => only.includes(relative)) : allJobs
const temporary = await mkdtemp(join(tmpdir(), 'case-image-quality-'))
const verifyOnly = process.argv.includes('--verify')
const manifest = only ? JSON.parse(await readFile('app/data/caseStudyImages.json', 'utf8')) : {}
const previous = verifyOnly || only ? JSON.parse(await readFile('claude-docs/perf-data/case-study-image-quality.json', 'utf8')) : []
const results = only ? previous.filter(item => !only.includes(item.source.replace('public/images/case-studies/', ''))) : []

async function displaySsim(source, candidate, width, background, colorSpace = 'yuv444p') {
  for (const [name, file] of [['reference', source], ['candidate', candidate]]) {
    // Fully decode first: format-specific shrink-on-load can shift sampling and
    // dominate the metric even for a pixel-identical lossless WebP.
    const decoded = await sharp(file).raw().toBuffer({ resolveWithObject: true })
    await sharp(decoded.data, { raw: decoded.info }).resize(width).flatten({ background })
      .removeAlpha().png().toFile(join(temporary, `${name}.png`))
  }
  const comparison = spawnSync('ffmpeg', ['-hide_banner', '-threads', '1', '-i', join(temporary, 'reference.png'),
    '-threads', '1', '-i', join(temporary, 'candidate.png'), '-filter_complex_threads', '1',
    '-lavfi', `[0:v]format=${colorSpace}[a];[1:v]format=${colorSpace}[b];[a][b]ssim`, '-f', 'null', '-'], { encoding: 'utf8' })
  assert.equal(comparison.status, 0, comparison.stderr)
  const all = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1])
  const luminance = Number(comparison.stderr.match(/SSIM Y:([\d.]+)/)?.[1] ?? all)
  return Math.min(all, luminance)
}

try {
  for (const [relative, widths, display, sizes] of jobs) {
    const source = `public/images/case-studies/${relative}`
    const metadata = await sharp(source).metadata()
    const alpha = !(await sharp(source).stats()).isOpaque
    const fallback = alpha ? 'png' : 'jpeg'
    const variants = []
    for (const width of widths) {
      const displayWidth = Math.min(display, width)
      // This photograph is always center-cropped into the same wide frame in
      // nova.vue. Deliver only the visible crop, retaining the archival portrait.
      const cropHeight = relative === 'nova/computer-lab.jpg' ? Math.round(width * 933 / 2150) : undefined
      const pipeline = sharp(source).resize(width, cropHeight, { withoutEnlargement: true })
      const referencePng = await pipeline.clone().png().toBuffer()
      const reference = await sharp(referencePng).ensureAlpha().raw().toBuffer()
      const variant = { width, height: cropHeight ?? Math.round(metadata.height * width / metadata.width) }
      for (const format of ['webp', fallback]) {
        const extension = format === 'jpeg' ? 'jpg' : format
        const output = source.replace(/\.(png|jpg)$/, `-${width}.${extension}`)
        const prior = previous.find(item => item.output === output)
        let accepted
        // Text/alpha PNG fallbacks are exact; JPEG uses 4:4:4 to protect colored edges.
        const qualities = format === 'png' ? [null] : [90, 94, 97, 100, ...(format === 'webp' ? ['lossless'] : [])]
        for (const quality of verifyOnly ? [prior?.quality] : qualities) {
          assert.ok(!verifyOnly || prior, `Missing quality record: ${output}`)
          const lossless = format === 'png' || quality === 'lossless' || (verifyOnly && prior.lossless)
          const options = format === 'png' ? { compressionLevel: 9, palette: false }
            : format === 'jpeg' ? { quality, chromaSubsampling: '4:4:4' }
              : { quality: typeof quality === 'number' ? quality : undefined, lossless, alphaQuality: 100, effort: 6 }
          if (!verifyOnly) await sharp(referencePng)[format](options).toFile(output)
          const decoded = await sharp(output).ensureAlpha().raw().toBuffer()
          assert.equal(decoded.length, reference.length)
          // Alpha must remain exact even when RGB is lossy. Ignore invisible RGB.
          let identical = true
          for (let offset = 0; offset < reference.length; offset += 4) {
            assert.equal(decoded[offset + 3], reference[offset + 3], `Alpha changed: ${output}`)
            if (reference[offset + 3] === 0) continue
            for (let channel = 0; channel < 3; channel++) {
              if (reference[offset + channel] !== decoded[offset + channel]) identical = false
            }
          }
          if (lossless) assert.ok(identical, `Lossless pixels changed: ${output}`)
          const scores = []
          for (const background of alpha ? ['#080c0f', '#ffffff'] : ['#ffffff']) {
            scores.push(await displaySsim(referencePng, output, displayWidth, background))
          }
          const ssim = Math.min(...scores)
          if (ssim >= 0.99) {
            accepted = { source, output, width, height: variant.height, displayWidth, quality,
              lossless, resizedVisiblePixelsIdentical: identical, alphaPreserved: true,
              displaySsim: ssim, ssimColorSpace: 'yuv444p (minimum of Y and All)',
              displayRgbSsim: await displaySsim(referencePng, output, displayWidth, '#ffffff', 'gbrp'),
              sourceBytes: (await stat(source)).size, outputBytes: (await stat(output)).size }
            break
          }
          assert.ok(!verifyOnly, `SSIM ${ssim} rejected: ${output}`)
        }
        assert.ok(accepted, `Cannot meet SSIM >= 0.99: ${output}`)
        results.push(accepted)
        variant[format === 'webp' ? 'webp' : 'fallback'] = output.slice('public'.length)
        console.log(`${output}: ${accepted.outputBytes} bytes; q=${accepted.quality}; SSIM=${accepted.displaySsim}`)
      }
      variants.push(variant)
    }
    const middle = variants[Math.floor((variants.length - 1) / 2)]
    manifest[source.slice('public'.length)] = {
      src: middle.fallback, webpSrc: middle.webp, webp: variants.map(v => `${v.webp} ${v.width}w`).join(', '),
      fallback: variants.map(v => `${v.fallback} ${v.width}w`).join(', '),
      width: middle.width, height: middle.height, sizes,
    }
  }
  if (!verifyOnly) {
    const clouds = JSON.parse(await readFile('app/data/homepageClouds.json', 'utf8'))
    manifest['/images/case-studies/nuance/fig-1-clouds.jpg'] = {
      src: clouds.src, webpSrc: '/images/case-studies/nuance/fig-1-clouds-1200.webp',
      webp: clouds.webp, fallback: clouds.jpeg, width: 1200, height: 800,
      sizes: '(min-width: 1832px) 1800px, (min-width: 640px) calc(100vw - 32px), calc(200vw - 64px)',
    }
    manifest['/images/case-studies/nuance/iphone-16-pro.png'] = {
      src: '/images/case-studies/nuance/iphone-16-pro.png',
      webpSrc: '/images/case-studies/nuance/iphone-16-pro-820.webp',
      webp: '/images/case-studies/nuance/iphone-16-pro-820.webp 820w, /images/case-studies/nuance/iphone-16-pro-1350.webp 1350w',
      fallback: '', width: 1350, height: 2760,
      sizes: '(min-width: 1832px) 438px, (min-width: 640px) 25vw, 58vw',
    }
    await writeFile('app/data/caseStudyImages.json', JSON.stringify(manifest, null, 2) + '\n')
    await writeFile('claude-docs/perf-data/case-study-image-quality.json', JSON.stringify(results, null, 2) + '\n')
  }
} finally {
  await rm(temporary, { recursive: true, force: true })
}
