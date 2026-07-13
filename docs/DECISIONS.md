# Decisões — Oficinas NAVE

Registro de escolhas arquiteturais e de produto. Formato: data, contexto, decisão, justificativa.

---

## DEC-001 — Site estático sem build

**Data:** 2026 (início do projeto)

**Contexto:** Publicação via GitHub Pages; equipe pequena; conteúdo predominante.

**Decisão:** HTML/CSS/JS vanilla, Tailwind via CDN, sem bundler obrigatório.

**Justificativa:** Simplicidade de deploy, baixo custo de manutenção, qualquer editor abre o projeto.

**Revisão:** Se o número de oficinas ou complexidade do conversor exigir testes automatizados em CI.

---

## DEC-002 — Template Word por marcadores, não por estilos

**Data:** 23/06/2026

**Contexto:** Conversor inicial esperava Título 1/2/3; `.docx` real usa `[Etapa 1]`, `[Seção 1]`, etc.

**Decisão:** Parser baseado em marcadores entre colchetes do template NAVE institucional.

**Justificativa:** Alinhamento com o arquivo `atividade-4-o-espelho-tecnologico.docx` recebido pela equipe.

**Revisão:** Se o template Word for reformulado para estilos nomeados.

---

## DEC-003 — Conversor client-side (navegador)

**Data:** 23/06/2026

**Contexto:** Oficinas podem conter conteúdo interno; privacidade e simplicidade de infra.

**Decisão:** Processamento do `.docx` inteiramente no navegador (JSZip + parser JS).

**Justificativa:** Sem servidor backend; arquivo não sai da máquina do usuário.

**Revisão:** Se houver necessidade de conversão em lote server-side ou fila de publicação.

---

## DEC-004 — Prévia via preview.html + localStorage

**Data:** 23/06/2026

**Contexto:** URL `blob:` falhou (busca no Google); `sessionStorage` não compartilha entre abas.

**Decisão:** Gravar HTML preparado em `localStorage` e abrir `tools/conversor/preview.html`.

**Justificativa:** Mesma origem (`localhost:8080`); caminhos `../../assets/` resolvem corretamente.

**Revisão:** Se localStorage limitar tamanho de oficinas muito grandes (considerar IndexedDB).

---

## DEC-005 — Oficina referência como golden master

**Data:** 23/06/2026

**Contexto:** HTML de `o-espelho-tecnologico` foi construído manualmente com mais detalhe que o gerador.

**Decisão:** Comparar saída do conversor com `oficinas/o-espelho-tecnologico/index.html` + `.docx` fonte.

**Justificativa:** Critério objetivo de qualidade para calibração do parser/gerador.

**Revisão:** Quando conversor atingir paridade aceita, referência pode ser só o `.docx`.

---

## DEC-006 — Metodologia D.N.E.E. + OpenSpec

**Data:** 23/06/2026

**Contexto:** Projeto em andamento; guia interno SDD/OpenSpec; uso de IA (Cursor).

**Decisão:** Adotar Nível 1–2: `docs/` + `openspec/` com changes por entrega relevante.

**Justificativa:** Reduz retrabalho, documenta baseline, orienta agentes de IA.

**Revisão:** Avaliar Nível 3 após 3+ oficinas publicadas via conversor.

---

## DEC-007 — Modo painel por seção (não scroll longo)

**Data:** 13/07/2026

**Contexto:** Roteiros extensos geram rolagem longa que pode intimidar educadores; pedido de mostrar só a seção ativa ao clicar no menu.

**Decisão:** `nave.js` ativa modo painel quando detecta seções `view`/`prepare`/… — oculta demais blocos, navegação Anterior/Próxima, hash na URL, retomada por seção (não por pixels de scroll).

**Justificativa:** Foco pedagógico por fase; implementação centralizada em assets compartilhados sem alterar cada HTML de oficina.

**Revisão:** Se houver demanda por “ver documento completo”, adicionar toggle opcional sem remover o modo painel padrão.
