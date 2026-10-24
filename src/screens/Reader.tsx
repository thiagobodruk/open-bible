import { useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight, List, MagnifyingGlass, NotePencil, TextAa } from '@phosphor-icons/react';
import { abbrOf, findVersion } from '../data/catalog';
import { useBookName, useBooks, useChapter } from '../hooks';
import { useLibrary } from '../state/library';
import { useSettings } from '../state/settings';
import { vkey, useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { readingVars } from '../components/readingVars';
import { SelectionBar } from '../components/SelectionBar';
import { AskBar } from '../components/AskBar';
import { AskFab } from '../components/AskFab';
import { aiEnabled } from '../ai';
import { useAsk } from '../state/ask';
import { InstallBanner } from '../components/InstallBanner';
import { SwipeHint } from '../components/SwipeHint';
import { Welcome } from '../components/Welcome';
import { useIncoming } from '../state/incoming';
import { go } from '../router';
import { hintPending, markHintSeen } from '../hint';
import { isMobile } from '../install';
import { ListenBar } from '../components/ListenBar';
import { resume, setSilentHandler, stop, useListen } from '../listen';
import { useT } from '../i18n';

export function Reader() {
  const t = useT();
  const { book, chapter, selection, highlights, notes, focusVerse, step, toggleVerse, clearFocus } = useStudy();
  const settings = useSettings();
  const { sheet, open, notify } = useUI();
  const askBar = useAsk((s) => s.bar) && aiEnabled;
  const [barMini, setBarMini] = useState(false);
  const [hint, setHint] = useState(false);
  const [dir, setDir] = useState<'next' | 'prev' | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const listenStatus = useListen((s) => s.status);
  const listenVerse = useListen((s) => s.verse);
  const advancing = useListen((s) => s.advancing);

  const books = useBooks();
  const bookName = useBookName();
  const installed = useLibrary((s) => !!s.installed[settings.versionId]);
  const awaitingLink = useIncoming((s) => s.incoming !== null);
  const libraryReady = useLibrary((s) => s.ready);
  const text = useChapter(book, chapter);
  const verses = text.status === 'ready' ? text.verses : [];
  const bName = bookName(book);
  const versionInfo = findVersion(settings.versionId);
  const hasSelection = selection.length > 0;
  const blocked = hasSelection || sheet !== null;

  const move = (delta: 1 | -1) => {
    if (blocked) return;
    if (step(delta)) {
      markHintSeen();
      setDir(delta === 1 ? 'next' : 'prev');
      scrollTo(0, 0);
    } else {
      notify(delta === 1 ? t('lastChapter') : t('firstChapter'));
    }
  };

  // A posição salva pode não existir na versão atual (por exemplo, uma versão só com o NT).
  useEffect(() => {
    if (!installed || books.some((x) => x.id === book && chapter <= x.chapters)) return;
    const target = books.find((x) => x.id === book) ?? books[0];
    if (target) useStudy.getState().goTo(target.id, 1);
  }, [installed, books, book, chapter]);

  // Trocar de capítulo por conta própria encerra a leitura. Quando ela mesma avança, continua no novo texto.
  useEffect(() => {
    const l = useListen.getState();
    if (l.status !== 'idle' && !l.advancing) stop();
  }, [book, chapter]);

  useEffect(() => {
    if (!advancing) return;
    if (text.status === 'ready' && verses.length) resume(verses, versionInfo?.lang ?? 'en');
    else if (text.status !== 'loading') stop();
  }, [advancing, text.status, verses, versionInfo?.lang]);

  useEffect(() => setSilentHandler(() => notify(t('listenSilent'))), [notify, t]);
  useEffect(() => () => stop(), []);

  // Acompanha o versículo lido, sem rolar se ele já está à vista.
  useEffect(() => {
    if (listenVerse === null) return;
    const el = document.getElementById(`v-${listenVerse}`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 110 || r.bottom > innerHeight - 110) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [listenVerse]);

  // Barra retrátil: some ao rolar para baixo, volta ao rolar para cima.
  useEffect(() => {
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      if (y < 60) setBarMini(false);
      else if (y > last + 8) setBarMini(true);
      else if (y < last - 8) setBarMini(false);
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!installed) return;
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'Escape') useStudy.getState().clearSelection();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  // Vem de Meu estudo com um versículo em foco
  useEffect(() => {
    if (focusVerse === null) return;
    if (text.status === 'loading') return;
    const el = document.getElementById(`v-${focusVerse}`);
    if (el) {
      el.scrollIntoView({ block: 'center' });
      el.classList.add('flash');
    }
    clearFocus();
  }, [focusVerse, clearFocus, book, chapter, text.status]);

  // Dica de gesto só na primeira abertura. Vale como vista quando aparece ou quando o usuário já troca de capítulo.
  useEffect(() => {
    if (!installed || !isMobile() || !hintPending()) return;
    const id = setTimeout(() => {
      if (!hintPending()) return;
      setHint(true);
      markHintSeen();
    }, 700);
    return () => clearTimeout(id);
  }, [installed]);

  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0];
    touch.current = { x: p.clientX, y: p.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - s.x;
    const dy = p.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
  };

  const onPageClick = (e: React.MouseEvent) => {
    if (e.clientY < 90) setBarMini(false);
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-v]');
    if (el) toggleVerse(Number(el.dataset.v));
    else if (hasSelection) useStudy.getState().clearSelection();
  };

  const noteAt = (v: number) => notes.some((n) => n.book === book && n.chapter === chapter && v >= n.verseStart && v <= n.verseEnd);

  if (libraryReady && (!installed || awaitingLink)) return <Welcome />;

  return (
    <div className="reader">
      <header className={`topbar ${barMini && !blocked ? 'mini' : ''}`}>
        <div className="topbar-in">
          <button className="mini-title" onClick={() => setBarMini(false)} aria-label={t('showBar', { ref: `${bName} ${chapter}`, abbr: abbrOf(settings.versionId) })} tabIndex={barMini && !blocked ? 0 : -1}>
            <span>{bName} {chapter}</span><i aria-hidden="true" /><span>{abbrOf(settings.versionId)}</span>
          </button>
          <button className="crumb" onClick={() => open('navigator')} aria-label={t('pickBook', { ref: `${bName} ${chapter}` })}>
            <span>{bName} {chapter}</span>
          </button>
          <button className="ver-chip" onClick={() => go('/library')} aria-label={t('chooseVersion')}>
            {abbrOf(settings.versionId)}
          </button>
          <span className="spacer" />
          <button className="icon-btn" onClick={() => open('search')} aria-label={t('search')}><MagnifyingGlass size={24} weight="light" /></button>
          <button className="icon-btn" onClick={() => open('text')} aria-label={t('textSettings')}><TextAa size={24} weight="light" /></button>
          <button className="icon-btn" onClick={() => open('menu')} aria-label={t('menu')}><List size={24} weight="light" /></button>
        </div>
      </header>

      <button className="edge left" hidden={blocked} onClick={() => move(-1)} aria-label={t('prevChapter')}><CaretLeft size={28} weight="light" /></button>
      <button className="edge right" hidden={blocked} onClick={() => move(1)} aria-label={t('nextChapter')}><CaretRight size={28} weight="light" /></button>

      <main
        className={`page${(hasSelection || askBar) && !sheet ? ' has-sel' : ''}`}
        style={readingVars(settings)}
        onClick={onPageClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <article
          key={`${book}.${chapter}`}
          className={`chapter ${dir ? `anim-${dir}` : ''} ${settings.textMode === 'verses' ? 'verses' : 'paragraph'} vn-${settings.verseNumbers}`}
          lang={versionInfo?.lang}
          dir={versionInfo?.rtl ? 'rtl' : undefined}
        >
          <h1 className="chapter-title">
            <span className="bk">{bName}</span>
            <span className="nr">{chapter}</span>
          </h1>
          {text.status === 'missing' && installed && <p className="chapter-note">{t('chapterMissing')}</p>}
          {text.status === 'ready' && verses.length === 0 && <p className="chapter-note">{t('chapterEmpty')}</p>}
          {verses.map((text, i) => {
            const v = i + 1;
            const hl = highlights[vkey(book, chapter, v)];
            const cls = ['verse', hl ? `hl c-${hl.color}` : '', selection.includes(v) ? 'sel' : '', listenStatus !== 'idle' && listenVerse === v ? 'speaking' : ''].join(' ');
            return (
              <span key={v} data-v={v} className="verse-wrap">
                <span id={`v-${v}`} className={cls}>
                  <span className="vn">{v}</span>
                  {text}
                  {noteAt(v) && <NotePencil className="note-mark" size={14} weight="fill" aria-label={t('hasNote')} />}
                </span>{' '}
              </span>
            );
          })}
          <div className="chapter-foot">
            <button className="btn" onClick={() => move(-1)}><CaretLeft size={18} weight="light" /> {t('prev')}</button>
            <button className="btn" onClick={() => move(1)}>{t('next')} <CaretRight size={18} weight="light" /></button>
          </div>
        </article>
        {versionInfo && (
          <footer className="copyright">
            {t('copyright', { name: versionInfo.name, abbr: abbrOf(versionInfo.id) })}
          </footer>
        )}
      </main>

      {hint && <SwipeHint onDone={() => setHint(false)} />}
      {listenStatus !== 'idle' && !hasSelection && !askBar && sheet !== 'menu' && <ListenBar />}
      <InstallBanner hidden={blocked || listenStatus !== 'idle'} hold={hint} />
      {hasSelection && !sheet && !askBar && <SelectionBar />}
      {askBar && !sheet && <AskBar />}
      {aiEnabled && !askBar && !hasSelection && !sheet && <AskFab />}
    </div>
  );
}
