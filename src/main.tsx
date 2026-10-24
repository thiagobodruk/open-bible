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
import { initSettingsEffects } from './state/settings';
import { boot } from './boot';
import { initUpdates } from './update';

initSettingsEffects();
boot();

initUpdates();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/** Tira a splash quando o app já desenhou e as fontes carregaram (no máximo 1,5 s de espera). */
const splash = document.getElementById('splash');
if (splash) {
  const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
  void Promise.race([fonts, new Promise((r) => setTimeout(r, 1500))]).then(() =>
    requestAnimationFrame(() => {
      splash.classList.add('hide');
      setTimeout(() => splash.remove(), 400);
    }),
  );
}
