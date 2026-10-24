import { useEffect } from 'react';
import { useRoute } from './router';
import { useUI } from './state/ui';
import { useStudy } from './state/study';
import { useSettings } from './state/settings';
import { useLibrary } from './state/library';
import { useIncoming } from './state/incoming';
import { appUrl, readPath } from './link';
import { Reader } from './screens/Reader';
import { Study } from './screens/Study';
import { Library } from './screens/Library';
import { Settings } from './screens/Settings';
import { MenuSheet } from './components/MenuSheet';
import { NavigatorSheet } from './components/NavigatorSheet';
import { TextSettingsSheet } from './components/TextSettingsSheet';
import { NoteSheet } from './components/NoteSheet';
import { InstallSheet } from './components/InstallSheet';
import { FeedbackSheet } from './components/FeedbackSheet';
import { CompareSheet } from './components/CompareSheet';
import { XrefSheet } from './components/XrefSheet';
import { ListenSheet } from './components/ListenSheet';
import { SearchSheet } from './components/SearchSheet';
import { Toast } from './components/Toast';

export default function App() {
  const route = useRoute();
  const { sheet, close } = useUI();

  // O endereço acompanha a leitura: /open-bible/<versão>/<livro>/<capítulo>
  const book = useStudy((s) => s.book);
  const chapter = useStudy((s) => s.chapter);
  const versionId = useSettings((s) => s.versionId);
  const installed = useLibrary((s) => !!s.installed[versionId]);
  const ready = useLibrary((s) => s.ready);
  const pending = useIncoming((s) => s.incoming !== null);
  const homeUrl = useUI((s) => s.homeUrl);
  useEffect(() => {
    if (route !== '/' || !ready || !installed || pending) return;
    const path = homeUrl ? new URL(appUrl()).pathname : readPath(versionId, book, chapter);
    if (location.pathname !== path || location.hash) history.replaceState(history.state, '', path + location.search);
  }, [route, ready, installed, pending, homeUrl, versionId, book, chapter]);

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
      {sheet === 'compare' && <CompareSheet />}
      {sheet === 'xrefs' && <XrefSheet />}
      {sheet === 'search' && <SearchSheet />}
      {sheet === 'install' && <InstallSheet />}
      {sheet === 'feedback' && <FeedbackSheet />}
      {sheet === 'listen' && <ListenSheet />}
      <Toast />
    </>
  );
}
