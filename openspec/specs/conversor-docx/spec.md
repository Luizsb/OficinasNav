# Spec — Conversor DOCX

Domínio: `tools/conversor/` — transformação de `.docx` template NAVE em pacote de oficina HTML.

## Requisitos

### REQ-CONV-001 — Leitura do template NAVE

**Given** um arquivo `.docx` no formato NAVE com marcadores `[Título da oficina]`, `[Texto]`, `[Etapa N]`, `[Seção N]`  
**When** o usuário envia o arquivo no conversor  
**Then** o parser extrai título, visão geral, estrutura (tabela quadro-resumo), seções Preparar/Criar/Refletir e materiais

### REQ-CONV-002 — Metadados

**Given** linhas `[x]` com ano, duração e eixo após `[Texto]`  
**When** o documento é parseado  
**Then** `meta.ano`, `meta.duracao` e `meta.foco` são preenchidos para badges e `oficinas.json`

### REQ-CONV-003 — Imagens embutidas

**Given** imagens embutidas no Word ou referências `<inserir arquivo.ext>`  
**When** a conversão completa  
**Then** imagens embutidas entram em `images/` no ZIP; placeholders `<inserir>` geram `src="images/arquivo.ext"` no HTML

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

## Cenários de erro

### ERR-CONV-001 — Documento sem título

**Given** `.docx` sem `[Título da oficina]`  
**When** o usuário envia o arquivo  
**Then** exibe erro claro e não habilita download/prévia

### ERR-CONV-002 — Prévia sem conversão prévia

**Given** usuário abre `preview.html` diretamente sem conversão  
**When** a página carrega  
**Then** exibe mensagem orientando a gerar conversão no conversor
