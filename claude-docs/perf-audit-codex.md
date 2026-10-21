# Media performance audit — Codex

Branch: `codex/media-performance-astra`. Baseline: `596990b` (see Git history for the exact parent if rebased). Local production build; no push or deployment.

## Method

- Cold, isolated headless Chromium contexts at **1440×900 / DPR 1** and **390×844 / DPR 3**, with mobile/touch emulation on the latter. Browser version is recorded in every JSON result. The same localhost production server, browser, viewport and scroll procedure were used before and after. No network or CPU throttling.
- Initial = navigation/network-idle plus five seconds, at scroll position zero. Full scroll = cumulative bytes after scrolling in overlapping 70%-viewport steps, waiting 1.5 seconds per step, visiting all five DoorDash art slides, then waiting five seconds. This measures a browsing session, not the sum of complete source file sizes. Long videos can remain partially downloaded. Results depend on scroll pace and browser buffering; these are observed runs, not a statistical benchmark.
- Chrome DevTools Protocol tracks `Image`/`Media` requests and media URL extensions, including CSS backgrounds, posters, SVGs, repeated range requests and partial canceled downloads. `Network.loadingFinished.encodedDataLength` supplies completed transfer bytes (including HTTP response overhead); `dataReceived.encodedDataLength` counts partial transfers. Cache hits contribute their observed wire bytes. Fonts, JS and CSS are excluded. **MB is decimal (1,000,000 bytes).**
- Playback/source counts are sampled every 100 ms. Outstanding download counts are CDP requests, not proof that every request is receiving bytes simultaneously. A separate 31-second tail observes source release; headline transfer totals exclude that tail. The raw request log is captured after the tail, so its sum can exceed the full-scroll checkpoint.
- `ffprobe` records every MP4, WebM and JPEG poster, including dimensions, average bitrate, codec, average frame rate, duration, byte size and SHA-256. VFR averages are not a frame-rate cap. Browser snapshots record selected `currentSrc`, preload, intrinsic/rendered dimensions and source media queries.
- Raw traces, media inventories, quality scores and screenshots: [`perf-data/`](perf-data/). Reproduction commands are below.

## DoorDash

Page: `app/pages/doordash.vue`.

### Before

| Viewport | Initial media bytes (MB) | After full scroll bytes (MB) | Full-scroll video / image MB | Peak playing / attached sources | Peak media / video requests |
|---|---:|---:|---:|---:|---:|
| desktop | 3,495,525 (3.50 MB) | 71,451,654 (71.45 MB) | 36.43 / 35.03 | 2 / 12 | 22 / 6 |
| mobile | 3,495,525 (3.50 MB) | 87,635,080 (87.64 MB) | 52.61 / 35.03 | 2 / 13 | 22 / 7 |

Findings:

- **Gate mismatch:** this branch’s custom `doordash.vue` renders its content directly and does not mount `CaseStudyGate`. The shared component accepts `case` and stores `case-study-unlocked=1`, but is not used here. The harness seeds that key and can submit the password if a gate is present. The audit did not add or remove a gate.
- Thirteen video elements mount immediately (twelve unique clips; `before.mp4` appears twice). Sources attach on coordinator demand; the video elements themselves stay mounted for layout. Playback is capped at one case-study clip, except the explicit two-clip comparison. Changing offscreen `preload` to `none` did not cancel already-started requests. Case-study sources remained attached for 30 seconds after leaving the extended observer range: up to 12 desktop / 13 mobile source sets were attached.
- All twelve unique JPEG posters were requested on initial load, along with both eager SVG-embedded alert screenshots. `preload="none"` does not defer a video poster. Initial media transfer was 3.50 MB even though no video was visible or downloaded.
- **Mobile selection:** Chromium selects the same H.264 MP4 URLs on desktop and mobile. There are no mobile source files or `<source media>` queries in this branch; this is not an ordering bug. MP4 precedes the VP9 WebM fallback. Full native resolution and VFR cadence are retained. Existing WebMs match MP4 dimensions, but many contain duplicated frames at 120 fps; they were not fetched by this Chromium run.
- The five art PNGs alone total 24.74 MB. The two large illustration/diagram PNGs add 6.59 MB. Text-bearing diagrams need sharp edges, so the implemented conversion is full-resolution lossless WebP. Original PNGs remain available as fallbacks.
- `loading="lazy"` already existed on regular images, but SVG `<image>` has no native lazy-loading behavior. Small SVG connectors and the device-shell SVG are retained. The table below compares each raster image with its observed rendered size; the mobile run uses DPR 3, so CSS pixels alone do not determine the required source resolution.

### After

| Viewport | Initial media bytes (MB) | After full scroll bytes (MB) | Initial / full-scroll reduction | Peak playing / attached sources | Peak media / video requests |
|---|---:|---:|---:|---:|---:|
| desktop | 43,827 (0.04 MB) | 69,439,299 (69.44 MB) | 98.7% / 2.8% | 2 / 4 | 8 / 3 |
| mobile | 43,827 (0.04 MB) | 57,710,543 (57.71 MB) | 98.7% / 34.1% | 2 / 3 | 8 / 3 |

The desktop full-scroll image transfer fell **35.03 → 18.22 MB**, while video transfer rose **36.43 → 51.22 MB** in the observed run. This offsets most of the image saving; it is not a claim of a large desktop total-byte reduction. On mobile, video transfer fell **52.61 → 39.49 MB** and image transfer fell **35.03 → 18.22 MB**. Earlier cancellation reduces competing requests, but the amount buffered during a fixed scroll session can vary.

Implemented:

- Posters attach only near the viewport or when the coordinator selects a clip. Alert SVG images are deferred until within 400px of the viewport.
- Idle players use `preload="none"` with no source children; selected/preparing players use `preload="auto"`. Video elements stay mounted (13 on DoorDash) to preserve layout, while source children unmount. Unfinished requests cancel immediately on deselection, and route unmount explicitly clears source URLs and calls `load()`.
- Only selected clips and, when there is spare capacity and the active clip is fully buffered, one upcoming case-study clip may load. Deselected unfinished downloads are canceled; complete deselected source sets release after 2.5 seconds. Two-clip comparison playback remains supported.
- Thirteen DoorDash raster images use full-resolution lossless WebP with PNG fallback. Intrinsic dimensions reserve image space. Video bytes, dimensions, codecs, timing, frame rates and posters are unchanged.

### Video file inventory (before and after unchanged)

Bitrate is the container average from ffprobe. MP4 = H.264; WebM = VP9. Full paths and pixel formats are in `media-before.json` / `media-after.json`.

| File under `/videos/` | Codec | Dimensions | Mbps | Average fps | Seconds | MB |
|---|---|---:|---:|---:|---:|---:|
| `doordash/before.mp4` | h264 | 3836×2110 | 4.777 | 49.57 | 7.653 | 4.57 |
| `doordash/before.webm` | vp9 | 3836×2110 | 1.521 | 60.00 | 7.650 | 1.45 |
| `doordash/iteration-banner.mp4` | h264 | 2998×1682 | 0.218 | 30.00 | 3.600 | 0.10 |
| `doordash/iteration-banner.webm` | vp9 | 2998×1682 | 0.210 | 30.00 | 3.600 | 0.09 |
| `doordash/iteration-toast.mp4` | h264 | 2998×1682 | 1.443 | 27.78 | 6.658 | 1.20 |
| `doordash/iteration-toast.webm` | vp9 | 2998×1682 | 0.694 | 120.00 | 6.667 | 0.58 |
| `doordash/legacy-feature-flag.mp4` | h264 | 3836×2110 | 5.850 | 50.56 | 24.902 | 18.21 |
| `doordash/legacy-feature-flag.webm` | vp9 | 3836×2110 | 1.438 | 60.00 | 24.916 | 4.48 |
| `doordash/prep-station.mp4` | h264 | 2740×1534 | 1.971 | 43.66 | 40.358 | 9.94 |
| `doordash/prep-station.webm` | vp9 | 2740×1534 | 0.720 | 120.00 | 40.358 | 3.63 |
| `doordash/printer-setup.mp4` | h264 | 2740×1534 | 1.853 | 42.79 | 33.883 | 7.85 |
| `doordash/printer-setup.webm` | vp9 | 2740×1534 | 0.639 | 120.00 | 33.884 | 2.71 |
| `doordash/printer-types.mp4` | h264 | 2726×1532 | 4.308 | 57.73 | 25.358 | 13.66 |
| `doordash/printer-types.webm` | vp9 | 2726×1532 | 1.248 | 120.00 | 25.359 | 3.95 |
| `doordash/select-printer.mp4` | h264 | 2540×1430 | 3.674 | 57.66 | 19.233 | 8.83 |
| `doordash/select-printer.webm` | vp9 | 2540×1430 | 1.015 | 120.00 | 19.234 | 2.44 |
| `doordash/status-bar-entry.mp4` | h264 | 2726×1532 | 4.502 | 57.64 | 20.333 | 11.44 |
| `doordash/status-bar-entry.webm` | vp9 | 2726×1532 | 1.477 | 120.00 | 20.334 | 3.75 |
| `doordash/status-bar.mp4` | h264 | 2910×1802 | 2.986 | 44.07 | 44.408 | 16.57 |
| `doordash/status-bar.webm` | vp9 | 2910×1802 | 0.725 | 120.00 | 44.408 | 4.03 |
| `doordash/status-logic-doc.mp4` | h264 | 2540×1716 | 7.643 | 51.29 | 29.153 | 27.85 |
| `doordash/status-logic-doc.webm` | vp9 | 2540×1716 | 1.493 | 120.00 | 29.150 | 5.44 |
| `doordash/toast-entry.mp4` | h264 | 2726×1532 | 5.040 | 57.72 | 16.683 | 10.51 |
| `doordash/toast-entry.webm` | vp9 | 2726×1532 | 1.584 | 120.00 | 16.684 | 3.30 |

### Posters (original JPEGs retained; now lazy)

| Poster under `/videos/posters/` | Dimensions | Bytes |
|---|---:|---:|
| `doordash/before.jpg` | 3836×2110 | 323,879 |
| `doordash/iteration-banner.jpg` | 2998×1682 | 123,703 |
| `doordash/iteration-toast.jpg` | 2998×1682 | 180,942 |
| `doordash/legacy-feature-flag.jpg` | 3836×2110 | 323,616 |
| `doordash/prep-station.jpg` | 2740×1534 | 122,565 |
| `doordash/printer-setup.jpg` | 2740×1534 | 159,173 |
| `doordash/printer-types.jpg` | 2726×1532 | 152,262 |
| `doordash/select-printer.jpg` | 2540×1430 | 204,811 |
| `doordash/status-bar-entry.jpg` | 2726×1532 | 219,015 |
| `doordash/status-bar.jpg` | 2910×1802 | 212,501 |
| `doordash/status-logic-doc.jpg` | 2540×1716 | 276,895 |
| `doordash/toast-entry.jpg` | 2726×1532 | 222,007 |

### Raster image size versus rendered size

Rendered sizes are CSS pixels from the baseline browser snapshots. Backgrounds fill/crop their card; SVG alert image bounds are the inner SVG image bounds, which are additionally cropped by the existing viewBox. Full-size lossless replacements keep the source dimensions.

| Source | Intrinsic | Bytes before | Desktop rendered | Mobile rendered |
|---|---:|---:|---:|---:|
| `/images/case-studies/doordash/alert-after.png` | 2758×1913 | 536,232 | 666×462 | 296×205 |
| `/images/case-studies/doordash/alert-before.png` | 2758×1913 | 390,711 | 651×462 | 289×205 |
| `/images/case-studies/doordash/flow-adapted-detail.png` | 1629×454 | 37,347 | 900×251 | 310×86 |
| `/images/case-studies/doordash/flow-ideal-detail.png` | 1629×325 | 30,382 | 900×180 | 310×62 |
| `/images/case-studies/doordash/handheld-status-bar.png` | 435×600 | 118,917 | 279×384 | 262×361 |
| `/images/case-studies/doordash/hardware-icons.png` | 443×195 | 13,047 | 279×123 | 262×115 |
| `/images/case-studies/doordash/printer-illustrations.png` | 1920×1080 | 3,569,454 | 1040×585 | 310×174 |
| `/images/case-studies/doordash/status-actions.png` | 1920×1080 | 3,019,904 | 1040×585 | 310×174 |
| `/images/case-studies/doordash/art-direction/render_3.png` | 2160×2700 | 4,162,970 | 468×585 | 187×234 |
| `/images/case-studies/doordash/art-direction/render_4.png` | 2160×2700 | 5,470,966 | 468×585 | 187×234 |
| `/images/case-studies/doordash/art-direction/render_5.png` | 2560×1920 | 5,046,257 | 780×585 | 312×234 |
| `/images/case-studies/doordash/art-direction/render_7.png` | 2160×2700 | 4,988,078 | 468×585 | 187×234 |
| `/images/case-studies/doordash/art-direction/render_8.png` | 2160×2700 | 5,070,709 | 468×585 | 187×234 |

## Homepage

Page: `app/pages/index.vue`.

### Before

| Viewport | Initial media bytes (MB) | After full scroll bytes (MB) | Full-scroll video / image MB | Peak playing / attached sources | Peak media / video requests |
|---|---:|---:|---:|---:|---:|
| desktop | 5,769,898 (5.77 MB) | 17,918,854 (17.92 MB) | 9.12 / 8.80 | 2 / 5 | 18 / 1 |
| mobile | 2,932,205 (2.93 MB) | 14,599,726 (14.60 MB) | 9.12 / 5.48 | 2 / 6 | 18 / 2 |

Findings:

- Ten video elements mount immediately. Before the fix, the source observer loaded metadata for clips inside `200px 75%` margins, including cards well beyond the visible horizontal carousel. Playback was limited to two, but up to five desktop / six mobile source sets stayed attached. Complete offscreen source sets were released after 2.5 seconds outside that wide range.
- All ten JPEG posters were eager. Decorative desktop background URLs were assigned to every card immediately. The 5723×3815 cloud background alone is 1.78 MB; several other backgrounds are 1600px wide. Mobile CSS hides these backgrounds, so many are not fetched on mobile, but the eager phone-frame PNG and posters still added avoidable work.
- **Mobile selection:** the same MP4s are selected on both viewports; there are no mobile-specific sources or source media conditions. Nova remains 1588×1288 at 60 fps, and ASL retains its 2914×1902 VFR recording. The existing thumbnail encodes and WebM fallbacks were not changed.
- The desktop uses the scroll-driven horizontal carousel; at tablet/mobile widths (≤1023px), it is a normal single-column list. The audit traverses both via vertical scrolling and retains this behavior.
- Watch is a 3.23 MB PNG; Haven and eVTOL add 1.27 MB. These images are now full-resolution lossless WebP with original PNG fallback. Large source-to-render ratios are documented below; downscaling was deliberately avoided to preserve high-DPR and cropped presentations.

### After

| Viewport | Initial media bytes (MB) | After full scroll bytes (MB) | Initial / full-scroll reduction | Peak playing / attached sources | Peak media / video requests |
|---|---:|---:|---:|---:|---:|
| desktop | 3,804,607 (3.80 MB) | 15,657,806 (15.66 MB) | 34.1% / 12.6% | 2 / 4 | 7 / 1 |
| mobile | 1,919,472 (1.92 MB) | 11,961,885 (11.96 MB) | 34.5% / 18.1% | 2 / 4 | 7 / 2 |

Implemented:

- Idle players use `preload="none"`; selected visible clips use `preload="auto"` (previously nearby clips used `metadata`). All ten video nodes remain for layout; source children detach offscreen, and route unmount clears URLs and aborts media loading.
- Poster proximity is reduced to 200px on all sides, and video sources attach only for the coordinator’s selected visible clips. The two-playing-video cap remains.
- Background URLs are assigned only to cards within 400px. Mobile still hides decorative backgrounds. The phone-frame PNG now uses native lazy loading.
- Four project images use full-resolution lossless WebP with PNG fallback and intrinsic dimensions. Existing video files and frame rates are unchanged.

### Video file inventory (before and after unchanged)

Bitrate is the container average from ffprobe. MP4 = H.264; WebM = VP9. Full paths and pixel formats are in `media-before.json` / `media-after.json`.

| File under `/videos/` | Codec | Dimensions | Mbps | Average fps | Seconds | MB |
|---|---|---:|---:|---:|---:|---:|
| `asl-feature.mp4` | h264 | 2914×1902 | 1.258 | 51.52 | 9.317 | 1.46 |
| `asl-feature.webm` | vp9 | 2914×1902 | 1.044 | 60.00 | 9.317 | 1.22 |
| `chewsy_createsc.mp4` | h264 | 1440×896 | 0.271 | 30.00 | 8.733 | 0.30 |
| `chewsy_createsc.webm` | vp9 | 1440×896 | 0.372 | 30.00 | 8.733 | 0.41 |
| `fleetline.mp4` | h264 | 1080×744 | 0.163 | 30.00 | 34.400 | 0.70 |
| `fleetline.webm` | vp9 | 1080×744 | 0.297 | 30.00 | 34.400 | 1.28 |
| `gameboy.mp4` | h264 | 1080×1472 | 0.342 | 30.00 | 13.800 | 0.59 |
| `gameboy.webm` | vp9 | 1080×1472 | 0.841 | 30.00 | 13.800 | 1.45 |
| `haven_3d.mp4` | h264 | 1080×1920 | 2.285 | 24.00 | 8.333 | 2.38 |
| `haven_3d.webm` | vp9 | 1080×1920 | 1.205 | 24.00 | 8.334 | 1.25 |
| `manta.mp4` | h264 | 1080×642 | 0.373 | 30.00 | 21.433 | 1.00 |
| `manta.webm` | vp9 | 1080×642 | 0.887 | 30.00 | 21.433 | 2.38 |
| `nova_practice_V.mp4` | h264 | 1588×1288 | 1.080 | 60.00 | 8.367 | 1.13 |
| `nova_practice_V.webm` | vp9 | 1588×1288 | 1.971 | 60.00 | 8.367 | 2.06 |
| `pen.mp4` | h264 | 1080×534 | 0.058 | 30.00 | 7.733 | 0.06 |
| `pen.webm` | vp9 | 1080×534 | 0.089 | 30.00 | 7.733 | 0.09 |
| `rabbithole.mp4` | h264 | 1200×778 | 0.458 | 30.00 | 23.967 | 1.37 |
| `rabbithole.webm` | vp9 | 1200×778 | 0.564 | 30.00 | 23.966 | 1.69 |
| `wiggle.mp4` | h264 | 1080×622 | 0.080 | 30.00 | 12.233 | 0.12 |
| `wiggle.webm` | vp9 | 1080×622 | 0.160 | 30.00 | 12.233 | 0.25 |

### Posters (original JPEGs retained; now lazy)

| Poster under `/videos/posters/` | Dimensions | Bytes |
|---|---:|---:|
| `asl-feature.jpg` | 2914×1902 | 133,245 |
| `chewsy_createsc.jpg` | 1440×896 | 52,022 |
| `fleetline.jpg` | 1080×744 | 89,464 |
| `gameboy.jpg` | 1080×1472 | 52,699 |
| `haven_3d.jpg` | 720×1280 | 12,844 |
| `manta.jpg` | 1080×642 | 12,397 |
| `nova_practice_V.jpg` | 1588×1288 | 125,092 |
| `pen.jpg` | 1080×534 | 8,689 |
| `rabbithole.jpg` | 1200×778 | 31,627 |
| `wiggle.jpg` | 1080×622 | 22,726 |

### Raster image size versus rendered size

Rendered sizes are CSS pixels from the baseline browser snapshots. Backgrounds fill/crop their card; SVG alert image bounds are the inner SVG image bounds, which are additionally cropped by the existing viewBox. Full-size lossless replacements keep the source dimensions.

| Source | Intrinsic | Bytes before | Desktop rendered | Mobile rendered |
|---|---:|---:|---:|---:|
| `/images/doordash.png` | 1024×607 | 26,264 | 554×328 | 358×212 |
| `/images/evtol.png` | 3274×1454 | 790,316 | 554×246 | 358×159 |
| `/images/haven.png` | 1678×1080 | 481,194 | 586×377 | 358×230 |
| `/images/watch_3_4_view.png` | 1920×1080 | 3,225,778 | 554×311 | 358×201 |
| `/images/home/media-backgrounds/evtol.jpg` | 1600×685 | 90,040 | background | not fetched |
| `/images/home/media-backgrounds/fleetline.jpg` | 1600×900 | 179,236 | background | not fetched |
| `/images/home/media-backgrounds/haven-video.jpg` | 1600×900 | 200,498 | background | not fetched |
| `/images/home/media-backgrounds/manta.jpg` | 1600×900 | 176,736 | background | not fetched |
| `/images/home/media-backgrounds/nova.jpg` | 1600×900 | 352,940 | background | not fetched |
| `/images/home/media-backgrounds/watch.jpg` | 1600×900 | 539,511 | background | not fetched |
| `/images/case-studies/nuance/fig-1-clouds.jpg` | 5723×3815 | 1,778,472 | background | not fetched |
| `/images/case-studies/nuance/iphone-16-pro.png` | 1350×2760 | 376,552 | 273×558 | 0×0 |

## Quality verification

**No video was re-encoded, downscaled, remuxed or frame-rate converted.** All delivered MP4s, WebMs and existing JPEG posters retain their original SHA-256 hashes. Thus their source pixels and cadence are unchanged, including 60-fps desktop recordings. No new mobile downscale or lower-quality fallback was introduced.

Each new WebP is full-resolution and lossless. The generation script requires exact decoded RGBA equality using Sharp and independently runs ffmpeg SSIM in planar RGB+alpha. It rejects SSIM below 0.98, unequal RGBA pixels, or files with no size saving. The installed ffmpeg has `ssim` but **no `libvmaf`**; `vmafmotion` is not VMAF. VMAF scores are therefore unavailable, not inferred. The smallest SSIM is 0.999917 for eVTOL despite exact RGBA equality in Sharp; ffmpeg’s two decoder/color paths differ slightly. All other delivered conversions score 1.0.

A trial conversion of the transparent phone-frame PNG changed RGB values under transparent pixels and failed the stricter exact-RGBA check. It was rejected and deleted; the original PNG is still served. No generated lossy video or image candidate is shipped.

Total for the 17 converted source images: **36,978,526 (36.98 MB) → 17,907,566 (17.91 MB)**, saving **19.07 MB** without removing pixels.

| Source filename | Original bytes | WebP bytes | ffmpeg SSIM | Exact RGBA |
|---|---:|---:|---:|---|
| `doordash.png` | 26,264 | 11,106 | 1.000000 | yes |
| `evtol.png` | 790,316 | 246,378 | 0.999917 | yes |
| `haven.png` | 481,194 | 270,132 | 1.000000 | yes |
| `watch_3_4_view.png` | 3,225,778 | 1,734,884 | 1.000000 | yes |
| `alert-after.png` | 536,232 | 257,724 | 1.000000 | yes |
| `alert-before.png` | 390,711 | 181,948 | 1.000000 | yes |
| `flow-adapted-detail.png` | 37,347 | 12,902 | 1.000000 | yes |
| `flow-ideal-detail.png` | 30,382 | 11,130 | 1.000000 | yes |
| `handheld-status-bar.png` | 118,917 | 68,828 | 1.000000 | yes |
| `hardware-icons.png` | 13,047 | 5,798 | 1.000000 | yes |
| `printer-illustrations.png` | 3,569,454 | 2,476,206 | 1.000000 | yes |
| `status-actions.png` | 3,019,904 | 1,963,546 | 1.000000 | yes |
| `render_3.png` | 4,162,970 | 1,858,044 | 1.000000 | yes |
| `render_4.png` | 5,470,966 | 2,268,470 | 1.000000 | yes |
| `render_5.png` | 5,046,257 | 2,250,072 | 1.000000 | yes |
| `render_7.png` | 4,988,078 | 2,130,322 | 1.000000 | yes |
| `render_8.png` | 5,070,709 | 2,160,076 | 1.000000 | yes |

## Reproduce

Use npm only. `ffprobe` / `ffmpeg` are required for the inventory and quality checks. In this restricted workspace npm’s cache and Playwright’s browser cache are placed in `/tmp`.

```sh
npm install --cache /tmp/portfolio-npm-cache
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright npx --cache /tmp/portfolio-npm-cache playwright install chromium
npm run build
node .output/server/index.mjs
# In another terminal:
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/audit.mjs after
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/visuals.mjs after
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/verify.mjs
python3 scripts/perf/inventory.py after
node scripts/perf/optimize-images.mjs
```

## Validation and remaining limits

- `npm install` completed using the writable cache. Both baseline and changed production builds passed `npm run build`.
- Automated behavior checks passed (`scripts/perf/verify.mjs`, results in `perf-data/verification.json`): lazy posters, mobile source/playback, offscreen release, scroll-back playback, SPA unmount cleanup, case-study startup buffering, SVG lazy loading, PNG fallback including pre-hydration failure, unchanged media hashes, and the 640/1023/1024px layout thresholds. Screenshot checks: five of six element captures are pixel-identical. The desktop illustration capture differs only where the baseline overlaps the fixed bottom blur/navigation; the unobscured artwork region is pixel-identical. Details: `perf-data/visual-comparison.json`.
- All eight baseline/after browser traces recorded zero JavaScript page errors; every run stayed at or below two playing videos.
- No source footage is altered; adding mobile downscales or new video encodes is deliberately deferred because this pass achieves savings without any video-quality tradeoff. Full-resolution images remain oversized for some rendered widths; lossless compression is the chosen safe reduction.
- No Safari/Firefox run, throttled cellular benchmark, or Core Web Vitals claim is included. Transfer numbers represent the specified Chromium scroll sessions. VMAF is unavailable in the installed ffmpeg.
- npm reported an existing engine warning (`rollup-plugin-visualizer` wants Node ≥22; runner uses Node 20.19.2) and 32 dependency advisories during installation. The build also emitted existing Browserslist-data and module-preload sourcemap warnings. The production build succeeded; dependency security upgrades are outside this media change.
- No push or deployment performed.
