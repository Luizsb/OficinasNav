# Spec — Publicação e índice

Domínio: `index.html`, `oficinas.json`, GitHub Pages.

## Requisitos

### REQ-PUB-001 — Índice de oficinas

**Given** entradas válidas em `oficinas.json`  
**When** o usuário abre `index.html`  
**Then** cards listam título, subtítulo, tags, ano e duração com link para `arquivo`

### REQ-PUB-002 — Fallback de dados

**Given** `fetch("oficinas.json")` falha (ex.: file://)  
**When** a página inicial carrega  
**Then** usa dados embutidos em `<script id="oficinas-data">`

### REQ-PUB-003 — Nova oficina

**Given** pasta `oficinas/{id}/index.html` existente  
**When** equipe adiciona entrada em `oficinas.json`  
**Then** oficina aparece no índice após deploy

### REQ-PUB-004 — Deploy

**Given** push na branch `main`  
**When** workflow `Deploy GitHub Pages` conclui  
**Then** site público reflete o commit (sem passo de build adicional)

### REQ-PUB-005 — Conversor fora do produto público

**Given** visitante do site em produção  
**When** navega apenas pelo índice e oficinas  
**Then** não é obrigatório usar `tools/conversor/` (ferramenta interna/local)
