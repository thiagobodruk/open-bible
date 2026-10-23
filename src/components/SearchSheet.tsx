import { Fragment, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { CaretRight, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { loadSearchIndex, type IndexedChapter } from '../data/bible';
import { abbrOf } from '../data/catalog';
import { useBookName, useBooks } from '../hooks';
import { MIN_CHARS, MAX_HITS, parseReference, searchVerses, type Hit } from '../search';
import { useSettings } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { go } from '../router';
import { refLabel } from '../ref';
import { plural, t } from '../strings';

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
  const close = useUI((s) => s.close);
  const goTo = useStudy((s) => s.goTo);
  const versionId = useSettings((s) => s.versionId);
  const [q, setQ] = useState('');
  const dq = useDeferredValue(q);

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
  const { hits, truncated } = useMemo(() => searchVerses(dq, chapters ?? []), [dq, chapters]);

  const groups = useMemo(() => {
    const out: { book: string; items: Hit[] }[] = [];
    for (const h of hits) {
      const last = out[out.length - 1];
      if (last && last.book === h.book) last.items.push(h);
      else out.push({ book: h.book, items: [h] });
    }
    return out;
  }, [hits]);

  const open = (book: string, chapter: number, verse?: number) => {
    goTo(book, chapter, verse);
    close();
    go('/');
    scrollTo(0, 0);
  };

  const typed = dq.trim().length >= MIN_CHARS;

  return (
    <Sheet title={t.search} onClose={close} tall>
      <label className="search" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
        <MagnifyingGlass size={20} weight="light" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Palavra ou referência, como jo 3:16"
          aria-label="Buscar no texto"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
        />
        {q && (
          <button className="icon-btn" style={{ width: 32, height: 32, margin: '0 -8px 0 0' }} onClick={() => setQ('')} aria-label="Limpar busca">
            <X size={18} weight="light" />
          </button>
        )}
      </label>

      {ref && (
        <button className="row goto" onClick={() => open(ref.book.id, ref.chapter, ref.verse)}>
          <span className="grow">
            <span className="sub" style={{ display: 'block' }}>Ir para</span>
            <span className="title">{refLabel(ref.book.name, ref.chapter, ref.verse, ref.verseEnd)}</span>
          </span>
          <CaretRight size={18} weight="light" color="var(--muted)" />
        </button>
      )}

      {!typed && !ref && (
        <div className="empty" style={{ padding: '40px 8px' }}>
          <MagnifyingGlass size={36} weight="light" />
          <p>Busque uma palavra ou vá direto a um trecho.</p>
          <p style={{ fontSize: 13, marginTop: 8 }}>Busca no texto da versão {abbrOf(versionId)}, direto neste aparelho.</p>
        </div>
      )}

      {typed && chapters === null && <div className="empty" style={{ padding: '40px 8px' }}><p>Preparando a busca…</p></div>}

      {typed && chapters !== null && hits.length === 0 && !ref && (
        <div className="empty" style={{ padding: '40px 8px' }}>
          <p>Nenhum versículo com “{dq.trim()}”.</p>
        </div>
      )}

      {hits.length > 0 && (
        <>
          <p className="hint" role="status">
            {truncated ? `Mostrando os primeiros ${MAX_HITS} resultados` : plural(hits.length, 'resultado', 'resultados')}
          </p>
          {groups.map((g) => (
            <section key={g.book}>
              <h3 className="book-title" style={{ position: 'static', fontSize: 17, padding: '14px 0 2px' }}>{bookName(g.book)}</h3>
              {g.items.map((h) => (
                <button key={`${h.chapter}.${h.verse}`} className="entry hit" onClick={() => open(h.book, h.chapter, h.verse)}>
                  <div className="ref">{refLabel(bookName(h.book), h.chapter, h.verse)}</div>
                  <p className="txt"><Highlighted hit={h} /></p>
                </button>
              ))}
            </section>
          ))}
        </>
      )}
    </Sheet>
  );
}
