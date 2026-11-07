import { Fragment, useMemo, useState } from 'react';
import { BookOpenText } from '@phosphor-icons/react';
import { BOOKS } from '../data/books';
import { abbrOf } from '../data/catalog';
import { localBookName } from '../i18n/books';
import { useBooks, useChapter } from '../hooks';
import { refLabel } from '../ref';
import { findReferences, type RefTarget } from '../search';
import { useSettings } from '../state/settings';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { go } from '../router';
import { useT } from '../i18n';
import { Button } from './Button';

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul' | 'ol'; items: string[] };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

/** Splits the answer into paragraphs and lists. Headings become bold paragraphs. */
function parse(text: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join('\n') });
    para = [];
  };
  for (const line of text.split('\n')) {
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const item = bullet ?? numbered;
    if (item) {
      flush();
      const type = bullet ? 'ul' : 'ol';
      const last = blocks[blocks.length - 1];
      if (last && last.type === type) last.items.push(item[1]);
      else blocks.push({ type, items: [item[1]] });
    } else if (!line.trim()) flush();
    else if (/^#{1,6}\s+/.test(line)) {
      flush();
      blocks.push({ type: 'p', text: `**${line.replace(/^#{1,6}\s+/, '').replace(/\*\*/g, '')}**` });
    } else para.push(line);
  }
  flush();
  return blocks;
}

/** Marks that wrap text: **bold** and *italic* or _italic_. */
const MARKS = /\*\*(.+?)\*\*|\*([^\s*][^*]*?)\*|_([^\s_][^_]*?)_/g;

function Passage({ target, onOpen }: { target: RefTarget; onOpen: () => void }) {
  const t = useT();
  const versionId = useSettings((s) => s.versionId);
  const text = useChapter(target.book.id, target.chapter);
  if (text.status !== 'ready') return null;
  const { verse, verseEnd } = target;
  const first = verse ?? 1;
  const last = Math.min(verseEnd ?? (verse ?? 4), text.verses.length);
  const range = last > first;
  return (
    <div className="ref-preview">
      <div className="ref-preview-head">
        <b>{refLabel(target.book.name, target.chapter, verse, verseEnd)}</b>
        <span className="chip">{abbrOf(versionId)}</span>
      </div>
      <p>
        {text.verses.slice(first - 1, last).map((v, i) => (
          <Fragment key={i}>
            {i > 0 && ' '}
            {range && <sup>{first + i} </sup>}
            {v}
          </Fragment>
        ))}
        {verse === undefined && last < text.verses.length && '…'}
      </p>
      <Button size="sm" icon={BookOpenText} onClick={onOpen}>{t('askOpenPassage')}</Button>
    </div>
  );
}

/** Answer of the AI: paragraphs, lists, bold and italic, and Bible references that open a preview of the passage. */
export function AiText({ text }: { text: string }) {
  const uiLang = useSettings((s) => s.uiLang);
  const versionBooks = useBooks();
  const close = useUI((s) => s.close);
  const goTo = useStudy((s) => s.goTo);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [openRef, setOpenRef] = useState<RefTarget | null>(null);

  // Names from the version and from the interface language, both pointing to the books the version has.
  const books = useMemo(() => {
    const extra = versionBooks.flatMap((b) => {
      const i = BOOKS.findIndex((x) => x.id === b.id);
      const name = i >= 0 ? localBookName(uiLang, i) : undefined;
      return name && name !== b.name ? [{ ...b, name }] : [];
    });
    return [...versionBooks, ...extra];
  }, [versionBooks, uiLang]);
  const blocks = useMemo(() => parse(text), [text]);

  const open = (r: RefTarget) => {
    // Scroll first: the verse focus triggered by goTo scrolls to the verse and must not be undone.
    scrollTo(0, 0);
    goTo(r.book.id, r.chapter, r.verse, r.verseEnd);
    close();
    go('/');
  };

  const refs = (s: string, key: string, where: string) => {
    const found = findReferences(s, books);
    if (found.length === 0) return s;
    const out: React.ReactNode[] = [];
    let at = 0;
    found.forEach((f, i) => {
      const id = `${where}:${key}:${i}`;
      out.push(
        s.slice(at, f.start),
        <button
          key={id}
          type="button"
          className="ref-link"
          aria-expanded={openKey === id}
          onClick={() => {
            setOpenKey(openKey === id ? null : id);
            setOpenRef(f.target);
          }}
        >
          {s.slice(f.start, f.end)}
        </button>,
      );
      at = f.end;
    });
    out.push(s.slice(at));
    return out.map((n, i) => (typeof n === 'string' ? <Fragment key={i}>{n}</Fragment> : n));
  };

  const inline = (s: string, where: string): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    let at = 0;
    for (const m of s.matchAll(MARKS)) {
      const i = m.index!;
      if (i > at) out.push(<Fragment key={`t${i}`}>{refs(s.slice(at, i), String(at), where)}</Fragment>);
      if (m[1] !== undefined) out.push(<strong key={`b${i}`}>{inline(m[1], `${where}b${i}`)}</strong>);
      else out.push(<em key={`i${i}`}>{inline(m[2] ?? m[3], `${where}i${i}`)}</em>);
      at = i + m[0].length;
    }
    if (at < s.length) out.push(<Fragment key={`t${at}`}>{refs(s.slice(at), String(at), where)}</Fragment>);
    return out;
  };

  return (
    <>
      {blocks.map((b, i) => (
        <Fragment key={i}>
          {b.type === 'p' && <p>{inline(b.text, `p${i}`)}</p>}
          {b.type === 'ul' && <ul>{b.items.map((it, j) => <li key={j}>{inline(it, `u${i}-${j}`)}</li>)}</ul>}
          {b.type === 'ol' && <ol>{b.items.map((it, j) => <li key={j}>{inline(it, `o${i}-${j}`)}</li>)}</ol>}
          {openKey?.startsWith(b.type === 'p' ? `p${i}:` : b.type === 'ul' ? `u${i}-` : `o${i}-`) && openRef && (
            <Passage target={openRef} onOpen={() => open(openRef)} />
          )}
        </Fragment>
      ))}
    </>
  );
}
