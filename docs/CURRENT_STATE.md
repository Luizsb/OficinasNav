# Estado atual — Oficinas NAVE

> Baseline congelado em 23/06/2026. Atualizado em 13/07/2026 (modo painel). Atualizar quando houver mudança relevante em fluxo, arquitetura ou regras.

## Resumo

Portal estático de roteiros pedagógicos para educadores, com uma oficina publicada e ferramenta interna de conversão DOCX → HTML em desenvolvimento.

## O que funciona

| Área | Estado | Observação |
|------|--------|------------|
| Site publicado | OK | GitHub Pages via push em `main` |
| Índice de oficinas | OK | `index.html` + `oficinas.json` |
| Oficina referência | OK | `oficinas/o-espelho-tecnologico/index.html` (HTML manual) |
| Design system | OK | `assets/css/nave.css`, `tailwind-config.js`, `nave.js` |
| Navegação modo painel | OK | Uma seção por vez; Anterior/Próxima/Concluir; hash + retomada por seção |
| Conclusão de oficina | OK | `localStorage` por slug; badge na home |
| Home redesenhada | OK | Hero NAVE, fases pedagógicas, cards com capa |
| Conversor DOCX | Parcial | Parser por marcadores NAVE; gera ZIP + HTML |
| Pré-visualização | Parcial | `preview.html` + `localStorage`; exige servidor local |
| README | OK | Como rodar e adicionar oficinas |

## O que está instável ou incompleto

| Item | Descrição |
|------|-----------|
| Conversor vs HTML manual | Saída automática ainda não equivale à oficina referência em layout e blocos complexos |
| Imagens `<inserir …>` | Placeholders no Word sem arquivo embutido não aparecem até copiar GIFs/PNG para `images/` |
| Tabelas / glossário | Conteúdo adicionado manualmente no HTML (ex.: apoio linguístico) não existe no `.docx` |
| `node_modules` em `tools/conversor/` | Resíduo de testes; não é necessário para rodar o conversor |
| Template Word no repo | `fonte/atividade-4-o-espelho-tecnologico.docx` — verificar se está versionado |

## Fluxos existentes

### Fluxo A — Consumir oficina (produção)

```
Educador → index.html → card da oficina → oficinas/{slug}/index.html → modo painel (uma seção por vez: #view, #prepare, …)
```

### Fluxo B — Publicar oficina manualmente

```
HTML + images/ → pasta oficinas/{slug}/ → entrada em oficinas.json → push main → GitHub Pages
```

### Fluxo C — Conversor DOCX (local)

```
.docx (template NAVE) → tools/conversor/index.html → parse → prévia / ZIP → revisão manual → Fluxo B
```

## Stack atual

- HTML5, Tailwind CSS (CDN), CSS/JS compartilhados
- JavaScript vanilla no conversor (JSZip via CDN)
- Sem build, sem backend, sem banco de dados
- Deploy: GitHub Actions → GitHub Pages

## Formato do template Word

O `.docx` NAVE **não usa estilos Título 1/2/3**. Usa marcadores:

- `[Título da oficina]`, `[Texto]`, `[x]` checkboxes, `[Quadro-resumo]` + tabela
- `[Etapa 1|2|3]`, `[Seção N] …`, `[Perguntas reflexivas]`, `[Elemento-chave]`, `[Dica]`
- `[Título] Nome da atividade`, etapas `1. …`, `<inserir arquivo.gif>`

Referência: `oficinas/o-espelho-tecnologico/fonte/atividade-4-o-espelho-tecnologico.docx`

## Riscos conhecidos

1. **Dependência de revisão manual** após conversão — prazo por oficina imprevisível
2. **Conhecimento do template** concentrado em quem formatou o Word
3. **Duplicação** de metadados (`oficinas.json` + bloco embutido em `index.html`)
4. **Prévia** depende de mesma origem/porta no servidor local

## Próxima change OpenSpec prioritária

`openspec/changes/calibrar-conversor-docx-nave/` — alinhar saída do conversor ao HTML de referência usando o `.docx` real.
