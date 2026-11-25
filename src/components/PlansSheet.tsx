import { useEffect, useMemo, useRef, useState } from 'react';
import { CaretDown, CaretLeft, CaretUp, Check, CheckCircle, Circle, Eraser, ListChecks, ListPlus, Minus, PencilSimple, Plus, Trash, ArrowClockwise } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { Row } from './Row';
import { Button } from './Button';
import { Empty } from './Empty';
import { ConfirmSheet } from './ConfirmSheet';
import { SearchField } from './SearchField';
import { useUI } from '../state/ui';
import { usePlans } from '../state/plans';
import { useStudy } from '../state/study';
import { useBookName, useBooks } from '../hooks';
import { go } from '../router';
import { useT, type Translator } from '../i18n';
import type { Key } from '../i18n';
import { trackFeature } from '../analytics';
import {
  MAX_DAYS, PRESETS, chaptersPerDay, customName, effectiveDays, firstUnread, itemsOfBooks, itemsOfPicks, progressOf,
  readingsOf, refOfItems, type Plan, type Preset, type PresetId,
} from '../data/plans';

const PRESET_NAME: Record<PresetId, Key> = {
  bible1y: 'planBible1y', nt90: 'planNt90', ot1y: 'planOt1y', psprov: 'planPsProv', gospels30: 'planGospels30', paul30: 'planPaul30',
};

/** Name to show: the ready-made ones follow the interface language, the custom ones keep what they were called. */
export const planTitle = (t: Translator, p: Pick<Plan, 'preset' | 'name'>) => (p.preset ? t(PRESET_NAME[p.preset]) : p.name || t('plansCustomName'));

/** Opens the reader on the next chapter of the plan that is not read yet. */
export function readPlan(plan: Plan) {
  const { next } = progressOf(plan);
  const r = readingsOf(plan)[next < 0 ? 0 : next];
  const at = firstUnread(plan, r);
  trackFeature('plan_read');
  useUI.getState().close();
  useStudy.getState().goTo(at.book, at.chapter);
  go('/');
}

/** Marks the chapters and, if that finished the plan, says so. */
export function markPlan(t: Translator, id: string, indexes: number[], on: boolean) {
  const before = usePlans.getState().plans.find((p) => p.id === id);
  const after = usePlans.getState().mark(id, indexes, on);
  if (after?.finishedAt && !before?.finishedAt) {
    trackFeature('plan_done');
    useUI.getState().notify(t('planCompleted'));
  }
}

/** "1,189 chapters": the count with the language's thousands separator. */
const chaptersText = (t: Translator, n: number) => t.n('planChapters', n, { n: new Intl.NumberFormat(t.lang).format(n) });

const sameDay = (a: number, b = Date.now()) => new Date(a).toDateString() === new Date(b).toDateString();
const byRecent = (a: Plan, b: Plan) => (b.readAt ?? b.startedAt) - (a.readAt ?? a.startedAt);

type View = { k: 'list' } | { k: 'new' } | { k: 'custom' } | { k: 'plan'; id: string } | { k: 'delete'; id: string };

export function PlansSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const plans = usePlans((s) => s.plans);
  const [view, setView] = useState<View>(() => {
    const focus = usePlans.getState().focus;
    usePlans.setState({ focus: null });
    if (focus) return { k: 'plan', id: focus };
    // Nothing to list yet (no plan, active or finished): go straight to choosing one.
    return usePlans.getState().plans.length ? { k: 'list' } : { k: 'new' };
  });
  const back = (to: View) => (
    <button className="icon-btn dx-back" onClick={() => setView(to)} aria-label={t('back')}><CaretLeft size={22} weight="light" /></button>
  );

  const plan = view.k === 'plan' || view.k === 'delete' ? plans.find((p) => p.id === view.id) : undefined;
  // A plan that disappears (deleted elsewhere, for example) takes the sheet back to the list.
  useEffect(() => {
    if ((view.k === 'plan' || view.k === 'delete') && !plan) setView({ k: 'list' });
  }, [view, plan]);

  if (view.k === 'new') return <NewPlan onClose={close} lead={plans.length ? back({ k: 'list' }) : undefined} onCustom={() => setView({ k: 'custom' })} onCreated={(id) => setView({ k: 'plan', id })} />;
  if (view.k === 'custom') return <CustomPlan onClose={close} lead={back({ k: 'new' })} onCreated={(id) => setView({ k: 'plan', id })} />;
  if (view.k === 'plan' && plan) return <PlanView plan={plan} onClose={close} lead={back({ k: 'list' })} onDelete={() => setView({ k: 'delete', id: plan.id })} onAgain={(id) => setView({ k: 'plan', id })} />;
  if (view.k === 'delete' && plan) {
    return (
      <ConfirmSheet
        title={t('planDeleteTitle')}
        text={t('planDeleteText', { name: planTitle(t, plan) })}
        confirmLabel={t('delete')}
        onCancel={() => setView({ k: 'plan', id: plan.id })}
        onConfirm={() => {
          usePlans.getState().remove(plan.id);
          useUI.getState().notify(t('planDeleted'));
          setView(usePlans.getState().plans.length ? { k: 'list' } : { k: 'new' });
        }}
      />
    );
  }
  return <PlanList onClose={close} onNew={() => setView({ k: 'new' })} onOpen={(id) => setView({ k: 'plan', id })} />;
}

function Meter({ plan }: { plan: Plan }) {
  const t = useT();
  const { done, total, percent } = progressOf(plan);
  return (
    <>
      <div className="plan-bar-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-label={planTitle(t, plan)}><i style={{ width: `${percent}%` }} /></div>
      <div className="plan-meta"><span>{t('planProgress', { done, total })}</span><span>{percent}%</span></div>
    </>
  );
}

function PlanList({ onClose, onNew, onOpen }: { onClose: () => void; onNew: () => void; onOpen: (id: string) => void }) {
  const t = useT();
  const plans = usePlans((s) => s.plans);
  const bookName = useBookName();
  const active = plans.filter((p) => !p.finishedAt).sort(byRecent);
  const finished = plans.filter((p) => p.finishedAt).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0));
  const fmt = useMemo(() => new Intl.DateTimeFormat(t.lang, { day: 'numeric', month: 'short' }), [t.lang]);

  return (
    <Sheet title={t('plansTitle')} icon={ListChecks} onClose={onClose} footer={<div className="ask-foot"><Button block variant="primary" icon={Plus} onClick={onNew}>{t('plansNew')}</Button></div>}>
      {plans.length === 0 && <Empty icon={ListChecks} compact>{t('plansEmpty')}</Empty>}
      <div className="plan-list">
        {active.map((p) => {
          const { next } = progressOf(p);
          const r = readingsOf(p)[next];
          const readToday = !!p.readAt && sameDay(p.readAt);
          return (
            <button key={p.id} className="plan-card" onClick={() => onOpen(p.id)}>
              <span className="plan-top">
                <span className="grow">
                  <b>{planTitle(t, p)}</b>
                  <span className="plan-sub">{refOfItems(p.items.slice(r.start, r.end), bookName)}</span>
                </span>
                {readToday ? <CheckCircle size={22} weight="fill" className="plan-ok" aria-label={t('planMarkRead')} /> : <span className="plan-tag">{t('planNext')}</span>}
              </span>
              <Meter plan={p} />
            </button>
          );
        })}
      </div>
      {finished.length > 0 && (
        <>
          <h3 className="plan-eyebrow">{t('plansDone')}</h3>
          <ul>
            {finished.map((p) => (
              <li key={p.id}>
                <Row icon={CheckCircle} iconSize={24} title={planTitle(t, p)} sub={t('planFinishedOn', { date: fmt.format(p.finishedAt) })} onClick={() => onOpen(p.id)} className="plan-done-row" />
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}

const summaryOf = (t: Translator, chapters: number, days: number) => {
  const d = effectiveDays(chapters, days);
  const avg = chaptersPerDay(chapters, days);
  const text = avg >= 10 ? String(Math.round(avg)) : new Intl.NumberFormat(t.lang, { maximumFractionDigits: 1 }).format(avg);
  return { days: d, avgText: t.n('planAvg', avg, { n: text }) };
};

function NewPlan({ onClose, lead, onCustom, onCreated }: { onClose: () => void; lead: React.ReactNode; onCustom: () => void; onCreated: (id: string) => void }) {
  const t = useT();
  const create = (p: Preset) => {
    const items = itemsOfBooks(p.books);
    const plan = usePlans.getState().create({ name: '', preset: p.id, items, days: p.days });
    trackFeature('plan_create');
    useUI.getState().notify(t('planCreated'));
    onCreated(plan.id);
  };
  return (
    <Sheet title={t('plansNew')} icon={ListPlus} onClose={onClose} leading={lead}>
      <Row icon={PencilSimple} iconSize={24} className="plan-custom-row" title={t('plansCustom')} sub={t('plansCustomSub')} onClick={onCustom} />
      <h3 className="plan-eyebrow">{t('plansReady')}</h3>
      <ul>
        {PRESETS.map((p) => {
          const n = itemsOfBooks(p.books).length;
          const { days, avgText } = summaryOf(t, n, p.days);
          return (
            <li key={p.id}>
              <Row title={t(PRESET_NAME[p.id])} sub={`${chaptersText(t, n)} · ${t.n('planDays', days)} · ${avgText}`} onClick={() => create(p)} />
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

const DURATIONS: { days: number; key: Key }[] = [
  { days: 7, key: 'planD7' }, { days: 30, key: 'planD30' }, { days: 180, key: 'planD180' }, { days: 365, key: 'planD365' },
];
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function CustomPlan({ onClose, lead, onCreated }: { onClose: () => void; lead: React.ReactNode; onCreated: (id: string) => void }) {
  const t = useT();
  const books = useBooks();
  const bookName = useBookName();
  const [picks, setPicks] = useState<Record<string, Set<number>>>({});
  const [days, setDays] = useState(30);
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<string | null>(null);

  const count = Object.values(picks).reduce((n, s) => n + s.size, 0);
  const shown = books.filter((b) => fold(b.name).includes(fold(query.trim())));
  const { days: eff, avgText } = summaryOf(t, Math.max(count, 1), days);

  const all = (n: number) => new Set(Array.from({ length: n }, (_, i) => i + 1));
  const setBook = (id: string, set: Set<number>) => setPicks((p) => ({ ...p, [id]: set }));
  const shortcut = (testament: 'AT' | 'NT') => setPicks(Object.fromEntries(books.filter((b) => b.testament === testament).map((b) => [b.id, all(b.chapters)])));
  const toggleChapter = (id: string, c: number) => {
    const next = new Set(picks[id] ?? []);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setBook(id, next);
  };
  const create = () => {
    const items = itemsOfPicks(picks);
    if (!items.length) return;
    const plan = usePlans.getState().create({ name: customName(items, bookName, t('plansCustomName')), items, days });
    trackFeature('plan_create');
    useUI.getState().notify(t('planCreated'));
    onCreated(plan.id);
  };
  const setNumber = (v: number) => setDays(Math.max(1, Math.min(MAX_DAYS, Math.round(v) || 1)));

  return (
    <Sheet
      title={t('plansCustomTitle')}
      icon={PencilSimple}
      onClose={onClose}
      leading={lead}
      footer={
        <div className="plan-foot">
          <span>
            {count ? (
              <>
                <b>{t('planSummary', { chapters: chaptersText(t, count), days: t.n('planDays', eff) })}</b>
                <br />
                {avgText}
              </>
            ) : (
              t('planPick')
            )}
          </span>
          <div className="actions">
            <Button icon={Eraser} disabled={!count} onClick={() => setPicks({})}>{t('planClear')}</Button>
            <Button variant="primary" icon={Plus} disabled={!count} onClick={create}>{t('planCreate')}</Button>
          </div>
        </div>
      }
    >
      <h3 className="plan-eyebrow">{t('planDuration')}</h3>
      <div className="plan-chips">
        {DURATIONS.map((d) => (
          <button key={d.days} className="chip-btn sort-btn" aria-pressed={days === d.days} onClick={() => setDays(d.days)}>{t(d.key)}</button>
        ))}
      </div>
      <div className="plan-step">
        <button className="icon-btn" aria-label={t('planLess')} onClick={() => setNumber(days - 1)}><Minus size={20} /></button>
        <input type="number" inputMode="numeric" min={1} max={MAX_DAYS} value={days} aria-label={t('planDaysField')} onChange={(e) => setNumber(Number(e.target.value))} />
        <span>{t('planDaysUnit')}</span>
        <button className="icon-btn" aria-label={t('planMore')} onClick={() => setNumber(days + 1)}><Plus size={20} /></button>
      </div>

      <h3 className="plan-eyebrow">{t('planWhat')}</h3>
      <SearchField value={query} onChange={setQuery} placeholder={t('planSearchBooks')} aria-label={t('planSearchBooks')} clearLabel={t('clearSearch')} />
      <div className="plan-chips">
        <button className="chip-btn" onClick={() => shortcut('AT')}>{t('testamentOld')}</button>
        <button className="chip-btn" onClick={() => shortcut('NT')}>{t('testamentNew')}</button>
      </div>
      {shown.length === 0 && <p className="hint">{t('planNoBooks')}</p>}
      <ul className="plan-books">
        {shown.map((b) => {
          const set = picks[b.id] ?? new Set<number>();
          const state = set.size === 0 ? 'none' : set.size === b.chapters ? 'all' : 'part';
          const open = opened === b.id;
          return (
            <li key={b.id}>
              <div className="plan-book">
                <button className="plan-cb" data-state={state} aria-pressed={state === 'all' ? true : state === 'part' ? 'mixed' : false} aria-label={t('planPickBook', { name: b.name })} onClick={() => setBook(b.id, state === 'all' ? new Set() : all(b.chapters))}>
                  {state === 'all' ? <Check size={14} weight="bold" /> : state === 'part' ? <Minus size={14} weight="bold" /> : null}
                </button>
                <button className="plan-book-name" onClick={() => setOpened(open ? null : b.id)} aria-expanded={open}>
                  <span className="title">{b.name}</span>
                  <span className="sub">{state === 'all' ? t('planWholeBook') : state === 'part' ? t('planPartial', { n: set.size, c: b.chapters }) : chaptersText(t, b.chapters)}</span>
                </button>
                <button className="icon-btn" aria-label={t(open ? 'planHideChapters' : 'planShowChapters', { name: b.name })} onClick={() => setOpened(open ? null : b.id)}>
                  {open ? <CaretUp size={18} weight="light" /> : <CaretDown size={18} weight="light" />}
                </button>
              </div>
              {open && (
                <div className="plan-caps">
                  {Array.from({ length: b.chapters }, (_, i) => i + 1).map((c) => (
                    <button key={c} aria-pressed={set.has(c)} onClick={() => toggleChapter(b.id, c)}>{c}</button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

function PlanView({ plan, onClose, lead, onDelete, onAgain }: { plan: Plan; onClose: () => void; lead: React.ReactNode; onDelete: () => void; onAgain: (id: string) => void }) {
  const t = useT();
  const bookName = useBookName();
  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const fmt = useMemo(() => new Intl.DateTimeFormat(t.lang, { day: 'numeric', month: 'short' }), [t.lang]);
  const readings = readingsOf(plan);
  const prog = progressOf(plan);
  const done = useMemo(() => new Set(plan.done), [plan.done]);
  const finished = !!plan.finishedAt;
  const nextRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    nextRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  const open = (i: number) => {
    const r = readings[i];
    const at = firstUnread(plan, r);
    trackFeature('plan_read');
    useUI.getState().close();
    useStudy.getState().goTo(at.book, at.chapter);
    go('/');
  };
  const toggle = (i: number, isRead: boolean) => {
    const r = readings[i];
    markPlan(t, plan.id, Array.from({ length: r.end - r.start }, (_, k) => r.start + k), !isRead);
  };
  const again = () => {
    const copy = usePlans.getState().create({ name: plan.name, preset: plan.preset, items: plan.items, days: plan.days });
    trackFeature('plan_create');
    useUI.getState().notify(t('planCreated'));
    onAgain(copy.id);
  };

  return (
    <Sheet
      title={planTitle(t, plan)}
      icon={ListChecks}
      onClose={onClose}
      leading={lead}
      footer={
        <div className="plan-foot">
          <div className="actions">
            <Button className="danger" icon={Trash} block={!finished} onClick={onDelete}>{finished ? t('delete') : t('planDelete')}</Button>
            {finished && <Button variant="primary" icon={ArrowClockwise} onClick={again}>{t('planAgain')}</Button>}
          </div>
        </div>
      }
    >
      {finished ? (
        <div className="plan-card static plan-finished">
          <CheckCircle size={36} weight="fill" className="plan-ok" />
          <b>{t('planFinishedTitle')}</b>
          <span className="plan-sub">{t('planFinishedOn', { date: fmt.format(plan.finishedAt!) })}</span>
          <Meter plan={plan} />
          <p>{t('planCongrats', { chapters: chaptersText(t, plan.items.length) })}</p>
        </div>
      ) : (
        <div className="plan-card static"><Meter plan={plan} /></div>
      )}
      {!finished && (
        <div className="plan-chips">
          <button className="chip-btn sort-btn" aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>{t('planFilterOpen')}</button>
          <button className="chip-btn sort-btn" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{t('planFilterAll')}</button>
        </div>
      )}
      {finished && <h3 className="plan-eyebrow">{t('planReads')}</h3>}
      <ul className="plan-days">
        {readings.map((r, i) => {
          const isRead = Array.from({ length: r.end - r.start }, (_, k) => done.has(r.start + k)).every(Boolean);
          if (filter === 'open' && !finished && isRead) return null;
          const isNext = !finished && i === prog.next;
          const ref = refOfItems(plan.items.slice(r.start, r.end), bookName);
          return (
            <li key={i} ref={isNext ? nextRef : undefined} className={`plan-day${isNext ? ' now' : ''}${isRead ? ' read' : ''}`}>
              <button className="plan-state" aria-pressed={isRead} aria-label={t(isRead ? 'planMarkUnread' : 'planMarkRead')} onClick={() => toggle(i, isRead)}>
                {isRead ? <CheckCircle size={24} weight="fill" className="plan-ok" /> : <Circle size={24} weight="regular" />}
              </button>
              <button className="plan-day-body" aria-label={t('planReadNow', { ref })} onClick={() => open(i)}>
                <span className="title">{ref}</span>
                <span className="sub">{t('planDay', { n: i + 1 })}</span>
              </button>
              {isNext && <span className="plan-tag">{t('planNext')}</span>}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
