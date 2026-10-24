// Cuts a release from the PRs merged since the last version.
// Input: prs.json, a list of { number, title, body, labels } (labels is a list of names). Prints the new version, or nothing if there is nothing to release.
import { readFileSync, writeFileSync } from 'node:fs';

const prs = JSON.parse(readFileSync('prs.json', 'utf8')).filter((p) => !p.labels.includes('no-release'));
if (!prs.length) process.exit(0);

// The highest label wins: major > minor > patch (the default).
const has = (name) => prs.some((p) => p.labels.map((l) => l.toLowerCase()).includes(name));
const level = has('major') ? 'major' : has('minor') ? 'minor' : 'patch';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [maj, min, pat] = pkg.version.split('.').map(Number);
const next = level === 'major' ? `${maj + 1}.0.0` : level === 'minor' ? `${maj}.${min + 1}.0` : `${maj}.${min}.${pat + 1}`;

/** Text under "## Changelog" in a PR body, up to the next "## " heading or the attribution footer. */
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

// Joins the Changelog sections of all PRs, grouped under one heading each (Added, Changed, Fixed, then any other).
const groups = new Map();
for (const p of prs) {
  let text = changelogOf(p.body) || `- ${p.title}`;
  if (!/^###\s/m.test(text)) text = `### Changed\n\n${text}`;
  let heading = 'Changed';
  for (const line of text.split('\n')) {
    const h = line.match(/^###\s+(.*\S)\s*$/);
    if (h) { heading = h[1]; continue; }
    if (!line.trim()) continue;
    if (!groups.has(heading)) groups.set(heading, []);
    groups.get(heading).push(line);
  }
}
const order = ['Added', 'Changed', 'Fixed'];
const names = [...order.filter((n) => groups.has(n)), ...[...groups.keys()].filter((n) => !order.includes(n))];
const notes = names.map((n) => `### ${n}\n\n${groups.get(n).join('\n')}`).join('\n\n');

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
