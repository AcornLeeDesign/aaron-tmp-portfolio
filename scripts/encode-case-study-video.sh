#!/usr/bin/env bash
# Encode case-study presentation video for VideoPlayer.
#
# Usage: scripts/encode-case-study-video.sh [--mobile | --mobile-only] <source> <public/videos/.../name.mp4>
#
# Desktop: H.264 + VP9 at the source frame rate, capped at 2560px wide (CRF env overrides 20).
# Mobile:  `name-mobile.mp4/.webm` at 1280px wide and at most 60fps, used by VideoPlayer's
#          `mobile-variant` prop at the mobile breakpoint.
# Posters are written to public/videos/posters/ with the same relative path.
set -euo pipefail

mode=desktop
case "${1:-}" in
  --mobile) mode=both; shift ;;
  --mobile-only) mode=mobile; shift ;;
esac
src=${1:?source video required}
out=${2:?output .mp4 path required}
base=${out%.mp4}
poster_base=${base/\/videos\//\/videos\/posters\/}
mkdir -p "$(dirname "$out")" "$(dirname "$poster_base")"

fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$src")
fps_cap=$(python3 -c "n,d='$fps'.split('/');print(',fps=60' if int(n)/int(d)>60 else '')")

encode() { # <scale+fps filter> <crf> <vp9-crf> <output base> <poster quality>
  local vf=$1 crf=$2 vp9_crf=$3 dest=$4 pq=$5 tmp
  tmp=$(mktemp -d)
  # Screen recordings are variable frame rate; passthrough keeps their timing instead of padding to a constant rate.
  ffmpeg -v error -y -i "$src" -vf "$vf" -fps_mode passthrough -c:v libx264 -preset slow -crf "$crf" -profile:v high \
    -pix_fmt yuv420p -an -movflags +faststart "$tmp/out.mp4"
  ffmpeg -v error -y -i "$src" -vf "$vf" -fps_mode passthrough -c:v libvpx-vp9 -crf "$vp9_crf" -b:v 0 -row-mt 1 \
    -cpu-used 4 -pix_fmt yuv420p -an "$tmp/out.webm"
  ffmpeg -v error -y -i "$src" -vf "${vf%%,fps=*}" -frames:v 1 -q:v "$pq" "$tmp/poster.jpg"
  mv "$tmp/out.mp4" "$dest.mp4"
  mv "$tmp/out.webm" "$dest.webm"
  mv "$tmp/poster.jpg" "${dest/\/videos\//\/videos\/posters\/}.jpg"
  rmdir "$tmp"
}

if [[ $mode != mobile ]]; then
  encode "scale='min(2560,iw)':-2:flags=lanczos" "${CRF:-20}" 25 "$base" 3
fi
if [[ $mode != desktop ]]; then
  encode "scale='min(1280,iw)':-2:flags=lanczos$fps_cap" 23 30 "$base-mobile" 4
fi
echo "done: $out ($mode)"
