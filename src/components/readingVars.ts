import type { CSSProperties } from 'react';
import type { Settings } from '../state/settings';

const FONTS = { serif: 'var(--font-serif)', sans: 'var(--font-sans)', mono: 'var(--font-mono)' } as const;
const COLS = { narrow: '44rem', medium: '37rem', wide: '31rem' } as const;
// Folga lateral extra do leitor, somada às faixas de toque de 10vw. Em telas estreitas é o que muda de fato a largura do texto.
const PADS = { narrow: '0px', medium: '3vw', wide: '7vw' } as const;
// O preview é uma miniatura do leitor, então usa porcentagem da própria largura.
const PREVIEW_PADS = { narrow: '0%', medium: '7%', wide: '16%' } as const;

/** Variáveis de leitura compartilhadas pelo leitor e pelo preview dos ajustes de texto. */
export function readingVars(s: Pick<Settings, 'font' | 'fontSize' | 'lineHeight' | 'margins' | 'align'>): CSSProperties {
  return {
    '--rd-font': FONTS[s.font],
    '--rd-size': `${s.fontSize}px`,
    '--rd-lh': s.lineHeight,
    '--rd-col': COLS[s.margins],
    '--rd-pad': PADS[s.margins],
    '--rd-pv-pad': PREVIEW_PADS[s.margins],
    '--rd-align': s.align,
    '--rd-hyph': s.align === 'justify' ? 'auto' : 'manual',
  } as CSSProperties;
}
