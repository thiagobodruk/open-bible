import type { ReactNode } from 'react';

/** Etiqueta pequena e arredondada. `accent` destaca o estado atual. */
export function Chip({ accent, className, children, ...rest }: { accent?: boolean; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={['chip', accent && 'accent', className].filter(Boolean).join(' ')} {...rest}>{children}</span>;
}
