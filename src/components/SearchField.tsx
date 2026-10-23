import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { useT } from '../i18n';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (v: string) => void;
  clearLabel?: string;
  style?: React.CSSProperties;
}

/** Campo de busca com botão × que limpa o texto e devolve o foco ao campo. */
export function SearchField({ value, onChange, clearLabel, style, ...input }: Props) {
  const t = useT();
  return (
    <label className="search" style={style}>
      <MagnifyingGlass size={20} weight="light" />
      <input {...input} value={value} onChange={(e) => onChange(e.target.value)} />
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
