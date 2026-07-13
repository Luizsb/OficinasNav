# Design — Calibrar conversor DOCX NAVE

## Arquivos principais

| Arquivo | Papel |
|---------|--------|
| `tools/conversor/js/docx-parser.js` | State machine por marcadores NAVE |
| `tools/conversor/js/html-generator.js` | Template HTML da oficina |
| `tools/conversor/js/app.js` | Upload, ZIP, prévia |
| `tools/conversor/preview.html` | Render com `localStorage` |

## Abordagem de calibração

```
atividade-4-o-espelho-tecnologico.docx
        │
        ▼
   docx-parser.js ──► JSON (meta, sections, images)
        │
        ▼
 html-generator.js ──► index.html
        │
        ├──► compare (manual) com o-espelho-tecnologico/index.html
        └──► ajustar parser/generator por gap
```

## Gaps conhecidos a endereçar

1. **Blocos complexos** — CTA/QR dentro de dicas; tabelas adicionadas só no HTML manual
2. **Imagens `<inserir>`** — sem binário no Word; documentar fluxo de copiar GIFs para `images/`
3. **Grid de imagens** (Criar) — múltiplas figuras lado a lado
4. **Opções de aprendizados** — cards Opção 1, 2, 3 na seção Refletir
5. **Subtítulo da oficina** — pode não existir no `.docx`; derivar ou campo futuro

## Alternativas consideradas

| Opção | Prós | Contras | Decisão |
|-------|------|---------|---------|
| Mammoth.js (HTML direto) | Rápido | Não mapeia template NAVE | Rejeitada (DEC-002) |
| Parser custom por marcadores | Alinhado ao Word real | Manutenção manual | **Adotada** |
| Reescrever HTML manual como fonte | Paridade perfeita | Não escala | Rejeitada |

## Teste manual recomendado

1. `python -m http.server 8080` na raiz
2. Conversor → upload `.docx` referência
3. Pré-visualizar HTML
4. Checklist em `tasks.md`
5. Baixar ZIP e abrir `oficinas/{id}/index.html` no servidor

## Impacto em specs

Atualiza comportamento esperado em `openspec/specs/conversor-docx/spec.md` — critérios de paridade na change, não breaking change no site público.
