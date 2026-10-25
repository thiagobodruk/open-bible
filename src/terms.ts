import type { UiLang } from './state/settings';

/** Versão dos termos e da política que a pessoa aceita. Ao mudar o texto de qualquer um, atualize a data. */
export const TERMS_VERSION = '2026-10-25';

interface Doc {
  updated: string;
  sections: { h: string; p: string[] }[];
}

/** Termos de uso por idioma. O inglês é a referência; ao mudar o texto, atualize todos e a data. */
export const TERMS: Record<UiLang, Doc> = {
  en: {
    updated: 'Last updated: October 25, 2026',
    sections: [
      { h: 'Acceptance', p: ['By using Open Bible you agree to these terms and to the privacy policy. If you do not agree, please do not use the app.'] },
      { h: 'The app', p: ['Open Bible is a free, open source Bible reader. It is provided as is, without warranty of any kind, and may change or stop at any time.'] },
      { h: 'Bible texts', p: ['Bible texts belong to their authors, translators and publishers, and are offered here as published by their sources. Open Bible does not claim any rights over them.'] },
      { h: 'Your content', p: ['Your notes and highlights are yours. They are stored on your device and, if you sign in, in your account so they can sync. You are responsible for what you write and for keeping a backup.'] },
      { h: 'AI answers', p: ['AI answers may be wrong or incomplete. They are a study aid, not religious, legal, medical or other professional advice. Check them against the text.'] },
      { h: 'Acceptable use', p: ['Do not misuse the app, try to break it or access data that is not yours, or send abusive content through its features.'] },
      { h: 'Account', p: ['Signing in with Google is optional. You can delete your account in Settings at any time.'] },
      { h: 'Liability', p: ['To the extent allowed by law, the maintainer is not liable for losses arising from the use of the app, including lost notes or unavailable features.'] },
      { h: 'Usage statistics', p: ['By accepting these terms you agree that anonymous usage statistics are collected, as described in the privacy policy. You can turn them off at any time in Settings.'] },
      { h: 'Changes', p: ['These terms may change. When they do, the date above is updated and you may be asked to accept them again.'] },
      { h: 'Contact', p: ['Questions about these terms: thiagobodruk@gmail.com.'] },
    ],
  },
  'pt-BR': {
    updated: 'Atualizados em 25 de outubro de 2026',
    sections: [
      { h: 'Aceite', p: ['Ao usar o Open Bible, você concorda com estes termos e com a política de privacidade. Se não concordar, não use o app.'] },
      { h: 'O app', p: ['O Open Bible é um leitor de Bíblia gratuito e de código aberto. Ele é oferecido como está, sem garantia de qualquer tipo, e pode mudar ou deixar de existir a qualquer momento.'] },
      { h: 'Textos bíblicos', p: ['Os textos bíblicos pertencem a seus autores, tradutores e editoras e são oferecidos como publicados por suas fontes. O Open Bible não reivindica direitos sobre eles.'] },
      { h: 'Seu conteúdo', p: ['Suas notas e destaques são seus. Ficam no seu aparelho e, se você entrar, na sua conta para sincronizar. Você é responsável pelo que escreve e por manter um backup.'] },
      { h: 'Respostas da IA', p: ['As respostas da IA podem estar erradas ou incompletas. São um apoio ao estudo, não orientação religiosa, jurídica, médica ou profissional. Confira sempre com o texto.'] },
      { h: 'Uso adequado', p: ['Não use o app de forma indevida, não tente quebrá-lo nem acessar dados que não são seus, e não envie conteúdo abusivo pelos recursos dele.'] },
      { h: 'Conta', p: ['Entrar com o Google é opcional. Você pode excluir sua conta em Ajustes quando quiser.'] },
      { h: 'Responsabilidade', p: ['Na medida permitida pela lei, o mantenedor não responde por perdas decorrentes do uso do app, incluindo notas perdidas ou recursos indisponíveis.'] },
      { h: 'Estatísticas de uso', p: ['Ao aceitar estes termos, você concorda com a coleta de estatísticas anônimas de uso, como descrito na política de privacidade. Você pode desligá-las quando quiser em Ajustes.'] },
      { h: 'Mudanças', p: ['Estes termos podem mudar. Quando isso acontecer, a data acima será atualizada e talvez você precise aceitá-los de novo.'] },
      { h: 'Contato', p: ['Dúvidas sobre estes termos: thiagobodruk@gmail.com.'] },
    ],
  },
  es: {
    updated: 'Actualizados el 25 de octubre de 2026',
    sections: [
      { h: 'Aceptación', p: ['Al usar Open Bible aceptas estos términos y la política de privacidad. Si no estás de acuerdo, no uses la app.'] },
      { h: 'La app', p: ['Open Bible es un lector de la Biblia gratuito y de código abierto. Se ofrece tal cual, sin garantía de ningún tipo, y puede cambiar o dejar de existir en cualquier momento.'] },
      { h: 'Textos bíblicos', p: ['Los textos bíblicos pertenecen a sus autores, traductores y editoriales, y se ofrecen tal como los publican sus fuentes. Open Bible no reclama derechos sobre ellos.'] },
      { h: 'Tu contenido', p: ['Tus notas y subrayados son tuyos. Se guardan en tu dispositivo y, si inicias sesión, en tu cuenta para sincronizarlos. Eres responsable de lo que escribes y de mantener una copia de seguridad.'] },
      { h: 'Respuestas de la IA', p: ['Las respuestas de la IA pueden ser erróneas o incompletas. Son una ayuda para el estudio, no orientación religiosa, legal, médica ni profesional. Compruébalas siempre con el texto.'] },
      { h: 'Uso adecuado', p: ['No hagas un mal uso de la app, no intentes romperla ni acceder a datos que no son tuyos, y no envíes contenido abusivo mediante sus funciones.'] },
      { h: 'Cuenta', p: ['Iniciar sesión con Google es opcional. Puedes eliminar tu cuenta en Ajustes cuando quieras.'] },
      { h: 'Responsabilidad', p: ['En la medida que permita la ley, el responsable no responde por pérdidas derivadas del uso de la app, incluidas notas perdidas o funciones no disponibles.'] },
      { h: 'Estadísticas de uso', p: ['Al aceptar estos términos, aceptas la recopilación de estadísticas anónimas de uso, tal como describe la política de privacidad. Puedes desactivarlas cuando quieras en Ajustes.'] },
      { h: 'Cambios', p: ['Estos términos pueden cambiar. Cuando ocurra, se actualizará la fecha de arriba y quizá debas aceptarlos de nuevo.'] },
      { h: 'Contacto', p: ['Dudas sobre estos términos: thiagobodruk@gmail.com.'] },
    ],
  },
  fr: {
    updated: 'Mises à jour le 25 octobre 2026',
    sections: [
      { h: 'Acceptation', p: ['En utilisant Open Bible, vous acceptez ces conditions et la politique de confidentialité. Si vous n’êtes pas d’accord, n’utilisez pas l’app.'] },
      { h: 'L’app', p: ['Open Bible est un lecteur de la Bible gratuit et open source. Il est fourni tel quel, sans garantie d’aucune sorte, et peut changer ou cesser à tout moment.'] },
      { h: 'Textes bibliques', p: ['Les textes bibliques appartiennent à leurs auteurs, traducteurs et éditeurs, et sont proposés tels que publiés par leurs sources. Open Bible ne revendique aucun droit sur eux.'] },
      { h: 'Votre contenu', p: ['Vos notes et surlignages vous appartiennent. Ils sont enregistrés sur votre appareil et, si vous vous connectez, dans votre compte pour être synchronisés. Vous êtes responsable de ce que vous écrivez et de garder une sauvegarde.'] },
      { h: 'Réponses de l’IA', p: ['Les réponses de l’IA peuvent être erronées ou incomplètes. Elles aident à l’étude, mais ne sont pas un conseil religieux, juridique, médical ou professionnel. Vérifiez-les toujours avec le texte.'] },
      { h: 'Usage acceptable', p: ['N’utilisez pas l’app de façon abusive, n’essayez pas de la casser ni d’accéder à des données qui ne sont pas les vôtres, et n’envoyez pas de contenu abusif via ses fonctions.'] },
      { h: 'Compte', p: ['Se connecter avec Google est facultatif. Vous pouvez supprimer votre compte dans les Réglages à tout moment.'] },
      { h: 'Responsabilité', p: ['Dans la mesure permise par la loi, le responsable n’est pas tenu des pertes liées à l’usage de l’app, y compris des notes perdues ou des fonctions indisponibles.'] },
      { h: 'Statistiques d’usage', p: ['En acceptant ces conditions, vous acceptez la collecte de statistiques d’usage anonymes, comme décrit dans la politique de confidentialité. Vous pouvez les désactiver à tout moment dans les Réglages.'] },
      { h: 'Modifications', p: ['Ces conditions peuvent changer. Dans ce cas, la date ci-dessus sera mise à jour et il pourra vous être demandé de les accepter à nouveau.'] },
      { h: 'Contact', p: ['Questions sur ces conditions : thiagobodruk@gmail.com.'] },
    ],
  },
  de: {
    updated: 'Stand: 25. Oktober 2026',
    sections: [
      { h: 'Zustimmung', p: ['Mit der Nutzung von Open Bible stimmst du diesen Bedingungen und der Datenschutzerklärung zu. Wenn du nicht einverstanden bist, nutze die App bitte nicht.'] },
      { h: 'Die App', p: ['Open Bible ist ein kostenloser Open-Source-Bibelleser. Er wird wie besehen und ohne jede Gewähr bereitgestellt und kann sich jederzeit ändern oder eingestellt werden.'] },
      { h: 'Bibeltexte', p: ['Die Bibeltexte gehören ihren Autoren, Übersetzern und Verlagen und werden so angeboten, wie ihre Quellen sie veröffentlichen. Open Bible erhebt keine Rechte an ihnen.'] },
      { h: 'Deine Inhalte', p: ['Deine Notizen und Markierungen gehören dir. Sie werden auf deinem Gerät und, wenn du dich anmeldest, zur Synchronisierung in deinem Konto gespeichert. Du bist für das verantwortlich, was du schreibst, und für ein Backup.'] },
      { h: 'Antworten der KI', p: ['Antworten der KI können falsch oder unvollständig sein. Sie sind eine Lernhilfe und keine religiöse, rechtliche, medizinische oder sonstige fachliche Beratung. Prüfe sie immer am Text.'] },
      { h: 'Zulässige Nutzung', p: ['Nutze die App nicht missbräuchlich, versuche nicht, sie zu stören oder auf fremde Daten zuzugreifen, und sende keine beleidigenden Inhalte über ihre Funktionen.'] },
      { h: 'Konto', p: ['Die Anmeldung mit Google ist freiwillig. Du kannst dein Konto jederzeit in den Einstellungen löschen.'] },
      { h: 'Haftung', p: ['Soweit gesetzlich zulässig, haftet der Betreiber nicht für Verluste aus der Nutzung der App, etwa verlorene Notizen oder nicht verfügbare Funktionen.'] },
      { h: 'Nutzungsstatistik', p: ['Mit der Zustimmung zu diesen Bedingungen erklärst du dich mit der Erfassung anonymer Nutzungsstatistiken einverstanden, wie in der Datenschutzerklärung beschrieben. Du kannst sie jederzeit in den Einstellungen ausschalten.'] },
      { h: 'Änderungen', p: ['Diese Bedingungen können sich ändern. Dann wird das Datum oben aktualisiert und du musst ihnen eventuell erneut zustimmen.'] },
      { h: 'Kontakt', p: ['Fragen zu diesen Bedingungen: thiagobodruk@gmail.com.'] },
    ],
  },
  'zh-CN': {
    updated: '更新于 2026 年 10 月 25 日',
    sections: [
      { h: '接受条款', p: ['使用 Open Bible 即表示你同意本条款和隐私政策。如不同意，请不要使用本应用。'] },
      { h: '关于应用', p: ['Open Bible 是一款免费、开源的圣经阅读应用。应用按现状提供，不作任何形式的保证，并可能随时变更或停止。'] },
      { h: '圣经经文', p: ['经文归其作者、译者和出版者所有，按其来源的发布内容提供。Open Bible 不对经文主张任何权利。'] },
      { h: '你的内容', p: ['你的笔记和高亮归你所有。它们保存在你的设备上，登录后也会保存在你的账号中以便同步。你需对所写内容负责，并自行保留备份。'] },
      { h: 'AI 回答', p: ['AI 的回答可能有误或不完整。它们只是学习辅助，不构成宗教、法律、医疗或其他专业建议。请始终对照经文核实。'] },
      { h: '合理使用', p: ['请勿滥用本应用，不要试图破坏它或访问不属于你的数据，也不要通过其功能发送侮辱性内容。'] },
      { h: '账号', p: ['使用 Google 登录是可选的。你可以随时在“设置”中删除账号。'] },
      { h: '责任', p: ['在法律允许的范围内，维护者不对因使用本应用造成的损失负责，包括笔记丢失或功能不可用。'] },
      { h: '使用统计', p: ['接受本条款即表示你同意按隐私政策所述收集匿名使用统计。你可以随时在“设置”中关闭。'] },
      { h: '条款变更', p: ['本条款可能会变更。变更时，上方日期会更新，你可能需要重新接受。'] },
      { h: '联系方式', p: ['关于本条款的问题：thiagobodruk@gmail.com。'] },
    ],
  },
  ja: {
    updated: '2026年10月25日更新',
    sections: [
      { h: '同意', p: ['Open Bible を利用すると、この利用規約とプライバシーポリシーに同意したものとみなされます。同意しない場合は、アプリを利用しないでください。'] },
      { h: 'アプリについて', p: ['Open Bible は無料のオープンソースの聖書リーダーです。現状有姿で提供され、いかなる保証もなく、いつでも変更または終了することがあります。'] },
      { h: '聖書の本文', p: ['聖書の本文は、著者、翻訳者、出版社に帰属し、提供元が公開した内容のまま提供されます。Open Bible はそれらに対する権利を主張しません。'] },
      { h: 'あなたのコンテンツ', p: ['メモとハイライトはあなたのものです。端末に保存され、ログインした場合は同期のためアカウントにも保存されます。書いた内容とバックアップの管理はご自身の責任です。'] },
      { h: 'AI の回答', p: ['AI の回答は誤っていたり不完全だったりすることがあります。学習の補助であり、宗教的、法的、医療的その他の専門的助言ではありません。必ず本文で確認してください。'] },
      { h: '適切な利用', p: ['アプリを不正に使用したり、破壊しようとしたり、他人のデータにアクセスしたり、機能を通じて不適切な内容を送信したりしないでください。'] },
      { h: 'アカウント', p: ['Google でのログインは任意です。アカウントは設定からいつでも削除できます。'] },
      { h: '責任', p: ['法律で認められる範囲で、運営者は、メモの消失や機能の停止など、アプリの利用によって生じた損害について責任を負いません。'] },
      { h: '利用統計', p: ['この規約に同意すると、プライバシーポリシーに記載のとおり匿名の利用統計を収集することに同意したものとなります。設定からいつでもオフにできます。'] },
      { h: '変更', p: ['この規約は変更されることがあります。変更時は上の日付を更新し、再度同意をお願いすることがあります。'] },
      { h: 'お問い合わせ', p: ['この規約に関するご質問：thiagobodruk@gmail.com。'] },
    ],
  },
};
