import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
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

initSettingsEffects();
boot();

// A versão nova espera em segundo plano e entra quando o app sai de cena, sem interromper a leitura.
let waiting = false;
const update = registerSW({
  onNeedRefresh() {
    waiting = true;
  },
});
document.addEventListener('visibilitychange', () => {
  if (waiting && document.visibilityState === 'hidden') void update(true);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
