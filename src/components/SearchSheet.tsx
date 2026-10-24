import { Fragment, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { SearchField } from './SearchField';
import { Sheet } from './Sheet';
import { loadSearchIndex, type IndexedChapter } from '../data/bible';
import { abbrOf } from '../data/catalog';
import { useBookName, useBooks } from '../hooks';
import { minChars, PAGE_SIZE, parseReference, searchVerses, type Hit } from '../search';
import { useSettings } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { go } from '../router';
import { refLabel } from '../ref';
import { useT } from '../i18n';

function Highlighted({ hit }: { hit: Hit }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  hit.ranges.forEach(([a, b], i) => {
    parts.push(hit.text.slice(at, a), <mark key={i}>{hit.text.slice(a, b)}</mark>);
    at = b;
  });
  parts.push(hit.text.slice(at));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

export function SearchSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const goTo = useStudy((s) => s.goTo);
  const versionId = useSettings((s) => s.versionId);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const books = useBooks();
  const bookName = useBookName();
  const [chapters, setChapters] = useState<IndexedChapter[] | null>(null);

  // Lê a versão inteira do IndexedDB uma vez, ao abrir a busca.
  useEffect(() => {
    let live = true;
    setChapters(null);
    loadSearchIndex(versionId).then((c) => live && setChapters(c)).catch(() => live && setChapters([]));
    return () => {
      live = false;
    };
  }, [versionId]);

  const ref = useMemo(() => parseReference(dq, books), [dq, books]);
  const hits = useMemo(() => searchVerses(dq, chapters ?? []), [dq, chapters]);
  const shown = hits.slice(0, limit);

  // Nova busca volta para a primeira página.
  useEffect(() => setLimit(PAGE_SIZE), [dq, chapters]);

  const open = (book: string, chapter: number, verse?: number) => {
    goTo(book, chapter, verse);
    close();
    go('/');
    scrollTo(0, 0);
  };

  const typed = dq.trim().length >= minChars(dq);
  const tooShort = !typed && dq.trim().length > 0;

  return (
    <Sheet
      title={t('search')}
      icon={MagnifyingGlass}
      onClose={close}
      tall
      pinned={
        <SearchField
          autoFocus
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
            // Referência reconhecida abre a passagem; senão recolhe o teclado para mostrar os resultados.
            if (ref) open(ref.book.id, ref.chapter, ref.verse);
            else e.currentTarget.blur();
          }}
        />
      }
    >
      {ref && (
        <button className="row goto" onClick={() => open(ref.book.id, ref.chapter, ref.verse)}>
          <span className="grow">
            <span className="sub" style={{ display: 'block' }}>{t('goTo')}</span>
            <span className="title">{refLabel(ref.book.name, ref.chapter, ref.verse, ref.verseEnd)}</span>
          </span>
          <CaretRight size={18} weight="light" color="var(--muted)" />
        </button>
      )}

      {!typed && !ref && (
        <div className="empty" style={{ padding: '40px 8px' }}>
          <MagnifyingGlass size={36} weight="light" />
          <p>{tooShort ? t('searchMin', { n: minChars(dq) }) : t('searchEmpty')}</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>{t('searchEmptyHint', { abbr: abbrOf(versionId) })}</p>
        </div>
      )}

      {typed && chapters === null && <div className="empty" style={{ padding: '40px 8px' }}><p>{t('searchPreparing')}</p></div>}

      {typed && chapters !== null && hits.length === 0 && !ref && (
        <div className="empty" style={{ padding: '40px 8px' }}>
          <p>{t('searchNone', { q: dq.trim() })}</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>{t('searchNoneHint')}</p>
        </div>
      )}

      {hits.length > 0 && (
        <>
          <p className="hint" role="status">
            {shown.length < hits.length ? t('searchShown', { n: shown.length, total: hits.length }) : t.n('result', hits.length)}
          </p>
          {shown.map((h) => (
            <button key={`${h.book}.${h.chapter}.${h.verse}`} className="entry hit" onClick={() => open(h.book, h.chapter, h.verse)}>
              <div className="ref">{refLabel(bookName(h.book), h.chapter, h.verse)}</div>
              <p className="txt"><Highlighted hit={h} /></p>
            </button>
          ))}
          {shown.length < hits.length && (
            <button className="row" style={{ justifyContent: 'center' }} onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              {t('searchMore')}
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
