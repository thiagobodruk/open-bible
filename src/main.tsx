import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/literata';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/reader.css';
import './styles/screens.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initSettingsEffects } from './state/settings';
import { boot } from './boot';
import { initUpdates } from './update';

initSettingsEffects();
boot();

initUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

const SPLASH_MIN = 1200;
const SPLASH_MAX = 3000;

/** Tira a splash quando o app já desenhou e as fontes carregaram, mas só depois de ficar 1,2 s à vista. */
const splash = document.getElementById('splash');
if (splash) {
  const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const shown = Math.max(0, SPLASH_MIN - performance.now());
  void Promise.all([Promise.race([fonts, wait(SPLASH_MAX)]), wait(shown)]).then(() =>
    requestAnimationFrame(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 400);
    }),
  );
}
