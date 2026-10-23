import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (v: string) => void;
  clearLabel?: string;
  style?: React.CSSProperties;
}

/** Campo de busca com botão × que limpa o texto e devolve o foco ao campo. */
export function SearchField({ value, onChange, clearLabel = 'Limpar busca', style, ...input }: Props) {
  return (
    <label className="search" style={style}>
      <MagnifyingGlass size={20} weight="light" />
      <input {...input} value={value} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button
          type="button"
          className="icon-btn search-clear"
          aria-label={clearLabel}
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
