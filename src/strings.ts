// Textos da interface em pt-BR. Na camada de i18n isso vira o locale pt-BR do i18next.
export const t = {
  appName: 'Open Bible',
  menu: 'Menu',
  read: 'Ler',
  study: 'Meu estudo',
  library: 'Biblioteca',
  librarySub: 'Idiomas e versões',
  settings: 'Ajustes',
  install: 'Instalar app',
  installSub: 'Use offline, em tela cheia',
  textSettings: 'Texto',
  search: 'Buscar',
  books: 'Livros',
  prevChapter: 'Capítulo anterior',
  nextChapter: 'Próximo capítulo',
  back: 'Voltar',
  close: 'Fechar',
  copy: 'Copiar',
  share: 'Compartilhar',
  note: 'Nota',
  cancel: 'Cancelar',
  save: 'Salvar',
  delete: 'Excluir',
} as const;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
