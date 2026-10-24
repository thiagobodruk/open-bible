# Design review do Open Bible

Escopo: fluxos principais (leitura, navegação, busca) e onboarding. Público: leitores comuns, mobile primeiro. Restrições: minimalista, offline-first sem backend, UI em 7 línguas (todo texto novo precisa de chave nos 7 locales).

Método: código + app rodando (`npm run dev`) em 375x812 e 1280x800, pt-BR e de. Cada achado é **[Observado]** (visto ou medido no app), **[Inferido]** (lido no código) ou **[Calculado]** (contraste).

Não testado: zh, ja, fr, es, offline real, Android/iOS reais, teclado virtual, leitor de tela. O sépia só foi visto na tela de leitura.

## Resumo

A base é sólida e fiel ao minimalismo: leitor calmo, barra retrátil, Welcome com progresso e erros distintos, busca com referência direta (`jo 3:16`) e suporte a CJK, `prefers-reduced-motion` respeitado. Os problemas se concentram em:

1. **Qualidade da busca**: casa por substring ("amor" acha "amorreus"), corta em 200 resultados na ordem canônica (só Gênesis aparece), Enter não faz nada.
2. **Acessibilidade**: sheets não prendem o foco, o × some no mobile, versículos não são acessíveis por teclado/leitor de tela.
3. **Navegação**: grade de capítulos enorme (Salmos = 1812px), sem volta da leitura aos resultados, trocar de versão não devolve o leitor.
4. **Contraste e alvos de toque**: sépia abaixo de 4,5:1, número de versículo sutil entre 2,5 e 2,7:1, chips do topo com 32px.

## Aderência às heurísticas de Nielsen

| # | Heurística | Nota | Evidência |
|---|---|---|---|
| 1 | Visibilidade do estado | 4 | Chip "Gênesis 1 / NVI", `role=status` nos resultados, progresso no Welcome. Falta: capítulo atual no Navigator (M-07), mínimo de caracteres na busca (B-05). |
| 2 | Mundo real | 4 | Nomes dos livros vêm da versão, "Ir para João 3:16". Ruído em A-01. |
| 3 | Controle e liberdade | 3 | Esc/arrastar/scrim fecham. Falhas: sem × no mobile (A-04), Voltar do Android (A-06), busca perdida (M-05). |
| 4 | Consistência | 3,5 | Duas buscas com poderes diferentes (M-04), Biblioteca é rota e o resto é sheet (M-06), alvos 32px e 44px (A-03). |
| 5 | Prevenção de erros | 3,5 | Referência inválida ignorada, posição revalidada. Gesto bloqueado sem aviso (B-04). |
| 6 | Reconhecimento | 3 | Divisor AT/NT sem nome, setas laterais só no hover, hint de gesto só no mobile. |
| 7 | Flexibilidade | 3,5 | Bom: referência direta, teclado, bordas. Falta: Enter na busca (A-03b), "sal 23" no Navigator (M-04), retomar rolagem (M-03). |
| 8 | Estética minimalista | 4,5 | Interface quieta, temas bem resolvidos. Ruído: grade de 150 botões, grip no desktop. |
| 9 | Recuperação de erros | 3 | Falha do IndexedDB vira "capítulo não existe" (M-02). "Nenhum versículo" sem saída (B-05). |
| 10 | Ajuda | 3,5 | `searchEmptyHint` e dica de gesto. Sem dica de atalhos no desktop. |
| — | Acessibilidade | 2,5 | A-02 a A-05, M-01, M-07. |

## Achados

### Alta

- **A-01. Busca casa por substring, não por palavra** · H2 · `src/search.ts:78` · [Observado]. "amor" retorna "amorreus" primeiro. Correção: ranquear início/palavra inteira antes (regex `(^|[^\p{L}])termo` sobre o texto normalizado); CJK continua substring.
- **A-02. Truncamento em 200 na ordem canônica** · H1/H7 · `search.ts:58,90`, `SearchSheet.tsx:119` · [Observado]. Só o Gênesis aparece e o total não é informado. Correção: contar todos, "200 de N", "Mostrar mais" a cada 50; ranquear antes de cortar; filtro AT/NT opcional (`Segmented`).
- **A-03. Chips do topo com 32px** · Acessibilidade · `reader.css:19,23` · [Observado]. `crumb` 88x32, `ver-chip` 48x32. Correção: manter o visual e ampliar a área de toque com `::before { inset:-6px }`.
- **A-03b. Enter não faz nada na busca** · H7/H5 · `SearchField.tsx`, `SearchSheet.tsx:78-87` · [Observado]. Correção: Enter abre a referência reconhecida; senão `blur()` para recolher o teclado.
- **A-04. Sheets sem trava de foco e × oculto no mobile** · Acessibilidade/H3 · `Sheet.tsx:39-48,142-150`, `ui.css:47` · [Observado + Inferido]. Tab sai do sheet para o leitor atrás. Correção: `inert` no resto da página enquanto houver sheet modal; manter o × no DOM e focável no mobile.
- **A-05. Versículos sem teclado/leitor de tela** · Acessibilidade · `Reader.tsx:158-163,216-217` · [Inferido]. Correção: `role="button"`, `tabIndex`, `aria-pressed`, Enter/Espaço. Cuidado com 30 a 176 tab stops por capítulo.
- **A-06. Voltar do Android provavelmente sai do app** · H3 · `state/ui.ts:26-31`, `router.ts:19` · [Inferido]. Correção: `history.pushState` ao abrir sheet e fechar em `popstate`. Testar em aparelho.

### Média

- **M-01. Contraste** · `tokens.css:44`, `reader.css:64-65` · [Calculado]. `--muted` no sépia 4,26:1 (3,85:1 sobre surface); `.vn-subtle` 2,55 a 2,74:1. Correção: escurecer `--muted` do sépia (validar ≥4,5:1) e tirar o `opacity` do número sutil ou subir o corpo.
- **M-02. Erro de leitura vira "não existe nesta versão"** · H9 · `hooks.ts:59`, `Reader.tsx:209` · [Inferido]. Correção: estado `error` com "Tentar de novo" (2 chaves × 7).
- **M-03. Rolagem dentro do capítulo não é guardada** · H7 · `state/position.ts:8-14` · [Inferido]. Correção: guardar o versículo do topo e restaurar sem `flash`.
- **M-04. "sal 23" não funciona no Navigator** · H4 · `NavigatorSheet.tsx:22,42-58` · [Inferido]. Correção: reusar `parseReference` e mostrar "Ir para Salmos 23".
- **M-05. Abrir resultado descarta a busca** · H3 · `SearchSheet.tsx:32,62-67` · [Inferido]. Correção: guardar `q` e `scrollTop` num store; zerar ao trocar de versão.
- **M-06. Escolher versão não devolve o leitor** · H3/H4 · `Reader.tsx:179`, `Library.tsx:62-65` · [Inferido]. Correção: `back()` após `choose()`.
- **M-07. Navigator: grade enorme e sem contexto** · H6/H8 · `NavigatorSheet.tsx`, `screens.css:60-63` · [Observado]. Correção: 6 a 7 colunas com botões de 44px; divisor AT/NT nomeado; capítulo atual no título/linha fixa.
- **M-08. Scroll suave ignora reduced-motion** · `Reader.tsx:92` · [Inferido]. Correção: `behavior` conforme `matchMedia`.

### Baixa

- **B-01.** Grip do sheet visível no desktop (`ui.css:41,53-55`) · [Observado]. Esconder em ≥720px.
- **B-02.** Setas do leitor só no hover (`reader.css:33-35`). Opcional: hint de teclado uma vez no desktop.
- **B-03.** Zona de toque lateral (10vw) pode colidir com o gesto de voltar do iOS (`reader.css:27-32`). Testar em aparelho.
- **B-04.** Gesto de página some sem aviso com seleção ativa (`Reader.tsx:53-55`). Opcional: toast.
- **B-05.** Estados vazios da busca sem orientação (`SearchSheet.tsx:100-114`) · [Observado]. Mensagens de mínimo de caracteres e de zero resultado (2 chaves × 7).
- **B-06.** Biblioteca prioriza o idioma da UI, não o da leitura (`Library.tsx:51`) · [Observado].
- **B-07.** Imagem quebrada na splash em dev · [Observado em dev]. Confirmar no build antes de agir.
- **B-08.** Ícone de nota sem `role="img"` (`Reader.tsx:220`).

## O que está bom (não mexer)

Welcome (offline vs falha, `progressbar`), `readingVars` unificado, `lang`/`dir` por versão, reduced-motion global, `minChars` para CJK, topo só com ícones (resiste a strings longas), barra retrátil.

## Plano de ajuste

**Lote 1 · Busca** (M): A-01, A-02 (filtro AT/NT opcional), A-03b, B-05.
**Lote 2 · Acessibilidade e controle** (M): A-04, A-05, A-03, A-06, M-01, M-08, B-08.
**Lote 3 · Navegação** (M): M-07, M-04, M-05, M-06.
**Lote 4 · Robustez e polimento** (P a M): M-02, M-03, B-01, B-06 e demais baixos.

Antes de implementar: testar A-06, B-03 e o teclado virtual (A-03b) em aparelhos reais; revisar zh e ja.

Chaves i18n novas esperadas (todas em 7 locales): mínimo de caracteres, sem resultados com sugestão, "Mostrar mais", "N de M", estado de erro + "Tentar de novo", filtro AT/NT (se aprovado), rótulo do versículo.
