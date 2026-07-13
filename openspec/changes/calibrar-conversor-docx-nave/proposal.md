# Proposal — Calibrar conversor DOCX NAVE

**Status:** Em andamento  
**Data:** 23/06/2026

## 1. Problema

O conversor gera HTML incompleto ou com layout inferior ao da oficina referência (`o-espelho-tecnologico`), apesar de usar o `.docx` institucional correto. Isso mantém dependência de conversão manual e reduz confiança na ferramenta.

## 2. Público impactado

- Equipe de conteúdo (publicação de novas oficinas)
- Desenvolvedores / IA (manutenção do parser e gerador)
- Educadores (indireto — qualidade do roteiro publicado)

## 3. Hipótese de valor

Calibrar parser + gerador contra `.docx` + HTML golden master reduz tempo de revisão manual e aumenta previsibilidade ao receber novos documentos.

## 4. Solução proposta

1. Comparar saída atual com `oficinas/o-espelho-tecnologico/index.html`
2. Corrigir gaps no `docx-parser.js` e `html-generator.js`
3. Validar com prévia e ZIP usando `atividade-4-o-espelho-tecnologico.docx`
4. Documentar checklist de QA pós-conversão
5. Fechar EV-001 com evidência antes/depois

## 5. Critérios de sucesso

- [ ] Todas as seções principais presentes (Preparar, Materiais, Criar, Refletir)
- [ ] Quadro-resumo (3 cards) gerado da tabela
- [ ] ≥ 10 dicas de condução em accordion (Etapa 1)
- [ ] ≥ 2 accordions de atividade na seção Criar
- [ ] Perguntas reflexivas e elemento-chave renderizados
- [ ] Pré-visualização abre com layout NAVE (servidor local)
- [ ] Imagens embutidas no Word aparecem na prévia

## 6. Fora de escopo

- Paridade 100% pixel-perfect com HTML manual
- Tabela de glossário inglês (não existe no `.docx`)
- Conversão em lote server-side
- Publicação automática no GitHub

## 7. Riscos

| Risco | Mitigação |
|-------|-----------|
| Template Word mudar | Versionar `.docx` em `fonte/` |
| HTML manual divergir do Word | Word + HTML manual como referência cruzada |
| Regressão em edge cases | Checklist manual por oficina |

## 8. Validação

Revisão com 1 pessoa de conteúdo comparando prévia do conversor com site publicado.

## 9. Evidência esperada

Atualizar `docs/EVIDENCES.md` EV-001 com checklist marcado e screenshots.
