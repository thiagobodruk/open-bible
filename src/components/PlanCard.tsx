import { BookOpenText } from '@phosphor-icons/react';
import { useUI } from '../state/ui';
import { usePlans } from '../state/plans';
import { useBookName } from '../hooks';
import { useT } from '../i18n';
import { latestActive, progressOf, readingsOf, refOfItems, shortName } from '../data/plans';
import { Button } from './Button';
import { planTitle, readPlan } from './PlansSheet';

/** Top of the menu: the plan read most recently, with a button to the next reading. Nothing when there is no active plan. */
export function PlanCard() {
  const t = useT();
  const plans = usePlans((s) => s.plans);
  const bookName = useBookName();
  const plan = latestActive(plans);
  if (!plan) return null;
  const { next, percent } = progressOf(plan);
  const r = readingsOf(plan)[next];
  const ref = refOfItems(plan.items.slice(r.start, r.end), (b) => shortName(bookName(b)));
  const full = refOfItems(plan.items.slice(r.start, r.end), bookName);
  const openPlan = () => {
    usePlans.setState({ focus: plan.id });
    useUI.getState().open('plans');
  };
  return (
    <div className="plan-card menu-plan">
      <button className="menu-plan-main" onClick={openPlan} aria-label={planTitle(t, plan)}>
        <b>{planTitle(t, plan)}</b>
        <span className="menu-plan-bar">
          <span className="plan-bar-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></span>
          <span>{percent}%</span>
        </span>
      </button>
      <Button variant="primary" size="sm" icon={BookOpenText} className="menu-plan-cta" aria-label={t('planReadNow', { ref: full })} onClick={() => readPlan(plan)}>
        <span>{ref}</span>
      </Button>
    </div>
  );
}
