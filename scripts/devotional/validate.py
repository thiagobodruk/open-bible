"""Checks a devotional pack: structure, word counts, style and every Bible reference written in the development paragraph.

Usage: python3 -I scripts/devotional/validate.py PACK.json LANG   (LANG: pt-BR or en)
"""
import json, re, sys

pack = json.load(open(sys.argv[1], encoding='utf-8'))
lang = sys.argv[2]
ROOT = __file__.rsplit('/scripts/', 1)[0]
BIBLE = '/home/user/bible-data/json/' + ('pt_nvi.json' if lang == 'pt-BR' else 'en_web.json')
bible = json.load(open(BIBLE, encoding='utf-8-sig'))

src = open(ROOT + '/src/data/books.ts', encoding='utf-8').read()
if lang == 'pt-BR':
    names = re.findall(r"\['[^']+', '([^']+)', \d+\]", src)
else:
    en = open(ROOT + '/src/i18n/books.ts', encoding='utf-8').read()
    names = re.search(r"en: '([^']+)'", en).group(1).split('|')
assert len(names) == 66, len(names)
index = {n: i for i, n in enumerate(names)}
alt = '|'.join(re.escape(n) for n in sorted(names, key=len, reverse=True))
REF = re.compile(r'(?<![\w])(%s) (\d+):(\d+)(?:-(\d+))?' % alt)

END = 'em nome de Jesus, Amém!' if lang == 'pt-BR' else "in Jesus' name, Amen!"
errs, refs = [], 0
for k, e in {**pack['days'], **pack['moveable']}.items():
    if set(e) != {'title', 'paragraphs', 'today', 'prayer'}: errs.append((k, 'fields')); continue
    ps = e['paragraphs']
    if len(ps) != 3: errs.append((k, 'paragraphs', len(ps))); continue
    if len(e['title'].split()) > 7 or e['title'].rstrip().endswith('.'): errs.append((k, 'title'))
    if not e['prayer'].endswith(END): errs.append((k, 'prayer end'))
    blob = ' '.join([e['title'], *ps, e['today'], e['prayer']])
    if re.search(r'[—–()]', blob): errs.append((k, 'dash/paren'))
    n = [len(p.split()) for p in ps]
    if not 25 <= n[0] <= 75: errs.append((k, 'abertura', n[0]))
    if not 70 <= n[1] <= 115: errs.append((k, 'desenvolvimento', n[1]))
    if not 25 <= n[2] <= 75: errs.append((k, 'fechamento', n[2]))
    for p_i, p in enumerate(ps):
        for m in REF.finditer(p):
            refs += 1
            b, c, v1, v2 = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4) or m.group(3))
            try:
                ch = bible[index[b]]['chapters'][c - 1]
                if v1 > v2 or v2 > len(ch): raise IndexError
            except IndexError:
                errs.append((k, 'ref does not exist', m.group(0)))
    cited = sum(len(REF.findall(p)) for p in ps[1:2])
    if cited > 2: errs.append((k, 'too many refs', cited))
print('OK' if not errs else errs, len(pack['days']), 'days,', refs, 'refs')
