import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

// Preserve the full-resolution originals for case studies and future exports.
const directory = 'public/images/case-studies/nuance'
const clouds = `${directory}/fig-1-clouds.jpg`
for (const width of [800, 1200, 1760]) {
  // Lossless encoding avoids chroma shifts in the dark teal clouds.
  await sharp(clouds).resize(width).webp({ lossless: true, effort: 6 })
    .toFile(`${directory}/fig-1-clouds-${width}.webp`)
  await sharp(clouds).resize(width).jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
    .toFile(`${directory}/fig-1-clouds-${width}.jpg`)
}
for (const width of [820, 1350]) {
  await sharp(`${directory}/iphone-16-pro.png`).resize(width)
    .webp({ lossless: true, effort: 6 }).toFile(`${directory}/iphone-16-pro-${width}.webp`)
}
// Keep all source pixels; only change the poster encoding, not its dimensions.
await sharp('public/videos/posters/asl-feature.jpg').webp({ quality: 90, effort: 6 })
  .toFile('public/videos/posters/asl-feature.webp')

const prefix = '/images/case-studies/nuance/fig-1-clouds'
await writeFile('app/data/homepageClouds.json', JSON.stringify({
  src: `${prefix}-1200.jpg`,
  webp: [800, 1200, 1760].map(width => `${prefix}-${width}.webp ${width}w`).join(', '),
  jpeg: [800, 1200, 1760].map(width => `${prefix}-${width}.jpg ${width}w`).join(', '),
  // Covering a 3:4 card with this 3:2 image needs twice the card's width.
  sizes: '(min-width: 1516px) 1000px, (min-width: 1024px) 66vw, calc(200vw - 64px)',
}, null, 2) + '\n')
