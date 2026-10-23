import { ArrowCounterClockwise, TextAlignJustify, TextAlignLeft } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { Segmented } from './Segmented';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { readingVars } from './readingVars';
import { t } from '../strings';

const THEMES = [
  { v: 'auto', label: 'Auto' },
  { v: 'light', label: 'Claro' },
  { v: 'sepia', label: 'Sépia' },
  { v: 'dark', label: 'Escuro' },
] as const;

const FONT_MIN = 14;
const FONT_MAX = 32;
const FONT_STEP = 2;
const LINE_HEIGHTS = [
  { v: 1.4, label: 'Compacta', gap: 4 },
  { v: 1.7, label: 'Normal', gap: 6 },
  { v: 2, label: 'Ampla', gap: 8 },
] as const;
const MARGINS = [
  { v: 'narrow', label: 'Estreitas', inset: 2 },
  { v: 'medium', label: 'Médias', inset: 6 },
  { v: 'wide', label: 'Largas', inset: 10 },
] as const;

/** Linhas de texto em miniatura. `gap` muda o espaçamento vertical e `inset` o recuo lateral. */
function Lines({ gap = 6, inset = 3 }: { gap?: number; inset?: number }) {
  const start = (26 - 3 * gap) / 2;
  const ys = [0, 1, 2, 3].map((i) => start + i * gap);
  return (
    <svg width="28" height="26" viewBox="0 0 28 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      {ys.map((y, i) => <line key={i} x1={inset} x2={28 - inset - (i === 3 ? 6 : 0)} y1={y} y2={y} />)}
    </svg>
  );
}

const nearest = (v: number) => LINE_HEIGHTS.reduce((a, b) => (Math.abs(b.v - v) < Math.abs(a.v - v) ? b : a));

export function TextSettingsSheet() {
  const close = useUI((s) => s.close);
  const s = useSettings();

  return (
    <Sheet
      title={t.textSettings}
      onClose={close}
      pinned={
        <div className="preview" style={readingVars(s)} aria-hidden="true">
          <div className={`preview-text vn-${s.verseNumbers}`} lang="en">
            <span className="vn">16</span>
            For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish.
          </div>
        </div>
      }
    >
      <div className="themes" role="group" aria-label="Tema">
        {THEMES.map((th) => (
          <button key={th.v} className="theme-btn" aria-pressed={s.theme === th.v} onClick={() => s.set('theme', th.v)}>
            <span className={`sw t-${th.v}`}>Aa</span>
            {th.label}
          </button>
        ))}
      </div>

      <div className="field">
        <span className="lbl">Tamanho <span>{s.fontSize} px</span></span>
        <div className="choice-row two" role="group" aria-label="Tamanho da fonte">
          <button
            className="choice"
            aria-label="Diminuir fonte"
            disabled={s.fontSize <= FONT_MIN}
            onClick={() => s.set('fontSize', Math.max(FONT_MIN, s.fontSize - FONT_STEP))}
          >
            <span style={{ fontSize: 15 }}>A</span>
          </button>
          <button
            className="choice"
            aria-label="Aumentar fonte"
            disabled={s.fontSize >= FONT_MAX}
            onClick={() => s.set('fontSize', Math.min(FONT_MAX, s.fontSize + FONT_STEP))}
          >
            <span style={{ fontSize: 26 }}>A</span>
          </button>
        </div>
      </div>

      <div className="field">
        <span className="lbl">Fonte</span>
        <Segmented
          label="Fonte"
          value={s.font}
          onChange={(v) => s.set('font', v)}
          options={[
            { value: 'serif', label: <span style={{ fontFamily: 'var(--font-serif)' }}>Serifada</span> },
            { value: 'sans', label: <span style={{ fontFamily: 'var(--font-sans)' }}>Sem serifa</span> },
            { value: 'mono', label: <span style={{ fontFamily: 'var(--font-mono)' }}>Mono</span> },
          ]}
        />
      </div>

      <div className="field">
        <span className="lbl">Altura da linha</span>
        <div className="choice-row" role="group" aria-label="Altura da linha">
          {LINE_HEIGHTS.map((l) => (
            <button key={l.v} className="choice" aria-pressed={nearest(s.lineHeight).v === l.v} aria-label={l.label} title={l.label} onClick={() => s.set('lineHeight', l.v)}>
              <Lines gap={l.gap} />
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="lbl">Margens</span>
        <div className="choice-row" role="group" aria-label="Margens">
          {MARGINS.map((m) => (
            <button key={m.v} className="choice" aria-pressed={s.margins === m.v} aria-label={m.label} title={m.label} onClick={() => s.set('margins', m.v)}>
              <Lines inset={m.inset} />
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="lbl">Alinhamento</span>
        <div className="choice-row two" role="group" aria-label="Alinhamento">
          <button className="choice" aria-pressed={s.align === 'left'} aria-label="Esquerda" title="Esquerda" onClick={() => s.set('align', 'left')}>
            <TextAlignLeft size={26} weight="light" />
          </button>
          <button className="choice" aria-pressed={s.align === 'justify'} aria-label="Justificado" title="Justificado" onClick={() => s.set('align', 'justify')}>
            <TextAlignJustify size={26} weight="light" />
          </button>
        </div>
      </div>

      <div className="field">
        <span className="lbl">Números dos versículos</span>
        <Segmented
          label="Números dos versículos"
          value={s.verseNumbers}
          onChange={(v) => s.set('verseNumbers', v)}
          options={[
            { value: 'visible', label: 'Visíveis' },
            { value: 'subtle', label: 'Discretos' },
            { value: 'hidden', label: 'Ocultos' },
          ]}
        />
      </div>

      <div className="field">
        <span className="lbl">Disposição</span>
        <Segmented
          label="Disposição"
          value={s.textMode}
          onChange={(v) => s.set('textMode', v)}
          options={[
            { value: 'verses', label: 'Um versículo por linha' },
            { value: 'paragraph', label: 'Parágrafo' },
          ]}
        />
      </div>

      <button className="btn block" style={{ marginTop: 28 }} onClick={s.resetText}>
        <ArrowCounterClockwise size={20} weight="light" /> Restaurar padrão
      </button>
    </Sheet>
  );
}
