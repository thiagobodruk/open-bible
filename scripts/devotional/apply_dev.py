"""Replaces the development paragraph (the second one) of some days of a pack.

Usage: python3 -I scripts/devotional/apply_dev.py PACK.json PATCH.json
PATCH is {"MM-DD": "new development paragraph", ...}. Everything else of the day stays as it is.
"""
import json, sys

path, patch = sys.argv[1], json.load(open(sys.argv[2], encoding='utf-8'))
pack = json.load(open(path, encoding='utf-8'))
for k, text in patch.items():
    day = pack['days'].get(k) or pack['moveable'][k]
    assert len(day['paragraphs']) == 3, k
    day['paragraphs'][1] = text.strip()
json.dump(pack, open(path, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('applied', len(patch))
