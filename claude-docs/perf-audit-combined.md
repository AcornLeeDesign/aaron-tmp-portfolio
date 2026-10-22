# Combined media performance audit

Local work on `codex/media-combined`. No push, deployment, PR, or login was performed. No GitHub/Vercel login is required for the completed local work. Production CDN behavior was not remotely measured.

## Changes

- Preserved the earlier lossless WebP assets, image fallbacks, lazy images/posters, and immediate cancellation of unfinished deselected video requests.
- Integrated the cursor branch’s JS rendition selection, coordinator-aware release, and immutable `/videos/**` headers. Mobile uses the 1280px-or-smaller rendition at ≤639px; tablet and desktop use the desktop rendition. All 42 clips have both paths.
- One playing video across every viewport, including comparison pairs. A selected clip cannot be released by a stale timer; only the nearest upcoming case-study clip may preload after the current clip finishes buffering. Completed deselected buffers release after 2.5 seconds; unmount clears URLs and cancels requests.
- Deleted the gate component, storage state, runtime setting, content-package field, and stale access documentation. DoorDash, Nova, and Nuance open directly in fresh production sessions and have public homepage links.
- Replaced WebM delivery with H.264 MP4. Preserved source backups locally and excluded `public/videos/originals/` from production assets.

## Measurement method

All four variants were built with `npm run build` and served locally from production output. The three comparison variants used detached Git worktrees at `/tmp/portfolio-main`, `/tmp/portfolio-cursor`, and `/tmp/portfolio-astra`. The same `scripts/perf/audit.mjs` measured every variant.

Each page/device gets a fresh Chromium context: desktop 1440×900 DPR 1; mobile 390×844 DPR 3 with touch/mobile emulation. Page-open bytes are sampled 5 seconds after network idle. Full-scroll bytes are cumulative, using overlapping 70%-viewport steps with 1.5-second waits, five DoorDash art-carousel slides, and a final 5-second wait. A further 31-second release observation is excluded from transfer totals. CDP counts encoded bytes, including partial cancelled transfers; no network throttling is applied. Total bytes include HTML, JS, CSS, fonts and media. Media-only totals are also provided.

These are single local runs, not production/CDN or statistical latency claims. Playback and cancellation timing can change byte counts; smaller files do not automatically imply fewer bytes for this fixed traversal. External font requests were handled identically. Raw request logs, samples, browser versions and screenshots are in the linked data directories.

| Variant | Revision | Raw data |
|---|---|---|
| `main` | `596990b` | [Measurements](perf-data/combined-main/) |
| `origin/cursor/case-study-video-performance-6604` | `ce42f0c` | [Measurements](perf-data/combined-cursor/) |
| `codex/media-performance-astra` | `cb6e854` | [Measurements](perf-data/combined-astra/) |
| `codex/media-combined` | `407f315` | [Measurements](perf-data/combined-combined/) |

## Per-page transferred bytes

Each cell is **page-open / full-scroll MiB** (1 MiB = 1,048,576 bytes).

| Page / viewport | main | cursor video work | earlier image work | combined |
|---|---:|---:|---:|---:|
| doordash-desktop | 3.85 / 105.04 | 1.44 / 65.50 | 0.56 / 79.57 | 0.56 / 57.21 |
| doordash-mobile | 3.85 / 80.95 | 1.44 / 43.73 | 0.56 / 54.26 | 0.56 / 39.57 |
| homepage-desktop | 6.03 / 17.64 | 5.99 / 17.61 | 4.16 / 15.49 | 5.08 / 15.18 |
| homepage-mobile | 3.32 / 14.48 | 2.32 / 12.28 | 2.36 / 11.97 | 2.05 / 11.48 |

Full-scroll transfer versus main: doordash-desktop 45.5% lower; doordash-mobile 51.1% lower; homepage-desktop 14.0% lower; homepage-mobile 20.7% lower.

Homepage desktop page-open increases from 4.16 MiB on the image-only branch to 5.08 MiB combined: the requested 2000k desktop ASL encode is larger than its previous compressed source. Full-scroll transfer is shown separately above.

Media-only transfer (same page-open / full-scroll MiB):

| Page / viewport | main | cursor video work | earlier image work | combined |
|---|---:|---:|---:|---:|
| doordash-desktop | 3.33 / 104.53 | 0.93 / 64.99 | 0.04 / 79.05 | 0.04 / 56.69 |
| doordash-mobile | 3.33 / 80.43 | 0.93 / 43.21 | 0.04 / 53.74 | 0.04 / 39.05 |
| homepage-desktop | 5.50 / 17.09 | 5.46 / 17.05 | 3.63 / 14.93 | 4.55 / 14.62 |
| homepage-mobile | 2.80 / 13.92 | 1.79 / 11.72 | 1.83 / 11.41 | 1.52 / 10.93 |

Peak simultaneously playing videos:

| Page / viewport | main | cursor | image work | combined |
|---|---:|---:|---:|---:|
| doordash-desktop | 2 | 2 | 2 | 1 |
| doordash-mobile | 2 | 2 | 2 | 1 |
| homepage-desktop | 2 | 2 | 2 | 1 |
| homepage-mobile | 2 | 1 | 2 | 1 |

## Encoding and quality

Every clip was tested with the requested two-pass libx264 recipe: slow preset, High profile, Level 4.2, yuv420p, square pixels, even aspect-preserving dimensions, faststart, no audio, and `qcomp=0.5:aq-mode=2:aq-strength=0.8:bframes=2:b-adapt=2:b-pyramid=none`. Desktop targets 2000k / maxrate 3000k / buffer 6000k; mobile targets 1000k / maxrate 2000k / buffer 4000k. Tall desktop clips are slightly narrower than 1920px to respect Level 4.2’s 8704 macroblocks/frame limit. No source is upscaled.

Best available local exports are documented in [video-sources.json](../scripts/perf/video-sources.json). No uncompressed masters were available in this checkout or local history. Four earlier 60fps artwork exports (Gameboy, Manta, Pen, Wiggle) replace later 30fps derivatives. All other sources come from the original main revision, avoiding the cursor branch’s re-encoded generations. The sources can be restored from Git by the batch driver.

`-fps_mode passthrough` and the source timebase preserve all source frames. The recordings average ≤60fps, although some have nominal 120fps metadata and short VFR bursts; those timestamps are preserved rather than dropping or duplicating frames. The duration helper preserves the final held frame in both presentation and decode order. The missed-call source has its final PTS exactly at its declared end; the MP4 helper preserves its zero-duration final frame by adjusting only the last sample duration and chunk offsets, without clipping the edit list.

All **84 outputs / 42 sources** pass: minimum SSIM **0.990614**, identical decoded frame counts, maximum presentation-timestamp delta **0.000000s**, maximum stream-duration delta **0.000325s**. SSIM compares every decoded frame with the source scaled to output dimensions. No bitrate increases above the target were needed. VMAF is **unavailable**: this FFmpeg build has `ssim` but no `libvmaf` (the `vmafmotion` filter is not VMAF quality scoring).

Native-pixel text crops at 20%, 50%, and 80% were reviewed for status-logic-doc, printer-types, Nova walkthrough, and transcript, in both renditions. Source is on the left and delivery on the right in [review sheets](perf-data/video-review/). No additional text blur was observed relative to the scaled source; status-logic-doc passed without retaining the full-size delivery. This is sampled visual review plus exhaustive SSIM, not a claim of mathematically lossless lossy encoding.

### Per-video size and SSIM

Each rendition cell lists dimensions, MiB, and SSIM. VMAF is unavailable for every row. Detailed per-output frame counts, duration comparisons, bitrate attempts, provenance, and hashes are in [quality records](perf-data/combined-video-quality/).

| Video | Source MiB | Desktop: dimensions · MiB · SSIM | Mobile: dimensions · MiB · SSIM |
|---|---:|---|---|
| `asl-feature.mp4` | 1.40 | 1840×1200 · 2.32 · 0.999567 | 1280×836 · 1.18 · 0.999483 |
| `chewsy_createsc.mp4` | 0.28 | 1440×896 · 0.28 · 1.000000 | 1280×796 · 1.05 · 0.999622 |
| `doordash/before.mp4` | 4.36 | 1920×1056 · 1.69 · 0.999940 | 1280×704 · 0.86 · 0.999823 |
| `doordash/guide.mp4` | 8.96 | 1920×1080 · 4.37 · 0.999416 | 1280×720 · 2.24 · 0.999186 |
| `doordash/iteration-banner.mp4` | 0.09 | 1920×1078 · 0.24 · 0.999995 | 1280×718 · 0.12 · 0.999991 |
| `doordash/iteration-toast.mp4` | 1.15 | 1920×1078 · 0.81 · 0.999944 | 1280×718 · 0.36 · 0.999915 |
| `doordash/legacy-feature-flag.mp4` | 17.37 | 1920×1056 · 6.04 · 0.999975 | 1280×704 · 3.37 · 0.999954 |
| `doordash/prep-station.mp4` | 9.48 | 1920×1074 · 9.72 · 0.999961 | 1280×716 · 5.22 · 0.999944 |
| `doordash/printer-setup.mp4` | 7.48 | 1920×1074 · 8.43 · 0.999962 | 1280×716 · 4.54 · 0.999945 |
| `doordash/printer-types.mp4` | 13.02 | 1920×1080 · 6.42 · 0.999803 | 1280×720 · 3.28 · 0.999689 |
| `doordash/select-printer.mp4` | 8.42 | 1920×1080 · 4.82 · 0.999769 | 1280×720 · 2.46 · 0.999707 |
| `doordash/status-bar-entry.mp4` | 10.91 | 1920×1080 · 5.00 · 0.999783 | 1280×720 · 2.58 · 0.999684 |
| `doordash/status-bar.mp4` | 15.81 | 1886×1168 · 10.89 · 0.999969 | 1280×792 · 5.76 · 0.999956 |
| `doordash/status-footer.mp4` | 5.94 | 1920×1074 · 4.57 · 0.999864 | 1280×716 · 2.32 · 0.999812 |
| `doordash/status-logic-doc.mp4` | 26.56 | 1808×1222 · 7.08 · 0.996913 | 1280×864 · 3.54 · 0.993784 |
| `doordash/status-logic.mp4` | 2.49 | 1920×1062 · 3.32 · 0.999987 | 1280×708 · 1.87 · 0.999983 |
| `doordash/toast-entry.mp4` | 10.02 | 1920×1080 · 4.19 · 0.999754 | 1280×720 · 2.18 · 0.999646 |
| `doordash/unused-motion-cutter.mp4` | 0.13 | 1126×720 · 0.13 · 1.000000 | 1126×720 · 0.13 · 1.000000 |
| `doordash/unused-motion-printer.mp4` | 0.37 | 1230×720 · 0.37 · 1.000000 | 1230×720 · 0.37 · 1.000000 |
| `fleetline.mp4` | 0.67 | 1080×744 · 0.67 · 1.000000 | 1080×744 · 0.67 · 1.000000 |
| `gameboy.mp4` | 0.69 | 1080×1472 · 0.69 · 1.000000 | 1080×1472 · 0.69 · 1.000000 |
| `haven_3d.mp4` | 2.27 | 1080×1920 · 2.00 · 0.992606 | 1080×1920 · 1.00 · 0.990614 |
| `home_screen.mp4` | 0.26 | 1200×1054 · 0.26 · 1.000000 | 1200×1054 · 0.26 · 1.000000 |
| `library.mp4` | 2.54 | 1920×1058 · 1.35 · 0.998831 | 1280×706 · 0.69 · 0.998571 |
| `manta.mp4` | 1.11 | 1080×642 · 1.11 · 1.000000 | 1080×642 · 1.11 · 1.000000 |
| `missed-call.mp4` | 1.46 | 1840×1200 · 3.96 · 0.999955 | 1280×836 · 2.07 · 0.999933 |
| `mock_call.mp4` | 0.18 | 1200×676 · 0.18 · 1.000000 | 1200×676 · 0.18 · 1.000000 |
| `mood-colors.mp4` | 6.23 | 1840×1200 · 3.66 · 0.999974 | 1280×836 · 1.86 · 0.999950 |
| `mood_set.mp4` | 0.50 | 1200×994 · 0.50 · 1.000000 | 1200×994 · 0.50 · 1.000000 |
| `multi-line.mp4` | 1.21 | 1840×1200 · 4.91 · 0.999962 | 1280×836 · 2.52 · 0.999954 |
| `nova_practice_V.mp4` | 1.08 | 1588×1288 · 1.08 · 1.000000 | 1280×1038 · 1.09 · 0.997479 |
| `nova_preview_quiz.mp4` | 7.68 | 1920×1080 · 2.32 · 0.999908 | 1280×720 · 1.18 · 0.999808 |
| `nova_walkthrough.mp4` | 5.42 | 1920×1078 · 8.45 · 0.999664 | 1280×718 · 4.28 · 0.999504 |
| `nuance-talking.mp4` | 3.87 | 1654×1080 · 3.87 · 1.000000 | 1280×836 · 2.15 · 0.999823 |
| `nuance_pure.mp4` | 0.13 | 600×600 · 0.13 · 1.000000 | 600×600 · 0.13 · 1.000000 |
| `pen.mp4` | 0.08 | 1080×534 · 0.08 · 1.000000 | 1080×534 · 0.08 · 1.000000 |
| `quiz_fullscreen_student.mp4` | 1.70 | 1920×1078 · 4.02 · 0.999884 | 1280×718 · 2.15 · 0.999906 |
| `quiz_fullscreen_teacher.mp4` | 1.43 | 1920×1078 · 3.83 · 0.999941 | 1280×718 · 2.09 · 0.999911 |
| `rabbithole.mp4` | 1.31 | 1200×778 · 1.31 · 1.000000 | 1200×778 · 1.31 · 1.000000 |
| `recent_call.mp4` | 0.37 | 1200×1044 · 0.37 · 1.000000 | 1200×1044 · 0.37 · 1.000000 |
| `transcript.mp4` | 1.59 | 1840×1200 · 5.59 · 0.999954 | 1280×836 · 2.85 · 0.999944 |
| `wiggle.mp4` | 0.15 | 1080×622 · 0.15 · 1.000000 | 1080×622 · 0.15 · 1.000000 |

### Retained losslessly and size exceptions

After testing the two-pass recipe, already-small H.264 sources that fit the output dimensions were retained with a lossless stream copy when re-encoding inflated bytes. Only level/SAR/container metadata is normalized. These copies keep the source’s original rate control, B-frame structure and preset history; they are intentional exceptions to re-encoding, with SSIM 1.0 and verified timing. Every delivered stream is High profile, Level 4.2 and yuv420p. No output was retained above the width limits or raised above the target bitrate for SSIM.

| Lossless source copy | Renditions | Reason |
|---|---|---|
| `chewsy_createsc.mp4` | desktop | Already fits; two-pass file was larger |
| `doordash/unused-motion-cutter.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `doordash/unused-motion-printer.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `fleetline.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `gameboy.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `home_screen.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `manta.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `mock_call.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `mood_set.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `nova_practice_V.mp4` | desktop | Already fits; two-pass file was larger |
| `nuance-talking.mp4` | desktop | Already fits; two-pass file was larger |
| `nuance_pure.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `pen.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `rabbithole.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `recent_call.mp4` | desktop, mobile | Already fits; two-pass file was larger |
| `wiggle.mp4` | desktop, mobile | Already fits; two-pass file was larger |

The prescribed bitrate targets can still increase bytes for low-motion, high-resolution clips that require resizing; these outputs retain the requested recipe rather than silently substituting a lower bitrate. Actual asset sizes and the page transfer tables expose that tradeoff. Desktop posters and the earlier lossless image files remain unchanged; mobile posters are generated directly from preserved sources.

## Verification and reproduction

- `npm run build` passes. The production output excludes source backups.
- [Asset verification](perf-data/video-verification.json): complete 84-file inventory, hashes, SSIM/timing records, codec/profile/level/pixel format, SAR, no audio, faststart, and posters.
- [Browser verification](perf-data/verification-combined.json): mobile selection, source release/re-entry, SPA cleanup, lazy lossless SVG images, original-image fallback, public case studies, and 640/1023/1024 layout thresholds.
- [Throttled cancellation](perf-data/cancellation-combined.json): an unfinished MP4 is detached and its network request aborted immediately after scrolling past it at 64 KiB/s.
- [Coordinator verification](perf-data/coordinator-combined.json): one playing video even for comparison pairs, no release of selected media, and rendition replacement on live resize at 390/640/1023/1440px.
- The combined audit has no page errors or missing local media responses. It observes at most one playing video in all four page/device runs.

```bash
python3 scripts/perf/encode-videos.py
python3 scripts/perf/verify-video-assets.py
npm run build
PORT=3000 HOST=127.0.0.1 node .output/server/index.mjs
# With the locally installed Playwright Chromium:
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/verify.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/verify-coordinator.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/verify-cancellation.mjs
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/audit.mjs combined-combined
python3 scripts/perf/report-combined.py
```

Automatic permission reviews timed out twice: while starting the image-branch benchmark and the final local server. Each permitted retry succeeded; no action remains blocked and no login was attempted.
