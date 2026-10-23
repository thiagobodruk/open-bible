import { ArrowCounterClockwise } from '@phosphor-icons/react';
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

export function TextSettingsSheet() {
  const close = useUI((s) => s.close);
  const s = useSettings();

  return (
    <Sheet title={t.textSettings} onClose={close}>
      <div className="preview-wrap">
        <div className="preview" style={readingVars(s)} aria-hidden="true">
          <div className={`preview-text vn-${s.verseNumbers}`} lang="en">
            <span className="vn">16</span>
            For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish.
          </div>
        </div>
      </div>

      <div className="themes" role="group" aria-label="Tema">
        {THEMES.map((th) => (
          <button key={th.v} className="theme-btn" aria-pressed={s.theme === th.v} onClick={() => s.set('theme', th.v)}>
            <span className={`sw t-${th.v}`}>Aa</span>
            {th.label}
          </button>
        ))}
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
        <label htmlFor="fs">Tamanho <span>{s.fontSize} px</span></label>
        <input id="fs" className="range" type="range" min={14} max={32} step={1} value={s.fontSize} onChange={(e) => s.set('fontSize', +e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="lh">Altura da linha <span>{s.lineHeight.toFixed(1)}</span></label>
        <input id="lh" className="range" type="range" min={1.3} max={2} step={0.1} value={s.lineHeight} onChange={(e) => s.set('lineHeight', +e.target.value)} />
      </div>

      <div className="field">
        <span className="lbl">Margens</span>
        <Segmented
          label="Margens"
          value={s.margins}
          onChange={(v) => s.set('margins', v)}
          options={[
            { value: 'narrow', label: 'Estreitas' },
            { value: 'medium', label: 'Médias' },
            { value: 'wide', label: 'Largas' },
          ]}
        />
      </div>

      <div className="field">
        <span className="lbl">Alinhamento</span>
        <Segmented
          label="Alinhamento"
          value={s.align}
          onChange={(v) => s.set('align', v)}
          options={[
            { value: 'left', label: 'Esquerda' },
            { value: 'justify', label: 'Justificado' },
          ]}
        />
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

      <div className="actions" style={{ marginTop: 22 }}>
        <button className="btn sm" onClick={s.reset}>
          <ArrowCounterClockwise size={18} weight="light" /> Restaurar padrão
        </button>
      </div>
    </Sheet>
  );
}
