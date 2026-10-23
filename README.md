# Open Bible

Leitor de Bíblia minimalista, offline e sem conta. Roda no navegador e pode ser instalado como app no Android e no iOS.

**Demo:** https://thiagobodruk.github.io/open-bible/

> Status: **v0, protótipo visual.** Esta versão traz o app shell com conteúdo de exemplo para validar o look and feel. A camada lógica (leitura das versões reais, persistência, i18n) ainda não foi implementada. Veja o [PLAN.md](PLAN.md).

## O que é

- Leitura em rolagem vertical, um capítulo por "página". Troca de capítulo por swipe, toque nas extremidades ou setas do teclado.
- Todas as versões do repositório [thiagobodruk/bible](https://github.com/thiagobodruk/bible), em 85 idiomas, baixadas sob demanda.
- Fonte, tamanho, tema (claro, sépia, escuro), margens e disposição do texto configuráveis.
- Seleção de versículos, marcação em 5 cores, notas pessoais e a tela **Meu estudo**.
- Busca textual na versão atual, com atalho de referência ("jo 3:16").
- Interface em inglês, português (pt-BR), espanhol, francês, alemão, mandarim e japonês.
- Sem login e sem backend. Configurações, marcações e notas ficam no navegador, com exportação e importação em arquivo.
- Ícones [Phosphor](https://phosphoricons.com/).

## O que a v0 já tem

| Área | Estado |
|---|---|
| Leitor com barra retrátil, rolagem, swipe e toque nas bordas | Interativo, com texto de exemplo (KJV, domínio público) |
| Seleção de versículos, cores, nota, copiar, compartilhar | Interativo, em memória |
| Navegador de livros e capítulos | Interativo |
| Ajustes de texto e temas | Interativo, persistido no navegador |
| Meu estudo | Interativo, com dados de exemplo |
| Busca e atalho de referência | Interativo, sobre os 3 capítulos reais de exemplo |
| Biblioteca de idiomas e versões | Amostra do catálogo, download simulado |
| Ajustes do app e guia de instalação | Interativo |
| PWA (manifesto e service worker) | Configurado |

Tudo que depende de dados reais ou de persistência de marcações e notas entra na próxima etapa.

## Desenvolvimento

Requer Node 20 ou superior.

```bash
npm install
npm run dev       # servidor de desenvolvimento em http://localhost:5173/open-bible/
npm run build     # typecheck e build de produção em dist/
npm run preview   # serve o build em http://localhost:4173/open-bible/
```

## Stack

React 19, TypeScript, Vite, Zustand, `vite-plugin-pwa` (Workbox) e `@phosphor-icons/react`. Fontes Inter e Literata via Fontsource, empacotadas no build.

## Estrutura

```
src/
├─ components/   sheets, barra de seleção, toast
├─ screens/      Reader, Study (Meu estudo), Library, Settings
├─ data/         livros, capítulos de exemplo, amostra do catálogo
├─ state/        stores Zustand: configurações, estudo, biblioteca, UI
└─ styles/       tokens de tema e CSS por área
```

## Publicação

O deploy no GitHub Pages é feito pelo workflow `.github/workflows/deploy.yml` a cada push na `main`. O app é servido em `/open-bible/`, definido em `vite.config.ts` (`base`) e usado também pelo manifesto PWA.

Configuração única no repositório: **Settings > Pages > Build and deployment > Source: GitHub Actions**.

## Licença

Código sob [MIT](LICENSE). Os textos bíblicos pertencem aos respectivos detentores de direitos, conforme descrito em [thiagobodruk/bible](https://github.com/thiagobodruk/bible#whats-about-the-license-and-the-copyrights).
