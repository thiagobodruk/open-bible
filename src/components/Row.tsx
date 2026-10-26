import { createElement, type HTMLAttributes, type ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';

type Props = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** Elemento HTML da linha. O padrão é `button`. */
  as?: 'button' | 'a' | 'div' | 'label';
  icon?: Icon;
  iconSize?: number;
  title: ReactNode;
  /** Linhas de apoio em cinza abaixo do título. Aceita várias. */
  sub?: ReactNode;
  /** Texto pequeno acima do título. */
  eyebrow?: ReactNode;
  /** Conteúdo à direita: seta, botão, caixa de seleção. */
  end?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  href?: string;
  target?: string;
  rel?: string;
};

/** Linha de lista: ícone opcional, título com textos de apoio e algo à direita. */
export function Row({ as = 'button', icon: Glyph, iconSize = 24, title, sub, eyebrow, end, danger, className, children, ...rest }: Props) {
  const subs = (Array.isArray(sub) ? sub : [sub]).filter(Boolean);
  return createElement(
    as,
    { className: ['row', danger && 'danger', className].filter(Boolean).join(' '), ...rest },
    Glyph && <Glyph size={iconSize} weight="light" />,
    <span className="grow">
      {eyebrow && <span className="sub">{eyebrow}</span>}
      <span className="title">{title}</span>
      {subs.map((s, i) => <span className="sub" key={i}>{s}</span>)}
    </span>,
    end,
    children,
  );
}
