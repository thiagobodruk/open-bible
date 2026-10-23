import { useRef } from 'react';
import { DeviceMobile, DownloadSimple, GithubLogo, Trash, Upload } from '@phosphor-icons/react';
import { ScreenHeader } from '../components/ScreenHeader';
import { abbrOf, findVersion } from '../data/catalog';
import { downloadedMb, useLibrary } from '../state/library';
import { downloadBackup, parseBackup } from '../backup';
import { useSettings, type UiLang } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { requestInstall } from '../install';
import { t } from '../strings';

const LANGS: { code: UiLang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'ja', label: '日本語' },
];

export function Settings() {
  const { uiLang, set } = useSettings();
  const { installed, remove } = useLibrary();
  const downloaded = Object.keys(installed);
  const fileInput = useRef<HTMLInputElement>(null);
  const { open, notify } = useUI();
  const notes = useStudy((s) => s.notes.length);
  const highlights = useStudy((s) => Object.keys(s.highlights).length);

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const { highlights: hs, notes: ns, skipped } = parseBackup(await file.text());
      await useStudy.getState().merge(hs, ns);
      notify(`Importado: ${hs.length} marcações e ${ns.length} notas${skipped ? `, ${skipped} ignoradas` : ''}`);
    } catch {
      notify('Arquivo de backup inválido');
    }
  };

  return (
    <div className="screen">
      <ScreenHeader title={t.settings} />
      <div className="screen-body">
        <section className="section">
          <h2>Idioma da interface</h2>
          <select
            className="select"
            value={uiLang}
            aria-label="Idioma da interface"
            onChange={(e) => {
              set('uiLang', e.target.value as UiLang);
              notify('As traduções entram na próxima etapa');
            }}
          >
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <p className="hint">Independe do idioma da Bíblia, que você escolhe na Biblioteca.</p>
        </section>

        <section className="section">
          <h2>Versões baixadas</h2>
          <div className="group">
            {downloaded.map((id) => {
              const v = findVersion(id);
              if (!v) return null;
              return (
                <div key={id} className="row">
                  <span className="grow">
                    <span className="title">{v.name}</span>
                    <span className="sub" style={{ display: 'block' }}>{abbrOf(id)} · {v.sizeMb.toFixed(1)} MB</span>
                  </span>
                  <button className="icon-btn" aria-label={`Remover ${v.name}`} onClick={async () => { await remove(id); notify('Versão removida'); }}>
                    <Trash size={22} weight="light" />
                  </button>
                </div>
              );
            })}
          </div>
          <p className="hint">Ocupando {downloadedMb(downloaded).toFixed(1)} MB neste dispositivo.</p>
        </section>

        <section className="section">
          <h2>Seus dados</h2>
          <div className="group">
            <button className="row" onClick={() => { downloadBackup(); notify('Backup exportado'); }}>
              <DownloadSimple size={24} weight="light" />
              <span className="grow"><span className="title">Exportar backup</span><span className="sub" style={{ display: 'block' }}>{highlights} marcações e {notes} notas</span></span>
            </button>
            <button className="row" onClick={() => fileInput.current?.click()}>
              <Upload size={24} weight="light" />
              <span className="grow"><span className="title">Importar backup</span></span>
            </button>
          </div>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
          <p className="hint">Tudo fica só neste navegador. Sem conta, sem nuvem. Exporte de vez em quando para não perder suas notas.</p>
        </section>

        <section className="section">
          <h2>Aplicativo</h2>
          <div className="group">
            <button className="row" onClick={async () => { if (!(await requestInstall())) open('install'); }}>
              <DeviceMobile size={24} weight="light" />
              <span className="grow"><span className="title">{t.install}</span><span className="sub" style={{ display: 'block' }}>{t.installSub}</span></span>
            </button>
            <a className="row" href="https://github.com/thiagobodruk/open-bible" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              <GithubLogo size={24} weight="light" />
              <span className="grow"><span className="title">Código no GitHub</span><span className="sub" style={{ display: 'block' }}>Licença MIT · v0.0.0 (protótipo visual)</span></span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
