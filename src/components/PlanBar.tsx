import { CaretRight, Check } from '@phosphor-icons/react';
import { useStudy } from '../state/study';
import { usePlans } from '../state/plans';
import { useT } from '../i18n';
import { chaptersLeft, latestActive, parseItem, pendingIndex, readingsOf } from '../data/plans';
import { Button } from './Button';
import { markPlan, planTitle } from './PlansSheet';

/** Floating bar in the reader when the chapter on screen is still to read in an active plan. */
export function PlanBar() {
  const t = useT();
  const book = useStudy((s) => s.book);
  const chapter = useStudy((s) => s.chapter);
  const plans = usePlans((s) => s.plans);
  const plan = latestActive(plans.filter((p) => pendingIndex(p, book, chapter) >= 0));
  if (!plan) return null;
  const index = pendingIndex(plan, book, chapter);
  const readings = readingsOf(plan);
  const at = readings.findIndex((r) => index >= r.start && index < r.end);
  const r = readings[at];
  const total = r.end - r.start;
  // The count follows where the person is in the reading, however they got there (this button, swiping or the buttons at the foot of the chapter).
  // Chapters already marked on their own still count.
  const read = Math.max(index - r.start, total - chaptersLeft(plan, r));
  const last = index === r.end - 1;
  const advance = () => {
    const to = parseItem(plan.items[index + 1]);
    useStudy.getState().goTo(to.book, to.chapter);
  };
  // The last chapter closes the whole reading.
  const finish = () => markPlan(t, plan.id, Array.from({ length: total }, (_, k) => r.start + k), true);
  return (
    <div className="listen-bar plan-reader-bar" role="region" aria-label={planTitle(t, plan)}>
      <span className="grow">
        <b>{planTitle(t, plan)} · {t('planDay', { n: at + 1 })}</b>
        <span className="plan-bar-count">
          <span className="plan-bar-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={read} aria-label={t('planCount', { done: read, total })}><i style={{ width: `${(read / total) * 100}%` }} /></span>
          <span>{t('planCount', { done: read, total })}</span>
        </span>
      </span>
      {last ? (
        <Button variant="primary" size="sm" icon={Check} iconSide="right" onClick={finish}>{t('planMarkRead')}</Button>
      ) : (
        <Button variant="primary" size="sm" icon={CaretRight} iconSide="right" onClick={advance}>{t('planNext')}</Button>
      )}
    </div>
  );
}
