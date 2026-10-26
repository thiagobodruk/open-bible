import { Fragment, useEffect, useRef, useState } from 'react';
import { Books, CaretDown, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { SearchField } from './SearchField';
import { normalize, parseReference } from '../search';
import { refLabel } from '../ref';
import { Sheet } from './Sheet';
import { useBooks } from '../hooks';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { useT } from '../i18n';
import { Row } from './Row';
import { Empty } from './Empty';

/** Lista única de livros, como no app Bíblia do iOS. O livro tocado abre a grade de capítulos logo abaixo dele. */
export function NavigatorSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const { book, chapter, goTo } = useStudy();
  const books = useBooks();
  const firstNt = books.findIndex((b) => b.testament === 'NT');
  const [expanded, setExpanded] = useState<string | null>(book);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState('');
  const term = normalize(q.trim()).norm.replace(/\s+/g, '');
  const visible = term ? books.filter((b) => normalize(b.name).norm.replace(/\s+/g, '').includes(term) || b.id === term) : books;
  const heading = (i: number) => (term ? null : i === firstNt ? 'testamentNew' : i === 0 ? 'testamentOld' : null);
  // "sal 23" também funciona aqui: oferece ir direto ao capítulo.
  const ref = searching ? parseReference(q, books) : null;
  const pick = (id: string, n: number, v?: number) => {
    goTo(id, n, v);
    scrollTo(0, 0);
    close();
  };
  const rows = useRef<Record<string, HTMLLIElement | null>>({});
  const first = useRef(true);

  // Ao abrir, leva o livro atual ao topo. Ao expandir outro livro, garante que a grade fique visível.
  useEffect(() => {
    if (!expanded) return;
    const el = rows.current[expanded];
    el?.scrollIntoView({ block: first.current ? 'start' : 'nearest' });
    first.current = false;
  }, [expanded]);

  return (
    <Sheet
      title={t('books')}
      icon={Books}
      onClose={close}
      tall
      trailing={
        <button
          className="icon-btn"
          aria-label={searching ? t('closeSearch') : t('bookSearch')}
          aria-pressed={searching}
          onClick={() => {
            setSearching(!searching);
            setQ('');
          }}
        >
          <MagnifyingGlass size={22} weight={searching ? 'fill' : 'light'} />
        </button>
      }
      pinned={
        searching ? (
          <SearchField autoFocus value={q} onChange={setQ} placeholder={t('bookSearch')} aria-label={t('bookSearch')} enterKeyHint="search" autoCapitalize="none" autoCorrect="off" onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            if (ref) pick(ref.book.id, ref.chapter, ref.verse);
            else e.currentTarget.blur();
          }} />
        ) : undefined
      }
    >
      {ref && (
        <Row
          className="goto"
          eyebrow={t('goTo')}
          title={refLabel(ref.book.name, ref.chapter, ref.verse, ref.verseEnd)}
          onClick={() => pick(ref.book.id, ref.chapter, ref.verse)}
          end={<CaretRight size={18} weight="light" color="var(--muted)" />}
        />
      )}
      {term && !ref && visible.length === 0 && <Empty compact>{t('noBooks')}</Empty>}
      <ul className="book-list">
        {visible.map((b, i) => {
          const isOpen = expanded === b.id;
          return (
            <Fragment key={b.id}>
              {heading(i) && <li className={`testament${i > 0 ? ' sep' : ''}`}><h3>{t(heading(i)!)}</h3></li>}
              <li ref={(el) => { rows.current[b.id] = el; }}>
                <button
                  className={`book-row ${b.id === book ? 'cur' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : b.id)}
                >
                  <span>{b.name}</span>
                  {isOpen ? <CaretDown size={16} weight="bold" /> : <CaretRight size={16} weight="bold" />}
                </button>
                {isOpen && (
                  <div className="chap-grid">
                    {Array.from({ length: b.chapters }, (_, k) => k + 1).map((n) => (
                      <button
                        key={n}
                        className={b.id === book && n === chapter ? 'cur' : ''}
                        aria-label={`${b.name} ${n}`}
                        onClick={() => pick(b.id, n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </Sheet>
  );
}
