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

## How it works

1. The catalog (`src/data/catalog.json`) is generated by `scripts/build-catalog.mjs` from the Bible repository.
2. Downloading a version fetches its JSON file from jsDelivr, with a fallback to GitHub, inside a Web Worker. The data is validated and stored by book in IndexedDB.
3. Reading, search, highlights, and notes all work from local data, so the app keeps working offline.

## Development

Requires Node 20 or later.

```bash
npm install
npm run dev       # dev server at http://localhost:5173/open-bible/
npm run build     # typecheck and production build into dist/
npm run preview   # serve the build at http://localhost:4173/open-bible/
```

### Releases

Versions follow [SemVer](https://semver.org/). To release, bump `version` in `package.json` and add a section with that number to `CHANGELOG.md`. When the change reaches `main`, the Release workflow creates the tag and the GitHub release using that section as the notes (or the generated notes if the section is missing).

### Translations

Every interface string lives in `src/i18n/locales/en.ts`. The other locale files are typed against it, so `npm run build` fails if a key is missing. To add a language, create a locale file, register it in `src/i18n/index.ts`, and add it to `UiLang` and the language list in Settings.

To refresh the version catalog:

```bash
node scripts/build-catalog.mjs [commit-sha]
```

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
| Hosting | GitHub Pages, deployed by GitHub Actions |

## Project structure

```
src/
├─ components/   sheets, selection sheet, toast, search field
├─ screens/      Reader, Study (My study), Library, Settings
├─ data/         books, catalog, IndexedDB access, download worker
├─ i18n/         translator and one locale file per interface language
├─ state/        Zustand stores: settings, study, library, UI
└─ styles/       theme tokens and CSS by area
scripts/         catalog generator
```

## Deployment

GitHub Pages deploys the app through `.github/workflows/deploy.yml` on every push to `main`. The app is served from `/open-bible/`, set in `vite.config.ts` (`base`) and reused by the PWA manifest. The build also emits `404.html` with the same content as `index.html`, so GitHub Pages opens chapter links such as `/open-bible/pt_nvi/jo/3`.

One-time repository setting: **Settings > Pages > Build and deployment > Source: GitHub Actions**.

## How can I help?

Review the code, report bugs, suggest improvements, or improve a translation in `src/i18n/locales/`. Every contribution is welcome. Issues and pull requests are open on [GitHub](https://github.com/thiagobodruk/open-bible).

## Support the project

Open Bible is free and has no ads. If it is useful to you, a voluntary donation helps keep it going.

<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=A9FM66AQT672L&lc=US&item_name=Bible%20Sources&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted"><img src="https://raw.githubusercontent.com/thiagobodruk/bible/92e121c2c829eae351b76db1d32858ced77b16a6/assets/paypal-donate-button.png" alt="Donate" width="400"></a>

## License

The source code is released under the [MIT License](LICENSE). The Bible texts belong to their respective authors and copyright holders.
