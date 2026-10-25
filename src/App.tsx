import { useEffect } from 'react';
import { useRoute } from './router';
import { useUI } from './state/ui';
import { useStudy } from './state/study';
import { useSettings } from './state/settings';
import { useLibrary } from './state/library';
import { useIncoming } from './state/incoming';
import { useIntro } from './state/intro';
import { Intro } from './components/Intro';
import { appUrl, readPath, searchWithoutRef } from './link';
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
import { AskCrash, AskSheet } from './components/AskSheet';
import { ErrorBoundary } from './components/ErrorBoundary';
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

  // A abertura inicial é só para quem chega sem nenhuma Bíblia. Quem já usa o app não a vê.
  const introDone = useIntro((s) => s.done);
  const hasVersions = useLibrary((s) => Object.keys(s.installed).length > 0);
  useEffect(() => {
    if (ready && hasVersions && !introDone) useIntro.getState().finish();
  }, [ready, hasVersions, introDone]);

  useEffect(() => {
    if (route !== '/' || !ready || !installed || pending) return;
    const sync = () => {
      const path = homeUrl ? new URL(appUrl()).pathname : readPath(versionId, book, chapter);
      const search = searchWithoutRef();
      if (location.pathname !== path || location.hash || location.search !== search) history.replaceState(history.state, '', path + search);
    };
    sync();
    // Fechar um sheet volta uma entrada do histórico, que pode guardar um endereço de antes da leitura mudar.
    // Com rota no endereço (#/study), quem navega é o roteador, então não mexe.
    const onPop = () => !location.hash && sync();
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
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
      {sheet === 'ask' && (
        <ErrorBoundary fallback={(reset) => <AskCrash onRetry={reset} />}>
          <AskSheet />
        </ErrorBoundary>
      )}
      {sheet === 'search' && <SearchSheet />}
      {sheet === 'install' && <InstallSheet />}
      {sheet === 'feedback' && <FeedbackSheet />}
      {sheet === 'listen' && <ListenSheet />}
      {ready && !hasVersions && !introDone && <Intro />}
      <Toast />
    </>
  );
}
