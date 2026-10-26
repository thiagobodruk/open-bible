import { useEffect, useRef, useState } from 'react';
import { BookmarkSimple, Microphone, PaperPlaneTilt, X } from '@phosphor-icons/react';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { dictationSupported, startDictation } from '../stt';
import { useT } from '../i18n';
import { getItem, setItem } from '../storage';

const MIC_NOTICE = 'ob:stt-notice';

// Sem armazenamento o aviso não aparece, para não repetir a cada uso.
const noticeSeen = () => getItem(MIC_NOTICE, '1') === '1';

interface Props {
  /** Referência do contexto, mostrada como pill. */
  context: string;
  /** Com isto, a pill ganha um × que descarta o contexto. */
  onClearContext?: () => void;
  placeholder: string;
  disabled?: boolean;
  onSubmit: (question: string) => void;
}

/** Campo de pergunta com a referência como pill e ditado por voz. Igual no prompt e na tela de resposta. */
export function PromptField({ context, onClearContext, placeholder, disabled, onSubmit }: Props) {
  const t = useT();
  const uiLang = useSettings((s) => s.uiLang);
  const notify = useUI((s) => s.notify);
  const [question, setQuestion] = useState('');
  const [listening, setListening] = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);

  const toggleMic = () => {
    if (listening) return stopRef.current?.();
    if (!noticeSeen()) {
      notify(t('sttNotice'));
      setItem(MIC_NOTICE, '1');
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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const asked = question.trim();
    if (!asked || disabled) return;
    stopRef.current?.();
    setQuestion('');
    onSubmit(asked);
  };

  return (
    <form className="ask-field" onSubmit={submit}>
      <span className="ask-pill">
        <BookmarkSimple size={15} weight="light" aria-hidden="true" />
        <span>{context}</span>
        {onClearContext && (
          <button type="button" onClick={onClearContext} aria-label={t('askRemoveContext')}>
            <X size={13} weight="bold" />
          </button>
        )}
      </span>
      <div className="ask-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={600}
          enterKeyHint="send"
          disabled={disabled}
        />
        {dictationSupported() && (
          <button
            type="button"
            className={`ask-mic${listening ? ' on' : ''}`}
            onClick={toggleMic}
            aria-pressed={listening}
            aria-label={listening ? t('askMicStop') : t('askMic')}
            disabled={disabled}
          >
            <Microphone size={22} weight="regular" />
          </button>
        )}
        <button type="submit" className="ask-send" disabled={!question.trim() || disabled} aria-label={t('askSend')}>
          <PaperPlaneTilt size={20} weight="fill" />
        </button>
      </div>
    </form>
  );
}
