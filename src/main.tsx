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
import { useUI } from './state/ui';
import { boot } from './boot';

initSettingsEffects();
boot();

const update = registerSW({
  onNeedRefresh() {
    useUI.getState().notify('Nova versão disponível', { label: 'Atualizar', run: () => update(true) });
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
