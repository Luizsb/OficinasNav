# Tasks — Calibrar conversor DOCX NAVE

## Implementação

- [ ] Rodar conversão com `oficinas/o-espelho-tecnologico/fonte/atividade-4-o-espelho-tecnologico.docx`
- [ ] Listar seções/blocos faltantes vs HTML referência (checklist abaixo)
- [ ] Ajustar `docx-parser.js` para gaps identificados
- [ ] Ajustar `html-generator.js` para gaps de layout
- [ ] Garantir prévia (`preview.html` + `localStorage`) funcional na porta do servidor
- [ ] Adicionar `.gitignore` para `tools/conversor/node_modules/`

## Checklist de paridade (QA manual)

### Visão geral
- [ ] Título e parágrafos introdutórios
- [ ] Badges: ano, duração, eixo
- [ ] Cards Estrutura da Oficina (Preparar / Criar / Refletir)

### Preparar
- [ ] Apresentação + figuras
- [ ] Perguntas reflexivas
- [ ] Elemento-chave (accordion)
- [ ] Dicas de condução (accordions numerados)
- [ ] CTA / QR na dica correta (se aplicável)
- [ ] Embarque + figuras + dica

### Materiais
- [ ] Lista com checkboxes

### Criar
- [ ] Card protótipo
- [ ] Passo a passo
- [ ] Accordions de atividade (ex.: Chapéu, Óculos)
- [ ] Etapas numeradas dentro dos accordions
- [ ] Dicas inline (Box: Dica)

### Refletir
- [ ] Aprendizados + opções
- [ ] Perguntas reflexivas
- [ ] Para ir além
- [ ] Dicas em cards

## Documentação

- [ ] Atualizar `docs/CURRENT_STATE.md` se fluxo mudar
- [ ] Registrar decisões novas em `docs/DECISIONS.md`
- [ ] Fechar `docs/EVIDENCES.md` EV-001
- [ ] Atualizar `CHANGELOG.md`

## Evidência

- [ ] Screenshot prévia com layout NAVE
- [ ] Nota: % estimado de revisão manual restante
- [ ] Marcar change como concluída (mover para `openspec/changes/archive/` quando processo existir)
