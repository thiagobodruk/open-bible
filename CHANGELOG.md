# Changelog

Versions follow [SemVer](https://semver.org/). This file is updated by the Release workflow, which joins the `## Changelog` sections of the PRs merged since the last version. Do not edit it in a PR.

## 1.12.0

### Added

- Notes, highlights, reading position and reading settings sync across devices when signed in.

### Changed

- Settings and the welcome screen no longer say that nothing leaves the device.

## 1.11.5

### Changed

- Selecting verses and tapping Note opens one sheet to change the highlight color, edit the note and delete.
- My study entries show the date and time next to the reference and have an edit button instead of delete.
- The delete icon in the edit sheet is gray.

## 1.11.4

### Added

- Notes are limited to 500 characters.

### Changed

- Tapping a note icon on a verse opens the Edit note sheet.
- The delete action in the note sheet is now a round icon button.

## 1.11.3

### Fixed

- Tapping buttons and chips on touch screens no longer leaves them stuck in the hover color.

## 1.11.2

### Changed

- The color filter in My study now looks like the color picker in the verse selection sheet.

## 1.11.1

### Changed

- On iOS, the first time you listen to a chapter, an overlay reminds you to turn off silent mode. Tap anywhere to start listening.

## 1.11.0

### Changed

- Buttons now share one component, with icons at the edge of full-width buttons.
- The Previous and Next buttons at the end of a chapter have their icons at the edges.
- The note sheet buttons now have icons, like the confirmation sheets.
- The start screen without a Bible now matches the last intro step.
- The data hint in Settings no longer says there is no account.

## 1.10.5

### Changed

- The intro Skip button now shows an arrow icon.

## 1.10.4

### Changed

- The intro slider buttons now sit in the footer with their icons on the right, and Skip only appears on the sign-in step.

## 1.10.3

### Fixed

- The intro slides can now be swiped back and forth, so skipping the first slide no longer leaves you unable to return.

## 1.10.2

### Changed

- Send feedback and Privacy policy now live in Settings, in the App block, instead of the menu.

## 1.10.1

### Added

- Tapping the version at the bottom of the menu checks for and applies an app update.

### Changed

- The account now sits at the bottom of the menu, with a Sign out button.
- The Account section in Settings moved to the end of the screen.
- The menu is leaner, with no logo and no title.

## 1.10.0

### Changed

- Downloading the first Bible is now the last screen of the initial intro.
- The Read option was removed from the menu.

## 1.9.1

### Changed

- The listen-to-chapter button now lives in the reading header instead of the menu.

## 1.9.0

### Added

- Sign in with a Google account from the menu, with an intro on first launch.
- Privacy policy in the menu.
- Delete the account in Settings.

### Changed

- The My study item in the menu no longer shows a counter.

## 1.8.5

### Changed

- Bottom sheets close only by dragging down again, without the arrow in the top-right corner.

## 1.8.4

### Added

- Down-arrow button to close bottom sheets.

## 1.8.3

### Changed

- The share card shows the small logo next to the text.

## 1.8.2

### Changed

- The share card shows the app logo as a square image.

### Fixed

- The AI answer appears at the top, without scrolling to the end.

## 1.8.1

### Added

- Link preview with logo and description when the app link is shared.

### Changed

- A shared passage link now uses `?ref=`.

## 1.8.0

### Added

- Sharing and copying verses include the passage link.

### Changed

- A passage link opens the chapter with the verses highlighted.

## 1.7.7

### Fixed

- The "Install app" item in the menu works again, for the native prompt and for the manual guide.

## 1.7.6

### Changed

- Search shows whole-word matches first, then word starts, then the rest ("amor" no longer opens on "amorreus").
- Search shows how many results exist ("100 of 515") with a Show more button, instead of stopping at 200 in book order.
- Enter in the search field opens a recognized reference (like jo 3:16) or closes the keyboard to show the results.
- Search explains the 2-letter minimum and suggests what to try when nothing is found.
- The books list names the Old and New Testament instead of a bare line.
- The chapter grid has 6 columns of 44 px buttons, so long books like Psalms take less scrolling.
- Typing a reference such as "ps 23" in the book search offers to go straight to that chapter, and Enter opens it.
- Choosing a version in the Library takes you back to the text.

### Fixed

- Sheets keep the keyboard focus inside them, and the close button is reachable by keyboard and screen reader on phones.
- The Back button (Android) and the browser Back close the open sheet instead of leaving the screen.
- Verses can be selected with the keyboard (Tab to the text, arrows to move, Enter or Space to select) and announce their state to screen readers.
- The book and version chips have a 44 px touch area.
- Better contrast for the sepia theme and for subtle verse numbers.
- The reading-aloud follow scroll respects the reduced motion setting.
- Menu items (My study, Library, Settings) open again instead of returning to the text.
- The address bar follows the chapter after opening a search result or picking a chapter.

## 1.7.5

### Added

- Friendly message inside the AI screen when something goes wrong.

### Fixed

- The AI screen no longer goes blank when asking a question in recent Chrome versions.
- The send button is no longer cut off on small Android screens.
- Cross-references are stored for offline use again.

## 1.7.4

### Fixed

- The install option shows up again on Android after uninstalling the app.

## 1.7.3

### Changed

- The AI prompt opens directly on first launch, without the notice that interrupted the onboarding.

## 1.7.2

### Fixed

- In the intro hint, quick successive taps no longer skip the AI button step. Each step ignores taps for 1 second, and the AI step appears slightly after the previous one.

## 1.7.1

### Changed

- The AI intro hint has shorter text, next to the button, with the icon above.
- In the Update button in Settings, versions show as "Current" and "New".

## 1.7.0

### Added

- On first launch, after the swipe-to-turn-pages hint, a second hint points to the AI button and asks for a tap on it, which opens the prompt.

## 1.6.8

### Changed

- The AI answer only appears after at least 1 second, with a three-dot animation in the meantime.

## 1.6.7

### Changed

- The AI first-use notice is shorter and reminds that it can make mistakes, while keeping the note that the question and passage are sent to Groq.

## 1.6.6

### Added

- In the AI answer, the reference pill has an × that removes the selected verses and goes back to the whole-chapter scope for the next questions.

### Fixed

- The reference pill's inner spacing is now balanced between the icon and the text.

## 1.6.5

### Changed

- The Bible reference pill in the AI prompt and answer now uses the bookmark icon.

## 1.6.4

### Changed

- In the AI prompt, the Practice shortcut was replaced by Summarize. The shortcuts are now Summarize, Explain and Context.

## 1.6.3

### Changed

- Dragging the AI answer down now slides it to the compact prompt instead of closing and only then showing the prompt.

## 1.6.2

### Changed

- The answer screen has the same question field as the prompt, with the passage pill and the microphone.
- The AI disclaimer is shown at the end of the answer with a warning icon.

### Fixed

- The AI question field no longer overflows the sheet on narrow screens.

## 1.6.1

### Changed

- The AI prompt has more space below its heading.

## 1.6.0

### Added

- Dictate your question to the AI with the microphone.
- Bottom sheets have a × button on desktop.

### Changed

- The AI prompt is lower and shows the passage as a pill inside the field.
- The AI prompt shortcut "Apply" is now "Practical".

## 1.5.1

### Changed

- Bottom sheet headings have an icon.

## 1.5.0

### Added

- Ask AI: select verses and ask for an explanation, the context or an application.
- The verse selection actions include AI.

### Changed

- Listen to chapter moved from the header to the menu.
- The AI prompt opens from a floating button in a bottom sheet that you can close.

## 1.4.1

### Changed

- Delete confirmation: the buttons have icons and Delete is now the primary button.

## 1.4.0

### Added

- Cross-references: select verses and tap References to see related passages.

### Changed

- The selection actions are arranged in two rows.

## 1.3.5

### Changed

- Settings: Export backup and Import backup have new icons.
- Settings: the "Send feedback" item is removed (it is still in the menu).

## 1.3.4

### Changed

- The Note action uses the Note icon.

## 1.3.3

### Changed

- Note and My study use the Notepad icon.

## 1.3.2

### Changed

- Reading header: book and chapter in a pill, with the version next to it.

### Fixed

- Search: results no longer scroll behind the search field.

## 1.3.1

### Changed

- Library: after a download, the toast says the version was downloaded and activated.
- Compare versions: "Download more versions" is always available below the verses, and the repeated reference under the title is gone.

## 1.3.0

### Added

- Compare versions: select one or more verses and tap Compare to see them in every downloaded version. Tap a version to read there.

### Changed

- The verse selection sheet title shows only the reference, without the verse count.

## 1.2.7

### Changed

- Install app (iPhone and iPad): the intro sentence is gone, only the steps remain.

## 1.2.6

### Changed

- Feedback: the buttons now match the rest of the app (no underline on "Continue on GitHub") and have icons.
- Copy and Share: the verse numbers are no longer included in the text.

## 1.2.5

### Changed

- Splash screen: the logo no longer pulses.

## 1.2.4

### Changed

- The "Restore default" button in Appearance has its icon at the left edge, with the label centered, like the buttons on the first screen.
- Splash screen: the version moves to the bottom of the screen, in a lighter gray, and the minimum time goes back to 1.2 seconds.

### Fixed

- Verse numbers: "Visible" and "Subtle" looked the same. Visible is now larger, bold and in the accent color, and Subtle is smaller and fainter.

## 1.2.3

### Changed

- First screen: the download and "Choose another version" buttons both have an icon, with the same spacing, and the "Open Bible" title lines up with the title in the reading header.

## 1.2.2

### Changed

- The splash screen now stays visible for at least 1.5 seconds.
- On the first screen, the download button and the "Choose another version" button have the same width.

## 1.2.1

### Changed

- The splash screen now stays visible for at least 1.2 seconds, so the logo can be seen even when the app opens fast.

## 1.2.0

### Added

- **Splash screen:** the app logo, name and version, with a soft pulse on the logo, show right away when the app opens and fades out once the app is ready. It follows the theme (light, sepia or dark) and respects reduced motion.

## 1.1.6

### Fixed

- The Update button on iOS could show "Updating to the new version..." and stay on the old version until the app was closed and reopened. The app now reloads as soon as the new worker is active, and after 4 seconds at most.

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
