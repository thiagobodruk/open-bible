import { SpeakerHigh } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { Segmented } from './Segmented';
import { RATES, useListen, voicesFor } from '../listen';
import { findVersion } from '../data/catalog';
import { useSettings } from '../state/settings';
import { useUI } from '../state/ui';
import { useT } from '../i18n';

export function ListenSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const versionId = useSettings((s) => s.versionId);
  const lang = findVersion(versionId)?.lang ?? 'en';
  const { rate, voices, next, setRate, setVoice, setNext } = useListen();
  const list = voicesFor(lang);
  const chosen = voices[lang.toLowerCase().split(/[-_]/)[0]] ?? list.find((v) => v.default)?.voiceURI ?? list[0]?.voiceURI ?? '';

  return (
    <Sheet title={t('listenTitle')} icon={SpeakerHigh} onClose={close}>
      <section className="section">
        <h2>{t('listenVoice')}</h2>
        <select className="select" value={chosen} aria-label={t('listenVoice')} onChange={(e) => setVoice(lang, e.target.value)}>
          {list.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
        </select>
      </section>
      <section className="section">
        <h2>{t('listenSpeed')}</h2>
        <Segmented
          label={t('listenSpeed')}
          value={String(rate)}
          options={RATES.map((r) => ({ value: String(r), label: `${r}×` }))}
          onChange={(v) => setRate(Number(v))}
        />
      </section>
      <label className="row" style={{ cursor: 'pointer' }}>
        <span className="grow title">{t('listenNext')}</span>
        <input type="checkbox" checked={next} onChange={(e) => setNext(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} />
      </label>
    </Sheet>
  );
}
