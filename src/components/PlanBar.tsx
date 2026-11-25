import { CaretRight, Check } from '@phosphor-icons/react';
import { useStudy } from '../state/study';
import { usePlans } from '../state/plans';
import { useBookName } from '../hooks';
import { useT } from '../i18n';
import { chaptersLeft, latestActive, parseItem, pendingIndex, readingsOf, refOfItems } from '../data/plans';
import { Button } from './Button';
import { markPlan, planTitle } from './PlansSheet';

/** Floating bar in the reader when the chapter on screen is still to read in an active plan. */
export function PlanBar() {
  const t = useT();
  const book = useStudy((s) => s.book);
  const chapter = useStudy((s) => s.chapter);
  const plans = usePlans((s) => s.plans);
  const bookName = useBookName();
  const plan = latestActive(plans.filter((p) => pendingIndex(p, book, chapter) >= 0));
  if (!plan) return null;
  const index = pendingIndex(plan, book, chapter);
  const readings = readingsOf(plan);
  const at = readings.findIndex((r) => index >= r.start && index < r.end);
  const r = readings[at];
  const left = chaptersLeft(plan, r);
  const ref = refOfItems(plan.items.slice(r.start, r.end), bookName);
  // Another chapter of this reading is still to read after this one: the button moves on to it instead of closing the reading.
  let later = -1;
  for (let i = index + 1; i < r.end; i++) {
    if (!plan.done.includes(i)) {
      later = i;
      break;
    }
  }
  const advance = () => {
    markPlan(t, plan.id, [index], true);
    const to = parseItem(plan.items[later]);
    useStudy.getState().goTo(to.book, to.chapter);
  };
  return (
    <div className="listen-bar plan-reader-bar" role="region" aria-label={planTitle(t, plan)}>
      <span className="grow">
        <b>{planTitle(t, plan)} · {t('planDay', { n: at + 1 })}</b>
        <span className="plan-sub">{ref} · {t('planBarLeft', { left, total: r.end - r.start })}</span>
      </span>
      {later >= 0 ? (
        <Button variant="primary" size="sm" icon={CaretRight} iconSide="right" onClick={advance}>{t('planNext')}</Button>
      ) : (
        <Button variant="primary" size="sm" icon={Check} onClick={() => markPlan(t, plan.id, [index], true)}>{t('planMarkRead')}</Button>
      )}
    </div>
  );
}
