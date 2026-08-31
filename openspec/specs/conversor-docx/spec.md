# Spec — Conversor DOCX

Domínio: `tools/conversor/` — transformação de `.docx` template NAVE em pacote de oficina HTML.

## Requisitos

### REQ-CONV-001 — Leitura do template NAVE

**Given** um arquivo `.docx` no formato NAVE com marcadores `[Título da oficina]`, `[text]`/`[Texto]`, `[Etapa N]`, `[acordeon]` ou `[Seção N]`  
**When** o usuário envia o arquivo no conversor  
**Then** o parser extrai título, visão geral, estrutura (tabela quadro-resumo), seções Preparar/Criar/Refletir/Para ir além e materiais, **sem** renderizar os marcadores `[card]`, `[text]`, `[acordeon]` como conteúdo visível

### REQ-CONV-002 — Metadados

**Given** linhas `[x]` **ou** os marcadores `[público-alvo]` / `[tempo para desenvolvimento da oficina]` / `[Eixos da Nova BCCI]`  
**When** o documento é parseado  
**Then** `meta.ano`, `meta.duracao` e `meta.eixos` (um item por eixo, com habilidades BNCC) são preenchidos para badges; cada eixo vira um chip expansível, não um único texto concatenado

### REQ-CONV-003 — Imagens embutidas e pasta local

**Given** imagens embutidas no Word, referências `<inserir arquivo.ext>` / `[imagem N] <img>`, **ou** uma pasta de imagens enviada no conversor  
**When** a conversão completa (e o envio para a home)  
**Then** as imagens entram em `oficinas/{id}/images/`; placeholders `<inserir>` e `<img>` geram `src="images/arquivo.ext"` no HTML

### REQ-CONV-004 — Saída ZIP

**Given** conversão bem-sucedida  
**When** o usuário clica em Baixar pacote ZIP  
**Then** o ZIP contém `oficinas/{id}/index.html`, `images/`, `fonte/{nome}.docx` e `LEIA-ME.txt` com snippet para `oficinas.json`

### REQ-CONV-005 — Pré-visualização

**Given** conversão bem-sucedida e servidor local na raiz do projeto  
**When** o usuário clica em Pré-visualizar HTML  
**Then** abre `preview.html` com layout NAVE (CSS/JS de `assets/`) e conteúdo gerado

### REQ-CONV-006 — Privacidade

**Given** qualquer `.docx` enviado  
**When** o processamento ocorre  
**Then** nenhuma requisição de rede envia o conteúdo do documento a servidores externos

### REQ-CONV-007 — Enviar para a home

**Given** conversão bem-sucedida no Chrome ou Edge, com o repositório aberto no disco  
**When** o usuário clica em **Enviar para a home** e escolhe a pasta raiz do OficinasNave **ou** a pasta `oficinas`  
**Then** grava `oficinas/{id}/index.html`, `images/` e `fonte/` no mesmo formato da oficina modelo; se a pasta escolhida for a raiz (com `oficinas.json`), também atualiza `oficinas.json` e o bloco `#oficinas-data` de `index.html`

## Cenários de erro

### ERR-CONV-001 — Documento sem título

**Given** `.docx` sem `[Título da oficina]`  
**When** o usuário envia o arquivo  
**Then** exibe erro claro e não habilita download/prévia

### ERR-CONV-002 — Prévia sem conversão prévia

**Given** usuário abre `preview.html` diretamente sem conversão  
**When** a página carrega  
**Then** exibe mensagem orientando a gerar conversão no conversor
