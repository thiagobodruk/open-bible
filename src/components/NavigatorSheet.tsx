import { Fragment, useEffect, useRef, useState } from 'react';
import { Books, CaretDown, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { SearchField } from './SearchField';
import { normalize } from '../search';
import { Sheet } from './Sheet';
import { useBooks } from '../hooks';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { useT } from '../i18n';

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
  const showDivider = (i: number) => !term && i === firstNt && i > 0;
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
          <SearchField autoFocus value={q} onChange={setQ} placeholder={t('bookSearch')} aria-label={t('bookSearch')} enterKeyHint="search" autoCapitalize="none" autoCorrect="off" />
        ) : undefined
      }
    >
      {term && visible.length === 0 && <p className="empty" style={{ padding: '32px 8px' }}>{t('noBooks')}</p>}
      <ul className="book-list">
        {visible.map((b, i) => {
          const isOpen = expanded === b.id;
          return (
            <Fragment key={b.id}>
              {showDivider(i) && <li className="divider" role="separator" />}
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
                        onClick={() => {
                          goTo(b.id, n);
                          scrollTo(0, 0);
                          close();
                        }}
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
