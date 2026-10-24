import { useEffect, useRef, useState } from 'react';
import { BookOpenText, Microphone, PaperPlaneTilt, Sparkle, X } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { consented, setConsented, type AiPassage } from '../ai';
import { useAsk } from '../state/ask';
import { useStudy } from '../state/study';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { abbrOf } from '../data/catalog';
import { useBookName, useChapter } from '../hooks';
import { refLabel } from '../ref';
import { dictationSupported, startDictation } from '../stt';
import { useT } from '../i18n';

const MAX_TEXT = 3000;
const MIC_NOTICE = 'ob:stt-notice';

const noticeSeen = () => {
  try {
    return localStorage.getItem(MIC_NOTICE) === '1';
  } catch {
    return true;
  }
};

/** Barra de pergunta no rodapé do leitor. O contexto é a seleção ou, sem seleção, o capítulo inteiro. */
export function AskBar() {
  const t = useT();
  const { book, chapter, selection } = useStudy();
  const versionId = useSettings((s) => s.versionId);
  const uiLang = useSettings((s) => s.uiLang);
  const open = useUI((s) => s.open);
  const notify = useUI((s) => s.notify);
  const closeBar = useAsk((s) => s.closeBar);
  const bookName = useBookName();
  const text = useChapter(book, chapter);
  const [question, setQuestion] = useState('');
  const [accepted, setAccepted] = useState(consented);
  const [listening, setListening] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  const toggleMic = () => {
    if (listening) return stopRef.current?.();
    if (!noticeSeen()) {
      notify(t('sttNotice'));
      try {
        localStorage.setItem(MIC_NOTICE, '1');
      } catch {
        /* o aviso volta na próxima vez */
      }
    }
    const base = question.trim();
    stopRef.current = startDictation(uiLang, {
      onText: (spoken) => setQuestion(base ? `${base} ${spoken}` : spoken),
      onEnd: () => {
        setListening(false);
        stopRef.current = null;
      },
      onError: (kind) => notify(t(kind === 'denied' ? 'sttDenied' : kind === 'network' ? 'sttNetwork' : 'sttFailed')),
    });
    setListening(stopRef.current !== null);
  };

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
    stopRef.current?.();
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
    <Sheet modeless compact title={t('askTitle')} icon={Sparkle} onClose={closeBar}>
      <div className="ask-body">
        <div className="ask-chips">
          <button className="chip-btn" onClick={() => ask(t('askExplainQ'))}>{t('askExplain')}</button>
          <button className="chip-btn" onClick={() => ask(t('askContextQ'))}>{t('askContext')}</button>
          <button className="chip-btn" onClick={() => ask(t('askApplyQ'))}>{t('askApply')}</button>
        </div>
        <form className="ask-field" onSubmit={(e) => { e.preventDefault(); ask(question); }}>
          <span className="ask-pill">
            <BookOpenText size={15} weight="light" aria-hidden="true" />
            <span>{ref}</span>
            {selection.length > 0 && (
              <button type="button" onClick={() => useStudy.getState().clearSelection()} aria-label={t('askRemoveContext')}>
                <X size={13} weight="bold" />
              </button>
            )}
          </span>
          <div className="ask-row">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('askPlaceholder')}
              aria-label={t('askPlaceholder')}
              maxLength={600}
              enterKeyHint="send"
            />
            {dictationSupported() && (
              <button
                type="button"
                className={`ask-mic${listening ? ' on' : ''}`}
                onClick={toggleMic}
                aria-pressed={listening}
                aria-label={listening ? t('askMicStop') : t('askMic')}
              >
                <Microphone size={22} weight="regular" />
              </button>
            )}
            <button type="submit" className="ask-send" disabled={!question.trim() || !verses.length} aria-label={t('askSend')}>
              <PaperPlaneTilt size={20} weight="fill" />
            </button>
          </div>
        </form>
      </div>
    </Sheet>
  );
}
