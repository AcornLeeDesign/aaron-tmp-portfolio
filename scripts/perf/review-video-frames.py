#!/usr/bin/env python3
"""Native-pixel crops for reviewing text: scaled source left, delivered MP4 right.
Rows sample 20%, 50%, and 80% of each clip. SSIM/timing checks remain full-clip.
"""
import json, subprocess, tempfile
from pathlib import Path
root = Path(__file__).resolve().parents[2]
out = root / 'claude-docs/perf-data/video-review'
out.mkdir(parents=True, exist_ok=True)
for name in ['doordash/status-logic-doc', 'doordash/printer-types', 'nova_walkthrough', 'transcript']:
    for mobile in (False, True):
        file = name + ('-mobile' if mobile else '')
        record = json.loads((root / 'claude-docs/perf-data/combined-video-quality' / (file.replace('/', '__') + '.mp4.json')).read_text())
        w,h = record['width'],record['height']
        with tempfile.TemporaryDirectory() as temp:
            crops = []
            for index, fraction in enumerate([.2,.5,.8]):
                t = str(float(record['duration']) * fraction)
                crop = Path(temp) / f'{index}.png'
                graph = (f'[0:v]scale={w}:{h}:flags=lanczos,setsar=1,crop=640:360:(iw-640)/2:(ih-360)/2[a];'
                         '[1:v]setsar=1,crop=640:360:(iw-640)/2:(ih-360)/2[b];[a][b]hstack')
                subprocess.run(['ffmpeg','-v','error','-y','-threads','2','-ss',t,'-i',str(root/record['source']),
                                '-threads','2','-ss',t,'-i',str(root/record['file']),'-filter_complex_threads','1',
                                '-filter_complex',graph,'-frames:v','1','-threads','1',str(crop)],check=True)
                crops += ['-i',str(crop)]
            subprocess.run(['ffmpeg','-v','error','-y',*crops,'-filter_complex_threads','1','-filter_complex','vstack=inputs=3',
                            '-frames:v','1','-threads','1',str(out/(file.replace('/','__')+'.png'))],check=True)
        print(file,flush=True)
