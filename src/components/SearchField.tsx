import { MagnifyingGlass, Microphone, X } from '@phosphor-icons/react';
import { useT } from '../i18n';
import { useDictation } from '../useDictation';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (v: string) => void;
  clearLabel?: string;
  /** Adds a microphone that dictates into the field. Called when dictation starts. */
  dictate?: { onStart?: () => void };
  style?: React.CSSProperties;
}

/** Search field with a × button that clears the text and returns focus to the field, and optional voice dictation. */
export function SearchField({ value, onChange, clearLabel, style, dictate, ...input }: Props) {
  const t = useT();
  const mic = useDictation(value, onChange, dictate?.onStart);
  return (
    <label className="search" style={style}>
      <MagnifyingGlass size={20} weight="light" />
      <input {...input} value={value} onChange={(e) => onChange(e.target.value)} />
      {dictate && mic.supported && (
        <button
          type="button"
          className={`icon-btn search-mic${mic.listening ? ' on' : ''}`}
          aria-pressed={mic.listening}
          aria-label={mic.listening ? t('askMicStop') : t('askMic')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={mic.toggle}
        >
          <Microphone size={20} weight="regular" />
        </button>
      )}
      {value && (
        <button
          type="button"
          className="icon-btn search-clear"
          aria-label={clearLabel ?? t('clearSearch')}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            onChange('');
            e.currentTarget.parentElement?.querySelector('input')?.focus();
          }}
        >
          <X size={18} weight="bold" />
        </button>
      )}
    </label>
  );
}
