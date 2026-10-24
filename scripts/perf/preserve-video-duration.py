#!/usr/bin/env python3
"""Remux without re-encoding to preserve a VFR source's final held frame.
FFmpeg infers the final packet duration from nominal fps when encoding. Set the
last presentation-frame duration explicitly and use the video timescale for movie/edit lists.
PTS, DTS, frame count and compressed video bytes are untouched.
"""
import json, subprocess, sys
from fractions import Fraction
from pathlib import Path

def info(path, packets=False):
    args = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_streams']
    if packets: args += ['-show_packets', '-show_entries', 'packet=pts,dts,duration']
    return json.loads(subprocess.check_output(args + ['-of', 'json', str(path)]))

def preserve(source, dest):
    original = info(source)['streams'][0]
    encoded = info(dest, True)
    stream = encoded['streams'][0]
    timebase = Fraction(stream['time_base'])
    target_ticks = round(Fraction(original['duration']) / timebase)
    packets = encoded['packets']
    last_pts = max(int(packet['pts']) for packet in packets)
    first_pts = min(int(packet['pts']) for packet in packets)
    last_duration = target_ticks - (last_pts - first_pts)
    assert last_duration >= 0
    # MP4 derives inter-packet sample durations from successive DTS values.
    # Give every packet the same presentation end to preserve the final hold
    # even when the final decode-order packet is a B frame. The muxer retains
    # the original DTS/PTS gaps; the batch driver verifies every decoded PTS.
    end = target_ticks + first_pts
    duration = f'{end}-PTS'
    tmp = Path(dest).with_suffix('.timing.mp4')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(dest), '-map', '0:v:0', '-c:v', 'copy',
                    '-bsf:v', f"setts=pts=PTS:dts=DTS:duration='{duration}'",
                    '-an', '-movie_timescale', str(timebase.denominator), '-video_track_timescale', str(timebase.denominator),
                    '-movflags', '+faststart', str(tmp)], check=True)
    if last_duration == 0:
        # Preserve the source's zero-duration final frame and container boundary.
        import runpy
        patch = runpy.run_path(str(Path(__file__).with_name('mp4-duration.py')))
        patch['set_duration'](tmp, original['duration'])
    delta = abs(float(info(tmp)['streams'][0]['duration']) - float(original['duration']))
    assert delta <= .0001, (source, delta)
    tmp.replace(dest)

if __name__ == '__main__': preserve(*sys.argv[1:])
