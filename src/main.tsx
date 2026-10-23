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
