# Open Bible design review

Scope: core flows (reading, navigation, search) and onboarding. Audience: everyday readers, mobile first. Constraints: minimalist, offline-first with no backend, UI in 7 languages (every new string needs a key in all 7 locales).

Method: code + running app (`npm run dev`) at 375x812 and 1280x800, pt-BR and de. Each finding is **[Observed]** (seen or measured in the app), **[Inferred]** (read from the code) or **[Calculated]** (contrast).

Not tested: zh, ja, fr, es, real offline, real Android/iOS, on-screen keyboard, screen reader. Sepia was only seen on the reading screen.

## Summary

The foundation is solid and true to minimalism: a calm reader, a collapsible bar, a Welcome screen with progress and distinct errors, search with direct references (`jo 3:16`) and CJK support, and `prefers-reduced-motion` respected. The problems cluster around:

1. **Search quality**: matches substrings ("amor" finds "amorreus"), cuts off at 200 results in canonical order (only Genesis shows up), Enter does nothing.
2. **Accessibility**: sheets do not trap focus, the × disappears on mobile, verses are not reachable by keyboard or screen reader.
3. **Navigation**: huge chapter grid (Psalms = 1812px), no way back from reading to the results, switching version does not return to the reader.
4. **Contrast and touch targets**: sepia below 4.5:1, subtle verse number between 2.5 and 2.7:1, top chips at 32px.

## Nielsen heuristics adherence

| # | Heuristic | Score | Evidence |
|---|---|---|---|
| 1 | Visibility of status | 4 | "Genesis 1 / NVI" chip, `role=status` on results, progress on Welcome. Missing: current chapter in the Navigator (M-07), minimum characters in search (B-05). |
| 2 | Match with the real world | 4 | Book names come from the version, "Go to John 3:16". Noise in A-01. |
| 3 | Control and freedom | 3 | Esc/drag/scrim close. Gaps: no × on mobile (A-04), Android Back (A-06), lost search (M-05). |
| 4 | Consistency | 3.5 | Two searches with different powers (M-04), Library is a route while the rest are sheets (M-06), 32px and 44px targets (A-03). |
| 5 | Error prevention | 3.5 | Invalid reference ignored, position revalidated. Gesture blocked without notice (B-04). |
| 6 | Recognition | 3 | Unnamed OT/NT divider, side arrows only on hover, gesture hint only on mobile. |
| 7 | Flexibility | 3.5 | Good: direct reference, keyboard, edges. Missing: Enter in search (A-03b), "ps 23" in the Navigator (M-04), resuming scroll (M-03). |
| 8 | Minimalist aesthetics | 4.5 | Quiet interface, well-resolved themes. Noise: 150-button grid, grip on desktop. |
| 9 | Error recovery | 3 | IndexedDB failure becomes "chapter does not exist" (M-02). "No verses" with no way out (B-05). |
| 10 | Help | 3.5 | `searchEmptyHint` and the gesture hint. No shortcut hint on desktop. |
| — | Accessibility | 2.5 | A-02 to A-05, M-01, M-07. |

## Findings

### High

- **A-01. Search matches substrings, not words** · H2 · `src/search.ts:78` · [Observed]. "amor" returns "amorreus" first. Fix: rank start-of-word/whole-word matches first (regex `(^|[^\p{L}])term` over the normalized text); CJK stays substring.
- **A-02. Truncation at 200 in canonical order** · H1/H7 · `search.ts:58,90`, `SearchSheet.tsx:119` · [Observed]. Only Genesis shows up and the total is not reported. Fix: count everything, "200 of N", "Show more" every 50; rank before cutting; optional OT/NT filter (`Segmented`).
- **A-03. Top chips at 32px** · Accessibility · `reader.css:19,23` · [Observed]. `crumb` 88x32, `ver-chip` 48x32. Fix: keep the look and enlarge the touch area with `::before { inset:-6px }`.
- **A-03b. Enter does nothing in search** · H7/H5 · `SearchField.tsx`, `SearchSheet.tsx:78-87` · [Observed]. Fix: Enter opens the recognized reference; otherwise `blur()` to dismiss the keyboard.
- **A-04. Sheets without a focus trap and × hidden on mobile** · Accessibility/H3 · `Sheet.tsx:39-48,142-150`, `ui.css:47` · [Observed + Inferred]. Tab leaves the sheet for the reader behind it. Fix: `inert` on the rest of the page while a modal sheet is open; keep the × in the DOM and focusable on mobile.
- **A-05. Verses not reachable by keyboard or screen reader** · Accessibility · `Reader.tsx:158-163,216-217` · [Inferred]. Fix: `role="button"`, `tabIndex`, `aria-pressed`, Enter/Space. Beware of 30 to 176 tab stops per chapter.
- **A-06. Android Back probably exits the app** · H3 · `state/ui.ts:26-31`, `router.ts:19` · [Inferred]. Fix: `history.pushState` when opening a sheet and close on `popstate`. Test on a device.

### Medium

- **M-01. Contrast** · `tokens.css:44`, `reader.css:64-65` · [Calculated]. Sepia `--muted` at 4.26:1 (3.85:1 on surface); `.vn-subtle` 2.55 to 2.74:1. Fix: darken the sepia `--muted` (validate ≥4.5:1) and drop the `opacity` on the subtle number or raise the body text.
- **M-02. Read error becomes "does not exist in this version"** · H9 · `hooks.ts:59`, `Reader.tsx:209` · [Inferred]. Fix: `error` state with "Try again" (2 keys × 7).
- **M-03. Scroll position within a chapter is not saved** · H7 · `state/position.ts:8-14` · [Inferred]. Fix: save the top verse and restore without `flash`.
- **M-04. "ps 23" does not work in the Navigator** · H4 · `NavigatorSheet.tsx:22,42-58` · [Inferred]. Fix: reuse `parseReference` and show "Go to Psalms 23".
- **M-05. Opening a result discards the search** · H3 · `SearchSheet.tsx:32,62-67` · [Inferred]. Fix: keep `q` and `scrollTop` in a store; reset when switching version.
- **M-06. Choosing a version does not return to the reader** · H3/H4 · `Reader.tsx:179`, `Library.tsx:62-65` · [Inferred]. Fix: `back()` after `choose()`.
- **M-07. Navigator: huge grid with no context** · H6/H8 · `NavigatorSheet.tsx`, `screens.css:60-63` · [Observed]. Fix: 6 to 7 columns with 44px buttons; named OT/NT divider; current chapter in the title or a sticky row.
- **M-08. Smooth scroll ignores reduced-motion** · `Reader.tsx:92` · [Inferred]. Fix: `behavior` according to `matchMedia`.

### Low

- **B-01.** Sheet grip visible on desktop (`ui.css:41,53-55`) · [Observed]. Hide at ≥720px.
- **B-02.** Reader arrows only on hover (`reader.css:33-35`). Optional: keyboard hint once on desktop.
- **B-03.** The side touch zone (10vw) may collide with the iOS back gesture (`reader.css:27-32`). Test on a device.
- **B-04.** The page gesture silently disappears with an active selection (`Reader.tsx:53-55`). Optional: toast.
- **B-05.** Empty search states give no guidance (`SearchSheet.tsx:100-114`) · [Observed]. Messages for minimum characters and for zero results (2 keys × 7).
- **B-06.** Library prioritizes the UI language, not the reading language (`Library.tsx:51`) · [Observed].
- **B-07.** Broken image on the splash in dev · [Observed in dev]. Confirm in the build before acting.
- **B-08.** Note icon without `role="img"` (`Reader.tsx:220`).

## What is good (leave alone)

Welcome (offline vs failure, `progressbar`), unified `readingVars`, `lang`/`dir` per version, global reduced-motion, `minChars` for CJK, icon-only top bar (resists long strings), collapsible bar.

## Adjustment plan

**Batch 1 · Search** (M): A-01, A-02 (optional OT/NT filter), A-03b, B-05.
**Batch 2 · Accessibility and control** (M): A-04, A-05, A-03, A-06, M-01, M-08, B-08.
**Batch 3 · Navigation** (M): M-07, M-04, M-05, M-06.
**Batch 4 · Robustness and polish** (S to M): M-02, M-03, B-01, B-06 and the remaining low items.

Before implementing: test A-06, B-03 and the on-screen keyboard (A-03b) on real devices; review zh and ja.

Expected new i18n keys (all in 7 locales): minimum characters, no results with a suggestion, "Show more", "N of M", error state + "Try again", OT/NT filter (if approved), verse label.
