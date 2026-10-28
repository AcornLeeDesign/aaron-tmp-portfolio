#!/usr/bin/env python3
"""Quality-first, resumable CRF search from git-provenance originals (never derivatives).

Run: python3 scripts/perf/reencode-quality.py [--only substring] [--jobs 2]
SSIM compares every source frame scaled with Lanczos to rendition dimensions.
Candidates are installed atomically only after size, quality and timing validation.
"""
import argparse
import concurrent.futures
import hashlib
import json
import math
import runpy
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
helpers = runpy.run_path(str(Path(__file__).with_name('encode-videos.py')))
run, probe, dimensions, quality = [helpers[k] for k in ('run', 'probe', 'dimensions', 'quality')]
preserve = runpy.run_path(str(Path(__file__).with_name('preserve-video-duration.py')))['preserve']
normalize = runpy.run_path(str(Path(__file__).with_name('normalize-mp4-sar.py')))['normalize']
DATA = ROOT / 'claude-docs/perf-data/reencode-quality'
THRESHOLD = .999


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rates(path):
    """Video packet bytes: average and maximum sliding [PTS, PTS+1s) window."""
    data = json.loads(run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                          '-show_packets', '-show_entries', 'packet=pts_time,size',
                          '-of', 'json', path]).stdout)
    packets = sorted((float(p['pts_time']), int(p['size'])) for p in data['packets'])
    left = total = peak = 0
    for right, (time, size) in enumerate(packets):
        total += size
        while time - packets[left][0] >= 1:
            total -= packets[left][1]
            left += 1
        peak = max(peak, total)
    duration = float(probe(path)['streams'][0]['duration'])
    return dict(bytes=path.stat().st_size, duration=duration,
                avgKbps=sum(p[1] for p in packets) * 8 / duration / 1000,
                peakKbps=peak * 8 / 1000)


def encode(item):
    rel = Path(item['file'])
    src = ROOT / 'public/videos/originals' / rel
    if not src.exists():
        src.parent.mkdir(parents=True, exist_ok=True)
        import subprocess
        with src.open('wb') as f:
            subprocess.run(['git', 'show', f"{item['ref']}:{item['path']}"], stdout=f, check=True)
    source_blob = run(['git', 'rev-parse', f"{item['ref']}:{item['path']}"]).stdout.strip()
    assert run(['git', 'hash-object', src]).stdout.strip() == source_blob, f'{rel}: original differs from Git reference'
    source = probe(src, True)
    s = source['streams'][0]
    source_rates = rates(src)
    for mobile in (False, True):
        name = rel.with_stem(rel.stem + '-mobile') if mobile else rel
        dest = ROOT / 'public/videos' / name
        record_path = DATA / (str(name).replace('/', '__') + '.json')
        if record_path.exists():
            old = json.loads(record_path.read_text())
            if old['sha256'] == digest(dest) and old['sourceSha256'] == digest(src):
                continue
        before = rates(dest)
        w, h = dimensions(s, 1280 if mobile else 1920)
        # Start below the old observed peak, with a one-second VBV reservoir.
        cap = max(128, math.floor(before['peakKbps'] * .75))
        attempts = []
        with tempfile.TemporaryDirectory(prefix='quality-encode-') as directory:
            candidate, best = Path(directory) / 'candidate.mp4', Path(directory) / 'best.mp4'
            selected = None
            # Already compact, conformant originals need no additional lossy generation.
            copy_compact = (s['width'] == w and s['height'] == h
                            and s['codec_name'] == 'h264' and source_rates['avgKbps'] < 500)
            for cap_attempt in range(0 if copy_compact else 8):
                # Tighten CRF until quality passes. Failure at CRF 1 means
                # VBV is limiting quality: raise the cap, never lower the gate.
                crf = 20
                last_failure = None
                passing = False
                while crf >= 1:
                    run(['ffmpeg', '-v', 'error', '-y', '-threads', '2', '-i', src,
                         '-map', '0:v:0', '-an', '-vf', f'scale={w}:{h}:flags=lanczos,setsar=1',
                         '-fps_mode', 'passthrough', '-enc_time_base', s['time_base'],
                         '-c:v', 'libx264', '-threads', '2', '-preset', 'slow',
                         '-profile:v', 'high', '-level:v', '4.2', '-pix_fmt', 'yuv420p',
                         '-x264opts', 'qcomp=0.5:aq-mode=2:aq-strength=0.8:bframes=2:b-adapt=2:b-pyramid=none',
                         # High profile disallows x264 lossless; QP floor 1 is enough
                         # to detect whether the cap is binding at this quality gate.
                         '-crf', str(max(1, crf)), '-maxrate', f'{cap}k', '-bufsize', f'{cap}k',
                         '-movie_timescale', s['time_base'].split('/')[1],
                         '-video_track_timescale', s['time_base'].split('/')[1],
                         '-movflags', '+faststart', candidate])
                    preserve(src, candidate)
                    score, _ = quality(src, candidate, w, h)
                    attempt = dict(crf=max(1, crf), maxrateKbps=cap, bufsizeKbits=cap,
                                   ssim=score, bytes=candidate.stat().st_size)
                    attempts.append(attempt)
                    attempts_dir = DATA.parent / 'reencode-attempts'
                    attempts_dir.mkdir(exist_ok=True)
                    (attempts_dir / record_path.name).write_text(json.dumps(attempts, indent=2) + '\n')
                    print(f'{name}: CRF {crf}, cap {cap}, SSIM {score}, {attempt["bytes"]} bytes', flush=True)
                    if score >= THRESHOLD:
                        passing = True
                        if candidate.stat().st_size <= source_rates['bytes']:
                            shutil.copyfile(candidate, best)
                            selected = attempt
                        # Search the intervening odd CRF before accepting. The
                        # result is within one CRF step of the passing boundary.
                        if last_failure is not None and last_failure - crf > 1:
                            last_failure, crf = None, crf + 1
                            continue
                        break
                    if selected:
                        break
                    recent = [a for a in attempts if a['maxrateKbps'] == cap][-3:]
                    if len(recent) == 3 and max(a['ssim'] for a in recent) - min(a['ssim'] for a in recent) < .00005:
                        # CRF has stopped affecting quality: VBV is binding.
                        break
                    last_failure = crf
                    crf = crf - 2 if crf > 2 else crf - 1
                if selected:
                    break
                # Stream-copy only when it also respects rendition dimensions.
                if s['width'] == w and s['height'] == h and s['codec_name'] == 'h264':
                    break
                if passing and cap_attempt >= 1:
                    break
                cap *= 2
            method = 'CRF search'
            if selected is None:
                if s['width'] != w or s['height'] != h or s['codec_name'] != 'h264':
                    raise ValueError(f'{name}: no candidate meets quality AND source size; source not installed above width cap')
                run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-map', '0:v:0',
                     '-c:v', 'copy', '-an', '-map_metadata', '-1', '-metadata', 'encoder=',
                     '-write_btrt', '0', '-bsf:v', 'h264_metadata=level=4.2:sample_aspect_ratio=1/1',
                     '-aspect', f'{w}:{h}', '-movflags', '+faststart', best])
                normalize(best)
                score, _ = quality(src, best, w, h)
                selected = dict(ssim=score, crf=None, maxrateKbps=None, bufsizeKbits=None)
                method = 'Stream copy (compact original)' if copy_compact else 'Stream copy (source preserves quality within size limit)'
            result = probe(best, True)
            d = result['streams'][0]
            frames, original = result['frames'], source['frames']
            assert len(frames) == len(original), (name, 'frame count')
            times = [float(f['best_effort_timestamp_time']) for f in frames]
            original_times = [float(f['best_effort_timestamp_time']) for f in original]
            delta = max(abs((a-times[0])-(b-original_times[0])) for a,b in zip(times, original_times))
            assert delta <= .0001, (name, 'timestamps', delta)
            assert abs(float(d['duration']) - float(s['duration'])) <= .001, (name, 'duration')
            assert selected['ssim'] >= THRESHOLD
            assert best.stat().st_size <= src.stat().st_size, (name, 'inflated stream copy')
            assert (d['codec_name'], d['profile'], d['level'], d['pix_fmt'], d['sample_aspect_ratio']) == ('h264', 'High', 42, 'yuv420p', '1:1')
            after = rates(best)
            record = dict(file=str(name), sourceRef=item['ref'], sourcePath=item['path'],
                          sourceSha256=digest(src), sha256=digest(best), before=before,
                          after=after, source=source_rates, width=w, height=h,
                          method=method, selected=selected, attempts=attempts,
                          frames=len(frames), maxTimestampDelta=delta,
                          durationDelta=abs(float(d['duration'])-float(s['duration'])))
            shutil.copyfile(best, dest.with_suffix('.new.mp4'))
            dest.with_suffix('.new.mp4').replace(dest)
            record_path.write_text(json.dumps(record, indent=2) + '\n')
            print(f'ACCEPTED {name}: {selected["ssim"]} {after["bytes"]} bytes ({method})', flush=True)


def report():
    records = [json.loads(p.read_text()) for p in sorted(DATA.glob('*.json'))]
    lines = ['# Quality-first video re-encoding', '',
             'Original exports are restored using `scripts/perf/video-sources.json`; no delivered derivative is a reference. '
             'Run `python3 scripts/perf/reencode-quality.py`. Results resume only when source and output SHA-256 match.', '',
             'Each encode uses libx264 slow, High/4.2, yuv420p, square pixels, faststart, no audio; '
             'desktop width ≤1920 and mobile ≤1280, without upscaling. The CRF search starts at 20 and tightens quality until it passes, checking intermediate integer CRFs. Compact originals below 500 kb/s that already fit are stream-copied. '
             'The initial VBV cap is 75% of the old measured peak with a one-second buffer; '
             'caps double when no candidate satisfies both SSIM ≥0.999 and source size. '
             'A source stream copy is permitted only within the rendition dimensions. No slow-network rendition exists.', '',
             'SSIM pairs every decoded frame against the original scaled to output size with Lanczos. '
             'This is a stringent lossy quality threshold, not mathematical pixel identity. '
             'Frame counts, timestamps (≤0.1 ms), duration (≤1 ms), codec and size are asserted before installation. '
             'Average bitrate counts video packet bytes / duration; peak is the maximum sliding one-second PTS window '
             '(not just integer-aligned buckets). Container file sizes include metadata. All rates below are kb/s, sizes MiB.', '',
             '| Clip | Original MiB | Before → after MiB | Average before → after | Peak before → after | SSIM | CRF / VBV cap |',
             '|---|---:|---:|---:|---:|---:|---|']
    for r in records:
        b,a,s = r['before'],r['after'],r['selected']
        lines.append(f'| `{r["file"]}` | {r["source"]["bytes"]/2**20:.3f} | {b["bytes"]/2**20:.3f} → {a["bytes"]/2**20:.3f} | {b["avgKbps"]:.0f} → {a["avgKbps"]:.0f} | {b["peakKbps"]:.0f} → {a["peakKbps"]:.0f} | {s["ssim"]:.6f} | {str(s["crf"])+" / "+str(s["maxrateKbps"]) if s["crf"] is not None else "stream copy"} |')
    pending_path = DATA.parent / 'reencode-pending.json'
    pending = json.loads(pending_path.read_text()) if pending_path.exists() else []
    accepted = {r['file'] for r in records}
    pending = [r for r in pending if r['file'] not in accepted]
    if pending:
        lines += ['', '## Pending constraint decisions', '',
                  'These existing files were left unchanged. No tested replacement meets all three requirements '
                  '(SSIM ≥0.999, mobile width ≤1280, bytes ≤source). They are not counted as accepted outputs. '
                  'Stream-copying would preserve source pixels and size but exceed the mobile width limit; '
                  'a qualifying resized encode exceeds source size.', '',
                  '| Clip | Original width / MiB | Existing MiB / SSIM | Existing avg / peak kbps (unchanged) | Smallest passing tested MiB / SSIM |',
                  '|---|---:|---:|---:|---:|']
        for r in pending:
            best = r['bestPassingAttempt']
            lines.append(f'| `{r["file"]}` | {r["sourceWidth"]} / {r["source"]["bytes"]/2**20:.3f} | {r["before"]["bytes"]/2**20:.3f} / {r["ssim"]:.6f} | {r["before"]["avgKbps"]:.0f} / {r["before"]["peakKbps"]:.0f} | {best["bytes"]/2**20:.3f} / {best["ssim"]:.6f} |')
        lines += ['', 'Existing bytes and average/peak rates are unchanged; [pending records](reencode-pending.json) contain those measurements and the failed search attempts. '
                  'The strict inventory verifier intentionally fails until these decisions are resolved.']
    lines += ['', f'Validated outputs: {len(records)}. Full attempt histories, source bitrate, hashes, dimensions and timing checks: [reencode-quality](reencode-quality/).', '']
    (DATA.parent / 'reencode-report.md').write_text('\n'.join(lines))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--only', default='')
    parser.add_argument('--jobs', type=int, default=2)
    args = parser.parse_args()
    DATA.mkdir(parents=True, exist_ok=True)
    sources = json.loads((ROOT / 'scripts/perf/video-sources.json').read_text())
    priority = ['multi-line.mp4', 'transcript.mp4', 'missed-call.mp4', 'quiz_fullscreen_student.mp4', 'quiz_fullscreen_teacher.mp4', 'nuance-talking.mp4']
    sources.sort(key=lambda item: priority.index(item['file']) if item['file'] in priority else len(priority))
    failed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:
        pending = {pool.submit(encode, item): item for item in sources if args.only in item['file']}
        for future in concurrent.futures.as_completed(pending):
            try:
                future.result()
            except Exception as e:
                failed.append(pending[future]['file'])
                print(f'FAILED {pending[future]["file"]}: {e}\n{getattr(e, "stderr", "")}', flush=True)
            report()
    if failed:
        raise SystemExit(f'Failed: {failed}')
