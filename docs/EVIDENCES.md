# Evidências — Oficinas NAVE

Registro de entregas com impacto verificável.

---

## EV-001 — Conversor DOCX → HTML (v1)

**Data:** 23/06/2026  
**Change relacionada:** `openspec/changes/calibrar-conversor-docx-nave/` (em andamento)

### Contexto

Equipe receberá mais oficinas em `.docx`. Era necessário acelerar publicação mantendo layout NAVE.

### Antes

- Conversão manual para HTML (ex.: `o-espelho-tecnologico`)
- Tentativa inicial de parser por estilos Word → saída vazia/incorreta

### Depois

- Ferramenta em `tools/conversor/` (upload, metadados, ZIP, prévia)
- Parser alinhado ao template com marcadores `[Etapa]`, `[Seção]`, etc.
- Prévia com layout via `preview.html` + `localStorage`

### Evidências coletadas

- [x] Estrutura de pastas `tools/conversor/`
- [x] Teste com análise do `.docx` real (348 parágrafos, 1 tabela, 14 imagens)
- [x] Correção prévia (blob → preview.html)
- [ ] Comparação side-by-side HTML gerado vs referência (pendente — change ativa)
- [ ] Feedback de educador/conteúdo (pendente)

### Resultado observado

Ferramenta utilizável para **primeira passagem**; revisão manual ainda necessária para paridade com HTML de referência.

### Conclusão

**Parcial** — infraestrutura entregue; calibração em progresso.

---

## EV-002 — Documentação metodológica (baseline)

**Data:** 23/06/2026

### Contexto

Adoção do guia D.N.E.E. / SDD / OpenSpec em projeto já iniciado.

### Depois

- `docs/CURRENT_STATE.md`, `SDD.md`, `DECISIONS.md`, `ROADMAP.md`
- `openspec/config.yaml` + specs iniciais + change `calibrar-conversor-docx-nave`

### Conclusão

**Sim** — baseline documental criado.
