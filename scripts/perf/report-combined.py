#!/usr/bin/env python3
"""Render the combined audit from measured network and quality records."""
import json, subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]
data=root/'claude-docs/perf-data'
labels=['main','cursor','astra','combined']
refs={'main':'main','cursor':'origin/cursor/case-study-video-performance-6604','astra':'codex/media-performance-astra','combined':'codex/media-combined'}
measurements={label:{p.stem:json.loads(p.read_text()) for p in (data/f'combined-{label}').glob('*.json')} for label in labels}
assert all(len(v)==4 for v in measurements.values())
quality={r['file']:r for p in (data/'combined-video-quality').glob('*.json') if (r:=json.loads(p.read_text()))}
verification=json.loads((data/'video-verification.json').read_text())
assert verification['outputs']==84
browser_checks=json.loads((data/'verification-combined.json').read_text())
coordinator=json.loads((data/'coordinator-combined.json').read_text())
cancellation=json.loads((data/'cancellation-combined.json').read_text())
assert not browser_checks['errors'] and len(browser_checks['checks']) >= 11
assert len(coordinator)==4 and all(r['peakPlaying']==1 and not r['failures'] for r in coordinator)
assert cancellation['detachMs'] < 1500 and any(r.get('failure')=='net::ERR_ABORTED' for r in cancellation['requests'])
for result in measurements['combined'].values():
    assert result['peakPlaying'] <= 1 and not result['errors']
    assert all(r.get('status',200)<400 for r in result['requests'])
mib=lambda n:f'{n/1048576:.2f}'
lines=['# Combined media performance audit','',
'Local work on `codex/media-combined`. No push, deployment, PR, or login was performed. No GitHub/Vercel login is required for the completed local work. Production CDN behavior was not remotely measured.','',
'## Changes','',
'- Preserved the earlier lossless WebP assets, image fallbacks, lazy images/posters, and immediate cancellation of unfinished deselected video requests.',
'- Integrated the cursor branch’s JS rendition selection, coordinator-aware release, and immutable `/videos/**` headers. Mobile uses the 1280px-or-smaller rendition at ≤639px; tablet and desktop use the desktop rendition. All 42 clips have both paths.',
'- One playing video across every viewport, including comparison pairs. A selected clip cannot be released by a stale timer; only the nearest upcoming case-study clip may preload after the current clip finishes buffering. Completed deselected buffers release after 2.5 seconds; unmount clears URLs and cancels requests.',
'- Deleted the gate component, storage state, runtime setting, content-package field, and stale access documentation. DoorDash, Nova, and Nuance open directly in fresh production sessions and have public homepage links.',
'- Replaced WebM delivery with H.264 MP4. Preserved source backups locally and excluded `public/videos/originals/` from production assets.','',
'## Measurement method','',
'All four variants were built with `npm run build` and served locally from production output. The three comparison variants used detached Git worktrees at `/tmp/portfolio-main`, `/tmp/portfolio-cursor`, and `/tmp/portfolio-astra`. The same `scripts/perf/audit.mjs` measured every variant.','',
'Each page/device gets a fresh Chromium context: desktop 1440×900 DPR 1; mobile 390×844 DPR 3 with touch/mobile emulation. Page-open bytes are sampled 5 seconds after network idle. Full-scroll bytes are cumulative, using overlapping 70%-viewport steps with 1.5-second waits, five DoorDash art-carousel slides, and a final 5-second wait. A further 31-second release observation is excluded from transfer totals. CDP counts encoded bytes, including partial cancelled transfers; no network throttling is applied. Total bytes include HTML, JS, CSS, fonts and media. Media-only totals are also provided.','',
'These are single local runs, not production/CDN or statistical latency claims. Playback and cancellation timing can change byte counts; smaller files do not automatically imply fewer bytes for this fixed traversal. External font requests were handled identically. Raw request logs, samples, browser versions and screenshots are in the linked data directories.','',
'| Variant | Revision | Raw data |','|---|---|---|']
for label in labels:
 ref=refs[label]
 sha=subprocess.check_output(['git','rev-parse','--short',ref],cwd=root,text=True).strip()
 lines.append(f'| `{ref}` | `{sha}` | [Measurements](perf-data/combined-{label}/) |')
lines += ['', '## Per-page transferred bytes', '', 'Each cell is **page-open / full-scroll MiB** (1 MiB = 1,048,576 bytes).', '',
'| Page / viewport | main | cursor video work | earlier image work | combined |','|---|---:|---:|---:|---:|']
for key in ['doordash-desktop','doordash-mobile','homepage-desktop','homepage-mobile']:
 cells=[f"{mib(measurements[l][key]['initial']['totalBytes'])} / {mib(measurements[l][key]['fullScroll']['totalBytes'])}" for l in labels]
 lines.append('| '+key+' | '+' | '.join(cells)+' |')
lines += ['', 'Full-scroll transfer versus main: ' + '; '.join(
    f"{key} {100*(1-measurements['combined'][key]['fullScroll']['totalBytes']/measurements['main'][key]['fullScroll']['totalBytes']):.1f}% lower"
    for key in ['doordash-desktop','doordash-mobile','homepage-desktop','homepage-mobile']) + '.', '',
    f"Homepage desktop page-open increases from {mib(measurements['astra']['homepage-desktop']['initial']['totalBytes'])} MiB on the image-only branch to {mib(measurements['combined']['homepage-desktop']['initial']['totalBytes'])} MiB combined: the requested 2000k desktop ASL encode is larger than its previous compressed source. Full-scroll transfer is shown separately above."]
lines += ['', 'Media-only transfer (same page-open / full-scroll MiB):', '',
'| Page / viewport | main | cursor video work | earlier image work | combined |','|---|---:|---:|---:|---:|']
for key in ['doordash-desktop','doordash-mobile','homepage-desktop','homepage-mobile']:
 cells=[f"{mib(measurements[l][key]['initial']['mediaBytes'])} / {mib(measurements[l][key]['fullScroll']['mediaBytes'])}" for l in labels]
 lines.append('| '+key+' | '+' | '.join(cells)+' |')
lines += ['', 'Peak simultaneously playing videos:', '', '| Page / viewport | main | cursor | image work | combined |','|---|---:|---:|---:|---:|']
for key in ['doordash-desktop','doordash-mobile','homepage-desktop','homepage-mobile']:
 lines.append('| '+key+' | '+' | '.join(str(measurements[l][key]['peakPlaying']) for l in labels)+' |')
lines += ['', '## Encoding and quality', '',
'Every clip was tested with the requested two-pass libx264 recipe: slow preset, High profile, Level 4.2, yuv420p, square pixels, even aspect-preserving dimensions, faststart, no audio, and `qcomp=0.5:aq-mode=2:aq-strength=0.8:bframes=2:b-adapt=2:b-pyramid=none`. Desktop targets 2000k / maxrate 3000k / buffer 6000k; mobile targets 1000k / maxrate 2000k / buffer 4000k. Tall desktop clips are slightly narrower than 1920px to respect Level 4.2’s 8704 macroblocks/frame limit. No source is upscaled.', '',
'Best available local exports are documented in [video-sources.json](../scripts/perf/video-sources.json). No uncompressed masters were available in this checkout or local history. Four earlier 60fps artwork exports (Gameboy, Manta, Pen, Wiggle) replace later 30fps derivatives. All other sources come from the original main revision, avoiding the cursor branch’s re-encoded generations. The sources can be restored from Git by the batch driver.', '',
'`-fps_mode passthrough` and the source timebase preserve all source frames. The recordings average ≤60fps, although some have nominal 120fps metadata and short VFR bursts; those timestamps are preserved rather than dropping or duplicating frames. The duration helper preserves the final held frame in both presentation and decode order. The missed-call source has its final PTS exactly at its declared end; the MP4 helper preserves its zero-duration final frame by adjusting only the last sample duration and chunk offsets, without clipping the edit list.', '',
f"All **{verification['outputs']} outputs / {verification['sources']} sources** pass: minimum SSIM **{verification['minSSIM']:.6f}**, identical decoded frame counts, maximum presentation-timestamp delta **{verification['maxTimestampDelta']:.6f}s**, maximum stream-duration delta **{verification['maxDurationDelta']:.6f}s**. SSIM compares every decoded frame with the source scaled to output dimensions. No bitrate increases above the target were needed. VMAF is **unavailable**: this FFmpeg build has `ssim` but no `libvmaf` (the `vmafmotion` filter is not VMAF quality scoring).", '',
'Native-pixel text crops at 20%, 50%, and 80% were reviewed for status-logic-doc, printer-types, Nova walkthrough, and transcript, in both renditions. Source is on the left and delivery on the right in [review sheets](perf-data/video-review/). No additional text blur was observed relative to the scaled source; status-logic-doc passed without retaining the full-size delivery. This is sampled visual review plus exhaustive SSIM, not a claim of mathematically lossless lossy encoding.', '',
'### Per-video size and SSIM', '',
'Each rendition cell lists dimensions, MiB, and SSIM. VMAF is unavailable for every row. Detailed per-output frame counts, duration comparisons, bitrate attempts, provenance, and hashes are in [quality records](perf-data/combined-video-quality/).', '',
'| Video | Source MiB | Desktop: dimensions · MiB · SSIM | Mobile: dimensions · MiB · SSIM |','|---|---:|---|---|']
sources=json.loads((root/'scripts/perf/video-sources.json').read_text())
for s in sources:
 p=Path(s['file']);d=quality['public/videos/'+str(p)];m=quality['public/videos/'+str(p.with_stem(p.stem+'-mobile'))]
 cell=lambda r:f"{r['width']}×{r['height']} · {mib(r['bytes'])} · {r['ssim']:.6f}"
 lines.append(f"| `{s['file']}` | {mib(d['sourceBytes'])} | {cell(d)} | {cell(m)} |")
lines += ['', '### Retained losslessly and size exceptions', '',
'After testing the two-pass recipe, already-small H.264 sources that fit the output dimensions were retained with a lossless stream copy when re-encoding inflated bytes. Only level/SAR/container metadata is normalized. These copies keep the source’s original rate control, B-frame structure and preset history; they are intentional exceptions to re-encoding, with SSIM 1.0 and verified timing. Every delivered stream is High profile, Level 4.2 and yuv420p. No output was retained above the width limits or raised above the target bitrate for SSIM.', '',
'| Lossless source copy | Renditions | Reason |','|---|---|---|']
for s in sources:
 p=Path(s['file']);names=[]
 for label,key in [('desktop','public/videos/'+str(p)),('mobile','public/videos/'+str(p.with_stem(p.stem+'-mobile')))]:
  if quality[key]['exception'].startswith('Lossless'):names.append(label)
 if names:lines.append(f"| `{s['file']}` | {', '.join(names)} | Already fits; two-pass file was larger |")
lines += ['', 'The prescribed bitrate targets can still increase bytes for low-motion, high-resolution clips that require resizing; these outputs retain the requested recipe rather than silently substituting a lower bitrate. Actual asset sizes and the page transfer tables expose that tradeoff. Desktop posters and the earlier lossless image files remain unchanged; mobile posters are generated directly from preserved sources.', '',
'## Verification and reproduction', '',
'- `npm run build` passes. The production output excludes source backups.',
'- [Asset verification](perf-data/video-verification.json): complete 84-file inventory, hashes, SSIM/timing records, codec/profile/level/pixel format, SAR, no audio, faststart, and posters.',
'- [Browser verification](perf-data/verification-combined.json): mobile selection, source release/re-entry, SPA cleanup, lazy lossless SVG images, original-image fallback, public case studies, and 640/1023/1024 layout thresholds.',
'- [Throttled cancellation](perf-data/cancellation-combined.json): an unfinished MP4 is detached and its network request aborted immediately after scrolling past it at 64 KiB/s.',
'- [Coordinator verification](perf-data/coordinator-combined.json): one playing video even for comparison pairs, no release of selected media, and rendition replacement on live resize at 390/640/1023/1440px.',
'- The combined audit has no page errors or missing local media responses. It observes at most one playing video in all four page/device runs.', '',
'```bash\npython3 scripts/perf/encode-videos.py\npython3 scripts/perf/verify-video-assets.py\nnpm run build\nPORT=3000 HOST=127.0.0.1 node .output/server/index.mjs\n# With the locally installed Playwright Chromium:\nPLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/verify.mjs\nPLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/verify-coordinator.mjs\nPLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/verify-cancellation.mjs\nPLAYWRIGHT_BROWSERS_PATH=/tmp/portfolio-playwright node scripts/perf/audit.mjs combined-combined\npython3 scripts/perf/report-combined.py\n```', '',
'Automatic permission reviews timed out twice: while starting the image-branch benchmark and the final local server. Each permitted retry succeeded; no action remains blocked and no login was attempted.']
(root/'claude-docs/perf-audit-combined.md').write_text('\n'.join(lines)+'\n')
print('Wrote claude-docs/perf-audit-combined.md')
