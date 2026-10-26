import { HL_COLORS, type HlColor } from '../state/study';
import { useT } from '../i18n';

interface Props {
  label: string;
  /** Diz se a cor aparece marcada. `null` é a opção "todas". */
  pressed: (color: HlColor | null) => boolean;
  onPick: (color: HlColor) => void;
  /** Quando existe, mostra a opção "todas" antes das cores (usado nos filtros). */
  onAll?: () => void;
  /** Rótulo de cada cor: "Destacar com …" (padrão) ou só o nome da cor (filtros). */
  describe?: 'paint' | 'name';
}

/** Escolha de cor de destaque, usada ao destacar, ao anotar e ao filtrar. */
export function ColorSwatches({ label, pressed, onPick, onAll, describe = 'paint' }: Props) {
  const t = useT();
  const nameOf = (c: HlColor) => (describe === 'name' ? t(c) : t('highlightWith', { color: t.lang === 'de' ? t(c) : t(c).toLowerCase() }));
  return (
    <div className="sheet-colors" role="group" aria-label={label}>
      {onAll && <button className="swatch all" aria-pressed={pressed(null)} aria-label={t('allColors')} onClick={onAll} />}
      {HL_COLORS.map((c) => (
        <button key={c} className={`swatch c-${c}`} aria-pressed={pressed(c)} aria-label={nameOf(c)} onClick={() => onPick(c)} />
      ))}
    </div>
  );
}
