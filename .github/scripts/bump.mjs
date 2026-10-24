// Bumps the version after a PR is merged, using the PR's labels and its "Changelog" section.
// Input (env): LABELS (comma separated), TITLE, BODY. Prints the new version to stdout.
import { readFileSync, writeFileSync } from 'node:fs';

const labels = (process.env.LABELS ?? '').split(',').map((l) => l.trim().toLowerCase());
const level = labels.includes('major') ? 'major' : labels.includes('minor') ? 'minor' : 'patch';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
const next = level === 'major' ? `${maj + 1}.0.0` : level === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;

/** Text under "## Changelog" in the PR body, up to the next "## " heading or the attribution footer. */
function changelogOf(body) {
  const lines = (body ?? '').replace(/\r/g, '').split('\n');
  const start = lines.findIndex((l) => /^##\s+changelog\s*$/i.test(l));
  if (start < 0) return '';
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (/^##\s/.test(l) || l.startsWith('🤖') || /^https:\/\/claude\.ai\//.test(l)) break;
    out.push(l);
  }
  return out.join('\n').trim();
}

let notes = changelogOf(process.env.BODY);
if (!notes) notes = `- ${process.env.TITLE ?? 'Update'}`;
if (!/^###\s/m.test(notes)) notes = `### Changed\n\n${notes}`;

pkg.version = next;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
lock.version = next;
if (lock.packages?.['']) lock.packages[''].version = next;
writeFileSync('package-lock.json', JSON.stringify(lock, null, 2) + '\n');

const log = readFileSync('CHANGELOG.md', 'utf8');
const at = log.search(/^## /m);
const section = `## ${next}\n\n${notes}\n\n`;
writeFileSync('CHANGELOG.md', at < 0 ? `${log.trimEnd()}\n\n${section}` : log.slice(0, at) + section + log.slice(at));
writeFileSync('release-notes.md', `${notes}\n`);
console.log(next);
