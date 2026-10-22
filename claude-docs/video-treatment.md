# Video delivery

All playback uses `app/components/VideoPlayer.vue`. The player selects one MP4 rendition in JavaScript: `-mobile.mp4` at widths up to 639px, desktop otherwise. Every delivery video has both paths, including sources narrower than 1280px (those are never upscaled). WebM is unnecessary for the current H.264 browser targets and is not shipped.

The shared coordinator permits one playing video on every screen. Comparison groups do not bypass the limit. Posters stay lazy on both the homepage and case studies. Only the selected clip and, after it finishes buffering, the nearest upcoming case-study clip may load. Deselected unfinished downloads are cancelled immediately; completed buffers release after 2.5 seconds. Release callbacks check coordinator ownership. SPA unmount clears source URLs and calls `load()` to cancel detached requests. `/videos/**` gets immutable one-year cache headers in both Nuxt and Vercel configuration.

## Reproduce the encodes

Use FFmpeg with libx264, ffprobe, and Python 3. Node workflows use npm.

```bash
python3 scripts/perf/encode-videos.py
# Retry a subset; records with matching output hashes are skipped.
python3 scripts/perf/encode-videos.py --only doordash/before --jobs 1
```

`scripts/perf/video-sources.json` records the Git revision and path of the best available local source for every clip. The batch driver restores missing sources with `git show` into `public/videos/originals/`. These backups are ignored by Git and excluded from production static assets. They are preserved exports, not necessarily uncompressed masters. Earlier 60fps exports are used for Gameboy, Manta, Pen, and Wiggle instead of the later 30fps derivatives.

The user-requested combined-media recipe supersedes the older CRF/2560px/WebM treatment:

- H.264 MP4, libx264, 8-bit yuv420p, High profile, Level 4.2, slow preset, two passes, faststart, no audio.
- x264 options: `qcomp=0.5:aq-mode=2:aq-strength=0.8:bframes=2:b-adapt=2:b-pyramid=none`.
- Desktop: up to 1920px wide, 2000k target, 3000k maxrate, 6000k buffer.
- Mobile: up to 1280px wide, 1000k target, 2000k maxrate, 4000k buffer.
- Even dimensions, square pixels, preserved aspect ratio, Lanczos scaling, no upscaling. Tall clips use a slightly smaller width to fit Level 4.2's 8704 macroblocks/frame limit.
- Preserve source frames and timestamps with `-fps_mode passthrough` and the source timebase. Never use a blind `fps=60` conversion: VFR recordings can declare 120fps while averaging below 60fps. All selected sources average at most 60fps; the batch driver refuses higher-rate inputs pending an explicit preservation decision.
- `preserve-video-duration.py` stream-copies after encoding to restore the final held-frame duration that FFmpeg otherwise infers from nominal fps. It explicitly preserves PTS and DTS and uses the video timescale for MP4 movie/edit lists. The zero-hold final frame in missed-call is preserved with a sample-table adjustment, including chunk-offset correction when the table grows.

The standalone shell encoder accepts `WIDTH`, `HEIGHT`, `BITRATE`, `MAXRATE`, and `BUFSIZE` overrides. Use the batch driver for conformance and quality validation.

## Acceptance checks

Every output is compared against the source scaled to its delivered dimensions. SSIM pairs decoded frames by index, while a separate ffprobe comparison checks every presentation timestamp, decoded frame count, and duration. SSIM below 0.98 triggers a fresh two-pass encode from the preserved source at a higher bitrate. The pipeline computes VMAF as well when FFmpeg has `libvmaf`. It never re-encodes a failed output as the next attempt's source.

Quality records in `claude-docs/perf-data/combined-video-quality/` include source provenance, dimensions, bitrate attempts, bytes, SSIM, optional VMAF, frame counts, timing deltas, codec metadata, and output SHA-256. The combined audit documents visual review and any exceptions. Existing desktop posters are retained to preserve the earlier image work; new mobile posters are generated directly from the source.

Compact source copies retain decoded pixels losslessly. Their H.264 level and SAR metadata are normalized; `normalize-mp4-sar.py` sets the MP4 pixel-aspect atom exactly to 1:1 because FFmpeg rounds some display-aspect ratios. Final asset verification checks both container and stream metadata.
