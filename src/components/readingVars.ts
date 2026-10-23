import type { CSSProperties } from 'react';
import type { Settings } from '../state/settings';

const COLS = { narrow: '44rem', medium: '37rem', wide: '31rem' } as const;
const PADS = { narrow: '0px', medium: '2vw', wide: '5vw' } as const;

export function readingVars(s: Pick<Settings, 'fontSize' | 'lineHeight' | 'margins' | 'align'>): CSSProperties {
  return {
    '--rd-size': `${s.fontSize}px`,
    '--rd-lh': s.lineHeight,
    '--rd-col': COLS[s.margins],
    '--rd-pad': PADS[s.margins],
    '--rd-align': s.align,
  } as CSSProperties;
}
