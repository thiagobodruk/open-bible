import { ScreenHeader } from '../components/ScreenHeader';
import { PRIVACY, PRIVACY_EMAIL } from '../privacy';
import { useT } from '../i18n';

export function Privacy() {
  const t = useT();
  const policy = PRIVACY[t.lang];
  return (
    <div className="screen">
      <ScreenHeader title={t('privacy')} />
      <div className="screen-body privacy">
        <p className="hint">{policy.updated}</p>
        {policy.sections.map((s) => (
          <section className="section" key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}
        <p><a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a></p>
      </div>
    </div>
  );
}
