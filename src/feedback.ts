import { abbrOf } from './data/catalog';
import { useSettings } from './state/settings';
import { currentBuild, buildLabel } from './update';
import { isInstalled } from './install';

export type FeedbackKind = 'bug' | 'suggestion' | 'translation' | 'version';

export const FEEDBACK_KINDS: FeedbackKind[] = ['bug', 'suggestion', 'translation', 'version'];

const LABELS: Record<FeedbackKind, string> = {
  bug: 'bug',
  suggestion: 'enhancement',
  translation: 'translation',
  version: 'new version',
};

const REPO = 'https://github.com/thiagobodruk/open-bible';

/** URL of a new, pre-filled issue, with the context that helps reproduce the problem. */
export function feedbackUrl(kind: FeedbackKind, message: string, passage: string): string {
  const { versionId, uiLang } = useSettings.getState();
  const context = [
    `- App: ${buildLabel(currentBuild)}`,
    `- Bible: ${abbrOf(versionId)} (${versionId})`,
    `- Passage: ${passage}`,
    `- Language: ${uiLang}`,
    `- Installed app: ${isInstalled() ? 'yes' : 'no'}`,
    `- Browser: ${navigator.userAgent}`,
  ].join('\n');
  const body = `${message.trim()}\n\n---\n${context}\n`;
  const title = message.trim().split('\n')[0].slice(0, 80);
  const q = new URLSearchParams({ title, body, labels: LABELS[kind] });
  return `${REPO}/issues/new?${q}`;
}
