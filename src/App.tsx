import { useEffect } from 'react';
import { useRoute } from './router';
import { useUI } from './state/ui';
import { Reader } from './screens/Reader';
import { Study } from './screens/Study';
import { Library } from './screens/Library';
import { Settings } from './screens/Settings';
import { MenuSheet } from './components/MenuSheet';
import { NavigatorSheet } from './components/NavigatorSheet';
import { TextSettingsSheet } from './components/TextSettingsSheet';
import { NoteSheet } from './components/NoteSheet';
import { InstallSheet } from './components/InstallSheet';
import { SearchSheet } from './components/SearchSheet';
import { Toast } from './components/Toast';

export default function App() {
  const route = useRoute();
  const { sheet, close } = useUI();

  // Troca de tela fecha sheets e volta ao topo
  useEffect(() => {
    close();
  }, [route, close]);

  return (
    <>
      {route === '/' && <Reader />}
      {route === '/study' && <Study />}
      {route === '/library' && <Library />}
      {route === '/settings' && <Settings />}

      {sheet === 'menu' && <MenuSheet />}
      {sheet === 'navigator' && <NavigatorSheet />}
      {sheet === 'text' && <TextSettingsSheet />}
      {sheet === 'note' && <NoteSheet />}
      {sheet === 'search' && <SearchSheet />}
      {sheet === 'install' && <InstallSheet />}
      <Toast />
    </>
  );
}
