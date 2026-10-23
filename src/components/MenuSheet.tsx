import { BookOpenText, DeviceMobile, GearSix, Notebook, Translate, CaretRight } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useUI } from '../state/ui';
import { useStudy } from '../state/study';
import { go, type Route } from '../router';
import { useT } from '../i18n';
import { requestInstall } from '../install';

export function MenuSheet() {
  const t = useT();
  const { close, open } = useUI();
  const count = useStudy((s) => Object.keys(s.highlights).length + s.notes.length);

  const nav = (r: Route) => {
    close();
    go(r);
  };

  const items = [
    { icon: BookOpenText, label: t('read'), sub: undefined, run: () => nav('/') },
    { icon: Notebook, label: t('study'), sub: undefined, badge: count, run: () => nav('/study') },
    { icon: Translate, label: t('library'), sub: t('librarySub'), run: () => nav('/library') },
    { icon: GearSix, label: t('settings'), sub: undefined, run: () => nav('/settings') },
    {
      icon: DeviceMobile,
      label: t('install'),
      sub: t('installSub'),
      run: async () => {
        close();
        if (!(await requestInstall())) open('install');
      },
    },
  ];

  return (
    <Sheet title={t('menu')} onClose={close}>
      <div className="menu-brand">
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <div>
          <b>Open Bible</b>
          <span>{t('tagline')}</span>
        </div>
      </div>
      <ul>
        {items.map(({ icon: Icon, label, sub, badge, run }) => (
          <li key={label}>
            <button className="row" onClick={run}>
              <Icon size={26} weight="light" />
              <span className="grow">
                <span className="title">{label}</span>
                {sub && <span className="sub" style={{ display: 'block' }}>{sub}</span>}
              </span>
              {badge !== undefined && <span className="badge">{badge}</span>}
              <CaretRight size={18} weight="light" color="var(--muted)" />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
