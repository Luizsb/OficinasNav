# 🗺️ Roadmap

Débitos e entregas mapeados no Raio-X do código (jul/2026). Atualizar checkboxes conforme o trabalho avançar.

## Crítico — performance e mídia

- [ ] Comprimir ou substituir os 6 GIFs da oficina (~187 MB) por MP4/WebP (ou equivalente mais leve)
- [ ] Lazy-load / adiar carga de mídia pesada na seção Criar
- [ ] Validar tamanho total da pasta da oficina após compressão (meta: redução drástica vs ~189 MB)

## Alto — conversor e escala

- [ ] Calibrar conversor DOCX vs HTML referência (`o-espelho-tecnologico` + `.docx` real)
- [ ] Fechar change OpenSpec `calibrar-conversor-docx-nave` (proposta, design, tasks, evidência)
- [ ] Tratar placeholders `<inserir …>` (fluxo claro para GIFs/PNG sem binário no Word)
- [ ] Gerar tabelas/glossário (ex.: apoio linguístico) sem edição só no HTML manual
- [ ] Checklist de QA pós-conversão antes de publicar
- [ ] Publicar segunda oficina piloto via conversor + revisão

## Médio — dados, deploy e consistência

- [ ] Unificar metadados: uma fonte (`oficinas.json`); remover ou gerar o embed `#oficinas-data`
- [ ] Usar ou remover o campo `capa` do catálogo (hoje não entra no render dos cards)
- [ ] Filtrar artefato GitHub Pages (não publicar `docs/`, `openspec/`, `tools/`, fonte `.docx` no site público)
- [ ] Alinhar gerador HTML (`tools/conversor/js/html-generator.js`) ao golden master manual
- [ ] Remover resíduos desnecessários do conversor (ex.: dependências Node não usadas na UI)

## Baixo — dívida técnica e qualidade

- [ ] Remover ou implementar código morto (`SCROLL_SAVE_MS` e afins)
- [ ] Migrar `onclick` legado restantes (Atenção / Dica / Elemento-chave) para handlers em `nave.js`
- [ ] Decidir escopo das classes `dark:` (toggle real ou remoção)
- [ ] Mitigar dependência exclusiva do Tailwind CDN (fallback ou build estático opcional)
- [ ] Acessibilidade: foco preso em lightbox/modais; `aria-valuemax` coerente com além
- [ ] Permitir “desmarcar conclusão” ou documentar conclusão como irreversível na UI
- [ ] Smoke tests automatizados (ex.: Playwright) no CI
- [ ] Template Word `.dotx` oficial versionado
- [ ] Prévia do conversor: evitar estouro de quota do `localStorage` (tamanho do HTML)

## Já entregue (baseline)

- [x] Site estático + oficina referência publicada
- [x] Modo painel (uma seção por vez) + Anterior / Próxima / Concluir
- [x] Persistência local (seção, checkboxes, conclusão)
- [x] Home com hero, fases e progresso nos cards
- [x] “Para ir além” integrada como última etapa sequencial antes de Concluir
- [x] Conversor DOCX v1 (parser de marcadores NAVE) — primeira passagem
- [x] Deploy GitHub Pages via Actions
- [x] Organização documental D.N.E.E. (este pacote)
