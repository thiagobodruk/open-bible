import { ArrowLeft } from '@phosphor-icons/react';
import { back } from '../router';
import { t } from '../strings';

export function ScreenHeader({ title }: { title: string }) {
  return (
    <header className="screen-head">
      <button className="icon-btn" onClick={back} aria-label={t.back}>
        <ArrowLeft size={24} weight="light" />
      </button>
      <h1>{title}</h1>
    </header>
  );
}
