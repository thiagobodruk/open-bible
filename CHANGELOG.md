# Changelog

Versions follow [SemVer](https://semver.org/). Each release is published from the section with its number, so add a section here when you bump `version` in `package.json`.

## 1.1.5

### Changed

- The app now looks for a new version whenever you come back to it (at most every 10 minutes), so installed copies that stay open in the background no longer miss updates. The new version still waits and is applied the next time the app leaves the screen.

## 1.1.4

### Changed

- New app icon: a cutout with transparent corners for the standard icons, a full square for the iOS home screen, a padded version for Android maskable icons, and a PNG favicon. The 1024 px masters are in `design/`.

## 1.1.3

### Added

- **Read aloud:** sound icon in the header, next to search. Reads the chapter verse by verse with the device's own voices, highlights the current verse and has play and pause, speed, voice choice and automatic advance to the next chapter.
- **Feedback:** form in the menu and in Settings that opens a prefilled GitHub issue with the app version, the Bible version and the passage.
- **Chapter links:** every chapter has its own address (`/version/book/chapter`), with a fallback for GitHub Pages and an option to download the version of the link.
- **Share the app** from the menu.
- **Silent updates:** the app updates when it leaves the screen, without a toast. In Settings, the Update button forces a check and shows the current and the new version.
- Install with the URL at the app root, menu without descriptions and the "Appearance" sheet.

### Fixed

- On iPhone and iPad, a hint reminds you to turn off silent mode, which mutes the reading.
- Reading uses the language's default voice unless you pick another one.
- The feedback button opens GitHub with a native link.

## 1.0.0

First release.
