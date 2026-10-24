import { Fragment, useEffect, useRef, useState } from 'react';
import { ArrowClockwise, Copy, PaperPlaneTilt } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useAsk } from '../state/ask';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { useT } from '../i18n';

/** Só o **negrito** que os modelos costumam usar; o resto fica como texto. */
function Inline({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

export function AskSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const notify = useUI((s) => s.notify);
  const uiLang = useSettings((s) => s.uiLang);
  const { passage, messages, status, error, followUp, retry, stop } = useAsk();
  const [question, setQuestion] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const busy = status === 'loading' || status === 'streaming';
  const answer = messages[messages.length - 1];

  useEffect(() => () => stop(), [stop]);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [messages.length, status]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${passage?.ref ?? ''}\n\n${answer.content}`.trim());
      notify(t('copied'));
    } catch {
      notify(t('copyFailed'));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || busy) return;
    followUp(question.trim(), uiLang);
    setQuestion('');
  };

  const errorKey = ({ offline: 'askOffline', limit: 'askRateLimited', daily: 'askDaily', busy: 'askBusy', failed: 'askError' } as const)[error ?? 'failed'];

  return (
    <Sheet
      title={t('askTitle')}
      onClose={close}
      tall
      trailing={
        answer?.role === 'assistant' && answer.content && !busy ? (
          <button className="icon-btn" onClick={copy} aria-label={t('copy')}><Copy size={22} weight="light" /></button>
        ) : undefined
      }
    >
      <div className="ask-chat">
        {passage && <div className="ask-ref">{passage.ref} · {passage.version}</div>}
        {messages.map((m, i) => (
          <div key={i} className={`ask-msg ${m.role}`}>
            {m.content ? <Inline text={m.content} /> : busy && i === messages.length - 1 ? <span className="ask-dots" aria-label={t('askThinking')} /> : null}
          </div>
        ))}
        {status === 'error' && (
          <div className="ask-error" role="alert">
            <p>{t(errorKey)}</p>
            {error !== 'daily' && <button className="btn sm" onClick={() => retry(uiLang)}><ArrowClockwise size={16} weight="regular" />{t('askRetry')}</button>}
          </div>
        )}
        {status !== 'error' && (
          <form className="ask-form in-sheet" onSubmit={submit}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('askFollowUp')}
              aria-label={t('askFollowUp')}
              maxLength={600}
              enterKeyHint="send"
              disabled={busy}
            />
            <button type="submit" className="ask-send" disabled={!question.trim() || busy} aria-label={t('askSend')}>
              <PaperPlaneTilt size={20} weight="fill" />
            </button>
          </form>
        )}
        <p className="hint ask-note">{t('askDisclaimer')}</p>
        <div ref={end} />
      </div>
    </Sheet>
  );
}
