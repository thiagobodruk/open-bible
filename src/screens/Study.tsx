import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, CalendarBlank, MagnifyingGlass, Notebook, PencilSimple } from '@phosphor-icons/react';
import { IconButton } from '../components/Button';
import { NoteSheet } from '../components/NoteSheet';
import { ScreenHeader } from '../components/ScreenHeader';
import { SearchField } from '../components/SearchField';
import { bookIndex } from '../data/books';
import { abbrOf } from '../data/catalog';
import { useBookName } from '../hooks';
import { useSettings } from '../state/settings';
import { HL_COLORS, useStudy, type HlColor } from '../state/study';
import { go } from '../router';
import { refLabel } from '../ref';
import { useT } from '../i18n';

interface Entry {
  key: string;
  book: string;
  chapter: number;
  v1: number;
  v2: number;
  color?: HlColor;
  text: string;
  note?: string;
  versionId: string;
  createdAt: number;
  updatedAt?: number;
}

type SortKey = 'date' | 'bible';
type SortDir = 'asc' | 'desc';

export function Study() {
  const t = useT();
  const fmt = useMemo(() => new Intl.DateTimeFormat(t.lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), [t.lang]);
  const { highlights, notes, goTo } = useStudy();
  const [editing, setEditing] = useState<Entry | null>(null);
  const bookName = useBookName();
  const versionId = useSettings((s) => s.versionId);
  const [color, setColor] = useState<HlColor | null>(null);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'bible', dir: 'asc' });

  // Clicar na ordenação ativa inverte a direção; em outra, começa pela direção mais útil.
  const pickSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'desc' : 'asc' }));

  const entries = useMemo(() => {
    const list: Entry[] = [];
    const used = new Set<string>();
    for (const n of notes) {
      const hl = highlights[`${n.book}.${n.chapter}.${n.verseStart}`];
      if (hl) used.add(`${n.book}.${n.chapter}.${n.verseStart}`);
      list.push({ key: n.id, book: n.book, chapter: n.chapter, v1: n.verseStart, v2: n.verseEnd, color: hl?.color, text: n.excerpt, note: n.text, versionId: n.versionId, createdAt: n.createdAt, updatedAt: n.updatedAt });
    }
    for (const [k, h] of Object.entries(highlights)) {
      if (used.has(k)) continue;
      list.push({ key: k, book: h.book, chapter: h.chapter, v1: h.verse, v2: h.verse, color: h.color, text: h.text, versionId: h.versionId, createdAt: h.createdAt });
    }
    const needle = q.trim().toLowerCase();
    const sign = sort.dir === 'asc' ? 1 : -1;
    const byBible = (a: Entry, b: Entry) => bookIndex(a.book) - bookIndex(b.book) || a.chapter - b.chapter || a.v1 - b.v1;
    const byDate = (a: Entry, b: Entry) => (a.updatedAt ?? a.createdAt) - (b.updatedAt ?? b.createdAt);
    return list
      .filter((e) => (color ? e.color === color : true))
      .filter((e) => !needle || `${refLabel(bookName(e.book), e.chapter, e.v1, e.v2)} ${e.text} ${e.note ?? ''}`.toLowerCase().includes(needle))
      .sort((a, b) => sign * (sort.key === 'date' ? byDate(a, b) || byBible(a, b) : byBible(a, b)));
  }, [highlights, notes, color, q, sort, bookName]);

  return (
    <div className="screen">
      <ScreenHeader title={t('study')} />
      <div className="screen-body">
        <div className="filters">
          <div className="sheet-colors" role="group" aria-label={t('filterColor')}>
            <button className="swatch all" aria-pressed={color === null} aria-label={t('allColors')} onClick={() => setColor(null)} />
            {HL_COLORS.map((c) => (
              <button key={c} className={`swatch c-${c}`} aria-pressed={color === c} aria-label={t(c)} onClick={() => setColor(color === c ? null : c)} />
            ))}
          </div>
          <div className="study-tools">
            {searching ? (
              <SearchField
                autoFocus
                value={q}
                onChange={setQ}
                placeholder={t('search')}
                aria-label={t('studySearch')}
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                onBlur={() => !q && setSearching(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setQ('');
                    setSearching(false);
                  }
                }}
              />
            ) : (
              <IconButton icon={MagnifyingGlass} label={t('studySearch')} onClick={() => setSearching(true)} />
            )}
            <div className="sort" role="group" aria-label={t('sortBy')}>
              {(['date', 'bible'] as const).map((k) => {
                const active = sort.key === k;
                const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown;
                const Glyph = k === 'date' ? CalendarBlank : BookOpen;
                const label = t(k === 'date' ? 'sortDate' : 'sortBible');
                return (
                  <button key={k} className="chip-btn sort-btn" aria-pressed={active} aria-label={label} title={label} onClick={() => pickSort(k)}>
                    <Glyph size={16} weight="regular" aria-hidden="true" />
                    {!searching && label}
                    {active && <Arrow size={14} weight="bold" aria-label={t(sort.dir === 'asc' ? 'sortAsc' : 'sortDesc')} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {entries.length === 0 && (
          <div className="empty">
            <Notebook size={40} weight="light" />
            <p>{t(q || color ? 'studyNoMatch' : 'nothingYet')}</p>
            {!q && !color && <p style={{ fontSize: 14 }}>{t('nothingHint')}</p>}
          </div>
        )}

        {entries.map((e) => (
          <div key={e.key} className="entry-row">
          <button
            className={`entry ${e.color ? `c-${e.color}` : ''}`}
            onClick={() => {
              goTo(e.book, e.chapter, e.v1);
              go('/');
            }}
          >
            <div className="ref">
              {e.color && <span className={`dot c-${e.color}`} />}
              {refLabel(bookName(e.book), e.chapter, e.v1, e.v2)}
              <span className="date">{fmt.format(e.updatedAt ?? e.createdAt)}</span>
              {e.versionId && e.versionId !== versionId && <span className="chip" style={{ marginLeft: 8 }}>{abbrOf(e.versionId)}</span>}
            </div>
            <p className="txt">{e.text}</p>
            {e.note && <p className="nt">{e.note}</p>}
          </button>
          <IconButton
            className="entry-edit"
            icon={PencilSimple}
            label={t('editRef', { ref: refLabel(bookName(e.book), e.chapter, e.v1, e.v2) })}
            onClick={() => setEditing(e)}
          />
          </div>
        ))}
      </div>

      {editing && <NoteSheet target={{ book: editing.book, chapter: editing.chapter, v1: editing.v1, v2: editing.v2, excerpt: editing.text }} onClose={() => setEditing(null)} />}
    </div>
  );
}
