import { useState } from 'react';
import { PaperPlaneTilt, Sparkle } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { consented, setConsented, type AiPassage } from '../ai';
import { useAsk } from '../state/ask';
import { useStudy } from '../state/study';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { abbrOf } from '../data/catalog';
import { useBookName, useChapter } from '../hooks';
import { refLabel } from '../ref';
import { useT } from '../i18n';

const MAX_TEXT = 3000;

/** Barra de pergunta no rodapé do leitor. O contexto é a seleção ou, sem seleção, o capítulo inteiro. */
export function AskBar() {
  const t = useT();
  const { book, chapter, selection } = useStudy();
  const versionId = useSettings((s) => s.versionId);
  const uiLang = useSettings((s) => s.uiLang);
  const open = useUI((s) => s.open);
  const closeBar = useAsk((s) => s.closeBar);
  const bookName = useBookName();
  const text = useChapter(book, chapter);
  const [question, setQuestion] = useState('');
  const [accepted, setAccepted] = useState(consented);

  const verses = text.status === 'ready' ? text.verses : [];
  const numbers = selection.length ? selection : verses.map((_, i) => i + 1);
  const ref = selection.length
    ? refLabel(bookName(book), chapter, selection[0], selection[selection.length - 1])
    : refLabel(bookName(book), chapter);

  const ask = (q: string) => {
    const asked = q.trim();
    if (!asked || !verses.length) return;
    const passage: AiPassage = {
      ref,
      version: abbrOf(versionId),
      text: numbers.map((n) => `${n} ${verses[n - 1]}`).join('\n').slice(0, MAX_TEXT),
    };
    useAsk.getState().start(asked, passage, uiLang);
    setQuestion('');
    open('ask');
  };

  if (!accepted) {
    return (
      <Sheet modeless compact title={t('askTitle')} icon={Sparkle} onClose={closeBar}>
        <div className="ask-body">
          <p className="ask-notice">{t('askNotice')}</p>
          <button className="btn primary block" onClick={() => { setConsented(); setAccepted(true); }}>{t('askAccept')}</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet modeless compact title={ref} icon={Sparkle} onClose={closeBar}>
      <div className="ask-body">
        <div className="ask-chips">
          <button className="chip-btn" onClick={() => ask(t('askExplainQ'))}>{t('askExplain')}</button>
          <button className="chip-btn" onClick={() => ask(t('askContextQ'))}>{t('askContext')}</button>
          <button className="chip-btn" onClick={() => ask(t('askApplyQ'))}>{t('askApply')}</button>
        </div>
        <form className="ask-form" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('askPlaceholder')}
            aria-label={t('askPlaceholder')}
            maxLength={600}
            enterKeyHint="send"
          />
          <button type="submit" className="ask-send" disabled={!question.trim() || !verses.length} aria-label={t('askSend')}>
            <PaperPlaneTilt size={20} weight="fill" />
          </button>
        </form>
      </div>
    </Sheet>
  );
}
