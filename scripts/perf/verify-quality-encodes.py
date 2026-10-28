#!/usr/bin/env python3
"""Verify current delivery files against quality-search records (no stale hashes)."""
import argparse
import hashlib
import json
import struct
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--accepted-only', action='store_true', help='Validate accepted outputs while explicitly reporting pending decisions')
args = parser.parse_args()
sources = json.loads((ROOT / 'scripts/perf/video-sources.json').read_text())
expected = set()
for source in sources:
    path = Path(source['file'])
    expected.update([str(path), str(path.with_stem(path.stem + '-mobile'))])
records = [json.loads(p.read_text()) for p in (ROOT / 'claude-docs/perf-data/reencode-quality').glob('*.json')]
accepted = {r['file'] for r in records}
assert accepted <= expected
missing = sorted(expected - accepted)
actual = {str(p.relative_to(ROOT / 'public/videos')) for p in (ROOT / 'public/videos').rglob('*.mp4') if 'originals' not in p.parts}
assert actual == expected, 'Unexpected or missing delivery files'
for r in records:
    path = ROOT / 'public/videos' / r['file']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == r['sha256'], path
    assert path.stat().st_size == r['after']['bytes'] <= r['source']['bytes'], path
    assert r['selected']['ssim'] >= .999, path
    assert r['maxTimestampDelta'] <= .0001 and r['durationDelta'] <= .001, path
    info = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))
    assert len(info['streams']) == 1, path
    stream = info['streams'][0]
    assert (stream['codec_name'], stream['profile'], stream['level'], stream['pix_fmt'], stream['sample_aspect_ratio']) == ('h264', 'High', 42, 'yuv420p', '1:1'), path
    assert stream['width'] == r['width'] and stream['height'] == r['height'], path
    assert stream['width'] <= (1280 if '-mobile.' in path.name else 1920), path
    assert abs(float(stream['duration']) - r['source']['duration']) <= .001, path
    with path.open('rb') as f:
        boxes = []
        while header := f.read(8):
            size, kind = struct.unpack('>I4s', header)
            assert size >= 8
            boxes.append(kind)
            f.seek(size-8, 1)
    assert boxes.index(b'moov') < boxes.index(b'mdat'), path
result = dict(outputs=len(records), pending=missing, complete=not missing, minSSIM=min(r['selected']['ssim'] for r in records),
              beforeBytes=sum(r['before']['bytes'] for r in records), afterBytes=sum(r['after']['bytes'] for r in records),
              maxTimestampDelta=max(r['maxTimestampDelta'] for r in records),
              maxDurationDelta=max(r['durationDelta'] for r in records))
(ROOT / 'claude-docs/perf-data/reencode-verification.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result, indent=2))
if missing and not args.accepted_only:
    raise SystemExit(f'Incomplete inventory; pending constraint decisions: {missing}')
