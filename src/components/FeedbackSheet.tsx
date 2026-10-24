import { useState } from 'react';
import { GithubLogo, X } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useUI } from '../state/ui';
import { useStudy } from '../state/study';
import { useBookName } from '../hooks';
import { refLabel } from '../ref';
import { FEEDBACK_KINDS, feedbackUrl, type FeedbackKind } from '../feedback';
import { useT } from '../i18n';

const MAX = 2000;

export function FeedbackSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const { book, chapter } = useStudy();
  const bookName = useBookName();
  const [kind, setKind] = useState<FeedbackKind>('bug');
  const [text, setText] = useState('');

  const empty = !text.trim();

  return (
    <Sheet title={t('feedback')} onClose={close}>
      <select className="select" value={kind} aria-label={t('feedbackType')} onChange={(e) => setKind(e.target.value as FeedbackKind)}>
        {FEEDBACK_KINDS.map((k) => <option key={k} value={k}>{t(`feedback_${k}`)}</option>)}
      </select>
      <textarea
        className="note-input"
        style={{ marginTop: 12 }}
        value={text}
        maxLength={MAX}
        autoFocus
        placeholder={t(`feedbackHint_${kind}`)}
        aria-label={t('feedbackMessage')}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="actions">
        <span className="grow" />
        <button className="btn" onClick={close}><X size={18} weight="regular" />{t('cancel')}</button>
        <a
          className="btn primary"
          href={empty ? undefined : feedbackUrl(kind, text, refLabel(bookName(book), chapter))}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={empty}
          style={empty ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
          onClick={() => setTimeout(close, 0)}
        >
          <GithubLogo size={18} weight="regular" />
          {t('feedbackSend')}
        </a>
      </div>
      <p className="hint">{t('feedbackNote')}</p>
    </Sheet>
  );
}
