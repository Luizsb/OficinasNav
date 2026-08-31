# Oficinas NAVE

Guias de condução interativos para educadores, publicados como site estático. Cada oficina reúne o roteiro completo de uma atividade — **Preparar**, **Materiais**, **Criar** e **Refletir** — com navegação lateral, accordions, imagens e dicas de condução.

O projeto não usa framework de front-end nem servidor de aplicação: são páginas HTML que podem ser abertas em qualquer navegador ou publicadas no **GitHub Pages**.

---

## Documentação do projeto (D.N.E.E.)

| Documento | Quando ler |
|-----------|------------|
| [docs/SOBRE.md](docs/SOBRE.md) | **Primeiro** — porta de entrada de negócio |
| [docs/visao-projeto.html](docs/visao-projeto.html) | Painel visual (Sobre, Norte, Roadmap, Evidências) |
| [docs/SDD.md](docs/SDD.md) | Estado técnico real + regras inquebráveis |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Débitos e entregas (checkboxes) |
| [docs/CHANGELOG_EVIDENCES.md](docs/CHANGELOG_EVIDENCES.md) | Log de mudanças verificáveis |
| [openspec/changes/calibrar-conversor-docx-nave/tasks.md](openspec/changes/calibrar-conversor-docx-nave/tasks.md) | Checklist da calibração do conversor |

Regras do agente: [`.cursorrules`](.cursorrules). Para o painel D.N.E.E.: `npm run docs:serve` e abra `http://localhost:3000/docs/visao-projeto.html` (evite `file://`).

---

## O que é

As oficinas são roteiros pedagógicos da NAVE voltados a aplicação em sala de aula. O educador acessa o site, escolhe a oficina no índice e percorre o conteúdo por seções:

| Seção | Função |
|-------|--------|
| **Visão geral** | Contexto, público-alvo, duração e estrutura da oficina |
| **Preparar** | Apresentação, perguntas reflexivas, elemento-chave, dicas e embarque |
| **Materiais** | Lista de materiais com checkboxes (marcação salva no navegador) |
| **Criar** | Passo a passo e atividades em accordions |
| **Refletir** | Socialização, perguntas finais e extensões |

A oficina de referência é **O Espelho tecnológico** (`oficinas/o-espelho-tecnologico/`).

---

## Tecnologias

| Camada | Tecnologia | Uso |
|--------|------------|-----|
| Marcação | HTML5 | Páginas estáticas de cada oficina |
| Estilo | [Tailwind CSS](https://tailwindcss.com) (CDN) | Layout, tipografia utilitária, responsividade |
| Design system | `assets/js/tailwind-config.js` | Cores e tokens NAVE (primary, prepare, secondary, etc.) |
| CSS customizado | `assets/css/nave.css` | Padrões visuais, lightbox, navegação ativa, cards |
| Interação | `assets/js/nave.js` | Modo painel por seção, lightbox, retomada de leitura, checkboxes persistentes |
| Ícones | [Material Symbols](https://fonts.google.com/icons) | Ícones da interface |
| Fonte | [Lexend](https://fonts.google.com/specimen/Lexend) | Tipografia principal |
| Índice | `oficinas.json` | Lista de oficinas exibida na página inicial |
| Publicação | GitHub Actions + GitHub Pages | Deploy automático ao enviar para `main` |
| Conversor (ferramenta interna) | JavaScript + JSZip | Converte `.docx` do template NAVE em HTML (`tools/conversor/`) |

**Não há** Node.js, React, Vue ou processo de build obrigatório para rodar o site das oficinas.

---

## Estrutura do repositório

```
OficinasNave/
├── index.html                 # Página inicial (lista de oficinas)
├── oficinas.json              # Metadados das oficinas (título, tags, link)
├── assets/
│   ├── css/nave.css           # Estilos compartilhados
│   ├── js/
│   │   ├── nave.js            # Comportamentos comuns
│   │   └── tailwind-config.js # Paleta e tokens Tailwind
│   └── images/                # Logo e ícones NAVE
├── oficinas/
│   └── nome-da-oficina/
│       ├── index.html         # Roteiro completo da oficina
│       ├── images/            # Figuras e GIFs da oficina
│       └── fonte/             # Documento .docx original (opcional)
├── tools/
│   └── conversor/             # Ferramenta DOCX → HTML (uso local)
├── docs/                      # SDD, estado atual, decisões, evidências
├── openspec/                  # Specs e changes (metodologia D.N.E.E.)
└── .github/workflows/
    └── pages.yml              # Pipeline de deploy
```

---

## Como rodar localmente

O site é estático. Para uma experiência fiel à produção (caminhos relativos, `fetch` do `oficinas.json`), use um servidor local simples na raiz do projeto.

### Opção 1 — Python (recomendado)

```bash
# Na pasta do repositório
python -m http.server 8080
```

Abra no navegador: [http://localhost:8080](http://localhost:8080)

### Opção 2 — Node (`npm run dev`)

```bash
npm run dev
```

Abra no navegador: [http://localhost:3000](http://localhost:3000)

Este comando usa `scripts/dev-server.js`. **Não use `npx serve`** nesta pasta: com o `serve.json` antigo ele lista arquivos ou devolve 404 em vez da home.

Se ainda quiser o `npx serve`, o `serve.json` precisa de `cleanUrls` + `trailingSlash` ligados (senão a raiz não abre o `index.html`). Prefira `npm run dev`.

### Opção 3 — VS Code / Cursor

Extensão **Live Server**: clique com o botão direito em `index.html` → *Open with Live Server*.

### Painel de documentação (`docs/visao-projeto.html`)

O painel D.N.E.E. (abas Sobre, Norte, Roadmap e Evidências) precisa ser servido por **HTTP local** — aberto direto pelo arquivo (`file://`), os diagramas Mermaid e as fontes via CDN podem falhar (a própria página exibe um aviso).

Passo a passo:

```bash
# Na raiz do repositório
npm run docs:serve
```

Depois abra no navegador:

```
http://localhost:3000/docs/visao-projeto.html
```

Alternativa sem Node (usando o servidor Python da Opção 1):

```
http://localhost:8080/docs/visao-projeto.html
```

A aba **💡 Sobre o projeto** abre por padrão; os documentos canônicos em Markdown ficam em `docs/` (o HTML é apenas a vista visual).

### Conversor DOCX

Abra diretamente no navegador (com o servidor local acima):

```
http://localhost:8080/tools/conversor/index.html
```

Se estiver usando `npx serve` (porta 3000):

```
http://localhost:3000/tools/conversor/index.html
```

O conversor processa o arquivo `.docx` **no próprio navegador** (nada é enviado a servidor externo). Envie o documento e, se quiser, a pasta de imagens. Revise a prévia e use **Enviar para a home** (Chrome/Edge): escolha a pasta **OficinasNave** (a que contém `oficinas.json`) — recomendado para o card aparecer na home — ou a pasta **oficinas**. O conversor grava `oficinas/{slug}/` no formato da oficina modelo (`index.html`, `images/`, `fonte/`). Depois abra os arquivos no editor para os ajustes finos. Alternativa: baixar o ZIP.

---

## Publicação (GitHub Pages)

O workflow `.github/workflows/pages.yml` publica o conteúdo da branch `main` automaticamente no GitHub Pages.

1. Faça commit e push para `main`
2. Em **Settings → Pages** do repositório, confirme que a fonte é **GitHub Actions**
3. Após o workflow concluir, o site fica disponível na URL do Pages do repositório

Não é necessário comando de build: o artefato publicado é o próprio conteúdo do repositório.

---

## Adicionar uma nova oficina

### Manualmente

1. Crie a pasta `oficinas/slug-da-oficina/`
2. Adicione `index.html` (use `oficinas/o-espelho-tecnologico/index.html` como modelo)
3. Coloque imagens em `oficinas/slug-da-oficina/images/`
4. Registre a oficina em `oficinas.json`:

```json
{
    "id": "slug-da-oficina",
    "titulo": "Título da oficina",
    "subtitulo": "Descrição curta",
    "arquivo": "oficinas/slug-da-oficina/index.html",
    "capa": "oficinas/slug-da-oficina/images/capa.png",
    "icone": "face",
    "ano": "7º ano EFAF",
    "duracao": "90 min",
    "tags": ["Scratch", "Pensamento Computacional"]
}
```

Campos opcionais em `oficinas.json`: `icone` (Material Symbol no card). O progresso e o destaque **Continuar** são calculados automaticamente via `localStorage`.

5. Atualize também o bloco embutido em `index.html` (`<script id="oficinas-data">`) ou confie no `fetch` de `oficinas.json` em produção.

### Pelo conversor DOCX

1. Use o template Word NAVE
2. Rode `npm run dev` e abra `http://localhost:3000/tools/conversor/index.html`
3. Envie o `.docx` e, se houver, a pasta `images` da oficina; revise a prévia
4. Clique em **Enviar para a home** e escolha a pasta **OficinasNave** (recomendado, a que contém `oficinas.json`) ou a pasta **oficinas**
5. O conversor grava `oficinas/{slug}/index.html`, `images/` e `fonte/`; na raiz, também atualiza o catálogo
6. Abra os arquivos no editor e ajuste o que ainda precisar (layout fino, imagens, textos)

Alternativa sem permissão de pasta: baixe o ZIP e copie `oficinas/slug/` manualmente.

O template Word usa **marcadores entre colchetes**, por exemplo:

- `[Título da oficina]`, `[Texto]`, `[Quadro-resumo]`
- `[Etapa 1]`, `[Etapa 2]`, `[Etapa 3]`
- `[Seção 1] Apresentação`, `[Perguntas reflexivas]`, `[Elemento-chave]`
- `[Título] Nome da atividade` e etapas `1. …`, `2. …` na seção Criar

---

## Funcionalidades do site (por oficina)

- **Modo painel:** menu lateral (desktop) e barra inferior (mobile) mostram uma seção por vez
- Indicador de progresso e botões Anterior / Próxima no rodapé do conteúdo
- Botão **Concluir** na última seção (Refletir) — modal com opção de ir à home ou continuar na oficina
- Badge **Oficina concluída** nos cards da página inicial (`localStorage`)
- URL com hash por seção (`#prepare`, `#create`, …) — compartilhável e compatível com voltar do navegador
- Lightbox com zoom nas imagens do roteiro
- Botão “voltar ao topo” (útil dentro de seções longas)
- Retomada de leitura (última seção visitada salva no `localStorage`)
- Checkboxes de materiais persistentes por oficina
- Links externos abertos em nova aba

---

## Licença e créditos

Conteúdo pedagógico © NAVE. Código e estrutura do site para uso interno e publicação das oficinas do programa.
