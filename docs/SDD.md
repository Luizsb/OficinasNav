# SDD — Oficinas NAVE

Documento norte do produto. Versão inicial: 23/06/2026.

## 1. Visão geral

**Oficinas NAVE** é um site estático que publica roteiros pedagógicos interativos para educadores aplicarem oficinas em sala de aula, com estrutura padronizada (Preparar, Materiais, Criar, Refletir) e identidade visual NAVE.

## 2. Problema e contexto

- Oficinas chegam em **Word (.docx)** com template institucional
- Publicar manualmente em HTML é **lento** e exige quem conhece o layout
- Educadores precisam de roteiro **claro, navegável e responsivo** (desktop e mobile)

## 3. Público impactado

| Público | Uso |
|---------|-----|
| Educadores | Ler e conduzir oficinas |
| Equipe NAVE / conteúdo | Converter e publicar novas oficinas |
| Gestão | Acompanhar escala de publicação |
| Mantenedores / IA | Evoluir site e conversor |

## 4. Objetivos

1. Publicar oficinas com experiência consistente
2. Reduzir tempo de conversão Word → HTML
3. Manter rastreabilidade (fonte `.docx`, specs, evidências)
4. Permitir evolução sem reescrever o site inteiro

## 5. Fora de escopo (v1)

- CMS ou painel administrativo
- Login / contas de usuário
- Build pipeline (Webpack, Vite, etc.)
- Conversão 100% automática sem revisão humana
- App mobile nativo

## 6. Fluxos principais

Ver `docs/CURRENT_STATE.md` — Fluxos A, B e C.

## 7. Regras de negócio

1. Toda oficina publicada deve ter: `index.html`, pasta `images/` (se houver mídia), entrada em `oficinas.json`
2. Seções obrigatórias na página: Visão geral, Preparar, Materiais, Criar, Refletir
3. Assets compartilhados ficam em `assets/` — oficinas referenciam via `../../assets/`
4. Template Word deve seguir marcadores NAVE documentados
5. Conteúdo pedagógico prevalece sobre automação — revisão humana é aceita e esperada na v1

## 8. Arquitetura e stack

```
index.html ──► oficinas.json
     │
     └──► oficinas/{slug}/index.html
              ├── ../../assets/ (css, js, logo)
              └── images/ (por oficina)

tools/conversor/  (uso local, não publicado como produto separado)
  ├── index.html
  ├── preview.html
  └── js/ (parser, generator, app)
```

## 9. Dados e entradas/saídas

| Entrada | Saída |
|---------|--------|
| `.docx` template NAVE | ZIP: `oficinas/{id}/index.html`, `images/`, `fonte/` |
| Metadados da oficina | `oficinas.json` |
| Push `main` | Site no GitHub Pages |

## 10. Critérios de qualidade

- Layout alinhado à oficina referência (`o-espelho-tecnologico`)
- Funciona em Chrome/Edge recentes
- Navegação em modo painel (uma seção por vez) + barra inferior no mobile
- Acessibilidade básica (estrutura semântica, alt em imagens, `aria-hidden` em seções ocultas)
- Conversor não envia `.docx` para servidor externo

## 11. Métricas e evidências

| Métrica | Meta inicial |
|---------|----------------|
| Tempo para publicar 1 oficina nova | Reduzir vs 100% manual |
| % seções geradas corretamente | ≥ 90% antes da revisão |
| Oficinas publicadas | Crescimento incremental |
| Changes com evidência | 100% das mudanças relevantes |

Registrar em `docs/EVIDENCES.md`.

## 12. Roadmap

Ver `docs/ROADMAP.md`.

## 13. Decisões relevantes

Ver `docs/DECISIONS.md`.

## 14. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Parser frágil a mudanças no Word | Spec + teste com `.docx` de referência |
| HTML manual divergir do gerado | Oficina referência como golden master |
| IA gera código desalinhado | OpenSpec + SDD + CURRENT_STATE |

## 15. Histórico de atualização

| Data | Mudança |
|------|---------|
| 13/07/2026 | Modo painel por seção nas oficinas (`nave.js`) |
| 23/06/2026 | Criação inicial do SDD (baseline projeto em andamento) |
