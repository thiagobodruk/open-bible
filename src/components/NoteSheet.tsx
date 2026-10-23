import { useState } from 'react';
import { Trash } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useUI } from '../state/ui';
import { useStudy } from '../state/study';
import { useBookName, useChapter } from '../hooks';
import { refLabel } from '../ref';
import { t } from '../strings';

const MAX = 5000;

export function NoteSheet() {
  const close = useUI((s) => s.close);
  const notify = useUI((s) => s.notify);
  const { book, chapter, selection, notes, saveNote, deleteNote, clearSelection } = useStudy();
  const first = selection[0];
  const existing = notes.find((n) => n.book === book && n.chapter === chapter && first >= n.verseStart && first <= n.verseEnd);
  const [text, setText] = useState(existing?.text ?? '');
  const bookName = useBookName();
  const text0 = useChapter(book, chapter);
  const verses = text0.status === 'ready' ? text0.verses : [];
  const last = selection[selection.length - 1];
  const excerpt = selection.map((v) => verses[v - 1]).join(' ');

  const onSave = () => {
    if (!text.trim()) {
      if (existing) deleteNote(existing.id);
    } else {
      saveNote(text.trim(), excerpt, existing?.id);
      notify('Nota salva');
    }
    clearSelection();
    close();
  };

  return (
    <Sheet title={existing ? 'Editar nota' : 'Nova nota'} onClose={close}>
      <div className="note-ref">{refLabel(bookName(book), chapter, existing?.verseStart ?? first, existing?.verseEnd ?? last)}</div>
      <blockquote className="note-quote" style={{ marginInline: 0 }}>{existing?.excerpt ?? excerpt}</blockquote>
      <textarea
        className="note-input"
        value={text}
        maxLength={MAX}
        autoFocus
        placeholder="Escreva sua nota"
        aria-label="Texto da nota"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="counter">{text.length} / {MAX}</div>
      <div className="actions">
        {existing && (
          <button
            className="icon-btn danger-icon"
            aria-label={t.delete}
            title={t.delete}
            onClick={() => {
              deleteNote(existing.id);
              clearSelection();
              close();
              notify('Nota excluída');
            }}
          >
            <Trash size={24} weight="light" />
          </button>
        )}
        <span className="grow" />
        <button className="btn" onClick={close}>{t.cancel}</button>
        <button className="btn primary" onClick={onSave}>{t.save}</button>
      </div>
    </Sheet>
  );
}
