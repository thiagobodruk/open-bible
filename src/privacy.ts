import type { UiLang } from './state/settings';

export const PRIVACY_EMAIL = 'thiagobodruk@gmail.com';

interface Policy {
  updated: string;
  sections: { h: string; p: string[] }[];
}

/** Política de privacidade por idioma. O inglês é a referência; ao mudar o texto, atualize todos e a data. */
export const PRIVACY: Record<UiLang, Policy> = {
  en: {
    updated: 'Last updated: October 25, 2026',
    sections: [
      { h: 'What stays on your device', p: ['Bible texts, notes, highlights, bookmarks and settings are saved on your device. Without an account, nothing about your study leaves it.'] },
      { h: 'If you sign in with Google', p: ['We receive your name, email and photo from Google. Your notes, highlights, bookmarks, reading position and settings are stored in Google Firebase (Authentication and Firestore) so they can sync between your devices. We never see your Google password.'] },
      { h: 'Questions to the AI', p: ['When you ask the AI, your question, the selected passage and the latest messages of the conversation are sent to our server and to an AI provider to write the answer. We do not store them and they are not tied to your account. The provider processes them under its own terms.'] },
      { h: 'Usage statistics', p: ['Only if you allow it, we use Google Analytics through Firebase to count anonymous usage, such as screens opened and Bible version. We never send verse text, your notes or your AI questions. You can turn this off at any time in Settings.'] },
      { h: 'Your rights', p: ['You can export your data, sign out and delete your account in Settings. Deleting marks the account as deleted and stops syncing; the cloud data is permanently removed afterwards. To have it removed right away, or to ask about your data, write to us.'] },
      { h: 'Changes', p: ['If this policy changes, the date above is updated.'] },
      { h: 'Who we are', p: ['Open Bible is a free, open source Bible reader kept by an independent developer. Contact: ' + PRIVACY_EMAIL + '.'] },
    ],
  },
  'pt-BR': {
    updated: 'Atualizada em 25 de outubro de 2026',
    sections: [
      { h: 'O que fica no seu aparelho', p: ['Os textos bíblicos, notas, destaques, favoritos e ajustes ficam salvos no seu aparelho. Sem conta, nada do seu estudo sai dele.'] },
      { h: 'Se você entrar com o Google', p: ['Recebemos seu nome, e-mail e foto do Google. Suas notas, destaques, favoritos, posição de leitura e ajustes são guardados no Google Firebase (Authentication e Firestore) para sincronizar entre seus aparelhos. Nunca vemos sua senha do Google.'] },
      { h: 'Perguntas à IA', p: ['Quando você pergunta à IA, a pergunta, a passagem selecionada e as últimas mensagens da conversa são enviadas ao nosso servidor e a um provedor de IA para gerar a resposta. Não guardamos esses dados e eles não ficam ligados à sua conta. O provedor os trata segundo os próprios termos.'] },
      { h: 'Estatísticas de uso', p: ['Somente se você permitir, usamos o Google Analytics, pelo Firebase, para contar o uso de forma anônima, como telas abertas e versão da Bíblia. Nunca enviamos o texto dos versículos, suas notas ou suas perguntas à IA. Você pode desligar isso quando quiser, em Ajustes.'] },
      { h: 'Seus direitos', p: ['Você pode exportar seus dados, sair e excluir sua conta em Ajustes. Excluir marca a conta como excluída e interrompe a sincronização; os dados na nuvem são removidos de forma definitiva depois. Para remover na hora, ou para tirar dúvidas sobre seus dados, escreva para nós.'] },
      { h: 'Mudanças', p: ['Se esta política mudar, a data acima será atualizada.'] },
      { h: 'Quem somos', p: ['O Open Bible é um leitor de Bíblia gratuito e de código aberto, mantido por um desenvolvedor independente. Contato: ' + PRIVACY_EMAIL + '.'] },
    ],
  },
  es: {
    updated: 'Actualizada el 25 de octubre de 2026',
    sections: [
      { h: 'Qué se queda en tu dispositivo', p: ['Los textos bíblicos, notas, subrayados, favoritos y ajustes se guardan en tu dispositivo. Sin cuenta, nada de tu estudio sale de él.'] },
      { h: 'Si inicias sesión con Google', p: ['Recibimos tu nombre, correo y foto de Google. Tus notas, subrayados, favoritos, posición de lectura y ajustes se guardan en Google Firebase (Authentication y Firestore) para sincronizarlos entre tus dispositivos. Nunca vemos tu contraseña de Google.'] },
      { h: 'Preguntas a la IA', p: ['Cuando preguntas a la IA, tu pregunta, el pasaje seleccionado y los últimos mensajes de la conversación se envían a nuestro servidor y a un proveedor de IA para generar la respuesta. No los guardamos y no se vinculan a tu cuenta. El proveedor los trata según sus propios términos.'] },
      { h: 'Estadísticas de uso', p: ['Solo si lo permites, usamos Google Analytics a través de Firebase para contar el uso de forma anónima, como pantallas abiertas y versión de la Biblia. Nunca enviamos el texto de los versículos, tus notas ni tus preguntas a la IA. Puedes desactivarlo cuando quieras en Ajustes.'] },
      { h: 'Tus derechos', p: ['Puedes exportar tus datos, cerrar sesión y eliminar tu cuenta en Ajustes. Eliminar marca la cuenta como eliminada y detiene la sincronización; los datos en la nube se borran de forma definitiva después. Para borrarlos de inmediato, o para consultar sobre tus datos, escríbenos.'] },
      { h: 'Cambios', p: ['Si esta política cambia, se actualizará la fecha de arriba.'] },
      { h: 'Quiénes somos', p: ['Open Bible es un lector de la Biblia gratuito y de código abierto, mantenido por un desarrollador independiente. Contacto: ' + PRIVACY_EMAIL + '.'] },
    ],
  },
  fr: {
    updated: 'Mise à jour le 25 octobre 2026',
    sections: [
      { h: 'Ce qui reste sur votre appareil', p: ['Les textes bibliques, notes, surlignages, favoris et réglages sont enregistrés sur votre appareil. Sans compte, rien de votre étude n’en sort.'] },
      { h: 'Si vous vous connectez avec Google', p: ['Nous recevons votre nom, votre e-mail et votre photo de Google. Vos notes, surlignages, favoris, position de lecture et réglages sont stockés dans Google Firebase (Authentication et Firestore) pour être synchronisés entre vos appareils. Nous ne voyons jamais votre mot de passe Google.'] },
      { h: 'Questions à l’IA', p: ['Quand vous interrogez l’IA, votre question, le passage sélectionné et les derniers messages de la conversation sont envoyés à notre serveur et à un fournisseur d’IA pour rédiger la réponse. Nous ne les conservons pas et ils ne sont pas liés à votre compte. Le fournisseur les traite selon ses propres conditions.'] },
      { h: 'Statistiques d’usage', p: ['Seulement si vous l’autorisez, nous utilisons Google Analytics via Firebase pour compter l’usage de façon anonyme, par exemple les écrans ouverts et la version de la Bible. Nous n’envoyons jamais le texte des versets, vos notes ni vos questions à l’IA. Vous pouvez le désactiver à tout moment dans les Réglages.'] },
      { h: 'Vos droits', p: ['Vous pouvez exporter vos données, vous déconnecter et supprimer votre compte dans les Réglages. La suppression marque le compte comme supprimé et arrête la synchronisation ; les données dans le cloud sont ensuite effacées définitivement. Pour les faire effacer tout de suite, ou pour toute question sur vos données, écrivez-nous.'] },
      { h: 'Modifications', p: ['Si cette politique change, la date ci-dessus sera mise à jour.'] },
      { h: 'Qui sommes-nous', p: ['Open Bible est un lecteur de la Bible gratuit et open source, maintenu par un développeur indépendant. Contact : ' + PRIVACY_EMAIL + '.'] },
    ],
  },
  de: {
    updated: 'Stand: 25. Oktober 2026',
    sections: [
      { h: 'Was auf deinem Gerät bleibt', p: ['Bibeltexte, Notizen, Markierungen, Lesezeichen und Einstellungen werden auf deinem Gerät gespeichert. Ohne Konto verlässt nichts von deinem Studium das Gerät.'] },
      { h: 'Wenn du dich mit Google anmeldest', p: ['Wir erhalten deinen Namen, deine E-Mail-Adresse und dein Foto von Google. Deine Notizen, Markierungen, Lesezeichen, Leseposition und Einstellungen werden in Google Firebase (Authentication und Firestore) gespeichert, damit sie zwischen deinen Geräten synchronisiert werden. Dein Google-Passwort sehen wir nie.'] },
      { h: 'Fragen an die KI', p: ['Wenn du die KI fragst, werden deine Frage, die gewählte Stelle und die letzten Nachrichten des Gesprächs an unseren Server und an einen KI-Anbieter gesendet, um die Antwort zu erstellen. Wir speichern sie nicht, und sie sind nicht mit deinem Konto verknüpft. Der Anbieter verarbeitet sie nach seinen eigenen Bedingungen.'] },
      { h: 'Nutzungsstatistik', p: ['Nur wenn du zustimmst, nutzen wir Google Analytics über Firebase, um die Nutzung anonym zu zählen, etwa geöffnete Ansichten und Bibelübersetzung. Wir senden nie Verstexte, deine Notizen oder deine KI-Fragen. Du kannst das jederzeit in den Einstellungen ausschalten.'] },
      { h: 'Deine Rechte', p: ['Du kannst deine Daten exportieren, dich abmelden und dein Konto in den Einstellungen löschen. Das Löschen markiert das Konto als gelöscht und beendet die Synchronisierung; die Daten in der Cloud werden danach endgültig entfernt. Für eine sofortige Entfernung oder Fragen zu deinen Daten schreib uns.'] },
      { h: 'Änderungen', p: ['Wenn sich diese Richtlinie ändert, wird das Datum oben aktualisiert.'] },
      { h: 'Wer wir sind', p: ['Open Bible ist ein kostenloser Open-Source-Bibelleser eines unabhängigen Entwicklers. Kontakt: ' + PRIVACY_EMAIL + '.'] },
    ],
  },
  'zh-CN': {
    updated: '更新日期：2026 年 10 月 25 日',
    sections: [
      { h: '留在你设备上的内容', p: ['经文、笔记、标注、收藏和设置都保存在你的设备上。不登录账号时，你的学习内容不会离开设备。'] },
      { h: '使用 Google 登录时', p: ['我们会从 Google 获取你的姓名、电子邮箱和头像。你的笔记、标注、收藏、阅读位置和设置会保存在 Google Firebase（Authentication 和 Firestore），以便在你的设备之间同步。我们永远看不到你的 Google 密码。'] },
      { h: '向 AI 提问', p: ['向 AI 提问时，你的问题、所选经文和最近的对话内容会发送到我们的服务器和 AI 服务商，用于生成回答。我们不会保存这些内容，它们也不会与你的账号关联。服务商按其自身条款处理这些内容。'] },
      { h: '使用统计', p: ['仅在你允许时，我们才会通过 Firebase 使用 Google Analytics，以匿名方式统计使用情况，例如打开的页面和圣经译本。我们绝不会发送经文内容、你的笔记或你向 AI 提出的问题。你可以随时在设置中关闭。'] },
      { h: '你的权利', p: ['你可以在设置中导出数据、退出登录并删除账号。删除会将账号标记为已删除并停止同步，云端数据随后会被永久清除。如需立即清除，或对你的数据有疑问，请联系我们。'] },
      { h: '变更', p: ['如果本政策有变更，上方的日期会随之更新。'] },
      { h: '我们是谁', p: ['Open Bible 是一款免费的开源圣经阅读器，由一位独立开发者维护。联系方式：' + PRIVACY_EMAIL + '。'] },
    ],
  },
  ja: {
    updated: '最終更新：2026年10月25日',
    sections: [
      { h: 'デバイスに残るもの', p: ['聖書の本文、メモ、ハイライト、ブックマーク、設定はお使いのデバイスに保存されます。アカウントがなければ、学びの内容がデバイスの外に出ることはありません。'] },
      { h: 'Google でログインした場合', p: ['Google から名前、メールアドレス、写真を受け取ります。メモ、ハイライト、ブックマーク、読書位置、設定は、デバイス間で同期するために Google Firebase（Authentication と Firestore）に保存されます。Google のパスワードを見ることはありません。'] },
      { h: 'AI への質問', p: ['AI に質問すると、質問、選択した箇所、直近の会話が、回答を作成するために当サーバーと AI プロバイダーに送信されます。これらは保存されず、アカウントにも結び付けられません。プロバイダーは自社の規約に従って処理します。'] },
      { h: '利用統計', p: ['許可した場合に限り、Firebase 経由で Google Analytics を使い、開いた画面や聖書の訳など、匿名の利用状況を集計します。聖句の本文、メモ、AI への質問は送信しません。設定からいつでもオフにできます。'] },
      { h: 'あなたの権利', p: ['設定で、データのエクスポート、ログアウト、アカウントの削除ができます。削除するとアカウントは削除済みとなり同期が停止し、クラウド上のデータはその後完全に削除されます。すぐに削除したい場合やデータに関するご質問は、ご連絡ください。'] },
      { h: '変更', p: ['このポリシーが変更された場合は、上の日付を更新します。'] },
      { h: '運営者', p: ['Open Bible は、個人の開発者が運営する無料のオープンソース聖書リーダーです。連絡先：' + PRIVACY_EMAIL + '。'] },
    ],
  },
};
