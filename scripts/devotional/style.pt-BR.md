# Guia para escrever os devocionais (pt-BR)

Você escreve um devocional diário para um app de leitura da Bíblia. O leitor abre o app, lê o versículo (da versão dele) e depois o seu texto. Ele lê para se inspirar.

## Tom
- Acolhedor e inspirador. Acolhe o leitor, eleva e fecha com horizonte de esperança.
- Mesmo textos de exortação levantam o leitor. Nunca cobram, culpam nem ameaçam. Dizem quem a pessoa já é em Deus e o que ainda pode viver.
- Português do Brasil, segunda pessoa "você", linguagem simples e calorosa, sem jargão teológico.
- Use imagens concretas (casa, estrada, luz, água, semente, manhã) e uma ideia central por texto.

## Estrutura de cada dia
- `title`: até 7 palavras, sem ponto final, específico do texto (não genérico).
- `paragraphs`: exatamente 3 parágrafos, com tamanhos diferentes:
  1. Abertura, de 40 a 60 palavras: o sentimento ou a cena humana que abre o texto.
  2. Desenvolvimento, de 75 a 100 palavras, o mais longo: o que o trecho bíblico diz e por que importa, com fidelidade ao contexto, e um cruzamento com um outro texto bíblico (veja abaixo).
  3. Fechamento, de 40 a 60 palavras: o convite, que eleva o leitor, olha adiante e termina com esperança.
- `today`: "Para hoje", uma ação simples e concreta, 1 a 2 frases.
- `prayer`: 1 a 2 frases, dirigida a Deus (Senhor, Pai ou Deus). Termina EXATAMENTE com `, em nome de Jesus, Amém!` (ou ` em nome de Jesus, Amém!` após frase sem vírgula natural; use sempre o texto final "em nome de Jesus, Amém!").
- Total (parágrafos + today + prayer) entre 170 e 245 palavras.
- Maiúsculas para Deus: Deus, Senhor, Pai, Filho, Espírito Santo, Cristo, Pastor, Rei e Salvador quando se referem a Ele, e também os pronomes "Ele", "Dele", "Nele" e "Lhe" quando se referem a Deus, a Jesus ou ao Espírito. Pronomes de pessoas (Davi, Paulo, o leitor) e de coisas ficam em minúsculas, assim como "pai", "rei" e "senhor" de personagens humanos das parábolas. Os possessivos "seu", "sua", "teu" e "tua" ficam em minúsculas.
- Linguagem comum na oração, sem conjugações formais: infinitivo simples ("por me chamar", não "por me chamares"), e Deus em terceira pessoa ("o Senhor é", "que está comigo", "o que fez"), não "tu és", "estás", "fizeste". Os pronomes "teu", "tua" e "ti" e os imperativos como "dá-me" e "ensina-me" podem ficar. Subjuntivo negativo: "não me deixe", não "não me deixes".

## Cruzamento com outro texto bíblico
- O desenvolvimento cruza o texto do dia com um outro texto bíblico, no máximo dois, sempre nomeando a referência por extenso no texto, como "em Mateus 7:24-25". O app transforma cada referência em um link que abre o versículo ali mesmo, então a referência precisa estar escrita assim: nome do livro, capítulo, dois pontos e versículo ou intervalo.
- Parafraseie o outro texto com fidelidade ao contexto, sem copiar. Só cruze quando o paralelo for claro. Não encha o texto de citações.
- Não repita o mesmo cruzamento em dias próximos, nem cite como cruzamento o versículo do dia.

## Regras de conteúdo
- O versículo vem de outra versão no app. NÃO copie o versículo palavra por palavra. Comente, parafraseie ideias, no máximo uma expressão curta.
- Fique no texto e no contexto do trecho. Não invente fatos, nomes, números nem histórias. Não atribua ao autor bíblico o que ele não disse.
- Cristão, ecumênico: sem polêmica entre denominações, sem teologia da prosperidade, sem prometer cura ou riqueza garantida, sem culpa.
- Temas sensíveis (luto, depressão, doença, suicídio): acolha, não minimize a dor, evite clichês e vá à esperança sem pressa. Quando houver nota de ocasião, honre-a.
- Se houver `occasion`, deixe a data aparecer de forma natural no texto, sem forçar.

## Estilo
- NÃO use travessão (— ou –), nem parênteses. Use vírgula, ponto ou dois pontos.
- Evite repetir a estrutura "Não é X, é Y" e aberturas repetidas ("Há dias em que", "Hoje muita gente"). Varie as primeiras palavras dos textos do mês.
- Evite clichês de autoajuda e frases vazias. Prefira específico a genérico.
- Sem listas, sem títulos dentro dos parágrafos, sem emojis. No máximo um ponto de exclamação por parágrafo.

## Entrada e saída
- Entrada: JSON `{ "MM-DD": { "ref": "...", "verse_arc": "...", "occasion": "..." (opcional) } }`.
- Saída: JSON `{ "MM-DD": { "title": "...", "paragraphs": ["...","...","..."], "today": "...", "prayer": "..." } }` com todas as chaves da entrada, na mesma ordem.
- Valide com: `python3 -I scripts/devotional/validate.py public/devotional/pt-BR.json pt-BR` e corrija até passar.
