"""Preserve a zero-hold final source frame without clipping it from the edit list.
A source may put its last PTS exactly at its declared stream duration. FFmpeg adds
one nominal frame to stts on re-encode. Shorten only the final decode sample's
hold: PTS/DTS, compressed samples and the permissive edit list stay unchanged.
Splitting a run in stts can grow moov, so update parent sizes and chunk offsets.
"""
from fractions import Fraction
from pathlib import Path
import struct

CONTAINERS = {b'moov', b'trak', b'mdia', b'minf', b'stbl', b'edts'}

def set_duration(path, seconds):
    data = Path(path).read_bytes()
    def boxes(blob):
        pos = 0
        while pos < len(blob):
            size, kind = struct.unpack_from('>I4s', blob, pos)
            assert size >= 8 and pos + size <= len(blob), 'Regular MP4 atoms required'
            yield pos, kind, blob[pos+8:pos+size]
            pos += size
    top = list(boxes(data))
    moov_pos, _, original = next(x for x in top if x[1] == b'moov')
    old_end = moov_pos + 8 + len(original)
    assert any(pos >= old_end and kind == b'mdat' for pos,kind,_ in top), 'Faststart MP4 required'
    mdhd_pos = data.index(b'mdhd') + 4
    version = data[mdhd_pos]
    scale = struct.unpack_from('>I', data, mdhd_pos + (20 if version else 12))[0]
    target = round(Fraction(seconds) * scale)
    def rebuild(blob, offset_delta):
        output = bytearray()
        for _, kind, payload in boxes(blob):
            if kind in CONTAINERS:
                payload = rebuild(payload, offset_delta)
            elif kind == b'stts':
                count = struct.unpack_from('>I', payload, 4)[0]
                runs = [struct.unpack_from('>II', payload, 8+i*8) for i in range(count)]
                adjustment = target - sum(n*duration for n,duration in runs)
                n, duration = runs.pop()
                assert duration + adjustment >= 0
                if n > 1: runs.append((n-1, duration))
                runs.append((1, duration + adjustment))
                payload = payload[:4] + struct.pack('>I', len(runs)) + b''.join(struct.pack('>II', *r) for r in runs)
            elif kind in (b'stco', b'co64'):
                count = struct.unpack_from('>I', payload, 4)[0]
                fmt, size = ('>I',4) if kind == b'stco' else ('>Q',8)
                updated = bytearray(payload)
                for i in range(count):
                    value = struct.unpack_from(fmt, payload, 8+i*size)[0]
                    if value >= old_end: struct.pack_into(fmt, updated, 8+i*size, value+offset_delta)
                payload = bytes(updated)
            output += struct.pack('>I4s', len(payload)+8, kind) + payload
        return bytes(output)
    first = rebuild(original, 0)
    updated = rebuild(original, len(first)-len(original))
    moov = struct.pack('>I4s', len(updated)+8, b'moov') + updated
    Path(path).write_bytes(data[:moov_pos] + moov + data[old_end:])
