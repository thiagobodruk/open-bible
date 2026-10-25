import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import type { Icon, IconWeight } from '@phosphor-icons/react';

interface Look {
  variant?: 'primary' | 'secondary';
  size?: 'md' | 'sm';
  /** Ocupa a largura disponível. O ícone vai para a extremidade do botão e o texto fica centralizado. */
  block?: boolean;
  icon?: Icon;
  iconSide?: 'left' | 'right';
  iconWeight?: IconWeight;
  children: ReactNode;
}

const classes = ({ variant = 'secondary', size = 'md', block, icon, iconSide = 'left' }: Look, extra?: string) =>
  ['btn', variant === 'primary' && 'primary', size === 'sm' && 'sm', block && 'block', icon && (iconSide === 'left' ? 'lead' : 'trail'), extra]
    .filter(Boolean)
    .join(' ');

function Content({ icon: Glyph, iconSide = 'left', iconWeight = 'regular', size = 'md', children }: Look) {
  if (!Glyph) return <>{children}</>;
  const glyph = <Glyph size={size === 'sm' ? 16 : 18} weight={iconWeight} aria-hidden="true" />;
  return iconSide === 'left' ? <>{glyph}{children}</> : <>{children}{glyph}</>;
}

/** Botão primário ou secundário, sem ícone ou com ícone à esquerda ou à direita. */
export function Button({ variant, size, block, icon, iconSide, iconWeight, className, children, type = 'button', ...rest }: Look & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const look = { variant, size, block, icon, iconSide, iconWeight, children };
  return (
    <button type={type} className={classes(look, className)} {...rest}>
      <Content {...look} />
    </button>
  );
}

/** Mesmo visual do botão, para links. */
export function ButtonLink({ variant, size, block, icon, iconSide, iconWeight, className, children, ...rest }: Look & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'>) {
  const look = { variant, size, block, icon, iconSide, iconWeight, children };
  return (
    <a className={classes(look, className)} {...rest}>
      <Content {...look} />
    </a>
  );
}
