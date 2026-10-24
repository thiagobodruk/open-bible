<div align="center">

<img src="design/app-icon-1024.png" alt="Open Bible logo" width="112">

# Open Bible

**A free, minimalist Bible reader for everyone, everywhere 🇧🇷 🇬🇧 🇪🇸 🇨🇳 🇫🇷 🇩🇪 🇯🇵**

Offline-first and installable on Android and iOS. No account, no backend, no tracking.

**[🚀 Live demo: thiagobodruk.github.io/open-bible](https://thiagobodruk.github.io/open-bible/)**

[![License: MIT](https://img.shields.io/github/license/thiagobodruk/open-bible)](LICENSE)
[![Stars](https://img.shields.io/github/stars/thiagobodruk/open-bible?style=flat&color=yellow)](https://github.com/thiagobodruk/open-bible/stargazers)
[![Deploy](https://img.shields.io/github/actions/workflow/status/thiagobodruk/open-bible/deploy.yml?branch=main&label=deploy)](https://github.com/thiagobodruk/open-bible/actions/workflows/deploy.yml)
![Versions](https://img.shields.io/badge/versions-141-blue)
![Languages](https://img.shields.io/badge/languages-85-blue)
[![PWA](https://img.shields.io/badge/PWA-installable-5a0fc8)](https://thiagobodruk.github.io/open-bible/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)](https://vite.dev)

[Live demo](https://thiagobodruk.github.io/open-bible/) · [Bible versions](#bible-versions) · [Features](#features) · [Development](#development) · [Donate](#support-the-project) · [Bible data repo](https://github.com/thiagobodruk/bible)

</div>

---

> "And this gospel of the kingdom shall be preached in all the world for a witness unto all nations; and then shall the end come."
> — Matthew 24:14 (KJV)

**Open Bible is an initiative to make the Bible available to as many people as possible, all around the world.** The code is free to use, study, and adapt under the [MIT License](LICENSE).

## Bible versions

Open Bible reads its texts from the [Bible](https://github.com/thiagobodruk/bible) repository, which collects many versions of the Bible in dozens of languages. The app's catalog is pinned to a specific commit of that repository and currently lists **141 versions in 85 languages**. Each version is downloaded once, on demand, and then works without an internet connection.

> **Copyright of the translations.** The rights to each translation belong to their respective authors and copyright holders. This project's MIT License covers the source code only, not the Bible texts. See the [license notes](https://github.com/thiagobodruk/bible#whats-about-the-license-and-the-copyrights) of the Bible repository. Every chapter shows the name of the version being read and a copyright notice.

## Features

- **Reading:** vertical scrolling, one chapter per page. Change chapters by swiping, tapping the screen edges, or using the arrow keys. The top bar collapses while you read.
- **Library:** browse versions by language, download the ones you want, and switch between them.
- **Appearance:** font, size, line height, margins, alignment, and light, sepia, and dark themes.
- **Study tools:** select verses, highlight them in five colors, write notes, copy or share, and review everything in **My study**.
- **Compare:** select verses and compare them across the versions you have downloaded.
- **Cross-references:** select verses and tap References to see related passages from the public-domain Treasury of Scripture Knowledge, shown in the version you are reading. Each book's file is downloaded the first time you use it and then works offline.
- **Ask AI (optional):** a round button on the reading page opens a prompt at the bottom of the screen, and the **AI** action appears when you select verses. Pick a shortcut (Summarize, Explain, Context) or write your own question, about the selected verses or the whole chapter. The passage shows as a pill inside the field, and you can remove the verses to go back to the chapter. Answers are short, stream in after a brief pause, and end with a reminder that the AI can make mistakes. You can dictate the question with the microphone where the browser supports speech recognition. The question and the passage go to an AI service through a small Cloudflare Worker (`worker/`) that holds the API key, so the key is never in the app. The Worker limits requests per IP and instructs the model to stay on the text and the Bible, refuse harmful content, stay neutral between traditions and point to help in a crisis. The button only appears when the app is built with the Worker address (the `AI_URL` repository variable). Everything else keeps working offline.
- **Search:** full-text search in the current version, plus quick references such as `jn 3:16`.
- **Private by design:** highlights, notes, and settings stay in your browser (IndexedDB and localStorage), with JSON export and import for backups.
- **Interface in 7 languages:** English, Portuguese (Brazil), Spanish, French, German, Simplified Chinese, and Japanese. The language follows your browser and can be changed in Settings, independently of the Bible language.
- **Listen:** read a chapter aloud with your device's own voices (Web Speech API), with play and pause, speed, voice choice and automatic advance to the next chapter. No audio is downloaded or sent anywhere; the quality and the languages depend on the voices installed on the device.
- **Feedback:** the menu and Settings have a form for bugs, suggestions, translation errors and version requests. It opens a prefilled GitHub issue with the app version, Bible version and passage attached. Nothing is sent until you submit it on GitHub.
- **Shareable links:** every chapter has its own address, like `/open-bible/pt_nvi/jo/3` (version, book, chapter). The menu has a button to share the app. Book ids follow the [Bible data repo](https://github.com/thiagobodruk/bible) abbreviations.
- **Installable and offline:** works as a PWA on Android and iOS. The app shell is cached by a service worker, and downloaded versions live in IndexedDB.
- **Icons:** [Phosphor Icons](https://phosphoricons.com/).

## Status

| Area | State |
|---|---|
| Catalog, download, and offline storage of real versions | Done |
| Reader, navigator, search, and quick references | Done |
| Highlights, notes, My study, backup export and import | Done |
| Text settings and themes | Done |
| PWA manifest, service worker, and install | Done |
| Share button and chapter URLs (`/version/book/chapter`) | Done |
| Feedback form that opens a prefilled GitHub issue | Done |
| Read aloud with system voices | Done |
| Interface translations (English, Portuguese, Spanish, French, German, Chinese, Japanese) | Done |
| Cross-references (Treasury of Scripture Knowledge) | Done |
| Compare versions side by side | Done |
| Ask AI with a Cloudflare Worker and an AI service (optional) | Done |
| Voice dictation for the AI question | Done |

## How it works

1. The catalog (`src/data/catalog.json`) is generated by `scripts/build-catalog.mjs` from the Bible repository.
2. Downloading a version fetches its JSON file from jsDelivr, with a fallback to GitHub, inside a Web Worker. The data is validated and stored by book in IndexedDB.
3. Reading, search, highlights, and notes all work from local data, so the app keeps working offline.
4. Cross-references are static JSON files in `public/xrefs/`, one per book, generated by `scripts/build-xrefs.mjs` from the Treasury of Scripture Knowledge (up to 10 per verse). Each file is fetched on first use and cached by the service worker.
5. Ask AI is the only feature that needs a server: the app posts the question and the passage to the Worker, which checks the origin, applies the rate limits and streams the AI answer back.

## Development

Requires Node 20 or later.

```bash
npm install
npm run dev       # dev server at http://localhost:5173/open-bible/
npm run build     # typecheck and production build into dist/
npm run preview   # serve the build at http://localhost:4173/open-bible/
```

To try Ask AI locally, deploy the Worker (see below), add `http://localhost:5173` to `ALLOWED_ORIGINS` in `worker/wrangler.toml`, and start the dev server with `VITE_AI_URL=<worker url> npm run dev`.

### Releases

Versions follow [SemVer](https://semver.org/). Merging a PR deploys the site but does not create a version. Label each PR `patch` (the default), `minor` (new feature), `major` (breaking change) or `no-release` (docs, workflows), and write what users will notice under `## Changelog` in the PR description. To publish a version, put the `release` label on the PR you are merging (or run the Release workflow by hand: Actions > Release > Run workflow). It takes the PRs merged since the last version, uses the highest label for the bump, joins their changelogs into one set of notes, tags and publishes the release, and deploys the site.

### Translations

Every interface string lives in `src/i18n/locales/en.ts`. The other locale files are typed against it, so `npm run build` fails if a key is missing. To add a language, create a locale file, register it in `src/i18n/index.ts`, and add it to `UiLang` and the language list in Settings.

To refresh the version catalog:

```bash
node scripts/build-catalog.mjs [commit-sha]
```

## Ask AI Worker

The Ask AI feature needs a small server, because the AI service key must never reach the browser. The Worker in `worker/` is that server: a [Cloudflare Worker](https://developers.cloudflare.com/workers/) that keeps your key as a secret, accepts calls only from your site, limits requests per IP, caps the size of each question and answer, and streams the reply back. Its system prompt keeps answers short, on the text and the Bible, and refuses harmful content. It is deployed separately from the site and is optional: without it the AI button is hidden and everything else works.

### Set it up with your own API key

You need a free [Cloudflare account](https://dash.cloudflare.com/sign-up), Node 20 or later, and an API key from any AI service that offers an OpenAI-compatible chat completions endpoint (`POST .../v1/chat/completions` with streaming).

1. **Get the code.** Fork or clone this repository and open the Worker folder:

   ```bash
   git clone https://github.com/<you>/open-bible.git
   cd open-bible/worker
   ```

2. **Log in to Cloudflare.**

   ```bash
   npx wrangler login
   ```

3. **Edit `wrangler.toml`.**
   - `ALLOWED_ORIGINS`: the sites allowed to call the Worker, separated by commas. Use your site address (for example `https://<you>.github.io`). Add `http://localhost:5173` to test locally.
   - `MODEL`: the model name your service offers. A lighter model is cheaper and faster, a larger one answers better.
   - `API_URL`: the chat completions endpoint of your service. Uncomment it if you are not using the default one.
   - `MAX_TOKENS`: the longest answer, including any thinking the model does first. 700 is enough for 1 to 3 short paragraphs.
   - `[[ratelimits]]`: requests per IP per minute (6 by default). Remove the block to run without it.

4. **Store your API key as a secret.** Paste it when asked. It is encrypted by Cloudflare and never written to a file or to this repository.

   ```bash
   npx wrangler secret put GROQ_API_KEY
   ```

   The secret name is historical; it works for any service.

5. **Deploy.**

   ```bash
   npx wrangler deploy
   ```

   Wrangler prints the Worker address, such as `https://open-bible-ai.<your-subdomain>.workers.dev`. The first time, it asks you to choose a `workers.dev` subdomain. A new address can take a minute or two before HTTPS works.

6. **Test it.** The origin header must match one in `ALLOWED_ORIGINS`:

   ```bash
   curl -N https://open-bible-ai.<your-subdomain>.workers.dev/ask \
     -H 'content-type: application/json' \
     -H 'origin: https://<you>.github.io' \
     -d '{"question":"What is this passage about?","passage":{"ref":"John 3:16","version":"KJV","text":"For God so loved the world..."},"lang":"en","history":[]}'
   ```

   You should see a stream of `data:` lines with the answer.

7. **Connect the site.** In your GitHub repository, go to **Settings > Secrets and variables > Actions > Variables**, create a variable named `AI_URL` with the Worker address, then run the Deploy workflow (Actions > Deploy > Run workflow). The button appears once the site is rebuilt.

8. **Optional: a daily limit per IP.** Run `npx wrangler kv namespace create DAILY`, uncomment the `[[kv_namespaces]]` block in `wrangler.toml`, paste the id it prints, adjust `DAILY_LIMIT`, and deploy again.

To run everything locally, put the key in `worker/.dev.vars` (ignored by git) as `GROQ_API_KEY=your-key`, start the Worker with `npx wrangler dev`, and start the app with `VITE_AI_URL=http://localhost:8787 npm run dev`.

### Keeping it safe and cheap

- Set a spending limit in your AI service console. The Worker caps each request and answer, but it cannot see your total usage.
- Free tiers are usually shared by your whole account, so the per-minute and per-day limits per IP keep one person from using everyone's share.
- If a key leaks, revoke it in the service console and run `npx wrangler secret put GROQ_API_KEY` with the new one. Never paste it in an issue, a chat or a commit.

### Troubleshooting

The app shows a generic message; the Worker answers with a JSON code such as `{ "error": "rate_limited" }`.

| Code | Meaning and fix |
|---|---|
| `forbidden_origin` | The site is not in `ALLOWED_ORIGINS`. Add it and deploy again. |
| `not_configured` | The secret is missing. Run `npx wrangler secret put GROQ_API_KEY`. |
| `rate_limited` | Too many requests in a minute from one IP. |
| `daily_limit` | The IP used its daily questions (only with the `DAILY` namespace). |
| `quota` | The AI service's own limit was reached. Wait, or use another key or model. |
| `upstream_error` | The service refused the call. A wrong model name or key is the usual cause. Run `npx wrangler tail`, repeat the request, and read the status the Worker logs (401 is a wrong key, 404 a wrong model or endpoint). |
| `bad_request` | The request body is not valid. |

## Stack

| Layer | Technology |
|---|---|
| UI | [React](https://react.dev) 19 |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Build | [Vite](https://vite.dev) |
| State | [Zustand](https://zustand.docs.pmnd.rs) |
| Local storage | IndexedDB (versions, highlights, notes) and localStorage (settings) |
| PWA and offline | [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app) (Workbox) |
| Icons | [Phosphor Icons](https://phosphoricons.com) |
| Fonts | Inter and Literata via [Fontsource](https://fontsource.org), bundled at build time |
| AI (optional) | An AI service through a [Cloudflare Worker](https://developers.cloudflare.com/workers/) |
| Hosting | GitHub Pages, deployed by GitHub Actions |

## Project structure

```
src/
├─ components/   sheets, selection bar, AI prompt and answer, toast, search field
├─ screens/      Reader, Study (My study), Library, Settings
├─ data/         books, catalog, IndexedDB access, download worker, cross-references
├─ i18n/         translator and one locale file per interface language
├─ state/        Zustand stores: settings, study, library, UI, AI
├─ styles/       theme tokens and CSS by area
├─ ai.ts         client for the Worker (streaming)
└─ stt.ts        voice dictation
public/xrefs/    cross-reference files, one per book
scripts/         catalog and cross-reference generators
worker/          Cloudflare Worker for Ask AI
```

## Deployment

GitHub Pages deploys the app through `.github/workflows/deploy.yml` on every push to `main`. The app is served from `/open-bible/`, set in `vite.config.ts` (`base`) and reused by the PWA manifest. The build also emits `404.html` with the same content as `index.html`, so GitHub Pages opens chapter links such as `/open-bible/pt_nvi/jo/3`.

The Worker is not part of this workflow: deploy it with `npx wrangler deploy` inside `worker/` whenever it changes.

One-time repository setting: **Settings > Pages > Build and deployment > Source: GitHub Actions**.

## How can I help?

Review the code, report bugs, suggest improvements, or improve a translation in `src/i18n/locales/`. Every contribution is welcome. Issues and pull requests are open on [GitHub](https://github.com/thiagobodruk/open-bible).

## Support the project

Open Bible is free and has no ads. If it is useful to you, a voluntary donation helps keep it going.

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A9FM66AQT672L&lc=US&item_name=Bible%20Sources&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted"><img src="https://raw.githubusercontent.com/thiagobodruk/bible/92e121c2c829eae351b76db1d32858ced77b16a6/assets/paypal-donate-button.png" alt="Donate" width="400"></a>

## License

The source code is released under the [MIT License](LICENSE). The Bible texts belong to their respective authors and copyright holders.
