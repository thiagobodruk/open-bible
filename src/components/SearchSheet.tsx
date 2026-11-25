import { Fragment, useDeferredValue, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowClockwise, CaretRight, Check, MagnifyingGlass, Sparkle, WarningCircle } from '@phosphor-icons/react';
import { SearchField } from './SearchField';
import { Sheet } from './Sheet';
import { loadSearchIndex, pruneSearchIndex, type IndexedChapter } from '../data/bible';
import { abbrOf } from '../data/catalog';
import { useBookName, useBooks } from '../hooks';
import { approxRanges, highlightRanges, minChars, normalize, PAGE_SIZE, parseReference, searchApprox, searchVerses, significantStems, stemsFound, type Hit } from '../search';
import { useLibrary } from '../state/library';
import { trackFeature } from '../analytics';
import { Chip } from './Chip';
import { Row } from './Row';
import { useSettings } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { go } from '../router';
import { refLabel } from '../ref';
import { useT } from '../i18n';
import { useScrollFade } from '../useScrollFade';
import { aiEnabled, type AiPassage } from '../ai';
import { AUTO_COVERAGE, AUTO_DELAY, autoAskLeft, CANDIDATES, countAutoAsk, looksLikePrompt, parseSuggestions } from '../aiSearch';
import { useRefBooks } from './AiText';
import { useAsk } from '../state/ask';
import { Empty } from './Empty';
import { Button } from './Button';
import { PromptField } from './PromptField';

function Highlighted({ text, ranges }: { text: string; ranges: [number, number][] }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  ranges.forEach(([a, b], i) => {
    parts.push(text.slice(at, a), <mark key={i}>{text.slice(a, b)}</mark>);
    at = b;
  });
  parts.push(text.slice(at));
  return <>{parts.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}

/** What the AI says about a verse. */
function AiNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="nt ai">
      <Sparkle size={14} weight="light" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

const hitKey = (h: { book: string; chapter: number; verse: number }) => `${h.book}.${h.chapter}.${h.verse}`;

const watchOnline = (cb: () => void) => {
  addEventListener('online', cb);
  addEventListener('offline', cb);
  return () => {
    removeEventListener('online', cb);
    removeEventListener('offline', cb);
  };
};
const useOnline = () => useSyncExternalStore(watchOnline, () => navigator.onLine, () => true);

/** Versions included in the search. Kept while the app is open, so reopening the search keeps the choice. */
let sessionSelection: string[] = [];
/** Last search, kept while the app is open so reopening the sheet shows the same results. Gone on reload. */
let sessionQuery = '';
let sessionLimit = PAGE_SIZE;

const VARIANT = (() => { try { return localStorage.getItem('__v') || 'A'; } catch { return 'A'; } })();

export function SearchSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const notify = useUI((s) => s.notify);
  const goTo = useStudy((s) => s.goTo);
  const versionId = useSettings((s) => s.versionId);
  const setSetting = useSettings((s) => s.set);
  const installed = useLibrary((s) => s.installed);
  const [q, setQ] = useState(sessionQuery);
  const dq = useDeferredValue(q);
  const [limit, setLimit] = useState(sessionLimit);
  sessionQuery = q;
  sessionLimit = limit;

  const books = useBooks();
  const bookName = useBookName();
  const chipsRow = useScrollFade<HTMLDivElement>();

  // Installed versions, the active one first. The selection only keeps versions that are still installed.
  const versions = useMemo(
    () => Object.keys(installed).sort((a, b) => Number(b === versionId) - Number(a === versionId) || a.localeCompare(b)),
    [installed, versionId],
  );
  const [picked, setPicked] = useState<string[]>(sessionSelection);
  const selected = useMemo(() => {
    const kept = versions.filter((v) => picked.includes(v));
    return kept.length > 0 ? kept : [versionId];
  }, [versions, picked, versionId]);
  const key = selected.join(',');

  const toggle = (id: string) => {
    trackFeature('search_versions');
    const next = selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id];
    if (next.length === 0) return;
    sessionSelection = next;
    setPicked(next);
  };

  // Reads the selected versions from IndexedDB, only the ones not in memory yet.
  const [indexes, setIndexes] = useState<Record<string, IndexedChapter[]>>({});
  useEffect(() => {
    let live = true;
    selected.forEach((id) =>
      loadSearchIndex(id)
        .then((c) => live && setIndexes((x) => (x[id] === c ? x : { ...x, [id]: c })))
        .catch(() => live && setIndexes((x) => ({ ...x, [id]: [] }))),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // Closing the search frees the other versions from memory.
  useEffect(() => () => pruneSearchIndex([useSettings.getState().versionId]), []);

  // Null while some selected version is still loading.
  const chapters = useMemo(() => (selected.every((id) => indexes[id]) ? selected : null), [selected, indexes]);
  const multi = selected.length > 1;
  // With more than one version installed, every result names its version, even when only one is selected.
  const showVersion = versions.length > 1;

  const ref = useMemo(() => parseReference(dq, books), [dq, books]);
  const hits = useMemo(
    () => (chapters ? searchVerses(dq, chapters.map((id) => ({ versionId: id, chapters: indexes[id] })), versionId) : []),
    [dq, chapters, indexes, versionId],
  );
  const typed = dq.trim().length >= minChars(dq);
  const tooShort = !typed && dq.trim().length > 0;
  // No verse has every word: the ones with most of them, the best first.
  const approx = useMemo(
    () => (chapters && typed && !ref && hits.length === 0 ? searchApprox(dq, chapters.map((id) => ({ versionId: id, chapters: indexes[id] })), versionId) : { hits: [] as Hit[], coverage: 0 }),
    [dq, chapters, indexes, versionId, hits, ref, typed],
  );
  const isApprox = hits.length === 0 && approx.hits.length > 0;
  const shown = isApprox ? approx.hits : hits.slice(0, limit);
  /** Share of the sentence's words in the best verse. Below the limit the AI is asked by itself. */
  const coverage = hits.length > 0 ? 1 : approx.coverage;

  // A new search goes back to the first page.
  const lastQuery = useRef(`${dq}|${key}`);
  useEffect(() => {
    const id = `${dq}|${key}`;
    if (lastQuery.current === id) return;
    lastQuery.current = id;
    setLimit(PAGE_SIZE);
  }, [dq, key]);

  const open = (book: string, chapter: number, verse?: number, version = versionId, to?: number) => {
    // Scroll first: the verse focus triggered by goTo scrolls to the verse and must not be undone.
    scrollTo(0, 0);
    if (version !== versionId) {
      setSetting('versionId', version);
      notify(t('versionToast', { abbr: abbrOf(version) }));
    }
    goTo(book, chapter, verse, to);
    close();
    go('/');
  };

  /** Book name as the version of the result calls it, so each result reads in its own language. */
  const nameIn = (id: string, book: string) => installed[id]?.books.find((b) => b.id === book)?.name ?? bookName(book);

  // Typed reference in each selected version that has it. A verse shows its text, a range adds the verse numbers,
  // and a whole chapter has no preview, so its card says where it goes.
  const passages = useMemo((): { id: string; text: React.ReactNode[] | null }[] => {
    if (!ref) return [];
    const { verse, verseEnd } = ref;
    return selected.flatMap((id): { id: string; text: React.ReactNode[] | null }[] => {
      const verses = indexes[id]?.find((c) => c.book === ref.book.id && c.chapter === ref.chapter)?.verses;
      if (!verses) return [];
      if (verse === undefined) return [{ id, text: null }];
      const last = Math.min(verseEnd ?? verse, verses.length);
      const parts: React.ReactNode[] = [];
      for (let v = verse; v <= last; v++) {
        parts.push(
          <Fragment key={v}>
            {v > verse && ' '}
            {last > verse && <sup>{v} </sup>}
            {verses[v - 1]}
          </Fragment>,
        );
      }
      return parts.length ? [{ id, text: parts }] : [];
    });
  }, [ref, selected, indexes]);

  // A sentence, not keywords: the AI suggests passages below the verses. It asks by itself when the local search is weak.
  const uiLang = useSettings((s) => s.uiLang);
  const online = useOnline();
  const qq = q.trim();
  const canAsk = aiEnabled && online && !ref && qq.length >= 3;
  const asking = canAsk && looksLikePrompt(q, uiLang);

  const aiBooks = useRefBooks();
  const aiMessages = useAsk((s) => s.messages);
  const aiStatus = useAsk((s) => s.status);
  const aiError = useAsk((s) => s.error);
  const aiPassage = useAsk((s) => s.passage);
  // The conversation in the store belongs to this search when it began with the same text.
  const aiMine = aiPassage?.topic === true && aiMessages[0]?.content === qq;
  const answer = aiMine ? aiMessages[1] : undefined;
  const busy = aiMine && aiMessages.length === 2 && (aiStatus === 'loading' || aiStatus === 'streaming');
  const failed = aiMine && aiStatus === 'error';

  // Text of the suggested verses comes from the installed version, never from the AI.
  const [readingIndex, setReadingIndex] = useState<IndexedChapter[] | null>(null);
  useEffect(() => {
    let live = true;
    loadSearchIndex(versionId).then((c) => live && setReadingIndex(c)).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [versionId]);

  const candidateHits = useMemo(() => (hits.length > 0 ? hits : approx.hits).slice(0, CANDIDATES), [hits, approx]);
  const displayed = useMemo(() => new Set(shown.map(hitKey)), [shown]);
  const suggestions = useMemo(() => (answer ? parseSuggestions(answer.content, aiBooks, !busy) : []), [answer, aiBooks, busy]);
  // Verses the AI chose. A verse already in the list gets the note there; the others come below. A passage the local search
  // did not find and that shares few words with a sentence that quotes a verse is dropped, since the AI may be off the topic.
  const cards = useMemo(() => {
    if (!readingIndex) return [];
    const stems = significantStems(qq);
    const candidateKeys = new Set(candidateHits.map(hitKey));
    const seen = new Set<string>();
    return suggestions.flatMap((s) => {
      const { book, chapter, verse = 1, verseEnd } = s.target;
      const key = hitKey({ book: book.id, chapter, verse });
      const verses = readingIndex.find((c) => c.book === book.id && c.chapter === chapter)?.verses;
      if (seen.has(key) || !verses || verse > verses.length) return [];
      const last = Math.min(verseEnd ?? verse, verses.length);
      const texts = verses.slice(verse - 1, last);
      // Only a sentence that looks like a verse (the local search found candidates) is held to its words; a theme question is not.
      const related = candidateKeys.has(key) || candidateKeys.size === 0 || stems.length < 4 || stemsFound(normalize(texts.join(' ')).norm, stems) >= Math.ceil(stems.length * 0.5);
      if (!related) return [];
      seen.add(key);
      return [{ key, target: s.target, note: s.note, texts, first: verse, last }];
    });
  }, [suggestions, readingIndex, candidateHits, qq]);
  const notes = useMemo(() => new Map(cards.filter((c) => displayed.has(c.key)).map((c) => [c.key, c.note])), [cards, displayed]);
  const extras = cards.filter((c) => !displayed.has(c.key));

  const startAi = (auto: boolean) => {
    if (!canAsk || !qq) return;
    trackFeature(auto ? 'ask_search_auto' : 'ask_search');
    const candidates = candidateHits.map((h) => `${refLabel(nameIn(h.versionId, h.book), h.chapter, h.verse)} (${abbrOf(h.versionId)}): ${h.text.slice(0, 300)}`);
    const passage: AiPassage = { ref: '', version: abbrOf(versionId), text: '', topic: true, candidates };
    useAsk.getState().start(qq, passage, uiLang);
  };
  const startRef = useRef(startAi);
  startRef.current = startAi;

  // Weak local result for a sentence: ask the AI after a pause, within the daily limit. Strong results never spend a question.
  const weak = asking && typed && chapters !== null && !aiMine && coverage < AUTO_COVERAGE;
  const autoPending = weak && autoAskLeft() > 0;
  useEffect(() => {
    if (!weak) return;
    const id = setTimeout(() => {
      if (autoAskLeft() <= 0) return;
      countAutoAsk();
      startRef.current(true);
    }, AUTO_DELAY);
    return () => clearTimeout(id);
  }, [weak, qq]);
  // Typing again drops an answer still on its way for the old text.
  useEffect(() => {
    const s = useAsk.getState();
    if ((s.status === 'loading' || s.status === 'streaming') && s.passage?.topic && s.messages[0]?.content !== qq) s.stop();
  }, [qq]);

  const errorKey = ({ offline: 'askOffline', limit: 'askRateLimited', daily: 'askDaily', busy: 'askBusy', failed: 'askError' } as const)[aiError ?? 'failed'];
  const showAi = typed && chapters !== null && !ref && (aiMine || asking);

  return (
    <Sheet
      title={t('search')}
      icon={MagnifyingGlass}
      onClose={close}
      tall
      footer={
        VARIANT === 'B' && aiMine && !busy && !failed && answer?.content ? (
          <div className="ask-foot">
            <PromptField placeholder={t('askFollowUp')} onSubmit={(q) => { useAsk.getState().followUp(q, uiLang); useUI.getState().open('ask'); }} />
          </div>
        ) : undefined
      }
      pinned={
        <>
        <SearchField
          autoFocus
          dictate={{ onStart: () => trackFeature('search_dictation') }}
          value={q}
          onChange={setQ}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchLabel')}
          enterKeyHint={asking ? 'send' : 'search'}
          ask={canAsk ? { active: asking, label: t('searchAsk'), onAsk: () => !aiMine && startAi(false) } : undefined}
          autoCapitalize="none"
          autoCorrect="off"
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            // A recognized reference opens the passage; otherwise it dismisses the keyboard to show the results.
            if (ref) open(ref.book.id, ref.chapter, ref.verse);
            else if (asking && !aiMine) startAi(false);
            else e.currentTarget.blur();
          }}
        />
        {versions.length > 1 && (
          <div className="vchips" ref={chipsRow} role="group" aria-label={t('searchVersions')}>
            {versions.map((id) => {
              const on = selected.includes(id);
              return (
                <button key={id} className="chip-btn" aria-pressed={on} onClick={() => toggle(id)}>
                  {on && <Check size={14} weight="bold" aria-hidden="true" />}
                  {abbrOf(id)}
                </button>
              );
            })}
          </div>
        )}
        </>
      }
    >
      {ref && (passages.length > 0 ? passages : [{ id: versionId, text: null }]).map((p, i) =>
        p.text ? (
          <button
            key={p.id}
            className="entry hit goto"
            style={i > 0 ? { marginTop: 0 } : undefined}
            onClick={() => open(ref.book.id, ref.chapter, ref.verse, p.id, ref.verseEnd)}
          >
            <div className="ref">
              <span className="goto-ref">{refLabel(nameIn(p.id, ref.book.id), ref.chapter, ref.verse, ref.verseEnd)}</span>
              {showVersion && <Chip>{abbrOf(p.id)}</Chip>}
              <CaretRight size={16} weight="light" color="var(--muted)" className="goto-caret" />
            </div>
            <p className="txt">{p.text}</p>
          </button>
        ) : (
          <Row
            key={p.id}
            className="goto"
            style={i > 0 ? { marginTop: 8 } : undefined}
            eyebrow={t('goTo')}
            title={
              <>
                {refLabel(nameIn(p.id, ref.book.id), ref.chapter, ref.verse, ref.verseEnd)}
                {showVersion && <Chip className="ml-8">{abbrOf(p.id)}</Chip>}
              </>
            }
            onClick={() => open(ref.book.id, ref.chapter, ref.verse, p.id, ref.verseEnd)}
            end={<CaretRight size={18} weight="light" color="var(--muted)" />}
          />
        ),
      )}

      {!typed && !ref && (
        <Empty compact icon={MagnifyingGlass} iconSize={36} hint={t('searchExamples')}>
          {tooShort ? t('searchMin', { n: minChars(dq) }) : t('searchEmpty')}
        </Empty>
      )}

      {typed && chapters === null && <Empty compact>{t('searchPreparing')}</Empty>}

      {typed && chapters !== null && shown.length === 0 && !ref && !asking && !aiMine && (
        <Empty compact hint={t('searchNoneHint')}>{t('searchNone', { q: dq.trim() })}</Empty>
      )}

      {shown.length > 0 && (
        <>
          <p className="hint" role="status">
            {isApprox
              ? t('searchApprox')
              : `${shown.length < hits.length ? t('searchShown', { n: shown.length, total: hits.length }) : t.n('result', hits.length)}${multi ? ` ${t('searchInVersions', { n: selected.length })}` : ''}`}
          </p>
          {shown.map((h) => {
            const note = notes.get(hitKey(h));
            return (
              <button key={`${h.versionId}.${h.book}.${h.chapter}.${h.verse}`} className="entry hit" onClick={() => open(h.book, h.chapter, h.verse, h.versionId)}>
                <div className="ref">
                  {refLabel(nameIn(h.versionId, h.book), h.chapter, h.verse)}
                  {showVersion && <Chip>{abbrOf(h.versionId)}</Chip>}
                </div>
                <p className="txt"><Highlighted text={h.text} ranges={isApprox ? approxRanges(dq, h.text) : highlightRanges(dq, h.text)} /></p>
                {note && <AiNote>{note}</AiNote>}
              </button>
            );
          })}
          {!isApprox && shown.length < hits.length && (
            <button className="row center" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
              {t('searchMore')}
            </button>
          )}
        </>
      )}

      {showAi && (
        <>
          {!aiMine && !autoPending && (
            <Row
              className="goto"
              icon={Sparkle}
              eyebrow={t('searchAskEyebrow')}
              title={t('searchAiShow')}
              onClick={() => startAi(false)}
              end={<CaretRight size={18} weight="light" color="var(--muted)" />}
            />
          )}
          {aiMine && !failed && (busy || extras.length > 0) && (
            <h3 className="ai-h" role="status">
              <Sparkle size={16} weight="light" aria-hidden="true" />
              {extras.length > 0 ? t('searchAiTitle') : t('searchAiLoading')}
            </h3>
          )}
          {extras.map((c) => (
            <button key={c.key} className="entry hit" onClick={() => open(c.target.book.id, c.target.chapter, c.first, versionId, c.last)}>
              <div className="ref">
                {refLabel(bookName(c.target.book.id), c.target.chapter, c.first, c.last)}
                {showVersion && <Chip>{abbrOf(versionId)}</Chip>}
              </div>
              <p className="txt">
                {c.texts.map((v, i) => (
                  <Fragment key={i}>
                    {i > 0 && ' '}
                    {c.last > c.first && <sup>{c.first + i} </sup>}
                    {v}
                  </Fragment>
                ))}
              </p>
              {c.note && <AiNote>{c.note}</AiNote>}
            </button>
          ))}
          {busy && (
            <div aria-hidden="true">
              <div className="sk" style={{ width: '94%' }} />
              <div className="sk" style={{ width: '78%' }} />
              {extras.length === 0 && <div className="sk" style={{ width: '86%' }} />}
            </div>
          )}
          {aiMine && !busy && !failed && cards.length === 0 && <p className="hint">{t('searchAiNone')}</p>}
          {failed && (
            <div className="ask-error" role="alert">
              <p>{t(errorKey)}</p>
              {aiError !== 'daily' && <Button size="sm" icon={ArrowClockwise} onClick={() => useAsk.getState().retry(uiLang)}>{t('askRetry')}</Button>}
            </div>
          )}
          {aiMine && !busy && !failed && answer?.content && (
            <>
              <p className="ask-note ai-foot">
                <WarningCircle size={14} weight="regular" aria-hidden="true" />
                {t('askDisclaimer')}
              </p>
              {VARIANT === 'A' && <Button block icon={Sparkle} onClick={() => useUI.getState().open('ask')}>{t('searchAiContinue')}</Button>}
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
