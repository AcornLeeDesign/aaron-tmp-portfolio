// Reversible, full-resolution lossless conversions. Originals remain the fallback.
import sharp from 'sharp'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'

const inventory = JSON.parse(await readFile('claude-docs/perf-data/images-before.json', 'utf8'))
const names = new Set(['doordash', 'haven', 'evtol', 'watch_3_4_view',
  'alert-before', 'alert-after', 'flow-ideal-detail', 'flow-adapted-detail',
  'handheld-status-bar', 'hardware-icons', 'printer-illustrations', 'status-actions',
  'render_3', 'render_4', 'render_5', 'render_7', 'render_8'])
const manifest = {}
const metrics = []
for (const item of inventory) {
  if (!names.has(item.path.split('/').at(-1).replace(/\.png$/, ''))) continue
  const input = `public${item.path}`
  const path = item.path.replace(/\.png$/, '.lossless.webp')
  const output = `public${path}`
  await sharp(input).webp({ lossless: true, effort: 6 }).toFile(output)
  // Exact RGBA comparison catches alpha/color changes that SSIM alone can miss.
  const original = await sharp(input).ensureAlpha().raw().toBuffer()
  const encoded = await sharp(output).ensureAlpha().raw().toBuffer()
  if (!original.equals(encoded)) throw new Error(`Pixel mismatch: ${input}`)
  const result = spawnSync('ffmpeg', ['-hide_banner', '-i', input, '-i', output,
    '-filter_complex', '[0:v]format=gbrap[a];[1:v]format=gbrap[b];[a][b]ssim',
    '-frames:v', '1', '-f', 'null', '-'], { encoding: 'utf8' })
  const ssim = Number(result.stderr.match(/All:([\d.]+)/)?.[1])
  if (result.status !== 0 || !(ssim >= 0.98)) throw new Error(`SSIM rejected: ${input}\n${result.stderr}`)
  const bytes = (await stat(output)).size
  if (bytes >= item.bytes) throw new Error(`No saving: ${input}`)
  manifest[item.path] = { src: path, width: item.width, height: item.height }
  metrics.push({ source: item.path, output: path, width: item.width, height: item.height,
    sourceBytes: item.bytes, outputBytes: bytes, ssim, rgbaIdentical: true })
  console.log(`${item.path}: ${item.bytes} -> ${bytes}; SSIM ${ssim}`)
}
await writeFile('app/data/losslessImages.json', `${JSON.stringify(manifest, null, 2)}\n`)
await writeFile('claude-docs/perf-data/image-quality.json', `${JSON.stringify(metrics, null, 2)}\n`)
