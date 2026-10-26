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
import { Settings } from './screens/Settings';
import { Privacy } from './screens/Privacy';
import { Terms } from './screens/Terms';
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
import { LibrarySheet } from './components/LibrarySheet';
import { DeleteAccountSheet } from './components/DeleteAccountSheet';
import { Toast } from './components/Toast';

/** The old #/library link now opens the reader with the library sheet on top. */
let openLibraryFromLink = location.hash === '#/library';

export default function App() {
  const route = useRoute();
  const { sheet, close } = useUI();

  // The URL follows the reading: /open-bible/<version>/<book>/<chapter>
  const book = useStudy((s) => s.book);
  const chapter = useStudy((s) => s.chapter);
  const versionId = useSettings((s) => s.versionId);
  const installed = useLibrary((s) => !!s.installed[versionId]);
  const ready = useLibrary((s) => s.ready);
  const pending = useIncoming((s) => s.incoming !== null);
  const homeUrl = useUI((s) => s.homeUrl);

  // The initial intro is only for those who arrive without any Bible. Those already using the app do not see it.
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
    // Closing a sheet goes back one history entry, which may hold a URL from before the reading changed.
    // With a route in the URL (#/study), the router navigates, so it does nothing.
    const onPop = () => !location.hash && sync();
    addEventListener('popstate', onPop);
    return () => removeEventListener('popstate', onPop);
  }, [route, ready, installed, pending, homeUrl, versionId, book, chapter]);

  // Changing screens closes sheets and scrolls back to the top
  useEffect(() => {
    close();
    if (openLibraryFromLink && route === '/') {
      openLibraryFromLink = false;
      history.replaceState(null, '', location.pathname + location.search);
      useUI.getState().open('library');
    }
  }, [route, close]);

  return (
    <>
      {route === '/' && <Reader />}
      {route === '/study' && <Study />}
      {route === '/settings' && <Settings />}
      {route === '/privacy' && <Privacy />}
      {route === '/terms' && <Terms />}

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
      {sheet === 'library' && <LibrarySheet />}
      {sheet === 'install' && <InstallSheet />}
      {sheet === 'feedback' && <FeedbackSheet />}
      {sheet === 'listen' && <ListenSheet />}
      {sheet === 'deleteAccount' && <DeleteAccountSheet />}
      {ready && !hasVersions && !introDone && route === '/' && <Intro />}
      <Toast />
    </>
  );
}
