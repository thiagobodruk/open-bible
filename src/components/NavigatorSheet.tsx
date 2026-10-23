import { Fragment, useEffect, useRef, useState } from 'react';
import { CaretDown, CaretRight } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { BOOKS } from '../data/books';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { t } from '../strings';

const FIRST_NT = BOOKS.findIndex((b) => b.testament === 'NT');

/** Lista única de livros, como no app Bíblia do iOS. O livro tocado abre a grade de capítulos logo abaixo dele. */
export function NavigatorSheet() {
  const close = useUI((s) => s.close);
  const { book, chapter, goTo } = useStudy();
  const [expanded, setExpanded] = useState<string | null>(book);
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
    <Sheet title={t.books} onClose={close} tall>
      <ul className="book-list">
        {BOOKS.map((b, i) => {
          const isOpen = expanded === b.id;
          return (
            <Fragment key={b.id}>
              {i === FIRST_NT && <li className="divider" role="separator" />}
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
