# Case-study loading fixes

The reproduction uses the current branch's production build, Chromium 156, cold
cache, 180,000 B/s download, 84,375 B/s upload, 562.5 ms latency and 4× CPU
throttling. Desktop is 1440×900 at DPR 1; mobile is 390×900 at DPR 3.
`scripts/perf/audit-case-load.mjs` records actual navigation `loadEventEnd`
separately from the older audit's “load” observation (network idle, capped at
45 seconds, followed by five seconds). These are local single runs, not production
CDN measurements or statistical medians. Final measurements used an isolated production-output snapshot. Encoding jobs ran during the initial
baseline; treat small CPU/timing differences cautiously.

## What caused the delays

- **Playback deadlock:** `VideoPlayer` required three seconds buffered before
  calling `play()`. The baseline Nova hero reached readyState 4 but remained at
  time zero. Chrome can stop filling a paused video's buffer before that custom
  threshold. The coordinator now starts selected case-study videos at `canplay`
  readiness (`HAVE_FUTURE_DATA`).
- **Downloads restarted on scrolling:** every deselected incomplete video lost
  its sources. The coordinator now pauses it and retains partial data while it
  remains within two viewport heights of either viewport edge. Only farther
  sources release after 2.5 seconds, with fresh geometry and selection checks.
  Route unmount still clears URLs and cancels requests. Rendition switching still
  chooses mobile below 640px and replaces the old source deliberately.
- **Late preparation:** source preparation is now observed one viewport ahead
  with `metadata` preload; only the active clip and its nearest upcoming clip use
  `auto`. The upcoming clip can preload once the current clip starts playing,
  without waiting for the entire current file. IO margins use `innerHeight` in
  pixels because percentage margins resolve against root **width**. Resize
  rebuilds the observer. The global one-playing-video rule remains in place.
- **Missing SSR posters:** all video elements now include their poster URL and
  `loading="lazy"` in SSR HTML. MP4 sources remain absent until client-side
  preparation. Mobile and custom poster selection are preserved. Native lazy
  poster distances are browser-controlled; the source observer is explicitly
  bounded to one viewport.
- **Nova images:** the baseline fetched the 8,480,221-byte computer-lab JPEG and
  2,685,642-byte research PNG without scrolling. Native `loading="lazy"` was
  already present but its larger lookahead still fetched these images. They
  dominated the reproduced 73.97-second desktop load. The native lazy threshold
  also fetched both images on mobile.
- **Nuance duplicate prefetch:** importing the three competitor PNGs from
  `app/assets` emitted SSR `<link rel="prefetch" as="image">` tags. The cold-cache
  waterfall downloaded each both as `Other` and `Image`: 541,580, 1,397,970, and
  919,187 bytes per set. Their existing public copies have identical SHA-256
  hashes; referencing those copies removes the extra prefetch. Those images,
  avatars, diagrams, and the later clouds now load near the viewport.
- **Image scheduling, not image recompression:** `NearViewportImage` and
  `NearViewportBackground` use a quarter-viewport lookahead. A full viewport still
  included Nova's 8.48 MB lab photo on a 390px-wide screen, so it was insufficient.
  Source image bytes, dimensions, CSS crop, decoding and existing responsive
  cloud candidates are preserved. The later Nuance cloud remains a CSS
  background, since replacing it with an image changed browser rasterization.
  The existing `OptimizedImage`, lossless manifest, SVG image handling and image
  error fallbacks are untouched. These new bounded offscreen image components
  require JavaScript to attach their URLs; visible hero images remain SSR images.
- **Unrelated prefetch:** the header home link no longer prefetches the homepage
  JS/CSS from a case study. Navigation still loads it normally.
- **Fonts/CSS/JS:** General Sans (38,372 bytes in the baseline waterfall) and
  Atkinson Mono (10,296 bytes) are already local with `font-display: swap`. No
  remote font stylesheet was involved. Initial Nuxt entry scripts were about
  183 KB and 93 KB; route/shared CSS was tens of KB. They are not responsible for
  the multi-megabyte image delays. No rendering styles or animations were removed.

## Final measured results

| Page / viewport | Load before → after | LCP before → after | First video after | Observed MiB before → after |
|---|---:|---:|---:|---:|
| nova / 1440px | 74.0s → 6.8s | 10.0s → 6.8s | 7.0s | 12.03 → 5.12 |
| nova / 390px | 80.5s → 7.2s | 9.5s → 7.3s | 7.0s | 11.78 → 3.70 |
| nuance / 1440px | 52.5s → 18.4s | 43.6s → 18.5s | 7.8s | 10.34 → 2.92 |
| nuance / 390px | 55.9s → 20.0s | 56.1s → 20.1s | 8.0s | 10.84 → 3.18 |

No baseline hero reached `playing` in these four runs. Byte observations follow the network-idle-plus-five-seconds method above, so their observation windows differ; they are not equal-duration transfer comparisons. No final run hit the idle timeout. See [final request logs](perf-data/case-load/after.json). Nuance’s remaining 18–20 second load is largely the unchanged responsive cloud JPEG, phone PNG, and hero video sharing a 180 KB/s connection. Those hero pixels and responsive choices were deliberately preserved.

**Validation:** `npm run build` and `npm test` pass. All ten desktop/mobile screenshot crops are pixel-identical. 82 accepted video outputs total 104.53 MiB, down from 201.85 MiB (48.2% less), with minimum SSIM 0.999, no timestamp drift, and at most 0.325 ms duration drift. Every accepted file is no larger than its original. [Validation records](perf-data/reencode-verification.json) and [test output](perf-data/slow4g-tests.txt).

**Two decisions remain:** `chewsy_createsc-mobile.mp4` and `nova_practice_V-mobile.mp4` were left unchanged. Their resized passing candidates exceed original size; stream copies exceed 1280px. The smallest tested passing Nova practice candidate is 1.878 MiB (SSIM 0.999018), versus a 1.078 MiB original. The full inventory verifier intentionally reports incomplete until a width or size exception is chosen. `python3 scripts/perf/verify-quality-encodes.py --accepted-only` verifies the 82 accepted files while explicitly listing the pending two.

## Quality and assets

[Re-encoding report](perf-data/reencode-report.md) contains original/delivery sizes,
average and peak one-second bitrate, SSIM, CRF and VBV caps for every accepted
rendition. The script uses originals with verified Git provenance; it never
uses a previous delivery encode as a reference. The historical combined audit's
SSIM ≥0.98 acceptance is superseded by **SSIM ≥0.999** for this work. Source
frames and timestamps are preserved. There is no low-bitrate network rendition.

The source itself is the size ceiling. Small conformant originals may be
stream-copied, with unnecessary container metadata removed so even a few added
bytes do not violate that ceiling. Stream copies retain original encoder rate
control; their measured peaks are reported rather than claiming they obey a new
VBV cap. The detailed status-logic clip requires raised caps to meet quality.

## Verification and reproduction

```sh
python3 scripts/perf/reencode-quality.py
python3 scripts/perf/verify-quality-encodes.py
npm run build
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright npm test
# Or set AUDIT_URL to an existing local production server for npm test.
PLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/audit-case-load.mjs after http://127.0.0.1:4202
```

Use your own Playwright browser path if Chromium is installed elsewhere. `npm
test` starts and stops the production server itself when `AUDIT_URL` is absent.
It checks startup with only 1.8 seconds buffered, upcoming prefetch during
playback, manual pause, hidden tabs, one-player selection, SSR posters, real Slow
4G startup with an incomplete buffer, nearby scroll reversal, distant cancellation,
re-entry, mobile renditions, SPA cleanup, original image fallback, responsive
breakpoints, and song behavior. Song code is unchanged: desktop autoplay follows
window load, blocked autoplay recovers on a gesture, and no audio element or
request exists below 640px. Tests wait for load and actual playback rather than
requiring streaming media to become network-idle.

[Visual comparisons](perf-data/case-load/visual-comparison.json) compare unchanged
research images, competitors, avatars and cloud composition at 1440px and 390px.
The [raw baseline](perf-data/case-load/before.json) retains request-level bytes,
image positions, media states and timings. The intermediate `loading-fix.json`
captures the first full-screen image margin and old walkthrough bytes; it is not
the final result.
