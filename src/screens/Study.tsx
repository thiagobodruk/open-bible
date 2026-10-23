import { useMemo, useState } from 'react';
import { Notebook, NotePencil, Trash } from '@phosphor-icons/react';
import { Sheet } from '../components/Sheet';
import { useUI } from '../state/ui';
import { ScreenHeader } from '../components/ScreenHeader';
import { Segmented } from '../components/Segmented';
import { BOOKS, bookIndex } from '../data/books';
import { abbrOf } from '../data/catalog';
import { useBookName } from '../hooks';
import { useSettings } from '../state/settings';
import { HL_COLORS, useStudy, type HlColor } from '../state/study';
import { go } from '../router';
import { refLabel } from '../ref';
import { t } from '../strings';

type Kind = 'all' | 'highlights' | 'notes';

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
}

const COLOR_NAMES: Record<HlColor, string> = { yellow: 'Amarelo', green: 'Verde', blue: 'Azul', pink: 'Rosa', orange: 'Laranja' };
const fmt = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });

export function Study() {
  const { highlights, notes, goTo, deleteNote, removeHighlight } = useStudy();
  const notify = useUI((s) => s.notify);
  const [pending, setPending] = useState<Entry | null>(null);
  const bookName = useBookName();
  const versionId = useSettings((s) => s.versionId);
  const [kind, setKind] = useState<Kind>('all');
  const [color, setColor] = useState<HlColor | null>(null);

  const entries = useMemo(() => {
    const list: Entry[] = [];
    const used = new Set<string>();
    for (const n of notes) {
      const hl = highlights[`${n.book}.${n.chapter}.${n.verseStart}`];
      if (hl) used.add(`${n.book}.${n.chapter}.${n.verseStart}`);
      list.push({ key: n.id, book: n.book, chapter: n.chapter, v1: n.verseStart, v2: n.verseEnd, color: hl?.color, text: n.excerpt, note: n.text, versionId: n.versionId, createdAt: n.createdAt });
    }
    for (const [k, h] of Object.entries(highlights)) {
      if (used.has(k)) continue;
      list.push({ key: k, book: h.book, chapter: h.chapter, v1: h.verse, v2: h.verse, color: h.color, text: h.text, versionId: h.versionId, createdAt: h.createdAt });
    }
    return list
      .filter((e) => (kind === 'notes' ? e.note : kind === 'highlights' ? e.color : true))
      .filter((e) => (color ? e.color === color : true))
      .sort((a, b) => bookIndex(a.book) - bookIndex(b.book) || a.chapter - b.chapter || a.v1 - b.v1);
  }, [highlights, notes, kind, color]);

  const groups = BOOKS.map((b) => ({ book: b, items: entries.filter((e) => e.book === b.id) })).filter((g) => g.items.length);

  return (
    <div className="screen">
      <ScreenHeader title={t.study} />
      <div className="screen-body">
        <div className="filters">
          <Segmented
            label="Tipo"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'all', label: 'Tudo' },
              { value: 'highlights', label: 'Marcações' },
              { value: 'notes', label: 'Notas' },
            ]}
          />
          <div className="colors" role="group" aria-label="Filtrar por cor">
            <button className="all" aria-pressed={color === null} aria-label="Todas as cores" onClick={() => setColor(null)} />
            {HL_COLORS.map((c) => (
              <button key={c} className={`c-${c}`} aria-pressed={color === c} aria-label={COLOR_NAMES[c]} onClick={() => setColor(color === c ? null : c)} />
            ))}
          </div>
        </div>

        {groups.length === 0 && (
          <div className="empty">
            <Notebook size={40} weight="light" />
            <p>Nada por aqui ainda.</p>
            <p style={{ fontSize: 14 }}>Toque em um versículo para marcar ou anotar.</p>
          </div>
        )}

        {groups.map(({ book, items }) => (
          <section key={book.id}>
            <h2 className="book-title">{bookName(book.id)}</h2>
            {items.map((e) => (
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
                  {e.versionId && e.versionId !== versionId && <span className="chip" style={{ marginLeft: 8 }}>{abbrOf(e.versionId)}</span>}
                </div>
                <p className="txt">{e.text}</p>
                {e.note && (
                  <p className="nt">
                    <NotePencil size={14} weight="fill" style={{ verticalAlign: '-2px', marginRight: 6, color: 'var(--accent)' }} />
                    {e.note}
                  </p>
                )}
                <div className="date">{fmt.format(e.createdAt)}</div>
              </button>
              <button
                className="icon-btn danger-icon entry-del"
                aria-label={`Excluir ${refLabel(bookName(e.book), e.chapter, e.v1, e.v2)}`}
                onClick={() => setPending(e)}
              >
                <Trash size={20} weight="light" />
              </button>
              </div>
            ))}
          </section>
        ))}
      </div>

      {pending && (
        <Sheet title="Excluir?" onClose={() => setPending(null)}>
          <p className="confirm-text">
            {pending.note && pending.color ? 'A marcação e a nota de ' : pending.note ? 'A nota de ' : 'A marcação de '}
            <b>{refLabel(bookName(pending.book), pending.chapter, pending.v1, pending.v2)}</b> {pending.note && pending.color ? 'serão excluídas' : 'será excluída'}. Isso não pode ser desfeito.
          </p>
          <div className="actions">
            <span className="grow" />
            <button className="btn" onClick={() => setPending(null)}>{t.cancel}</button>
            <button
              className="btn danger"
              onClick={() => {
                if (pending.note) deleteNote(pending.key);
                if (pending.color) removeHighlight(`${pending.book}.${pending.chapter}.${pending.v1}`);
                setPending(null);
                notify('Excluído');
              }}
            >
              {t.delete}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
