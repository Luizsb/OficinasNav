# Changelog de evidências

Registro verificável de mudanças relevantes (padrão D.N.E.E.).

Formato do cabeçalho de cada entrada:

```markdown
## AAAA-MM-DD · HH:MM — [Nome da mudança]
```

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
