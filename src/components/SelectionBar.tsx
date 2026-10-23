import { Copy, NotePencil, ShareNetwork, X } from '@phosphor-icons/react';
import { HL_COLORS, vkey, useStudy, type HlColor } from '../state/study';
import { useUI } from '../state/ui';
import { getBook } from '../data/books';
import { getChapter } from '../data/chapters';
import { useSettings } from '../state/settings';
import { getVersion } from '../data/library';
import { refLabel } from '../ref';
import { plural, t } from '../strings';

const COLOR_NAMES: Record<HlColor, string> = { yellow: 'Amarelo', green: 'Verde', blue: 'Azul', pink: 'Rosa', orange: 'Laranja' };

export function SelectionBar() {
  const { book, chapter, selection, highlights, paint, clearSelection } = useStudy();
  const open = useUI((s) => s.open);
  const notify = useUI((s) => s.notify);
  const versionId = useSettings((s) => s.versionId);
  const verses = getChapter(book, chapter).verses;
  const texts = Object.fromEntries(selection.map((v) => [v, verses[v - 1]]));
  const active = (c: HlColor) => selection.every((v) => highlights[vkey(book, chapter, v)]?.color === c);

  const citation = () => {
    const first = selection[0];
    const last = selection[selection.length - 1];
    const body = selection.map((v) => `${v} ${verses[v - 1]}`).join('\n');
    return `${body}\n${refLabel(getBook(book).name, chapter, first, last)} (${getVersion(versionId).abbr})`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citation());
      notify('Copiado');
    } catch {
      notify('Não foi possível copiar');
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: citation() });
      } catch {
        /* cancelado */
      }
    } else {
      copy();
    }
  };

  return (
    <div className="selbar" role="toolbar" aria-label="Ações do versículo">
      <span className="count">{plural(selection.length, 'versículo', 'versículos')}</span>
      {HL_COLORS.map((c) => (
        <button
          key={c}
          className={`swatch c-${c}`}
          aria-pressed={active(c)}
          aria-label={`Marcar de ${COLOR_NAMES[c].toLowerCase()}`}
          onClick={() => paint(c, texts)}
        />
      ))}
      <span className="sep" />
      <button className="icon-btn" aria-label={t.note} onClick={() => open('note')}><NotePencil size={22} weight="light" /></button>
      <button className="icon-btn" aria-label={t.copy} onClick={copy}><Copy size={22} weight="light" /></button>
      <button className="icon-btn" aria-label={t.share} onClick={share}><ShareNetwork size={22} weight="light" /></button>
      <button className="icon-btn" aria-label={t.close} onClick={clearSelection}><X size={22} weight="light" /></button>
    </div>
  );
}
