# Case-study image optimization

Implemented on `codex/media-combined`. No video files, encode logic, audio behavior, password gates, or production deployment changed.

## Delivery and sizes

19 referenced images now have responsive WebP plus JPEG/PNG fallbacks. The largest new WebPs total **2.77 MB**, versus **35.09 MB** for their previous default files (**92.1% less**). This compares one largest variant per image, not all files in the repository or a measured full-page transfer. Smaller screens generally select smaller candidates.

Sizes below are decimal KB. DoorDash's before column uses the previously served lossless WebP, not the larger archival PNG.

| Image | Before KB | Default WebP KB | Largest WebP KB |
| --- | ---: | ---: | ---: |
| nova/computer-lab.jpg | 8480.0 | 214.0 (1200px) | 415.8 (1800px) |
| nova/field-research-blurred.png | 2685.4 | 126.6 (1200px) | 142.5 (1800px) |
| nova/figma/design-image-1-transparent.png | 1242.7 | 46.5 (640px) | 109.7 (1254px) |
| nova/nova-hardware.png | 606.0 | 45.4 (920px) | 45.4 (920px) |
| nova/oLkabsfhAzIBPjfCo4MF1C9NrqQ-transparent.png | 601.7 | 51.7 (1200px) | 90.4 (1800px) |
| nova/u4vE6oS3396MmsZs0nLjVr396d8.png | 821.0 | 60.0 (1200px) | 60.0 (1200px) |
| nuance/avatar-listening-blue.png | 964.9 | 29.5 (640px) | 64.8 (1040px) |
| nuance/avatar-listening-pink.png | 842.4 | 28.5 (640px) | 61.0 (1040px) |
| nuance/captionmate-call-history.png | 541.3 | 32.6 (640px) | 50.8 (900px) |
| nuance/innocaption-call-upscaled.png | 1397.7 | 80.4 (640px) | 125.5 (900px) |
| nuance/live-caption-call-upscaled.png | 918.9 | 18.9 (640px) | 28.9 (900px) |
| nuance/mood-colors-clouds.jpg | 879.1 | 342.9 (1200px) | 612.7 (1800px) |
| doordash/printer-illustrations.png | 2476.2 | 40.3 (800px) | 357.2 (1920px) |
| doordash/status-actions.png | 1963.5 | 30.9 (800px) | 346.7 (1920px) |
| doordash/art-direction/render_3.png | 1858.0 | 26.2 (960px) | 45.1 (1440px) |
| doordash/art-direction/render_4.png | 2268.5 | 31.2 (960px) | 50.3 (1440px) |
| doordash/art-direction/render_5.png | 2250.1 | 38.0 (1200px) | 65.0 (1920px) |
| doordash/art-direction/render_7.png | 2130.3 | 26.0 (960px) | 42.8 (1440px) |
| doordash/art-direction/render_8.png | 2160.1 | 33.4 (960px) | 56.2 (1440px) |

Nova's computer-lab delivery is a center crop matching the existing 2150:933 CSS frame at every breakpoint; its untouched 4000×6000 portrait remains archival. The 1800px WebP is 416 KB and its JPEG fallback is 496 KB. The 1200px default is 214 KB WebP / 204 KB JPEG. No composition change is intended.

Nuance Fig 1 reuses existing 800/1200/1760 clouds: default WebP is 1200px (619 KB), JPEG fallback 1200px (605 KB); the 5723px original is absent from the rendered src/srcset. Both iPhone frames reuse 820/1350px lossless WebPs (72/164 KB), with the original 377 KB alpha PNG used only on failure. Competitor sizes account for the source area needed by object-fit: cover, including the landscape Live Caption screenshot.

Vue source URLs are manifest lookup keys, not fetched originals. `CaseStudyImage` emits derivative src/srcset and switches both to JPEG/PNG on unsupported/failed WebP. The img root preserves scoped layout styles. Native lazy loading is retained; previously deferred images withhold both src and srcset until the existing bounded observer fires. Mood clouds now use a deferred image behind the same phone/video composition.

## Quality verification

- All **92 generated files** pass **SSIM ≥ 0.99** at the recorded display width against the uncompressed, resized source/crop. FFmpeg compares YUV444 (no chroma subsampling); the gate takes the lower of luminance Y and combined All, and tests both white/dark backgrounds for transparency. Minimum: **0.990166**. This measures encoding quality after resizing, not pixel identity against the full-size source.
- RGB SSIM is also recorded transparently; its minimum is **0.963483**. Dark gradients/chroma can score lower in RGB. Browser comparisons against the original source supplement the numeric gate; they include resizing, object-fit cropping, and browser rasterization.
- Every alpha channel is byte-identical to the resized reference. Every PNG fallback and lossless WebP has identical visible RGBA pixels (RGB under fully transparent pixels is ignored). Two small WebPs remain lossless because lossy encodes missed the gate: InnoCaption 320px and Live Caption 320px. Minimum source widths were raised where browser review revealed softened fine detail; the desktop printer diagrams use the full 1920px source dimensions.
- Existing Fig 1/phone WebPs separately passed exact resized-pixel checks with `verify-homepage-image-quality.mjs`. Delivered-image screenshots were compared with originals at identical CSS geometry, with navigation/scroll blur hidden. No apparent degradation in text, silhouettes, photographic detail, or gradients at display size; browser screenshot SSIM is diagnostic rather than the encoding gate.

Reproduce with npm-installed Sharp and system FFmpeg:

`node scripts/perf/optimize-case-study-images.mjs` regenerates; `--verify` checks without writing assets; optional `--only=relative/path.png,...` limits regeneration.

`npm run build` passed. `npm test` passed (including video coordination, lazy loading, route access, desktop audio autoplay, and mobile silence). After correcting responsive intrinsic heights, the build, image audit, and case-loading regression were rerun. `AUDIT_URL=http://127.0.0.1:4301 node scripts/perf/verify-case-study-images.mjs` checks 390px/DPR2, 768px/DPR2, and 1440px/DPR1, WebP decode, bounded deferral, square avatars, no archival fetches, and forced JPEG/PNG fallback. Set `IMAGE_SCREENSHOTS=/tmp/case-study-image-review` for original/delivered captures.

Detailed evidence: [encoding metrics](perf-data/case-study-image-quality.json), [browser selections](perf-data/case-study-image-browser.json), [browser visual comparisons](perf-data/case-study-image-visual.json).

## Intentionally retained / limits

Unused Nova files and Nuance `problem-call-miscommunication.png` are unreferenced and unchanged. The three `app/assets/images/case-studies/nuance/` duplicates are unreferenced and SHA-256 identical to their public originals; they were left untouched. Originals and old lossless DoorDash files remain archival but are not selected by these displays.

Some exact-alpha PNG and high-quality JPEG fallback variants are larger than the original compressed file; their WebP primary paths are substantially smaller. Browser visual review covers the tested viewport sizes, not every possible display/DPR. No requested, referenced image was left on an oversized primary fetch path for failure to pass the quality gate.
