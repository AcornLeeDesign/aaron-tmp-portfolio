#!/usr/bin/env python3
"""Encode every tracked source, validate every frame, and retain measured quality exceptions.
Sources can be restored from video-sources.json using `git show REF:PATH`.
No originals are overwritten. --only filters paths; completed records are resumable.
"""
import argparse, concurrent.futures, hashlib, json, math, os, re, subprocess
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'claude-docs/perf-data/combined-video-quality'
OUT.mkdir(parents=True, exist_ok=True)

def run(args, **kw):
    return subprocess.run([str(x) for x in args], check=True, capture_output=True, text=True, **kw)

def probe(path, frames=False):
    args = ['ffprobe', '-v', 'error', '-threads', '2', '-select_streams', 'v:0', '-show_streams', '-show_format']
    if frames: args += ['-show_frames', '-show_entries', 'frame=best_effort_timestamp_time,pkt_duration_time']
    return json.loads(run(args + ['-of', 'json', path]).stdout)

def dimensions(s, cap):
    # Level 4.2 supports at most 8704 macroblocks/frame (and 522240/sec at 60fps).
    # Preserve portrait aspect as well; width-only scaling can exceed that limit.
    sar = Fraction(s.get('sample_aspect_ratio', '1:1').replace(':', '/'))
    aspect = s['width'] * float(sar) / s['height']
    width = min(cap, s['width']) // 2 * 2
    height = round(width / aspect / 2) * 2
    while math.ceil(width / 16) * math.ceil(height / 16) > 8704:
        width -= 2
        height = round(width / aspect / 2) * 2
    return width, height

def quality(src, dest, w, h):
    # Pair by frame index, not framesync's VFR duplication. Timing is checked independently.
    graph = (f'[0:v]scale={w}:{h}:flags=lanczos,setsar=1,format=yuv420p,settb=1/60,setpts=N[a];'
             '[1:v]settb=1/60,setpts=N[b];[a][b]ssim=shortest=1')
    result = run(['ffmpeg', '-hide_banner', '-threads', '2', '-i', src, '-threads', '2', '-i', dest,
                  '-filter_complex_threads', '1', '-lavfi', graph, '-an', '-f', 'null', '-'])
    score = float(re.findall(r'All:([\d.]+)', result.stderr)[-1])
    vmaf = None
    if ' libvmaf ' in run(['ffmpeg', '-hide_banner', '-filters']).stdout:
        vgraph = graph.replace('[a][b]ssim=shortest=1', '[b][a]libvmaf=n_threads=2:shortest=1')
        result = run(['ffmpeg', '-hide_banner', '-threads', '2', '-i', src, '-threads', '2', '-i', dest,
                      '-filter_complex_threads', '1', '-lavfi', vgraph, '-an', '-f', 'null', '-'])
        vmaf = float(re.findall(r'VMAF score: ([\d.]+)', result.stderr)[-1])
    return score, vmaf

def encode(item):
    rel = Path(item['file'])
    src = ROOT / 'public/videos/originals' / rel
    if not src.exists():
        src.parent.mkdir(parents=True, exist_ok=True)
        with src.open('wb') as f:
            subprocess.run(['git', 'show', f"{item['ref']}:{item['path']}"], stdout=f, check=True)
    source = probe(src, True)
    s = source['streams'][0]
    source_frames = source['frames']
    # All repository sources average <=60fps. Preserve bursty VFR timestamps too:
    # blindly applying fps=60 would drop source frames and duplicate others.
    if Fraction(s['avg_frame_rate']) > 60:
        raise ValueError(f'{rel}: >60fps source requires an explicit frame preservation decision')
    records = []
    for mobile in (False, True):
        dest = ROOT / 'public/videos' / (rel.with_stem(rel.stem + '-mobile') if mobile else rel)
        record_path = OUT / (str(dest.relative_to(ROOT / 'public/videos')).replace('/', '__') + '.json')
        cached = None
        if record_path.exists():
            old = json.loads(record_path.read_text())
            if dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest() == old['sha256']:
                can_copy = (s['width'] == old['width'] and s['height'] == old['height']
                            and s['profile'] == 'High' and s['pix_fmt'] == 'yuv420p'
                            and src.stat().st_size < old['bytes']
                            and not old['exception'].startswith('Lossless source stream copy'))
                if old['exception'].startswith('Lossless') and old.get('sampleAspectRatio') != '1:1':
                    can_copy = True
                if can_copy: cached = old
                else:
                    records.append(old); continue
        w, h = dimensions(s, 1280 if mobile else 1920)
        bitrate, maxrate = (1000, 2000) if mobile else (2000, 3000)
        attempts = cached['attempts'] if cached else []
        exception = ''
        while cached is None:
            env = dict(os.environ, WIDTH=str(w), HEIGHT=str(h), BITRATE=str(bitrate),
                       MAXRATE=str(maxrate), BUFSIZE=str(maxrate * 2))
            run([ROOT / 'scripts/encode-case-study-video.sh', src, dest], env=env)
            score, vmaf = quality(src, dest, w, h)
            attempts.append(dict(bitrate=bitrate, maxrate=maxrate, ssim=score, bytes=dest.stat().st_size))
            if score >= .98: break
            bitrate *= 2; maxrate = max(maxrate * 2, bitrate)
            if bitrate > 32000:
                raise ValueError(f'{rel}: quality threshold failed even at 32000k; source retained in originals')
        if len(attempts) > 1:
            exception = f'Raised bitrate to {bitrate}k for SSIM >=0.98 (first attempt {attempts[0]["ssim"]:.6f})'
        # Do not inflate already compact, conformant H.264 footage. Every clip is
        # first tested with the requested two-pass recipe; this fallback preserves
        # source pixels and frames losslessly and merely updates the level metadata.
        if ((src.stat().st_size < dest.stat().st_size or cached and cached['exception'].startswith('Lossless'))
                and s['width'] == w and s['height'] == h
                and s['profile'] == 'High' and s['pix_fmt'] == 'yuv420p'):
            run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:v:0', '-c:v', 'copy',
                 '-bsf:v', 'h264_metadata=level=4.2:sample_aspect_ratio=1/1', '-aspect', f'{w}:{h}', '-an', '-movflags', '+faststart', dest])
            run(['python3', ROOT / 'scripts/perf/normalize-mp4-sar.py', dest])
            score, vmaf = quality(src, dest, w, h)
            exception = 'Lossless source stream copy: already fits rendition; two-pass encode inflated bytes'
        result = probe(dest, True)
        d = result['streams'][0]
        frames = result['frames']
        assert len(frames) == len(source_frames), (rel, len(source_frames), len(frames))
        timestamps = [float(f['best_effort_timestamp_time']) for f in frames]
        original_times = [float(f['best_effort_timestamp_time']) for f in source_frames]
        max_delta = max(abs((a-timestamps[0])-(b-original_times[0])) for a,b in zip(timestamps, original_times))
        assert max_delta <= .0001, (rel, 'timestamp mismatch', max_delta)
        duration_delta = abs(float(s['duration']) - float(d['duration']))
        assert duration_delta <= .001, (rel, 'duration mismatch', s['duration'], d['duration'])
        assert d['codec_name'] == 'h264' and d['pix_fmt'] == 'yuv420p' and d['profile'] == 'High' and d['level'] == 42
        poster = ROOT / 'public/videos/posters' / dest.relative_to(ROOT / 'public/videos').with_suffix('.jpg')
        poster.parent.mkdir(parents=True, exist_ok=True)
        # Retain existing desktop posters; mobile posters come directly from the preserved source.
        if mobile or not poster.exists():
            run(['ffmpeg', '-v', 'error', '-y', '-threads', '2', '-i', src, '-vf', f'scale={w}:{h}:flags=lanczos,setsar=1',
                 '-frames:v', '1', '-q:v', '2', '-threads', '1', poster])
        record = dict(file=str(dest.relative_to(ROOT)), source=str(src.relative_to(ROOT)), sourceRef=item['ref'],
                      sourceBytes=src.stat().st_size, bytes=dest.stat().st_size, width=w, height=h,
                      sourceWidth=s['width'], sourceHeight=s['height'], ssim=score, vmaf=vmaf,
                      frames=len(frames), sourceFrames=len(source_frames), duration=d['duration'], sourceDuration=s['duration'],
                      maxTimestampDelta=max_delta, durationDelta=duration_delta,
                      sampleAspectRatio=d.get('sample_aspect_ratio'), profile=d['profile'], level=d['level'], pixFmt=d['pix_fmt'], bitrate=bitrate, maxrate=maxrate,
                      exception=exception, attempts=attempts, sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
        record_path.write_text(json.dumps(record, indent=2)+'\n')
        records.append(record)
        print(f'{rel} {"mobile" if mobile else "desktop"}: {w}x{h}, {score:.6f}, {dest.stat().st_size:,} bytes {exception}', flush=True)
    return records

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--only', default=''); parser.add_argument('--jobs', type=int, default=2)
    args = parser.parse_args()
    sources = json.loads((ROOT / 'scripts/perf/video-sources.json').read_text())
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        futures = {pool.submit(encode, s): s for s in sources if args.only in s['file']}
        failed = []
        for future in concurrent.futures.as_completed(futures):
            try: future.result()
            except Exception as e:
                failed.append(futures[future]['file'])
                print(f'FAILED {futures[future]["file"]}: {e}\n{getattr(e, "stderr", "")}', flush=True)
        if failed: raise SystemExit(f'Failed: {failed}')
