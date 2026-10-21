# Video Treatment Process

Standard process for optimizing video files added to the portfolio site.

## 1. Place originals in `public/videos/`

All video files go in `public/videos/` (Nuxt convention for static assets served at root URL).

## 2. Get video dimensions

Use Python to parse MP4 dimensions from the `stsd` box:

```bash
python3 -c "
import os, struct

def parse_mp4_dims(path):
    with open(path, 'rb') as f:
        data = f.read(min(os.path.getsize(path), 20*1024*1024))
    idx = 0
    while True:
        idx = data.find(b'stsd', idx)
        if idx == -1:
            break
        entry_start = idx + 4 + 4 + 4
        w_offset = entry_start + 4 + 4 + 6 + 2 + 16
        if w_offset + 4 <= len(data):
            w = struct.unpack('>H', data[w_offset:w_offset+2])[0]
            h = struct.unpack('>H', data[w_offset+2:w_offset+4])[0]
            if w > 0 and h > 0 and w < 8000 and h < 8000:
                return w, h
        idx += 4
    return None, None

base = 'public/videos'
for v in os.listdir(base):
    if v.endswith('.mp4'):
        w, h = parse_mp4_dims(os.path.join(base, v))
        if w and h:
            print(f'{v}: {w}x{h} (aspect {w}/{h} = {w/h:.4f})')
"
```

Use the width and height values as the `aspect` property in the waterfall grid data (e.g. `aspect: '1588 / 1288'`).

## 3. Compress MP4 (H.264)

Waterfall videos use aggressive compression for their small display size:

```bash
ffmpeg -y -i input.mp4 \
  -vf "scale='min(1080,iw)':-2" \
  -c:v libx264 -crf 30 -preset slow \
  -an -movflags +faststart \
  output.mp4
```

## 4. Generate WebM (VP9)

Generate a fallback that matches the waterfall scale:

```bash
ffmpeg -y -i input.mp4 \
  -vf "scale='min(1080,iw)':-2" \
  -c:v libvpx-vp9 -crf 35 -b:v 0 \
  -an \
  output.webm
```

## 5. Generate poster image

JPEG first-frame for each video, shown before the video loads:

```bash
ffmpeg -y -i input.mp4 -vframes 1 -q:v 5 poster.jpg
```

Posters go in `public/videos/posters/` with the same base filename (e.g. `manta.jpg`).

## 6. Batch process all videos

Run from `public/videos/`:

```bash
cd public/videos
mkdir -p originals posters

for f in *.mp4; do
  name="${f%.mp4}"

  # Backup original
  cp "$f" "originals/$f"

  # Compress MP4
  ffmpeg -y -i "$f" -vf "scale='min(1080,iw)':-2" -c:v libx264 -crf 30 -preset slow -an -movflags +faststart "compressed_${f}" 2>/dev/null
  mv "compressed_${f}" "$f"

  # Generate WebM
  ffmpeg -y -i "$f" -vf "scale='min(1080,iw)':-2" -c:v libvpx-vp9 -crf 35 -b:v 0 -an "${name}.webm" 2>/dev/null

  # Generate poster
  ffmpeg -y -i "$f" -vframes 1 -q:v 5 "posters/${name}.jpg" 2>/dev/null

  echo "Done: $name"
done
```

## Case-study videos

Case-study media uses a separate presentation profile (see `AGENTS.md`), encoded with
`scripts/encode-case-study-video.sh`. Prefer the untouched export in `public/videos/originals/`
when it exists; re-encoding an already-compressed delivery file is a last resort.

```bash
# Desktop only: <=2560px wide, source frame rate, H.264 CRF 20 + VP9 CRF 25, poster
scripts/encode-case-study-video.sh public/videos/originals/clip.mov public/videos/doordash/clip.mp4

# Also generate clip-mobile.mp4/.webm/.jpg (1280px wide, <=60fps) for phones
scripts/encode-case-study-video.sh --mobile public/videos/originals/clip.mov public/videos/doordash/clip.mp4

# Text-heavy mobile clip (keep glyphs crisp)
MOBILE_CRF=18 MOBILE_VP9_CRF=25 scripts/encode-case-study-video.sh --mobile-only \
  public/videos/originals/clip.mov public/videos/doordash/clip.mp4
```

Pass `mobile-variant` to `VideoPlayer` when the `-mobile` files exist. `VideoPlayer`
JS-selects the 1280px files at `max-width: 639px` and attaches only that rendition
(H.264 first, VP9 fallback). Do **not** list desktop and mobile `<source>` elements
together and do **not** rely on `<source media>` — it is not in the HTML spec for
`<video>` and browsers that ignore it will download the first playable (desktop) file.

Skip the mobile variant when the video is CSS-cropped or zoomed on mobile (the crop
needs the extra source pixels) or when the source is already ≤1280px. Use `CRF=18`
/ `MOBILE_CRF=18` for text-heavy clips. Keep source frame timing on desktop
(`-fps_mode passthrough`); mobile caps at 60fps.

Do not downscale a desktop case-study file that is already compact and sharper than
2560px if the re-encode would inflate size or soften UI text. The 2560px cap applies
when encoding from a large original, not as a mandate to re-encode a good delivery.

If the current delivery is already browser-compatible H.264 at the right size,
prefer `-c:v copy -an -movflags +faststart` over another CRF pass. Same-resolution
re-encodes of text-heavy clips (for example the status-logic doc) drop SSIM well
below 0.99 and soften glyphs. Mobile fps caps must use `avg_frame_rate`, not
`r_frame_rate` — screen recordings often declare 120fps while averaging ~50fps.

## 7. Loading optimization (handled by `VideoPlayer` component)

The `app/components/VideoPlayer.vue` component handles:

- **Lazy loading** via IntersectionObserver — homepage sources attach 200px before
  the viewport; case-study posters attach within one viewport, and case-study
  media data is attached only for the visible clip plus the nearest upcoming clip
- **`preload="none"`** until attach, then `metadata` (homepage) or `auto` (active /
  upcoming case-study clip)
- **Poster image** — auto-derived from the active rendition
  (`/videos/foo.mp4` → `/videos/posters/foo.jpg`, or `foo-mobile.jpg` on mobile);
  case-study posters are only requested once the video is within one viewport
- **JS source selection** — only the matching desktop or mobile MP4+WebM pair is
  in the DOM, so a phone cannot fetch the 2560px file
- **Source release** — sources detach after leaving the load range: 30s on desktop,
  5s at 1023px and below. Release is skipped while the playback coordinator still
  wants the clip loaded (visible or nearest upcoming)
- **Dual format** — H.264 MP4 first, WebM as fallback, for the selected rendition only
- **Viewport playback** — offscreen videos pause; at most one decoder runs on case
  studies and on viewports ≤1023px; the homepage may play two clips on desktop.
  A `data-playback-group` pair may play together when both are visible
- **Caching** — `/videos/**` is served with `Cache-Control: public, max-age=31536000, immutable`
  so a released clip can re-attach from disk cache instead of the network
- **Autoplay/loop/muted** — background video behavior with page-visibility pausing

## File structure after treatment

```
public/
  videos/
    manta.mp4          # Compressed H.264
    manta.webm         # VP9 alternative
    gameboy.mp4
    gameboy.webm
    ...
    posters/
      manta.jpg         # First-frame poster
      gameboy.jpg
      ...
    originals/          # Uncompressed backups
      manta.mp4
      gameboy.mp4
      ...
```

## Typical compression results

| Video | Before | After (MP4) | Savings |
|-------|--------|-------------|---------|
| manta | 16MB | 1.1MB | 93% |
| nuance_pure | 2.9MB | 43KB | 98% |
| gameboy | 1.9MB | 703KB | 64% |
| nova_practice | 1.1MB | 407KB | 63% |

## Checklist for adding a new video

1. Drop the `.mp4` file into `public/videos/`
2. Run the dimension parser to get width x height
3. Run the compression commands (MP4 + WebM + poster)
4. Add to the waterfall grid in `app/pages/index.vue` with `aspect: 'W / H'`
5. Verify playback in the browser
