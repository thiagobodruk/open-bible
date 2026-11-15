import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, CalendarBlank, Heart, Notebook, Notepad, PencilSimple } from '@phosphor-icons/react';
import { Button, IconButton } from './Button';
import { NoteSheet } from './NoteSheet';
import { SearchField } from './SearchField';
import { Segmented } from './Segmented';
import { Sheet } from './Sheet';
import { bookIndex } from '../data/books';
import { abbrOf } from '../data/catalog';
import { dateOfKey, dayId, refOfKey } from '../data/devotional';
import { useBookName } from '../hooks';
import { useDevotional } from '../state/devotional';
import { useSettings } from '../state/settings';
import { useStudy, type HlColor } from '../state/study';
import { useUI, type StudyTab } from '../state/ui';
import { refLabel } from '../ref';
import { track, trackFeature } from '../analytics';
import { useT } from '../i18n';
import { Chip } from './Chip';
import { ColorSwatches } from './ColorSwatches';
import { Empty } from './Empty';

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

export function StudySheet() {
  const t = useT();
  const fmtDay = useMemo(() => new Intl.DateTimeFormat(t.lang, { day: 'numeric', month: 'short' }), [t.lang]);
  const fmt = useMemo(() => new Intl.DateTimeFormat(t.lang, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }), [t.lang]);
  const { highlights, notes, likes, goTo } = useStudy();
  const close = useUI((s) => s.close);
  const open = useUI((s) => s.open);
  const uiLang = useSettings((s) => s.uiLang);
  const pack = useDevotional((s) => s.pack);
  const [editing, setEditing] = useState<Entry | null>(null);
  const bookName = useBookName();
  const versionId = useSettings((s) => s.versionId);
  const [color, setColor] = useState<HlColor | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'date', dir: 'desc' });
  // The tab comes from whoever opened the sheet (the "See" shortcut of the devotional opens it on the liked ones).
  const [tab, setTab] = useState<StudyTab>(() => useUI.getState().studyTab);
  const [likeDir, setLikeDir] = useState<SortDir>('desc');
  useEffect(() => () => useUI.setState({ studyTab: 'verses' }), []);
  useEffect(() => {
    if (tab !== 'devotionals') return;
    track('devotional_likes_open');
    // The texts of the liked devotionals come from the pack of the interface language, which is already on the device or is fetched quietly.
    void useDevotional.getState().load();
  }, [tab, uiLang]);
  const likeDate = useMemo(() => new Intl.DateTimeFormat(t.lang, { day: 'numeric', month: 'long' }), [t.lang]);

  // Clicking the active sort flips the direction; clicking another starts with the most useful direction.
  const pickSort = (key: SortKey) => {
    trackFeature('study_sort');
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'date' ? 'desc' : 'asc' }));
  };

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

  const likeEntries = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const sign = likeDir === 'asc' ? 1 : -1;
    return Object.values(likes)
      .map((l) => {
        const ref = refOfKey(l.key);
        const date = dateOfKey(l.key);
        const text = pack ? (pack.moveable[l.key as keyof typeof pack.moveable] ?? pack.days[l.key]) : undefined;
        return {
          key: l.key,
          at: l.updatedAt ?? l.createdAt,
          date: date ? likeDate.format(date) : l.key,
          verse: ref ? refLabel(bookName(ref.book), ref.chapter, ref.from, ref.to) : '',
          title: text?.title,
          excerpt: text?.paragraphs[0],
        };
      })
      .filter((e) => !needle || `${e.date} ${e.title ?? ''} ${e.verse} ${e.excerpt ?? ''}`.toLowerCase().includes(needle))
      .sort((a, b) => sign * (a.at - b.at));
  }, [likes, pack, q, likeDir, likeDate, bookName]);

  const total = Object.keys(likes).length;

  const openLike = (key: string) => {
    const date = dateOfKey(key);
    if (!date) return;
    track('devotional_likes_read');
    useDevotional.setState({ day: dayId(date), source: 'likes' });
    close();
    open('devotional');
  };
  const openToday = () => {
    useDevotional.setState({ day: null, source: 'menu' });
    close();
    open('devotional');
  };
  const pickTab = (next: StudyTab) => {
    setTab(next);
    setQ('');
  };

  return (
    <>
      {/* While a note is being edited, its sheet is on top: Esc and dragging close only that one. */}
      <Sheet
        title={t('study')}
        icon={Notepad}
        onClose={() => !editing && close()}
        tall
        pinned={
          <div className="filters">
            <Segmented
              label={t('studyType')}
              value={tab}
              onChange={pickTab}
              options={[
                { value: 'verses', label: t('studyVerses') },
                {
                  value: 'devotionals',
                  label: (
                    <>
                      {t('studyDevotionals')}
                      {total > 0 && <span className="seg-n">{total}</span>}
                    </>
                  ),
                },
              ]}
            />
            {tab === 'verses' && <ColorSwatches
              label={t('filterColor')}
              describe="name"
              pressed={(c) => color === c}
              onAll={() => setColor(null)}
              onPick={(c) => {
                trackFeature('study_filter');
                setColor(color === c ? null : c);
              }}
            />}
            <div className="study-tools">
              <SearchField
                value={q}
                onChange={(v) => {
                  if (!q && v) trackFeature('study_search');
                  setQ(v);
                }}
                placeholder={t('search')}
                aria-label={t('studySearch')}
                enterKeyHint="search"
                autoCapitalize="none"
                autoCorrect="off"
                onKeyDown={(e) => e.key === 'Escape' && setQ('')}
              />
              <div className="sort" role="group" aria-label={t('sortBy')}>
                {tab === 'devotionals' ? (
                  <button className="chip-btn sort-btn" aria-pressed="true" aria-label={t('sortDate')} title={t('sortDate')} onClick={() => setLikeDir((d) => (d === 'asc' ? 'desc' : 'asc'))}>
                    <CalendarBlank size={16} weight="regular" aria-hidden="true" />
                    {likeDir === 'asc' ? <ArrowUp size={14} weight="bold" aria-label={t('sortAsc')} /> : <ArrowDown size={14} weight="bold" aria-label={t('sortDesc')} />}
                  </button>
                ) : (['date', 'bible'] as const).map((k) => {
                  const active = sort.key === k;
                  const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown;
                  const Glyph = k === 'date' ? CalendarBlank : BookOpen;
                  const label = t(k === 'date' ? 'sortDate' : 'sortBible');
                  return (
                    <button key={k} className="chip-btn sort-btn" aria-pressed={active} aria-label={label} title={label} onClick={() => pickSort(k)}>
                      <Glyph size={16} weight="regular" aria-hidden="true" />
                          {active && <Arrow size={14} weight="bold" aria-label={t(sort.dir === 'asc' ? 'sortAsc' : 'sortDesc')} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        }
      >
      {tab === 'devotionals' ? (
        <>
          {likeEntries.length === 0 && (
            <Empty
              icon={Heart}
              hint={!q && t('likedEmptyHint')}
              action={!q && <Button variant="primary" onClick={openToday}>{t('likedOpenToday')}</Button>}
            >
              {t(q ? 'studyNoMatch' : 'likedEmpty')}
            </Empty>
          )}
          {likeEntries.map((e) => (
            <div key={e.key} className="entry-row">
              <button className="entry dev-like" onClick={() => openLike(e.key)}>
                <div className="ref">
                  {e.date}
                  <span className="date">{t('likedAt', { date: fmtDay.format(e.at) })}</span>
                </div>
                <div className="dl-title">{e.title ?? e.verse}</div>
                {e.title && e.verse && <div className="dl-verse">{e.verse}</div>}
                {e.excerpt && <p className="dl-excerpt">{e.excerpt}</p>}
              </button>
            </div>
          ))}
        </>
      ) : (
        <>
      {entries.length === 0 && (
        <Empty icon={Notebook} hint={!q && !color && t('nothingHint')}>{t(q || color ? 'studyNoMatch' : 'nothingYet')}</Empty>
      )}

      {entries.map((e) => (
        <div key={e.key} className="entry-row">
          <button
          className={`entry ${e.color ? `c-${e.color}` : ''}`}
          onClick={() => {
            goTo(e.book, e.chapter, e.v1);
            close();
          }}
        >
          <div className="ref">
            {e.color && <span className={`dot c-${e.color}`} />}
            {refLabel(bookName(e.book), e.chapter, e.v1, e.v2)}
            <span className="date">{fmt.format(e.updatedAt ?? e.createdAt)}</span>
            {e.versionId && e.versionId !== versionId && <Chip className="ml-8">{abbrOf(e.versionId)}</Chip>}
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
        </>
      )}
      </Sheet>

      {editing && <NoteSheet target={{ book: editing.book, chapter: editing.chapter, v1: editing.v1, v2: editing.v2, excerpt: editing.text }} onClose={() => setEditing(null)} />}
    </>
  );
}
