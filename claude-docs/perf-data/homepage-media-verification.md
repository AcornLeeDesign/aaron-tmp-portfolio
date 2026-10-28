# Homepage media verification

Verified locally on `codex/media-combined`. Nothing pushed or deployed.

## Changes

- Nuance homepage clouds: real SSR `<picture>` with 800/1200/1760w lossless WebP and JPEG candidates. `sizes` accounts for the portrait card's `cover` crop. A desktop-only responsive preload requests the selected WebP at high priority without a duplicate request.
- Nuance case study: responsive JPEG candidates, retaining the untouched 5723px source for larger display/DPR combinations. The full-resolution case-study phone frames remain unchanged.
- Homepage phone: 820w lossless WebP (72,172 bytes versus 376,552), plus a 1350w lossless candidate for larger tablet/retina displays. Original alpha PNG remains the fallback.
- Desktop ASL poster: 57,292 bytes versus 133,245, retaining all 2914×1902 source dimensions. The separate mobile poster/crop is unchanged.
- Audio: no source assigned until a trusted click or keypress. `preload="none"`, mute/resume, profile synchronization, and mobile playback stopping remain in place.
- Atkinson Hyperlegible Mono: the exact Google Fonts regular Latin and Latin Extended WOFF2 subsets, self-hosted with the original Unicode ranges and `font-display: swap`. OFL license included.
- Homepage project links disable Nuxt prefetching. DoorDash/Nuance scoped CSS loads on navigation instead of homepage idle time.

## Validation

- `npm run build`: passed.
- `node scripts/perf/verify-homepage-image-quality.mjs`: passed; results in `homepage-media-quality.json`.
- `AUDIT_URL=http://127.0.0.1:3100 CHROME_PATH=/usr/bin/google-chrome node scripts/perf/verify-homepage-media.mjs`: passed.
- Existing `scripts/perf/verify.mjs`: passed using installed Chrome. Includes source detach/resume, SPA cleanup, image fallback, public case studies, and the 640/1023/1024px carousel breakpoints.
- Browser network checks: no song request/source on load, synthetic events, or a mobile-to-desktop resize; trusted click and keypress start playback. Muting stays muted on later unrelated input. Mobile gestures fetch neither audio nor hidden cloud/phone images.
- No Google Fonts or DoorDash/Nuance CSS requests on the idle homepage. Exactly one cloud request at desktop width. Route CSS loads after SPA navigation. JPEG/PNG fallbacks decode.
- Original and optimized source assets reviewed side by side in Chrome at 390, 768, 1024, 1440, and 1920px. Card bounds match exactly. Mobile homepage and card screenshots are pixel-identical. Fixed-position full-card screenshot SSIM: 1.000000 / 0.983859 / 0.987912 / 0.992710 / 0.993336 respectively. Nuance figure screenshots were also reviewed at 390 and 1440px.

The lossless cloud and phone files preserve every visible RGB sample and alpha value of the resized reference. Display-size asset SSIM is 0.992901–0.995829 for clouds, 0.999215–0.999252 for phone frames, and 0.998162 for the poster. Resampling and the poster's lossy encoding are not mathematically identical to the original source pixels; no visible degradation was observed at the tested display sizes.

Regenerate assets with `node scripts/perf/optimize-homepage-media.mjs`. Originals are retained.
