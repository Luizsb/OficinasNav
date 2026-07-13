# Spec — Página de oficina HTML

Domínio: `oficinas/{slug}/index.html` — roteiro pedagógico individual.

## Requisitos

### REQ-OFC-001 — Estrutura de seções

**Given** uma oficina publicada  
**When** o educador abre a página  
**Then** existem seções com ids: `view`, `prepare`, `materials`, `create`, `reflect`

### REQ-OFC-002 — Navegação em modo painel

**Given** uma oficina com seções `view`, `prepare`, `materials`, `create`, `reflect`  
**When** o educador clica em um item do menu lateral ou da barra inferior  
**Then** apenas o conteúdo da seção escolhida fica visível no painel principal  
**And** as demais seções ficam ocultas (`nave-panel-hidden`)

**Given** modo painel ativo  
**When** o usuário navega entre seções  
**Then** a URL atualiza com hash (`#prepare`, `#create`, …)  
**And** botões Anterior / Próxima e indicador “N de 5” aparecem no rodapé do conteúdo

**Given** o educador retorna à oficina sem hash na URL  
**When** existe última seção salva no `localStorage`  
**Then** a página abre em Visão geral e oferece banner para continuar na seção salva

### REQ-OFC-002b — Agrupamento Visão geral

**Given** blocos sem `id` entre `#view` e `#prepare` (ex.: “Estrutura da Oficina”)  
**When** o painel “Visão geral” está ativo  
**Then** esses blocos são exibidos junto com `#view`

### REQ-OFC-002c — Conclusão da oficina

**Given** o educador está na seção `reflect`  
**When** clica em **Concluir**  
**Then** a oficina é marcada como concluída no `localStorage` (chave `nave-completed:{slug}`)  
**And** um modal oferece **Lista de oficinas** ou **Continuar na oficina**  
**And** ao reentrar na oficina já concluída, o botão exibe **Lista de oficinas** (sem modal repetido)

**Given** oficina concluída  
**When** o educador abre `index.html`  
**Then** o card da oficina exibe selo **Oficina concluída**

### REQ-OFC-003 — Assets compartilhados

**Given** HTML gerado ou manual  
**When** a página carrega a partir de `oficinas/{slug}/`  
**Then** referencia `../../assets/css/nave.css`, `tailwind-config.js`, `nave.js` corretamente

### REQ-OFC-004 — Componentes pedagógicos

**Given** conteúdo no `.docx` ou HTML  
**When** renderizado  
**Then** suporta: perguntas reflexivas, elemento-chave (accordion), dicas de condução, accordions de atividade na seção Criar, checklist de materiais

### REQ-OFC-005 — Persistência local

**Given** checkboxes de materiais  
**When** o usuário marca/desmarca  
**Then** estado persiste no `localStorage` por oficina (`nave.js`)

### REQ-OFC-006 — Imagens

**Given** figuras em `images/`  
**When** o usuário clica na imagem no conteúdo  
**Then** lightbox com zoom está disponível (`nave.js`)

## Golden master

Referência: `oficinas/o-espelho-tecnologico/index.html`  
Fonte: `oficinas/o-espelho-tecnologico/fonte/atividade-4-o-espelho-tecnologico.docx`
