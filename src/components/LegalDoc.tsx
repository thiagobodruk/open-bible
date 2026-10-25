import { ScreenHeader } from './ScreenHeader';
import { PRIVACY_EMAIL } from '../privacy';

interface Doc {
  updated: string;
  sections: { h: string; p: string[] }[];
}

/** Texto jurídico em tela cheia: termos de uso e política de privacidade. */
export function LegalDoc({ title, doc }: { title: string; doc: Doc }) {
  return (
    <div className="screen">
      <ScreenHeader title={title} />
      <div className="screen-body privacy">
        <p className="hint">{doc.updated}</p>
        {doc.sections.map((s) => (
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
