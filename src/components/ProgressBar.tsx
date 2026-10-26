import { useT } from '../i18n';

/** Barra de progresso de download. `value` vai de 0 a 1. */
export function ProgressBar({ value }: { value: number }) {
  const t = useT();
  const pct = Math.round(value * 100);
  return (
    <div className="progress" role="progressbar" aria-label={t('downloading')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <i style={{ width: `${value * 100}%` }} />
    </div>
  );
}
