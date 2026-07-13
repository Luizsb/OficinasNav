# Changelog — Oficinas NAVE

Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

## [0.2.0] — 2026-06-23

### Added

- Estrutura de documentação D.N.E.E.: `docs/` (SDD, CURRENT_STATE, DECISIONS, EVIDENCES, ROADMAP, discovery)
- OpenSpec: `openspec/config.yaml`, specs iniciais (conversor, oficina-html, publicacao)
- Change `calibrar-conversor-docx-nave` (proposal, design, tasks)
- Conversor DOCX → HTML em `tools/conversor/`
- Pré-visualização via `preview.html` + `localStorage`
- README com instruções de execução
- Tag discreta **Opcional** no menu lateral para a seção **Para ir além**
- Classe `subsection-neutral` para títulos de conteúdo sem cor de seção

### Changed

- Parser do conversor: de estilos Word para marcadores template NAVE
- Navegação das oficinas: modo painel (uma seção visível por vez) em `nave.js` + `nave.css`
- Conclusão de oficina: botão Concluir, badge na home, persistência em `localStorage`
- Home: hero com identidade NAVE, cards com capa e fases pedagógicas
- Dicas de condução em accordions (Preparar, Criar, Refletir), todos recolhidos ao carregar
- Nav mobile expandida para 6 itens; cores ativas da sidebar corrigidas
- Títulos **Apresentação**, **Embarque** e **Aprendizados** em preto (menos saturação visual)
- Tags removidas do card da oficina na home

### Fixed

- Pré-visualização: blob URL → `preview.html` (layout e storage entre abas)
- Banner de retomada: nome da seção na mesma linha do texto
- Progresso e conclusão: oficina só marca 100% ao clicar em Concluir
- Bottom nav: `display: grid` global não sobrescreve mais `lg:hidden`

[Unreleased]: compare com v0.2.0
[0.2.0]: https://github.com/compare/v0.1.0...v0.2.0

## [0.1.0] — 2026 (baseline)

### Added

- Site estático Oficinas NAVE
- Oficina **O Espelho tecnológico** (`o-espelho-tecnologico`)
- Assets compartilhados (`nave.css`, `nave.js`, Tailwind config)
- Deploy GitHub Pages

[0.1.0]: baseline inicial do repositório
