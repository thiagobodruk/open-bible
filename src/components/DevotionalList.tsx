import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CaretLeft, Heart } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { useT } from '../i18n';
import { useUI } from '../state/ui';
import { useSettings } from '../state/settings';
import { useStudy } from '../state/study';
import { useDevotional } from '../state/devotional';
import { DAY_COUNT, dateOfDayId, dayId, refOfKey, todayFor } from '../data/devotional';
import { useBookName } from '../hooks';
import { refLabel } from '../ref';
import { track } from '../analytics';

interface Props {
  onBack: () => void;
  /** Opens the devotional of a day ID, in this year. */
  onPick: (id: number) => void;
}

type Where = 'in' | 'above' | 'below';

/** Every devotional of the year, in calendar order. Past days are dimmed, today is highlighted and liked ones carry a heart. */
export function DevotionalList({ onBack, onPick }: Props) {
  const t = useT();
  const close = useUI((s) => s.close);
  const uiLang = useSettings((s) => s.uiLang);
  const pack = useDevotional((s) => s.pack);
  const likes = useStudy((s) => s.likes);
  const bookName = useBookName();
  const todayRef = useRef<HTMLButtonElement>(null);
  const [where, setWhere] = useState<Where>('in');
  const todayId = useMemo(() => dayId(new Date()), []);

  // One entry per day ID, grouped by month. The text of a day is the one read on it this year, so Easter replaces its date.
  const months = useMemo(() => {
    const month = new Intl.DateTimeFormat(uiLang, { month: 'long' });
    const groups: { month: number; name: string; days: { id: number; day: number; key: string }[] }[] = [];
    for (let id = 1; id <= DAY_COUNT; id++) {
      const date = dateOfDayId(id);
      if (!date) continue;
      let group = groups[groups.length - 1];
      if (!group || group.month !== date.getMonth()) groups.push((group = { month: date.getMonth(), name: month.format(date), days: [] }));
      group.days.push({ id, day: date.getDate(), key: todayFor(date).key });
    }
    return groups;
  }, [uiLang]);

  useEffect(() => {
    track('devotional_list_open');
  }, []);

  // Opens at today, and tells whether it is out of sight to offer the way back.
  useEffect(() => {
    const el = todayRef.current;
    const root = el?.closest('.sheet-body');
    if (!el || !(root instanceof HTMLElement)) return;
    el.scrollIntoView({ block: 'center' });
    const seen = new IntersectionObserver(
      ([e]) => setWhere(e.isIntersecting ? 'in' : e.boundingClientRect.top < (e.rootBounds?.top ?? 0) ? 'above' : 'below'),
      { root, threshold: 0.6 },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, []);

  const jump = () => {
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    todayRef.current?.scrollIntoView({ block: 'center', behavior: calm ? 'auto' : 'smooth' });
  };

  const entry = (key: string) => {
    const ref = refOfKey(key);
    return {
      title: pack?.moveable[key as keyof typeof pack.moveable]?.title ?? pack?.days[key]?.title ?? '',
      label: ref ? refLabel(bookName(ref.book), ref.chapter, ref.from, ref.to) : '',
    };
  };

  return (
    <Sheet
      title={t('devotionalAll')}
      onClose={close}
      tall
      leading={<button className="icon-btn dx-back" onClick={onBack} aria-label={t('devotionalBack')}><CaretLeft size={22} weight="light" /></button>}
    >
      <p className="dx-hint">{t('devotionalListHint')}</p>
      {months.map((m) => (
        <section key={m.month} aria-label={m.name}>
          <h3 className="dx-month">{m.name}</h3>
          <div className="dx-rows">
            {m.days.map(({ id, day, key }) => {
              const now = id === todayId;
              const { title, label } = entry(key);
              return (
                <button
                  key={id}
                  type="button"
                  ref={now ? todayRef : undefined}
                  className={`dx-row${id < todayId ? ' past' : now ? ' today' : ''}`}
                  aria-current={now ? 'date' : undefined}
                  onClick={() => onPick(id)}
                >
                  <span className="dx-d">{day}</span>
                  <span className="dx-tx">
                    {now && <span className="dx-tag">{t('devotionalTodayTag')}</span>}
                    <span className="dx-t">{title}</span>
                    <span className="dx-v">{label}</span>
                  </span>
                  {likes[key] && <Heart className="dx-lk" size={18} weight="fill" role="img" aria-label={t('devotionalLiked')} />}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <div className="dx-jump-wrap">
        {where !== 'in' && (
          <button type="button" className="dx-jump" onClick={jump}>
            {where === 'above' ? <ArrowUp size={20} weight="bold" aria-hidden="true" /> : <ArrowDown size={20} weight="bold" aria-hidden="true" />}
            {t('devotionalJump')}
          </button>
        )}
      </div>
    </Sheet>
  );
}
