"""Record delivered video/poster metadata with ffprobe (no encodes)."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

rows = []
for path in sorted(Path('public/videos').rglob('*')):
    if path.suffix not in ('.mp4', '.webm', '.jpg') or 'originals' in path.parts:
        continue
    data = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'quiet', '-show_streams', '-show_format', '-of', 'json', str(path),
    ]))
    stream, container = data['streams'][0], data['format']
    rows.append(dict(
        path='/' + str(path.relative_to('public')), bytes=path.stat().st_size,
        width=stream.get('width'), height=stream.get('height'), codec=stream.get('codec_name'),
        fps=stream.get('avg_frame_rate'), duration=container.get('duration'),
        bitrate=container.get('bit_rate'), pixelFormat=stream.get('pix_fmt'),
        sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
    ))
label = sys.argv[1] if len(sys.argv) > 1 else 'after'
Path(f'claude-docs/perf-data/media-{label}.json').write_text(json.dumps(rows, indent=2) + '\n')
print(f'Inventoried {len(rows)} files.')
