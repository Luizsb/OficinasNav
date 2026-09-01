# Changelog de evidências

Registro verificável de mudanças relevantes (padrão D.N.E.E.).

Formato do cabeçalho de cada entrada:

```markdown
## AAAA-MM-DD · HH:MM — [Nome da mudança]
```

---

## 2026-09-01 · 16:15 — Busca e paginação no catálogo da home

### Contexto

Com 15 oficinas publicadas, a home ficava longa demais na rolagem e não havia forma rápida de localizar uma oficina pelo nome ou tema.

### O que mudou

- `index.html`: campo de busca no catálogo (título, subtítulo, id, faixa etária, duração e tags); filtro sem acentos; paginação de 6 itens por página integrada à busca; botão limpar.
- `assets/css/nave.css`: estilos da busca e da paginação alinhados ao toggle Cards/Lista.

### Como verificar

1. Abrir `index.html` na raiz do projeto.
2. Digitar termos como `arduino`, `IA` ou `hacker` — a lista filtra em tempo real.
3. Com mais de 6 resultados, conferir paginação e subtítulo com contagem.
4. Clicar no × ou em **Limpar busca** quando não houver resultados.

### Resultado

Catálogo navegável com busca e páginas curtas, sem rolagem excessiva.

---

## 2026-09-01 · 14:20 — Espaçamento do aviso global na Visão Geral

### Contexto

O bloco **Atenção!** injetado na Visão Geral aparecia colado às bordas do card, sem o padding do conteúdo ao redor.

### O que mudou

- `assets/js/nave.js`: o aviso passa a ser inserido dentro do container `.relative` (com `p-8 lg:p-12`), não como filho direto de `#view`.
- `assets/css/nave.css`: padding interno maior, gap entre parágrafos, tipografia `body-md` e leve sombra no card.

### Como verificar

1. Abrir qualquer oficina → **Visão Geral**.
2. O aviso deve alinhar ao texto/chips acima, com margem superior e respiro interno confortável.

### Resultado

Aviso visualmente integrado ao hero da oficina, sem colar nas bordas.

---

## 2026-09-01 · 13:45 — Aviso de oficinas digitais só na Visão Geral

### Contexto

O bloco **Atenção!** injetado por `initWorkshopNotice()` aparecia em todas as seções (Materiais, Preparar, Criar, etc.) ao navegar pela oficina.

### O que mudou

- `assets/js/nave.js`: o `<aside id="nave-workshop-notice">` passa a ser inserido **dentro** de `#view`, em vez de logo após a seção. O modo painel só alterna `<section>`; elementos soltos no `<main>` ficavam sempre visíveis.

### Como verificar

1. Abrir qualquer oficina em `/oficinas/…/index.html` (ex.: Tradutor de Dados).
2. Na **Visão Geral**: o aviso azul sobre oficinas digitais deve aparecer.
3. Ir para **Criar**, **Preparar** ou outra seção: o aviso **não** deve repetir no topo.

### Resultado

Aviso global restrito à etapa Visão Geral; demais seções sem duplicata.

---

## 2026-08-31 · 15:40 — Janela de código estilo macOS (Blink ESP32)

### Contexto

O sketch Blink na oficina *Cofre com ESP32* estava numa tabela, sem fonte monoespaçada nem forma de copiar o código.

### O que mudou

- Componente `.nave-code-window` (chrome com bolinhas vermelho/amarelo/verde, título, botão Copiar)
- Highlight simples (palavra-chave, função, número, comentário) em `nave.css`
- `initCodeWindows` em `nave.js` copia o texto do `<code>` (Clipboard API, com fallback)

### Como verificar

1. Abrir `http://localhost:3000/oficinas/cofre-com-esp32-autenticacao-e-maquina-de-estados/`
2. Ir a Preparar → Preparação da placa ESP32 → passo do Blink
3. Conferir a janela escura e o botão **Copiar**; colar noutro sítio e ver o sketch indentado

### Resultado

O código aparece como bloco de editor; copiar devolve o sketch, não HTML.

### Conclusão

**Sim** — bloco de código reutilizável (`data-nave-code-window`) na oficina do cofre.

---

## 2026-08-31 · 15:20 — Catálogo da home em lista ou cards

### Contexto

Com mais oficinas no catálogo, a lista em coluna única fica longa. Era preciso poder ver os itens em grade, sem perder o layout atual.

### O que mudou

- Toggle **Lista** / **Cards** em “Catálogo de oficinas”
- Cards: 1 coluna no celular, 2 a partir de 768px, 3 a partir de 1100px; capa do catálogo no topo do card
- Preferência gravada em `localStorage` (`nave-home-catalog-view`)

### Como verificar

1. Abrir `http://localhost:3000/`
2. Alternar Lista e Cards; recarregar e confirmar que o modo permanece
3. Em Cards, conferir 2 colunas em tablet e 3 no desktop; abrir um card continua levando à oficina

### Resultado

O educador escolhe a vista; a lista original permanece disponível.

### Conclusão

**Sim** — duas vistas no catálogo, com persistência local.

---

## 2026-08-31 · 15:16 — Cofre com ESP32 no catálogo da home

### Contexto

A pasta `oficinas/cofre-com-esp32-autenticacao-e-maquina-de-estados/` já existia após o envio pelo conversor, mas o card não aparecia na home: o catálogo só lista `oficinas.json` e o embed `#oficinas-data`.

### O que mudou

- Entrada do Cofre em `oficinas.json` e em `#oficinas-data` (`index.html`)
- Docs D.N.E.E. passam a registrar 4 oficinas no catálogo

### Como verificar

1. Abrir `http://localhost:3000/` (Ctrl+F5): devem aparecer 4 cards, inclusive o Cofre
2. Abrir o card e chegar em `oficinas/cofre-com-esp32-autenticacao-e-maquina-de-estados/index.html`

### Resultado

A oficina nova entra na home local. Para o site publicado, ainda é preciso subir pasta + catálogo no git.

### Conclusão

**Sim** — catálogo alinhado à pasta enviada pelo conversor.

---

## 2026-08-31 · 13:20 — Enviar para a home sempre atualiza o catálogo

### Contexto

A oficina *Semáforo Inteligente com Pedestre - Arduino* foi gravada em `oficinas/`, mas o card não aparecia na home: o catálogo só muda se `oficinas.json` (e o embed em `index.html`) forem atualizados. Escolher a pasta `oficinas` no conversor pulava esse passo.

### O que mudou

- Catálogo: entrada do Semáforo em `oficinas.json` e em `#oficinas-data`
- Conversor: depois de gravar a pasta, atualiza o catálogo; se a escolha foi `oficinas/`, pede a pasta OficinasNave (ou reusa a última raiz autorizada)

### Como verificar

1. Abrir `http://localhost:3000/` (Ctrl+F5): devem aparecer 3 cards, inclusive o Semáforo
2. Abrir o card e chegar em `oficinas/semaforo-inteligente-com-pedestre-arduino/index.html`

### Resultado

A oficina nova entra na home; o próximo **Enviar para a home** também registra o card.

### Conclusão

**Sim** — catálogo alinhado às pastas; conversor deixa de depender de escolher só a raiz.

---

## 2026-08-31 · 10:55 — Imagens não usadas removidas

### Contexto

A pasta `oficinas/recriando-a-realidade/images/` tinha duplicatas (png/gif/jpg do mesmo número) e um atalho, além de arquivos que o HTML não referencia.

### O que mudou

- Apagados 40 arquivos sem referência no HTML da oficina, em `oficinas.json` nem na home
- Mantidos 55 arquivos usados (incluindo `image3.png` da capa do catálogo)

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Percorrer as seções: nenhuma figura quebrada
3. Home: capa de *Recriando a realidade* continua visível

### Resultado

Só restam as imagens de fato usadas no código.

### Conclusão

**Sim** — pasta alinhada às referências do HTML e do catálogo.

---

## 2026-08-31 · 10:40 — Imagens menores em Primeira e Segunda criação

### Contexto

Nas seções *Primeira criação* e *Recriando a história* (acordeões da etapa Criar), as capturas de tela saíam em largura total demais.

### O que mudou

- 41 figuras desses acordeões passaram a `w-1/2` (metade da largura, centralizadas)
- Conversor gera o mesmo tamanho nos passos de oficina

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Criar → Primeira criação e Recriando a história: imagens com metade da largura

### Resultado

As capturas dos dois acordeões ficam menores e mais fáceis de percorrer.

### Conclusão

**Sim** — oficina local e conversor alinhados.

---

## 2026-08-31 · 10:35 — Atenção em etapas e Dica separada da tabela

### Contexto

O Atenção da estrutura saía numa lista única de bullets. A Dica (listagem de modelos) colava na tabela abaixo e os dois blocos se confundiam.

### O que mudou

- Atenção: **Etapa 1** e **Etapa 2** em negrito, cada uma com lista numerada (1, 2, 3…)
- Dica: margem inferior; tabela em card com borda e fundo próprios
- Conversor gera o mesmo padrão

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Criar → Atenção: duas etapas em negrito, passos numerados
3. Recriando a história → Escolher o tema: espaço claro entre Dica e a tabela

### Resultado

Estrutura do Atenção bate com o Word; Dica e tabela ficam visualmente distintas.

### Conclusão

**Sim** — oficina local e conversor alinhados.

---

## 2026-08-31 · 10:20 — Atenção fora de Primeira criação

### Contexto

O bloco *Atenção!* (estrutura sugerida da construção) estava dentro do acordeão *Primeira criação*. Ele descreve as duas etapas de Criar e deve aparecer antes dos acordeões.

### O que mudou

- Oficina: Atenção entre o texto de Criar e os acordeões *Primeira criação* / *Recriando a história*
- Conversor: Atenção pendente da etapa Criar vai para a oficina (`workshopSub.atencao`), não para o primeiro acordeão

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Seção Criar: o bloco Atenção aparece **antes** de *Primeira criação*
3. Abrir *Primeira criação*: começa em Passo a passo, sem o Atenção da estrutura

### Resultado

O educador vê a estrutura sugerida sem precisar abrir o primeiro acordeão.

### Conclusão

**Sim** — oficina local e conversor alinhados.

---

## 2026-08-31 · 10:15 — Embarque: passos 1 a 6 numerados

### Contexto

No Embarque de *Recriando a realidade*, os 6 passos saíam como bullets isolados (cada um numa `<ul>`), em vez da numeração 1–6 do Word.

### O que mudou

- Oficina: uma `<ol>` com os 6 passos; imagens 3 e 4 ficam dentro dos passos 1 e 3
- Conversor: listas do Embarque são ordenadas e contínuas; figura seguinte entra no último passo

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Preparar → Embarque: numeração 1 a 6, sem bullets

### Resultado

Os passos do Embarque aparecem como 1–6, com as figuras no passo correspondente.

### Conclusão

**Sim** — oficina local e conversor alinhados.

---

## 2026-08-31 · 10:10 — Dica 2: lojas em a/b com nome do app

### Contexto

Na dica 2 de Preparar (*Instale o Halo AR…*), o texto das lojas vinha num único parágrafo, com a URL visível ao lado do nome do app.

### O que mudou

- Oficina: intro + itens **a. Google Play** e **b. App Store**; o nome do app é o link; a URL não aparece no texto
- Conversor: subitens a/b (ou linhas Google Play/App Store) viram lista; o gerador esconde a URL e ancora o nome

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Preparar → Dicas de condução → item 2
3. Deve haver dois itens (a e b); clicar no nome do app abre a loja; nenhum `https://` visível no painel

### Resultado

Layout alinhado ao Word: lista a/b e link no nome do app.

### Conclusão

**Sim** — oficina local e conversor alinhados.

---

## 2026-08-31 · 10:00 — Perguntas reflexivas sem duplicata

### Contexto

No acordeão *Perguntas reflexivas* (Preparar e Refletir), cada pergunta aparecia duas vezes: o gerador HTML concatenava `sub.items` com a mesma lista em `sub.blocks`.

### O que mudou

- Conversor: deduplica as perguntas no parser e no `renderPerguntas`
- Oficina `oficinas/recriando-a-realidade/index.html`: listas com cada pergunta uma única vez

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Preparar → Perguntas reflexivas: 4 itens, sem repetição
3. Refletir → Perguntas reflexivas: 3 itens, sem repetição

### Resultado

O bloco mostra cada pergunta só uma vez; nova conversão do Word não deve duplicar.

### Conclusão

**Sim** — oficina local e conversor alinhados.

---

## 2026-08-31 · 09:50 — Materiais, Atenção, links e image1

### Contexto

Na oficina *Recriando a realidade*, o bloco Atenção colava no de Materiais; o trecho em negrito do Word saía como parágrafo comum; URLs (`canva.com`, `epicgames.com/id/register`, `sketchfab.com`) não eram clicáveis; `image1.png` quebrava porque o arquivo na pasta é `image1.gif`.

### O que mudou

- Espaço entre Materiais e Atenção (`mt-8`)
- Subtítulo em negrito e itens 1–2 como lista com links
- Conversor: `linkify` em domínios sem `https://`; imagem usa a extensão que existe na pasta (`gif`/`png`)

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html` (Ctrl+F5)
2. Seção Materiais: gap antes de Atenção; `canva.com` e `sketchfab.com` clicáveis
3. Atenção: título em negrito; links da Epic e do Sketchfab; figura visível (`image1.gif`)

### Resultado

Os três pontos da extração (espaço, negrito/links, imagem) passam a bater com o Word.

### Conclusão

**Sim** — oficina local corrigida; conversor evita o mesmo erro na próxima conversão.

---

## 2026-08-31 · 09:45 — Eixos da Nova BCCI em chips separados

### Contexto

Em *Recriando a realidade*, Mundo Digital e IA e Cultura Digital e Midiática saíam num único chip, sem listar a BNCC de cada eixo.

### O que mudou

- Parser guarda `meta.eixos` (nome + habilidades `EF…`)
- Gerador HTML cria **um chip por eixo**, expansível, com a BNCC na lista
- Oficina `oficinas/recriando-a-realidade/index.html` já atualizada

### Como verificar

1. Abrir `http://localhost:3000/oficinas/recriando-a-realidade/index.html`
2. Na visão geral, deve haver dois chips de eixo
3. Clicar em cada um: aparece EF07CO06 no primeiro e EF07CO11 no segundo

### Resultado

Os dois eixos ficam distintos, com a habilidade BNCC dentro de cada um.

### Conclusão

**Sim** — conversor e oficina local alinhados ao padrão da oficina modelo (chip + painel).

---

## 2026-08-31 · 09:35 — Recriando a realidade no catálogo da home

### Contexto

A pasta `oficinas/recriando-a-realidade/` já existia (envio do conversor), mas a home só lista o que está em `oficinas.json` e no bloco `#oficinas-data` de `index.html`. O envio tinha sido feito escolhendo a pasta `oficinas`, então o catálogo não foi atualizado.

### O que mudou

- Entrada de *Recriando a realidade* em `oficinas.json` e no embed da home
- Documentação D.N.E.E. alinhada a duas oficinas no catálogo

### Como verificar

1. `npm run dev` e abrir `http://localhost:3000/`
2. Conferir “2 oficinas disponíveis” e o card *Recriando a realidade*
3. Clicar em **Abrir oficina** e chegar em `oficinas/recriando-a-realidade/index.html`

### Resultado

A home passa a mostrar as duas pastas que já estavam em `oficinas/`.

### Conclusão

**Sim** — catálogo e pastas alinhados. Na próxima conversão, escolher a pasta **OficinasNave** (com `oficinas.json`) para o card entrar sozinho.

---

## 2026-08-31 · 10:15 — Conversor: Para ir além, pasta de imagens e envio flexível

### Contexto

No card **Para ir além**, dois títulos do Word (*Museu nos corredores* e *Realidades locais*) saíam como um único parágrafo. O botão **Enviar para a home** recusava a pasta `oficinas` e só aceitava a raiz com `index.html` e `oficinas.json` ao mesmo tempo. Faltava anexar a pasta de imagens da oficina.

### O que mudou

- Parser do quadro-resumo separa títulos em negrito (e o padrão “título + verbo”) em blocos no card e na seção Para ir além
- **Enviar para a home** aceita a pasta **OficinasNave** (com `oficinas.json`) **ou** a pasta **oficinas**
- Botão **Pasta de imagens** (e soltar arquivos de imagem na área do .docx) copia os arquivos para `oficinas/{slug}/images/`

### Como verificar

1. `npm run dev` e abrir `http://localhost:3000/tools/conversor/index.html` (Chrome ou Edge)
2. Enviar o .docx da Atividade 13 e, se quiser, a pasta `images`
3. Na prévia: o card Para ir além deve mostrar os dois títulos, não texto corrido
4. **Enviar para a home** → escolher `[NAVE] OficinasNave` (recomendado) ou a pasta `oficinas`
5. Conferir `oficinas/{slug}/` no editor e o card na home (quando a raiz foi a pasta escolhida)

### Resultado

O fluxo local fica: converter → gravar na pasta das oficinas → editar o HTML depois.

### Conclusão

**Sim** — extração dos títulos do card e gravação no disco deixam de exigir exatamente a combinação antiga de arquivos na pasta escolhida.

---

## 2026-08-31 · 09:15 — Home no npm run dev e envio do conversor para o catálogo

### Contexto

`npm run dev` (`npx serve`) listava o diretório (`Index of [NAVE] OficinasNave/`) em vez de abrir o site: colchetes no nome da pasta são tratados como glob. Em paralelo, o conversor só gerava ZIP; faltava gravar a oficina no repositório no formato da oficina modelo.

### O que mudou

- `npm run dev` passa a usar `scripts/dev-server.js` (fs.stat, serve `index.html` na raiz)
- `serve.json` desliga a listagem de pasta se alguém ainda usar `npx serve`
- Botão **Enviar para a home** no conversor: File System Access API grava `oficinas/{slug}/` (`index.html`, `images/`, `fonte/`) e atualiza `oficinas.json` + embed em `index.html`

### Como verificar

1. Parar o servidor antigo; na raiz, `npm run dev`
2. Abrir `http://localhost:3000/` — deve aparecer a home NAVE, não a lista de arquivos
3. Abrir `http://localhost:3000/tools/conversor/index.html`, converter um `.docx`
4. Clicar **Enviar para a home**, escolher a pasta do repositório
5. Confirmar o card na home e a pasta `oficinas/{slug}/` no editor

### Resultado

A home abre pelo `npm run dev`. A oficina convertida entra no catálogo em disco para revisão no código.

### Conclusão

**Sim** — listagem de diretório corrigida no fluxo `npm run dev`; publicação local via botão, sem backend.

---

## 2026-08-31 · 09:05 — Parser do conversor no template atual de Word

### Contexto

O `.docx` *Atividade 13 — Recriando a realidade* usa marcadores novos (`[card]`, `[text]`, `[acordeon]`, `[check-list]`, `[imagem N] <img>`). O parser só entendia o template legado (`[Texto]`, `[Seção N]`), então as chaves apareciam no HTML e o conteúdo não ia para Preparar / Criar / Refletir.

### O que mudou

- `docx-parser.js` reconhece o template atual e o legado; marcadores estruturais não viram parágrafo
- Metadados a partir de `[público-alvo]`, duração e eixos; quadro-resumo pela tabela Etapa/Tempo
- `[Etapa 4]` vira seção Para ir além; `[acordeon]` vira perguntas, elemento-chave e dicas
- `[imagem N] <img>arquivo.png</img>` entra em `images/`; bloco `[Atenção!]` em materiais
- Ajuda do conversor e spec `conversor-docx` atualizados

### Como verificar

1. Abrir `http://localhost:3000/tools/conversor/index.html` (reiniciar `npx serve` se ainda estiver o processo antigo)
2. Enviar o `.docx` da Atividade 13 (Realidade Aumentada)
3. Conferir metadados: título *Recriando a realidade*, público e duração
4. Na prévia HTML: **não** deve aparecer `[card]`, `[text]` nem `[acordeon]`
5. Deve haver seções Materiais, Preparar (Apresentação, perguntas, dicas, Embarque), Criar (accordions), Refletir e Para ir além

### Resultado

Estrutura da oficina sai dividida nas seções do site; chaves de produção deixam de vazar no conteúdo.

### Conclusão

**Parcial** — revisão humana ainda é esperada (layout fino, grade de imagens, notas DIGI). A conversão deixa de colapsar tudo na visão geral.

---

## 2026-08-31 · 08:50 — Conversor e imagens locais no npx serve

### Contexto

Com `npx serve .`, o conversor DOCX não aceitava upload: `html-generator.js` e `app.js` retornavam 404. O `serve` redirecionava `/tools/conversor/index.html` para `/tools/conversor` (sem barra), e os scripts relativos iam para `/tools/js/` em vez de `/tools/conversor/js/`. O mesmo padrão quebrava imagens da oficina (`/oficinas/images/…`).

### O que mudou

- `serve.json` na raiz: `cleanUrls: false` e `trailingSlash: true`
- Conversor define `<base>` conforme o pathname, para scripts funcionarem mesmo em URL sem `.html`
- Mensagem de erro visível se os scripts do conversor não carregarem
- `npm run dev` passa a subir o servidor estático

### Como verificar

1. Na raiz: `npx serve .` (reiniciar se já estava rodando, para ler `serve.json`)
2. Abrir `http://localhost:3000/tools/conversor/index.html`
3. Confirmar no DevTools que `js/docx-parser.js`, `js/html-generator.js` e `js/app.js` retornam 200
4. Selecionar um `.docx` na zona de envio e ver metadados/prévia
5. Abrir a oficina referência e confirmar que as imagens em `oficinas/o-espelho-tecnologico/images/` carregam

### Resultado

Upload do conversor volta a funcionar no servidor local Node; caminhos relativos das oficinas deixam de 404 por causa do clean URL.

### Conclusão

**Sim** — 404 causado pelo `npx serve`, não pela lógica de conversão.

---

## 2026-07-17 · 13:27 — Para ir além como última etapa

### Contexto

“Para ir além” continuava indicada como opcional, mas o botão de Refletir concluía a oficina e desviava o educador antes dessa seção.

### O que mudou

- Refletir agora exibe **Próxima** e avança para “Para ir além” quando a seção existe
- **Concluir** aparece somente na última etapa disponível
- A barra considera “Para ir além” na contagem sequencial, mantendo a indicação “opcional”
- Removido o segundo atalho redundante “Para ir além (opcional)” do rodapé
- Atualizados SDD e ROADMAP

### Como verificar

1. Abrir a oficina e navegar até **Refletir**
2. Clicar em **Próxima** e confirmar a abertura de **Para ir além**
3. Confirmar que **Concluir** aparece nessa última etapa
4. Em uma oficina sem `#beyond`, confirmar que **Concluir** permanece em Refletir

### Resultado

O fluxo principal percorre todas as seções disponíveis antes da conclusão; “Para ir além” permanece sinalizada como opcional na interface.

### Conclusão

**Sim** — última etapa e conclusão alinhadas ao uso pedagógico solicitado.

---

## 2026-07-15 · 15:05 — Organização inicial D.N.E.E.

### Contexto

Projeto já tinha código e docs soltos (`CURRENT_STATE`, `COMECAR_AQUI`, `EVIDENCES`, discovery). Foi pedido aplicar a arquitetura D.N.E.E. com mapeamento prévio da realidade (Raio-X) e reorganização dos documentos.

### O que mudou

- Criado `.cursorrules` exigindo fluxo Discovery → Norte → Evidências → Execução, formato de evidências e diagramas em `<details>`
- Criados / reescritos: `docs/SOBRE.md`, `docs/SDD.md`, `docs/ROADMAP.md` (débitos do Raio-X em checkboxes)
- Criado `docs/visao-projeto.html` (abas Sobre, Norte, Roadmap, Evidências; Sobre como padrão)
- Criado este arquivo `docs/CHANGELOG_EVIDENCES.md`
- Removidos docs legados substituídos: `CURRENT_STATE.md`, `COMECAR_AQUI.md`, `EVIDENCES.md`, `DECISIONS.md`, pasta `docs/discovery/`
- README apontando para o novo pacote documental

### Como verificar

1. Abrir `docs/SOBRE.md`, `docs/SDD.md`, `docs/ROADMAP.md`, `.cursorrules`
2. Na raiz do repo: `npm run docs:serve` e abrir `http://localhost:3000/docs/visao-projeto.html` (aba Sobre ativa por padrão)
3. Confirmar ausência dos arquivos legados listados acima em `docs/`

### Resultado

Baseline documental alinhado ao código; porta de entrada de negócio e painel visual prontos; débitos do Raio-X rastreados no ROADMAP.

### Conclusão

**Sim** — organização D.N.E.E. aplicada sobre o estado real do projeto.

---

## 2026-07-13 · 12:00 — Release v0.2.0 e refinamentos da oficina (código)

### Contexto

Evolução do site estático: navegação por painéis, conclusão manual, conversor v1, ajustes de UI da oficina e da home.

### O que mudou (resumo)

- Mode painel, footer Anterior/Próxima/Concluir, progresso na home
- Tag Opcional no menu “Para ir além”; títulos neutros; correção de bordas do hero
- Scroll ao trocar accordions de atividade; conversor em `tools/conversor/`
- Tag `v0.2.0` no Git

### Como verificar

- Git tag `v0.2.0` / commits em `main` a partir de `9b917ce`
- Oficina `oficinas/o-espelho-tecnologico/index.html` + `assets/js/nave.js`

### Resultado

Oficina referência utilizável em produção Pages; conversor ainda parcial.

### Conclusão

**Parcial quanto ao conversor** — produto de consumo OK; calibração DOCX pendente (ver ROADMAP).

---

## 2026-06-23 · 10:00 — Baseline documentado e conversor v1

### Contexto

Necessidade de acelerar publicação de oficinas a partir de Word com template NAVE.

### O que mudou

- Ferramenta `tools/conversor/` (parser de marcadores, ZIP, prévia)
- Primeira camada documental OpenSpec + SDD antigo

### Como verificar

- Pasta `tools/conversor/`
- Change `openspec/changes/calibrar-conversor-docx-nave/`

### Resultado

Primeira passagem útil; paridade com HTML manual incompleta.

### Conclusão

**Parcial** — infraestrutura entregue; calibração segue no ROADMAP.
