import assert from 'node:assert/strict'
import sharp from 'sharp'
import { mkdtemp, stat, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const temporary = await mkdtemp(join(tmpdir(), 'homepage-quality-'))
const directory = 'public/images/case-studies/nuance'
const comparisons = [
  ...[800, 1200, 1760].map((width, index) => ({
    source: `${directory}/fig-1-clouds.jpg`, output: `${directory}/fig-1-clouds-${width}.webp`,
    width, display: [[338, 451], [475, 634], [736, 981]][index], lossless: true,
  })),
  { source: `${directory}/iphone-16-pro.png`, output: `${directory}/iphone-16-pro-820.webp`,
    width: 820, display: [273, 558], lossless: true },
  { source: `${directory}/iphone-16-pro.png`, output: `${directory}/iphone-16-pro-1350.webp`,
    width: 1350, display: [422, 863], lossless: true },
  { source: 'public/videos/posters/asl-feature.jpg', output: 'public/videos/posters/asl-feature.webp',
    width: 2914, display: [1092, 713], lossless: false },
]
const results = []
try {
  for (const item of comparisons) {
    if (item.lossless) {
      const reference = await sharp(item.source).resize(item.width).ensureAlpha().raw().toBuffer()
      const candidate = await sharp(item.output).ensureAlpha().raw().toBuffer()
      assert.equal(candidate.length, reference.length)
      for (let offset = 0; offset < reference.length; offset += 4) {
        assert.equal(candidate[offset + 3], reference[offset + 3], `Alpha changed: ${item.output}`)
        // RGB under fully transparent pixels is invisible and WebP zeroes it.
        if (reference[offset + 3] === 0) continue
        for (let channel = 0; channel < 3; channel++) {
          assert.equal(candidate[offset + channel], reference[offset + channel], `RGB changed: ${item.output}`)
        }
      }
    }
    for (const [name, file] of [['reference', item.source], ['candidate', item.output]]) {
      await sharp(file).resize(...item.display, { fit: 'cover' }).flatten({ background: '#080c0f' })
        .png().toFile(join(temporary, `${name}.png`))
    }
    const comparison = spawnSync('ffmpeg', ['-hide_banner', '-i', join(temporary, 'reference.png'),
      '-i', join(temporary, 'candidate.png'), '-lavfi', 'ssim', '-f', 'null', '-'], { encoding: 'utf8' })
    assert.equal(comparison.status, 0, comparison.stderr)
    const ssim = Number(comparison.stderr.match(/All:([\d.]+)/)?.[1])
    assert.ok(ssim >= 0.98, `${item.output}: SSIM ${ssim}`)
    const metadata = await sharp(item.output).metadata()
    results.push({ ...item, sourceBytes: (await stat(item.source)).size,
      outputBytes: (await stat(item.output)).size, dimensions: [metadata.width, metadata.height],
      alpha: metadata.hasAlpha, resizedVisiblePixelsIdentical: item.lossless, displaySsim: ssim })
  }
  assert.ok(results.at(-1).outputBytes <= 61000)
  const output = 'claude-docs/perf-data/homepage-media-quality.json'
  await writeFile(output, JSON.stringify(results, null, 2) + '\n')
  console.log(results.map(item => `${item.output}: ${item.outputBytes} bytes; SSIM ${item.displaySsim}; lossless ${item.lossless}`).join('\n'))
} finally {
  await rm(temporary, { recursive: true, force: true })
}
