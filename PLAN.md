# PLAN.md: Leitor da Bíblia (PWA)

Status: rascunho para revisão. Nada foi implementado ainda.

Diretriz de produto: leitor simples, entendido como minimalista (ver 5.1). Decidido: barra superior fina que some ao rolar e volta ao tocar, e 5 cores de marcação. Decidido também: a v0 inclui a tela Meu estudo e a navegação por capítulos (sem paginação dentro do capítulo), e o app é publicado no GitHub Pages.

## 1. Visão geral

Leitor de Bíblia web, offline-first, inspirado em leitores ePub. Sem backend, sem login. Tudo que é do usuário (configurações, marcações, notas) fica no navegador e pode ser exportado e importado como arquivo.

Escopo da v0:

1. Seleção de idioma e versão da Bíblia.
2. Configuração de fonte, tema e leitura em rolagem vertical, com troca de capítulo por swipe ou toque nas extremidades.
3. Seleção de versículos, marcação com cores e notas pessoais.
4. UI em 7 idiomas: en, pt-BR, es, fr, de, zh-CN, ja.
5. Tela Meu estudo, com todas as marcações e notas.
6. PWA instalável em Android e iOS, publicado no GitHub Pages.
7. Ícones com Phosphor Icons.

Fora da v0: busca, favoritos, comparação paralela, planos de leitura, sincronização entre dispositivos, áudio.

## 2. Fonte de dados

Repo `thiagobodruk/bible` (licença MIT no código, textos pertencem aos respectivos donos).

O que existe, conferido no repo:

- 141 versões em 85 idiomas, em `json/<codigo>.json` e `xml/<codigo>.xml`.
- Código no formato `<idioma>_<versao>`, por exemplo `pt_nvi`, `ja_jniv`, `zh_cnvs`, `sa_san-dn`.
- JSON: array de livros `{ abbrev, name, chapters: [[verso, ...], ...] }`. Capítulo e versículo são o índice do array.
- `abbrev` é estável entre idiomas e versões, então serve de chave canônica do livro. `name` já vem no idioma da versão.
- `json/index.json` lista idiomas e versões, mas só com nome em inglês e sem código de idioma, sem cobertura e sem direção do texto.
- Arquivos pesam de 0,9 MB até 14,6 MB, a maioria por volta de 4 MB. Os de escrita indiana e birmanesa passam de 10 MB.
- Várias versões são parciais: só NT, só AT, 64 de 66 livros, NT mais Salmos. Algumas têm Malaquias com 3 capítulos. O README avisa que pode haver pequenos problemas de encoding.
- Há idiomas RTL: árabe, hebraico, persa, urdu, yiddish, curdo sorani.

Decisões de consumo:

- **Em runtime**, o app baixa o JSON da versão escolhida via jsDelivr, fixado em um commit: `https://cdn.jsdelivr.net/gh/thiagobodruk/bible@<sha>/json/<codigo>.json`. Fallback para `raw.githubusercontent.com`. O SHA fica em uma constante e é atualizado manualmente, o que evita que mudanças no repo quebrem o app ou invalidem anotações.
- **Em build**, um script (`scripts/build-catalog.ts`) lê o repo e gera `catalog.json`, que entra no bundle. Ele acrescenta ao `index.json`: código ISO do idioma, flag RTL, quantidade de livros e testamentos cobertos, tamanho em bytes. Nomes de idioma não precisam de tabela, usamos `Intl.DisplayNames` no navegador, localizado e também no nome nativo.
- O app nunca depende do CDN para ler uma versão já baixada.

## 3. Regras de negócio

### 3.1 Referência canônica

Uma referência é `{ book: abbrev, chapter, verse }`, com capítulo e versículo começando em 1. Exemplo: `jo.3.16`. Não depende de versão nem de idioma.

### 3.2 Idioma da UI e idioma da Bíblia

São independentes.

- Primeiro acesso: UI segue `navigator.language`, com fallback para en. Idioma da Bíblia inicia igual ao da UI, se houver versão disponível.
- Cada idioma tem uma versão padrão (tabela em `config/defaults.ts`). Sugestão inicial: en_web, pt_nvi, es_rvr1960, fr_apee, de_sch1951, zh_cnvs, ja_jniv. Ver decisão D3.
- Trocar de idioma seleciona a última versão usada naquele idioma, ou o padrão.
- Trocar de versão preserva livro, capítulo e versículo. Se o livro, capítulo ou versículo não existir na nova versão, o app vai para o mais próximo e mostra um aviso curto.

### 3.3 Disponibilidade

- Versões parciais aparecem com um selo: "Só NT", "Só AT", "Incompleta".
- Navegador de livros mostra apenas os livros que a versão contém.
- Primeira abertura de uma versão exige download. Há tela de progresso e erro com tentar de novo. Depois disso funciona offline.
- Usuário pode ver e remover versões baixadas em Ajustes > Downloads, com tamanho ocupado.

### 3.4 Seleção de versículos

- Toque em um versículo o seleciona. Novo toque o desmarca. Pode haver seleção múltipla, incluindo intervalos.
- Selecionando, aparece uma barra de ações flutuante: cores, nota, copiar, compartilhar, limpar seleção.
- Tocar fora ou rolar para longe não limpa a seleção. Limpa ao tocar em fechar ou ao trocar de capítulo.
- Na v0 a granularidade é o versículo inteiro. Seleção de trecho dentro do versículo fica para depois.
- Copiar gera: `texto dos versículos` + linha `Livro cap:ver, Versão`. Compartilhar usa Web Share API, com fallback para copiar.

### 3.5 Marcações

- 5 cores: amarelo, verde, azul, rosa, laranja. Os tons mudam por tema, mantendo contraste do texto.
- Um versículo tem no máximo uma cor. Marcar com outra cor substitui. Marcar com a mesma cor remove.
- A marcação é gravada por referência canônica, então aparece em qualquer versão que tenha aquele versículo.
- Cada registro guarda a versão em que foi criado. Ao ler em outra versão, a marcação aparece normalmente.

### 3.6 Notas

- Uma nota pertence a um intervalo de versículos `{ book, chapter, verseStart, verseEnd }` dentro de um capítulo.
- Texto simples, até 5.000 caracteres, com salvamento ao fechar o editor. Salvar vazio apaga, com confirmação.
- Versículos com nota exibem um ícone discreto ao lado do número. Tocar abre a nota.
- Sobreposição de notas é permitida. Se vários versículos tiverem notas, o toque abre a lista.
- Notas e marcações são independentes. Apagar uma não apaga a outra.

### 3.7 Tela "Meu estudo"

Lista de marcações e notas, agrupada por livro na ordem canônica, com filtro por cor e por tipo. Tocar em um item abre o versículo no leitor. Mostra o texto na versão atual quando existir.

### 3.8 Preferências de leitura

| Preferência | Opções |
|---|---|
| Fonte | Serifada, sem serifa, mono, com fallback de sistema para CJK, indianos, árabe e hebraico |
| Tamanho | 14 a 32 px, passo de 1 |
| Altura de linha | 1,3 a 2,0 |
| Largura/margens | estreita, média, larga |
| Alinhamento | esquerda ou justificado |
| Tema | claro, sépia, escuro, automático pelo sistema |
| Números de versículo | visíveis, discretos, ocultos |
| Modo de texto | um versículo por linha, ou parágrafo contínuo |

Aplicam-se imediatamente, com prévia ao vivo no painel de ajustes.

### 3.9 Navegação entre capítulos

Cada capítulo é uma página única e rola na vertical. Não existe paginação dentro do capítulo. A "página" do leitor é o capítulo.

- Swipe horizontal para a esquerda vai ao capítulo seguinte, para a direita vai ao anterior. O gesto só vale se for predominantemente horizontal, com deslocamento mínimo de 60 px, para não competir com a rolagem vertical nem com a seleção.
- Toque nas extremidades: faixas laterais de cerca de 10% da largura da tela. Esquerda volta, direita avança. Toques fora das faixas selecionam versículos normalmente. A coluna de texto tem margem lateral mínima igual à faixa, para que ler e tocar não se confundam.
- Teclado: setas esquerda e direita. Desktop também tem dois botões discretos nas laterais.
- No fim do livro, avança para o primeiro capítulo do próximo livro. No primeiro e último capítulo da versão, o gesto não faz nada e mostra um toast curto.
- Ao trocar de capítulo, a rolagem volta ao topo e a transição é um deslize curto, desligado com `prefers-reduced-motion`.
- O capítulo seguinte e o anterior são pré-carregados do IndexedDB para a troca ser instantânea.
- Com texto selecionado, swipe e toque nas extremidades ficam desativados até a seleção ser limpa.

### 3.10 Posição de leitura

Salva automaticamente com debounce: livro, capítulo e primeiro versículo visível na rolagem. O app abre exatamente onde o usuário parou.

### 3.11 Direção do texto

Idiomas RTL aplicam `dir="rtl"` na área de texto, mas a UI continua na direção do idioma da interface.

### 3.12 Privacidade

Sem analytics, sem contas, sem chamadas a servidores além do download das versões. A página de ajustes diz isso de forma explícita.

## 4. Arquitetura

SPA estática, sem servidor.

### 4.1 Stack proposta

| Camada | Escolha | Motivo |
|---|---|---|
| Build | Vite + TypeScript | rápido, ecossistema PWA maduro |
| UI | React 18 | amplo suporte, ótima compatibilidade com Phosphor |
| Rotas | React Router, modo hash | funciona em hospedagem estática sem regras de rewrite |
| Estado | Zustand | pequeno, sem boilerplate |
| Persistência | IndexedDB via Dexie | notas, marcações, textos das versões |
| Configurações | localStorage espelhando o Zustand | leitura síncrona no boot evita flash de tema |
| Estilo | CSS Modules com custom properties, sem framework de UI | controle total sobre tipografia e temas |
| i18n | i18next + react-i18next | JSON por idioma com carregamento sob demanda |
| Ícones | `@phosphor-icons/react` | requisito, imports nomeados para tree-shaking |
| PWA | vite-plugin-pwa (Workbox) | manifesto, precache e atualização |
| Testes | Vitest, Testing Library, Playwright | unidade, componente, e2e |
| Deploy | GitHub Actions + GitHub Pages | publicação estática gratuita com HTTPS |

### 4.2 Camadas

```
UI (telas e componentes)
  └─ Hooks e stores (Zustand)
       └─ Serviços
            ├─ BibleRepository   catálogo, download, leitura de capítulo
            ├─ AnnotationService marcações e notas
            ├─ SettingsService   preferências
            └─ BackupService     exportar e importar
                 └─ Armazenamento: IndexedDB (Dexie) e localStorage
```

A UI nunca fala com fetch nem com Dexie direto. Isso permite trocar o provedor de dados (CDN hoje, arquivos próprios amanhã) sem tocar na interface.

### 4.3 Fluxo de dados da Bíblia

1. Usuário escolhe a versão. O `BibleRepository` verifica se ela está em IndexedDB.
2. Se não estiver, faz `fetch` do JSON, e um Web Worker valida a estrutura e divide em livros.
3. Cada livro é gravado em `bibleBooks` com chave `[versionId, abbrev]`. O JSON bruto é descartado.
4. O leitor lê apenas o livro necessário, sem parsear 4 a 14 MB a cada abertura.
5. Metadados (livros presentes, data do download, SHA da fonte) vão em `versions`.

### 4.4 Modelo de dados local

```ts
// IndexedDB
versions:       { id, lang, name, rtl, books: string[], bytes, sourceSha, downloadedAt }
bibleBooks:     { versionId, abbrev, name, chapters: string[][] }      // chave [versionId, abbrev]
highlights:     { key: "jo.3.16", color, versionId, createdAt, updatedAt }
notes:          { id: uuid, book, chapter, verseStart, verseEnd, text, versionId, createdAt, updatedAt }
meta:           { schemaVersion, ... }

// localStorage (espelho síncrono)
settings:       { uiLang, bibleLang, versionId, theme, font, fontSize, lineHeight, margins,
                  align, verseNumbers, textMode, layout }
position:       { versionId, book, chapter, verse }
```

Migrações com `db.version(n).upgrade()` do Dexie. Há um `schemaVersion` também no arquivo de backup.

### 4.5 Backup e portabilidade

Como não há nuvem, o usuário precisa de uma saída:

- Exportar: arquivo `bible-study-AAAA-MM-DD.json` com configurações, marcações e notas. Os textos bíblicos não vão no backup.
- Importar: valida o `schemaVersion` e oferece "mesclar" (vence o `updatedAt` mais recente) ou "substituir".
- `navigator.storage.persist()` é solicitado no primeiro uso para reduzir risco de limpeza pelo navegador.
- Lembrete discreto para exportar a cada 30 dias se houver notas.

### 4.6 Estrutura de pastas

```
/
├─ .github/workflows/ deploy.yml (build e publicação no Pages)
├─ public/            ícones, manifest, apple-touch
├─ scripts/           build-catalog.ts
├─ src/
│  ├─ app/            roteamento, providers, shell
│  ├─ features/
│  │   ├─ reader/     texto, troca de capítulo, seleção
│  │   ├─ navigator/  livros, capítulos
│  │   ├─ library/    idiomas, versões, downloads
│  │   ├─ study/      marcações e notas
│  │   ├─ settings/   leitura, idioma, dados
│  │   └─ install/    guia de instalação PWA
│  ├─ services/
│  ├─ db/
│  ├─ i18n/locales/   en, pt-BR, es, fr, de, zh-CN, ja
│  ├─ theme/          tokens e temas
│  └─ workers/        ingestão da versão
├─ tests/
└─ PLAN.md
```

## 5. Design

### 5.1 Princípios

"Simples" significa minimalista. Texto primeiro, interface mínima, mobile-first, toque confortável, acessível.

Regras do minimalismo:

- Uma barra superior fina com livro, capítulo e versão. Ela some ao rolar para baixo e volta ao rolar para cima ou ao tocar no topo da tela.
- Sem barras, rodapés ou painéis fixos além dessa. Navegação de capítulo por swipe, toque nas extremidades, setas do teclado e botões discretos no fim do capítulo.
- Todos os ajustes de leitura numa única folha inferior, sem submenus.
- Paleta quase monocromática. A única cor viva da interface são as 5 cores de marcação.
- Ícones Phosphor no peso `light` ou `regular`, sem rótulos de texto ao lado, exceto em menus.
- Sem modais desnecessários, sem onboarding longo, sem banners. Avisos viram toasts curtos.
- Tipografia como elemento principal de design: espaço em branco generoso e coluna de leitura limitada.

### 5.2 Telas

1. **Leitor** (principal). Barra superior fina e retrátil com título "Livro Cap" (abre o navegador), chip da versão (abre biblioteca), botão de ajustes de texto e atalho para Meu estudo. Sem barra inferior. Rolagem vertical dentro do capítulo; troca de capítulo por swipe, toque nas extremidades e dois botões discretos ao fim do capítulo.
2. **Navegador de livros e capítulos.** Abas AT e NT, grade de capítulos.
3. **Biblioteca.** Busca por idioma, lista de versões com selo de cobertura e estado (baixada, baixar, tamanho).
4. **Ajustes de texto.** Folha inferior com prévia: fonte, tamanho, linha, margens, tema, layout.
5. **Barra de ações do versículo.** Seleção, cores, nota, copiar, compartilhar.
6. **Editor de nota.** Folha inferior com referência no topo.
7. **Meu estudo.** Marcações e notas com filtros.
8. **Ajustes do app.** Idioma da UI, downloads, backup, sobre, instalar app.

Desktop: o mesmo layout centralizado com coluna de leitura limitada a cerca de 70 caracteres, painéis laterais no lugar de folhas inferiores.

### 5.3 Visual

- Tokens em CSS custom properties: cor de fundo, texto, destaque, 5 cores de marcação, raios, sombras e escala de espaçamento.
- Três temas completos, com contraste mínimo AA para texto e marcações.
- Fonte do app: sistema. Fonte de leitura: serifada empacotada (candidata: Literata, licença OFL) mais fallbacks por script.
- Animações curtas, respeitando `prefers-reduced-motion`.

### 5.4 Ícones Phosphor

Peso `light` por padrão e `fill` para estado ativo. Mapa inicial:

| Uso | Ícone |
|---|---|
| Livro/navegador | `BookOpenText` |
| Ajustes de texto | `TextAa` |
| Idioma/versão | `Translate` |
| Marcar | `Highlighter` |
| Nota | `NotePencil` |
| Copiar | `Copy` |
| Compartilhar | `ShareNetwork` |
| Capítulo anterior/próximo | `CaretLeft`, `CaretRight` |
| Meu estudo | `Notebook` |
| Download | `DownloadSimple`, `CloudCheck` |
| Backup | `Export`, `Upload` |
| Tema | `Sun`, `Moon`, `CircleHalf` |
| Excluir | `Trash` |
| Fechar | `X` |
| Instalar | `DeviceMobile` |

Todo ícone isolado tem `aria-label` traduzido.

### 5.5 Acessibilidade

Navegação por teclado, foco visível, ordem de leitura correta, `lang` e `dir` corretos no trecho bíblico, botões com 44 px de área mínima, escala de fonte respeitando o sistema, ações de seleção acessíveis sem gestos complexos.

## 6. Internacionalização da UI

- Idiomas: `en`, `pt-BR`, `es`, `fr`, `de`, `zh-CN`, `ja`. Mandarim em chinês simplificado. Ver D4.
- Chaves por namespace (`common`, `reader`, `library`, `study`, `settings`). Fallback para `en`.
- Datas e números com `Intl`. Plurais com o mecanismo do i18next.
- Nomes de idioma da Bíblia com `Intl.DisplayNames`, nunca traduzidos à mão.
- Nomes de livros vêm da própria versão, não do i18n.
- Textos iniciais gerados em en e pt-BR por mim, demais idiomas com tradução assistida e revisão sua. Script de CI falha se faltar chave em algum idioma.
- Fontes de sistema para zh e ja, sem empacotar fontes CJK.

## 7. PWA

- Manifesto: `name`, `short_name`, `id`, `start_url`, `scope`, `display: standalone`, cores de tema e fundo, ícones 192 e 512, ícone `maskable`, `apple-touch-icon` 180 px.
- Service worker com Workbox: precache do shell do app, `catalog.json` e locales. Textos das versões ficam em IndexedDB, não em cache de SW.
- Atualização: `registerType: 'prompt'`, com aviso "Nova versão disponível, atualizar".
- Android/Chrome: captura `beforeinstallprompt` e mostra botão "Instalar" em Ajustes.
- iOS/Safari: não há prompt. Mostra um guia ilustrado "Compartilhar > Adicionar à Tela de Início" quando detecta iOS fora do modo standalone. Metatags `apple-mobile-web-app-*` incluídas.
- Offline: o app abre sem rede. Versões não baixadas ficam desabilitadas com explicação.
- Observação sobre iOS: dados de sites usados no navegador podem ser limpos após cerca de 7 dias sem uso. App instalado na tela inicial não sofre esse limite do mesmo modo. Por isso o backup e o guia de instalação são parte do produto, não extras.
- Hospedagem exige HTTPS, que o GitHub Pages fornece.

### 7.1 Publicação no GitHub Pages

- Site de projeto serve o app em `https://<usuario>.github.io/<repo>/`. O Vite usa `base: '/<repo>/'`. Todo caminho (manifesto, ícones, service worker, `start_url`, `scope`) é relativo a essa base.
- Rotas em modo hash, então o refresh e links diretos funcionam sem regra de rewrite e sem `404.html` especial.
- Workflow `.github/workflows/deploy.yml`: em push na `main`, instala dependências, roda lint e testes, gera `catalog.json`, executa `vite build` e publica `dist/` com `actions/deploy-pages`. A fonte do Pages é configurada como "GitHub Actions".
- O service worker fica na raiz da base, com escopo cobrindo apenas o app.
- Domínio próprio é opcional e só exige trocar `base` para `/`.
- Cada deploy muda o hash do precache, então o aviso de atualização do item acima aparece para quem já instalou o app.

## 8. Qualidade

- **Unidade:** parser e validação do JSON, mapeamento de referências, regras de marcação e nota, merge de backup.
- **Componente:** barra de seleção, editor de nota, painel de ajustes.
- **E2E (Playwright):** baixar versão, ler, marcar, anotar, recarregar e conferir persistência, trocar de versão com livro ausente, trabalhar offline, importar e exportar.
- **Dados:** teste que baixa uma amostra de versões (completa, só NT, 64 livros, RTL, CJK) e valida estrutura.
- **PWA:** Lighthouse com meta de pontuação PWA completa, teste manual em Android e iOS reais.
- **Desempenho:** primeira carga do shell abaixo de 200 KB gzip, leitura de capítulo abaixo de 50 ms depois de baixado.

## 9. Fases

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 0 | Projeto Vite, lint, CI, tokens de tema, `build-catalog`, workflow do Pages | `catalog.json` gerado, app vazio publicado no GitHub Pages |
| 1 | Camada de dados e leitor básico | Ler qualquer capítulo de qualquer versão baixada, navegador de livros, posição salva |
| 2 | Biblioteca de idiomas e versões | Baixar, ver tamanho, remover, selos de cobertura, RTL |
| 3 | Tipografia e navegação por capítulo | Preferências de 3.8, swipe e toque nas extremidades (3.9), pré-carga de capítulos |
| 4 | Seleção, marcações, notas e Meu estudo | Regras 3.4 a 3.7 completas e persistentes, incluindo a tela Meu estudo |
| 5 | i18n | 7 idiomas, sem chaves faltando |
| 6 | PWA e deploy | Instalável em Android e iOS, offline, atualização, publicado no GitHub Pages por workflow |
| 7 | Backup, a11y, polimento, testes | Export/import, auditoria de acessibilidade, e2e verde |
| Depois | Busca, favoritos, versões em paralelo, planos, chinês tradicional | Fora do escopo desta aprovação |

## 10. Riscos

1. **Direitos autorais.** Muitas versões listadas são comerciais, por exemplo NIV, ESV, NLT, NVI, Amplified. O repo é MIT, mas o README diz que os textos são dos donos. Publicar um app que serve esses textos pode gerar problema legal. Ver D1.
2. **Dependência do repo e do CDN.** Mitigado com SHA fixado e fallback. Ainda assim, se o repo sumir, há risco. Alternativa é espelhar os arquivos em hospedagem própria.
3. **Qualidade dos dados.** Texto gerado por crawler, com possíveis erros de encoding e livros incompletos. O validador do worker rejeita arquivos malformados e o app mostra o aviso de cobertura.
4. **Numeração divergente.** Algumas versões divergem em capítulos e versículos, como Malaquias com 3 capítulos. Como as marcações são por referência, uma marcação pode cair em trecho diferente. Mitigado com o selo de versão de origem e o aviso na troca. Ver D2.
5. **Arquivos grandes.** Até 14,6 MB em redes móveis. Mitigado com compressão do CDN, progresso de download e armazenamento por livro.
6. **Persistência no iOS.** Descrita na seção 7.
7. **Fontes de escritas raras.** Birmanês, amárico, indianas, hebraico com pontuação. Depende de fontes de sistema, testar em dispositivos.

## 11. Decisões em aberto

| # | Pergunta | Recomendação |
|---|---|---|
| D1 | Listar todas as 141 versões ou só as de domínio público e licença livre no catálogo público? | Começar com todas para uso pessoal; para publicar, filtrar por uma lista `allowlist` fácil de editar |
| D2 | Marcações e notas valem para todas as versões da mesma referência, ou só para a versão em que foram criadas? | Todas as versões, com selo da versão de origem |
| D3 | Versões padrão por idioma | en_web, pt_nvi, es_rvr1960, fr_apee, de_sch1951, zh_cnvs, ja_jniv. Confirme ou troque |
| D4 | Mandarim: simplificado apenas, ou também tradicional na UI | Simplificado na v0 |
| D5 | Framework | React com Vite. Posso trocar por Svelte se preferir |
| D6 | Hospedagem | Decidido: GitHub Pages. Falta definir o nome do repositório, que vira parte da URL |
| D7 | Busca de texto entra na v0? | Não, fica para a fase seguinte |
| D8 | Nome do app e identidade visual | A definir; uso "Leitor" como nome de trabalho |
| D9 | Escopo da v0 | Decidido: inclui Meu estudo e troca de capítulo por swipe e toque nas extremidades. Não há paginação dentro do capítulo |
