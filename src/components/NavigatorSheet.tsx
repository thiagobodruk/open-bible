import { useState } from 'react';
import { CaretLeft } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { Segmented } from './Segmented';
import { BOOKS, getBook } from '../data/books';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { t } from '../strings';

export function NavigatorSheet() {
  const close = useUI((s) => s.close);
  const { book, chapter, goTo } = useStudy();
  const current = getBook(book);
  const [testament, setTestament] = useState<'AT' | 'NT'>(current.testament);
  const [picked, setPicked] = useState<string | null>(null);
  const pickedBook = picked ? getBook(picked) : null;

  if (pickedBook) {
    return (
      <Sheet
        title={pickedBook.name}
        onClose={close}
        leading={
          <button className="icon-btn" onClick={() => setPicked(null)} aria-label={t.books} style={{ marginLeft: -12 }}>
            <CaretLeft size={22} weight="light" />
          </button>
        }
      >
        <div className="chap-grid">
          {Array.from({ length: pickedBook.chapters }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={pickedBook.id === book && n === chapter ? 'cur' : ''}
              onClick={() => {
                goTo(pickedBook.id, n);
                scrollTo(0, 0);
                close();
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title={t.books} onClose={close}>
      <Segmented
        label="Testamento"
        value={testament}
        onChange={setTestament}
        options={[
          { value: 'AT', label: 'Antigo Testamento' },
          { value: 'NT', label: 'Novo Testamento' },
        ]}
      />
      <div className="book-grid" style={{ marginTop: 14 }}>
        {BOOKS.filter((b) => b.testament === testament).map((b) => (
          <button key={b.id} className={b.id === book ? 'cur' : ''} onClick={() => setPicked(b.id)}>
            {b.name}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
