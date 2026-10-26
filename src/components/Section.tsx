import type { ReactNode } from 'react';

/** Bloco de uma tela ou folha: título em caixa-alta e o conteúdo logo abaixo. */
export function Section({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
