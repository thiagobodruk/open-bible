# Changelog

Versions follow [SemVer](https://semver.org/). This file is updated by the Release workflow, which joins the `## Changelog` sections of the PRs merged since the last version. Do not edit it in a PR.

## 1.10.1

### Added

- Tocar na versão no rodapé do menu verifica e aplica a atualização do app.

### Changed

- A conta ficou no rodapé do menu, com um botão Sair.
- A seção Conta de Ajustes ficou no fim da tela.
- O menu ficou mais enxuto, sem logo e sem título.

## 1.10.0

### Changed

- O download da primeira Bíblia agora é a última tela da apresentação inicial.
- A opção Ler foi removida do menu.

## 1.9.1

### Changed

- O botão de ouvir o capítulo agora fica no cabeçalho da leitura, e não mais no menu.

## 1.9.0

### Added

- Entrar com a conta Google pelo menu, com apresentação inicial no primeiro acesso.
- Política de privacidade no menu.
- Excluir a conta em Ajustes.

### Changed

- O item Meu estudo do menu não mostra mais o contador.

## 1.8.5

### Changed

- Os bottom sheets voltam a fechar só ao arrastar para baixo, sem a seta no canto superior direito.

## 1.8.4

### Added

- Botão de seta para baixo para fechar os bottom sheets.

## 1.8.3

### Changed

- O cartão de compartilhamento mostra a logo pequena ao lado do texto.

## 1.8.2

### Changed

- O cartão de compartilhamento mostra a logo do app em imagem quadrada.

### Fixed

- A resposta da IA aparece no início, sem rolar até o fim.

## 1.8.1

### Added

- Pré-visualização com logo e descrição quando o link do app é compartilhado.

### Changed

- O link de um trecho compartilhado agora usa `?ref=`.

## 1.8.0

### Added

- Compartilhar e copiar versículos incluem o link do trecho.

### Changed

- O link de um trecho abre o capítulo com os versículos destacados.

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

- Mensagem amigável dentro da tela da IA quando algo dá errado.

### Fixed

- A tela da IA não fica mais em branco ao perguntar em versões recentes do Chrome.
- O botão de enviar não é mais cortado em telas pequenas do Android.
- As referências cruzadas voltam a ser guardadas para uso offline.

## 1.7.4

### Fixed

- A opção de instalar o app volta a aparecer no Android depois de desinstalar o app.

## 1.7.3

### Changed

- O prompt da IA abre direto no primeiro acesso, sem o aviso que interrompia o onboarding.

## 1.7.2

### Fixed

- Na dica de introdução, toques rápidos em sequência não pulam mais o passo do botão de IA. Cada passo ignora toques por 1 segundo, e o passo da IA entra um pouco depois do anterior.

## 1.7.1

### Changed

- A dica de introdução da IA tem um texto mais curto, ao lado do botão, com o ícone acima.
- No botão Atualizar dos Ajustes, as versões aparecem como "Atual" e "Nova".

## 1.7.0

### Added

- Na primeira abertura, depois da dica de deslizar para paginar, uma segunda dica aponta para o botão de IA e pede um toque nele, que abre o prompt.

## 1.6.8

### Changed

- A resposta da IA só aparece depois de pelo menos 1 segundo, com uma animação de três pontinhos enquanto isso.

## 1.6.7

### Changed

- O aviso de primeiro uso da IA ficou mais curto e lembra que ela pode cometer erros, mantendo a informação de que a pergunta e o trecho são enviados à Groq.

## 1.6.6

### Added

- Na resposta da IA, a pill da referência tem um × que remove os versos selecionados e volta ao escopo do capítulo inteiro nas próximas perguntas.

### Fixed

- O espaçamento interno da pill de referência ficou equilibrado entre o ícone e o texto.

## 1.6.5

### Changed

- A pill da referência bíblica no prompt e na resposta da IA agora usa o ícone de marcador.

## 1.6.4

### Changed

- No prompt da IA, o atalho Prática foi substituído por Resumir. Os atalhos agora são Resumir, Explicar e Contexto.

## 1.6.3

### Changed

- Ao arrastar a resposta da IA para baixo, ela desliza até o prompt compacto em vez de fechar e só depois mostrar o prompt.

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
