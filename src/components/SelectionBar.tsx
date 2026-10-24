import { Copy, NotePencil, ShareNetwork, TextColumns } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { HL_COLORS, vkey, useStudy, type HlColor } from '../state/study';
import { useUI } from '../state/ui';
import { abbrOf } from '../data/catalog';
import { useBookName, useChapter } from '../hooks';
import { useSettings } from '../state/settings';
import { refLabel } from '../ref';
import { useT } from '../i18n';

/** Ações para os versículos selecionados. É um bottom sheet sem fundo escurecido, para seguir tocando nos versículos. */
export function SelectionBar() {
  const t = useT();
  const { book, chapter, selection, highlights, paint, clearSelection } = useStudy();
  const open = useUI((s) => s.open);
  const notify = useUI((s) => s.notify);
  const versionId = useSettings((s) => s.versionId);
  const bookName = useBookName();
  const text = useChapter(book, chapter);
  const verses = text.status === 'ready' ? text.verses : [];
  const texts = Object.fromEntries(selection.map((v) => [v, verses[v - 1]]));
  const active = (c: HlColor) => selection.every((v) => highlights[vkey(book, chapter, v)]?.color === c);

  const citation = () => {
    const first = selection[0];
    const last = selection[selection.length - 1];
    const body = selection.map((v) => verses[v - 1]).join('\n');
    return `${body}\n${refLabel(bookName(book), chapter, first, last)} (${abbrOf(versionId)})`;
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citation());
      notify(t('copied'));
    } catch {
      notify(t('copyFailed'));
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
    <Sheet
      modeless
      title={refLabel(bookName(book), chapter, selection[0], selection[selection.length - 1])}
      onClose={clearSelection}
    >
      <div className="sheet-colors" role="group" aria-label={t('highlightColor')}>
        {HL_COLORS.map((c) => (
          <button
            key={c}
            className={`swatch c-${c}`}
            aria-pressed={active(c)}
            aria-label={t('highlightWith', { color: t.lang === 'de' ? t(c) : t(c).toLowerCase() })}
            onClick={() => paint(c, texts)}
          />
        ))}
      </div>
      <div className="sheet-actions">
        <button className="sheet-action" onClick={() => open('note')}><NotePencil size={24} weight="light" />{t('note')}</button>
        <button className="sheet-action" onClick={() => open('compare')}><TextColumns size={24} weight="light" />{t('compare')}</button>
        <button className="sheet-action" onClick={copy}><Copy size={24} weight="light" />{t('copy')}</button>
        <button className="sheet-action" onClick={share}><ShareNetwork size={24} weight="light" />{t('share')}</button>
      </div>
    </Sheet>
  );
}
