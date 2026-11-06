import { Fragment, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CaretRight, Check, MagnifyingGlass } from '@phosphor-icons/react';
import { SearchField } from './SearchField';
import { Sheet } from './Sheet';
import { loadSearchIndex, pruneSearchIndex, type IndexedChapter } from '../data/bible';
import { abbrOf } from '../data/catalog';
import { useBookName, useBooks } from '../hooks';
import { highlightRanges, minChars, PAGE_SIZE, parseReference, searchVerses, type Hit } from '../search';
import { useLibrary } from '../state/library';
import { trackFeature } from '../analytics';
import { Chip } from './Chip';
import { useSettings } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { go } from '../router';
import { refLabel } from '../ref';
import { useT } from '../i18n';
import { Row } from './Row';
import { Empty } from './Empty';

function Highlighted({ hit, query }: { hit: Hit; query: string }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  highlightRanges(query, hit.text).forEach(([a, b], i) => {
    parts.push(hit.text.slice(at, a), <mark key={i}>{hit.text.slice(a, b)}</mark>);
    at = b;
  });
  parts.push(hit.text.slice(at));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

/** Versions included in the search. Kept while the app is open, so reopening the search keeps the choice. */
let sessionSelection: string[] = [];

export function SearchSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const notify = useUI((s) => s.notify);
  const goTo = useStudy((s) => s.goTo);
  const versionId = useSettings((s) => s.versionId);
  const setSetting = useSettings((s) => s.set);
  const installed = useLibrary((s) => s.installed);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const books = useBooks();
  const bookName = useBookName();

  // Installed versions, the active one first. The selection only keeps versions that are still installed.
  const versions = useMemo(
    () => Object.keys(installed).sort((a, b) => Number(b === versionId) - Number(a === versionId) || a.localeCompare(b)),
    [installed, versionId],
  );
  const [picked, setPicked] = useState<string[]>(sessionSelection);
  const selected = useMemo(() => {
    const kept = versions.filter((v) => picked.includes(v));
    return kept.length > 0 ? kept : [versionId];
  }, [versions, picked, versionId]);
  const key = selected.join(',');

  const toggle = (id: string) => {
    trackFeature('search_versions');
    const next = selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id];
    if (next.length === 0) return;
    sessionSelection = next;
    setPicked(next);
  };

  // Reads the selected versions from IndexedDB, only the ones not in memory yet.
  const [indexes, setIndexes] = useState<Record<string, IndexedChapter[]>>({});
  useEffect(() => {
    let live = true;
    selected.forEach((id) =>
      loadSearchIndex(id)
        .then((c) => live && setIndexes((x) => (x[id] === c ? x : { ...x, [id]: c })))
        .catch(() => live && setIndexes((x) => ({ ...x, [id]: [] }))),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // Closing the search frees the other versions from memory.
  useEffect(() => () => pruneSearchIndex([useSettings.getState().versionId]), []);

  // Null while some selected version is still loading.
  const chapters = useMemo(() => (selected.every((id) => indexes[id]) ? selected : null), [selected, indexes]);
  const multi = selected.length > 1;

  const ref = useMemo(() => parseReference(dq, books), [dq, books]);
  const hits = useMemo(
    () => (chapters ? searchVerses(dq, chapters.map((id) => ({ versionId: id, chapters: indexes[id] })), versionId) : []),
    [dq, chapters, indexes, versionId],
  );
  const shown = hits.slice(0, limit);

  // A new search goes back to the first page.
  useEffect(() => setLimit(PAGE_SIZE), [dq, chapters]);

  const open = (book: string, chapter: number, verse?: number, version = versionId) => {
    // Scroll first: the verse focus triggered by goTo scrolls to the verse and must not be undone.
    scrollTo(0, 0);
    if (version !== versionId) {
      setSetting('versionId', version);
      notify(t('searchVersionChanged', { abbr: abbrOf(version) }));
    }
    goTo(book, chapter, verse);
    close();
    go('/');
  };

  /** Book name as the version of the result calls it, so each result reads in its own language. */
  const nameIn = (id: string, book: string) => installed[id]?.books.find((b) => b.id === book)?.name ?? bookName(book);

  const typed = dq.trim().length >= minChars(dq);
  const tooShort = !typed && dq.trim().length > 0;

  return (
    <Sheet
      title={t('search')}
      icon={MagnifyingGlass}
      onClose={close}
      tall
      pinned={
        <>
        <SearchField
          autoFocus
          dictate={{ onStart: () => trackFeature('search_dictation') }}
          value={q}
          onChange={setQ}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchLabel')}
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            // A recognized reference opens the passage; otherwise it dismisses the keyboard to show the results.
            if (ref) open(ref.book.id, ref.chapter, ref.verse);
            else e.currentTarget.blur();
          }}
        />
        {versions.length > 1 && (
          <div className="vchips" role="group" aria-label={t('searchVersions')}>
            {versions.map((id) => {
              const on = selected.includes(id);
              return (
                <button key={id} className="chip-btn" aria-pressed={on} onClick={() => toggle(id)}>
                  {on && <Check size={14} weight="bold" aria-hidden="true" />}
                  {abbrOf(id)}
                </button>
              );
            })}
          </div>
        )}
        </>
      }
    >
      {ref && (
        <Row
          className="goto"
          eyebrow={t('goTo')}
          title={refLabel(ref.book.name, ref.chapter, ref.verse, ref.verseEnd)}
          onClick={() => open(ref.book.id, ref.chapter, ref.verse)}
          end={<CaretRight size={18} weight="light" color="var(--muted)" />}
        />
      )}

      {!typed && !ref && (
        <Empty compact icon={MagnifyingGlass} iconSize={36} hint={multi ? t('searchEmptyHintMany', { n: selected.length }) : t('searchEmptyHint', { abbr: abbrOf(versionId) })}>
          {tooShort ? t('searchMin', { n: minChars(dq) }) : t('searchEmpty')}
        </Empty>
      )}

      {typed && chapters === null && <Empty compact>{t('searchPreparing')}</Empty>}

      {typed && chapters !== null && hits.length === 0 && !ref && (
        <Empty compact hint={t('searchNoneHint')}>{t('searchNone', { q: dq.trim() })}</Empty>
      )}

      {hits.length > 0 && (
        <>
          <p className="hint" role="status">
            {shown.length < hits.length ? t('searchShown', { n: shown.length, total: hits.length }) : t.n('result', hits.length)}
            {multi && ` ${t('searchInVersions', { n: selected.length })}`}
          </p>
          {shown.map((h) => (
            <button key={`${h.versionId}.${h.book}.${h.chapter}.${h.verse}`} className="entry hit" onClick={() => open(h.book, h.chapter, h.verse, h.versionId)}>
              <div className="ref">
                {refLabel(nameIn(h.versionId, h.book), h.chapter, h.verse)}
                {multi && <Chip>{abbrOf(h.versionId)}</Chip>}
              </div>
              <p className="txt"><Highlighted hit={h} query={dq} /></p>
            </button>
          ))}
          {shown.length < hits.length && (
            <button className="row center" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              {t('searchMore')}
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
