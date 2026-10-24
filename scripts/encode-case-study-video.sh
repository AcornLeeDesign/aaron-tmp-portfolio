#!/usr/bin/env bash
# MP4 delivery recipe; quality validation and retry policy live in encode-videos.py.
# Usage: [WIDTH=1920 BITRATE=2000 MAXRATE=3000 BUFSIZE=6000] script source output.mp4
# Dimensions are supplied by the batch driver (even, aspect preserving, no upscale).
set -euo pipefail
src=${1:?source required}
out=${2:?output required}
width=${WIDTH:-1920}
height=${HEIGHT:--2}
bitrate=${BITRATE:-2000}
maxrate=${MAXRATE:-3000}
bufsize=${BUFSIZE:-6000}
timebase=$(ffprobe -v error -select_streams v:0 -show_entries stream=time_base -of csv=p=0 "$src")
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$(dirname "$out")"
args=(-v error -y -threads 2 -i "$src" -map 0:v:0 -an
  -vf "scale='trunc(min($width,iw)/2)*2':$height:flags=lanczos,setsar=1"
  -fps_mode passthrough -enc_time_base "$timebase" -c:v libx264 -threads 2
  -pix_fmt yuv420p -profile:v high -level:v 4.2 -preset slow -fastfirstpass 0
  -x264opts qcomp=0.5:aq-mode=2:aq-strength=0.8:bframes=2:b-adapt=2:b-pyramid=none
  -b:v "${bitrate}k" -maxrate "${maxrate}k" -bufsize "${bufsize}k"
  -passlogfile "$tmp/pass")
ffmpeg "${args[@]}" -pass 1 -f null /dev/null
ffmpeg "${args[@]}" -pass 2 -movie_timescale "${timebase#*/}" -video_track_timescale "${timebase#*/}" -movflags +faststart "$tmp/out.mp4"
python3 "$(dirname "$0")/perf/preserve-video-duration.py" "$src" "$tmp/out.mp4"
mv "$tmp/out.mp4" "$out"
