#!/usr/bin/env python3
"""Check the accepted batch's complete inventory, hashes and delivery metadata."""
import hashlib, json, struct, subprocess
from pathlib import Path
root = Path(__file__).resolve().parents[2]
media = root / 'public/videos'
records = [json.loads(p.read_text()) for p in (root/'claude-docs/perf-data/combined-video-quality').glob('*.json')]
sources = json.loads((root/'scripts/perf/video-sources.json').read_text())
assert len(records) == len(sources)*2
expected = set()
for s in sources:
    p = Path(s['file'])
    expected.update([str(Path('public/videos')/p), str(Path('public/videos')/p.with_stem(p.stem+'-mobile'))])
assert {r['file'] for r in records} == expected
actual = {str(p.relative_to(root)) for p in media.rglob('*.mp4') if 'originals' not in p.parts}
assert actual == expected
assert not list(media.rglob('*.webm'))
for r in records:
    p = root/r['file']
    assert hashlib.sha256(p.read_bytes()).hexdigest() == r['sha256'], p
    assert r['ssim'] >= .98 and r['frames'] == r['sourceFrames']
    assert r['maxTimestampDelta'] <= .0001 and r['durationDelta'] <= .001
    d = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(p)]))
    assert len(d['streams']) == 1
    s = d['streams'][0]
    assert (s['codec_name'],s['profile'],s['level'],s['pix_fmt']) == ('h264','High',42,'yuv420p')
    assert s['sample_aspect_ratio'] == '1:1'
    assert (s['width'],s['height']) == (r['width'],r['height'])
    assert s['width'] % 2 == 0 and s['height'] % 2 == 0
    assert abs(float(s['duration'])-float(r['sourceDuration'])) <= .001
    with p.open('rb') as f:
        boxes=[]
        while header:=f.read(8):
            size,kind=struct.unpack('>I4s',header)
            assert size>=8
            boxes.append(kind);f.seek(size-8,1)
    assert boxes.index(b'moov') < boxes.index(b'mdat')
    poster = media/'posters'/p.relative_to(media).with_suffix('.jpg')
    assert poster.exists(), poster
result = {'outputs':len(records),'sources':len(sources),'minSSIM':min(r['ssim'] for r in records),
          'maxDurationDelta':max(r['durationDelta'] for r in records),
          'maxTimestampDelta':max(r['maxTimestampDelta'] for r in records),
          'frames':sum(r['frames'] for r in records),
          'losslessCopies':sum(r['exception'].startswith('Lossless') for r in records),
          'checks':'Inventory, SHA-256, SSIM records, frame/timing records, codec, profile, level, pixel format, SAR, dimensions, no audio, faststart, poster presence, no WebM'}
(root/'claude-docs/perf-data/video-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
