#!/usr/bin/env python3
"""Set MP4's pixel-aspect atom to 1:1 after lossless H.264 VUI normalization.
FFmpeg's -aspect option rounds the display ratio, producing a slightly non-square
pasp for some sizes. Change only the fixed-size metadata atom, never the samples.
"""
import struct, sys
from pathlib import Path

def normalize(path):
    data = bytearray(Path(path).read_bytes())
    def walk(start, end):
        while start < end:
            size, kind = struct.unpack_from('>I4s', data, start)
            assert size >= 8 and start+size <= end
            payload = start+8
            if kind in {b'moov',b'trak',b'mdia',b'minf',b'stbl'}: walk(payload,start+size)
            elif kind == b'stsd': walk(payload+8,start+size)
            elif kind in {b'avc1',b'avc3'}: walk(payload+78,start+size)
            elif kind == b'pasp':
                assert size == 16
                struct.pack_into('>II',data,payload,1,1)
            start += size
    walk(0,len(data))
    Path(path).write_bytes(data)

if __name__ == '__main__': normalize(sys.argv[1])
