# Comece aqui — Oficinas NAVE

Um mapa simples. Ignore o resto até precisar.

---

## O projeto tem só 3 partes

```
┌─────────────────────────────────────────────────────────┐
│  1. SITE (o que o educador vê)                          │
│     index.html  +  oficinas/o-espelho-tecnologico/     │
│     assets/  +  oficinas.json                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  2. CONVERSOR (ferramenta interna — Word → HTML)        │
│     tools/conversor/                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  3. DOCUMENTAÇÃO (processo — opcional no dia a dia)     │
│     docs/  +  openspec/                               │
└─────────────────────────────────────────────────────────┘
```

**90% do tempo** você mexe na parte 1 ou 2. A parte 3 é para alinhar time, IA e entregas maiores.

---

## Qualquer pessoa consegue continuar?

**Sim**, se tiver:

| Precisa | Para quê |
|---------|----------|
| Git + clone do repositório | Ter o código |
| Python 3 (já vem no Windows) | Rodar site local: `python -m http.server 8080` |
| Navegador (Chrome/Edge) | Ver site e usar conversor |
| Editor (Cursor, VS Code) | Editar HTML ou código do conversor |

**Não precisa:** Node, npm, build, banco de dados, servidor na nuvem para desenvolver.

---

## Rodar em 3 passos

```powershell
# 1. Entrar na pasta (ajuste o caminho se necessário)
Set-Location -LiteralPath 'C:\Users\luiz.barbosa\Documents\[NAVE] OficinasNave'

# 2. Subir servidor
python -m http.server 8080

# 3. Abrir no navegador
# Site:      http://localhost:8080
# Conversor: http://localhost:8080/tools/conversor/index.html
```

---

## O que é “calibrar o conversor”?

Não é misterioso. É **ajustar o código até a saída parecer com a oficina que já está boa**.

### Referências (sempre as mesmas)

| Arquivo | Papel |
|---------|--------|
| `oficinas/o-espelho-tecnologico/fonte/atividade-4-o-espelho-tecnologico.docx` | Entrada (Word) |
| `oficinas/o-espelho-tecnologico/index.html` | Saída ideal (HTML manual) |

### Passo a passo da calibração

1. **Converter** o `.docx` no conversor (localhost:8080/tools/conversor/)
2. **Pré-visualizar HTML** — ver se layout NAVE aparece
3. **Comparar** com a oficina publicada (abrir as duas abas lado a lado)
4. **Anotar o que falta** — ex.: “faltou accordion de dicas”, “imagem quebrada”
5. **Corrigir código** em um destes arquivos:
   - `tools/conversor/js/docx-parser.js` — lê o Word
   - `tools/conversor/js/html-generator.js` — monta o HTML
6. **Repetir** 1–5 até a lista de gaps ficar aceitável
7. **Revisão humana** — alguns detalhes do HTML manual nunca existiram no Word (ex.: tabela de glossário)

Checklist detalhado: `openspec/changes/calibrar-conversor-docx-nave/tasks.md`

---

## Pastas — o que ignorar

| Pasta/arquivo | Ignorar? | Motivo |
|---------------|----------|--------|
| `tools/conversor/node_modules/` | Sim | Lixo de teste; conversor usa CDN |
| `docs/discovery/TEMPLATE_*` | Até precisar | Modelo para novas features |
| `openspec/specs/` | Leitura opcional | Regras técnicas; dev/IA consultam |
| `openspec/changes/...` | Só a change ativa | Tarefa atual = calibrar conversor |
| `.github/workflows/` | Sim no dia a dia | Deploy automático ao dar push |

---

## Pastas — o que importa

| Caminho | Quem usa | O quê |
|---------|----------|--------|
| `oficinas/nome/` | Conteúdo | Cada oficina publicada |
| `oficinas.json` | Conteúdo | Lista na página inicial |
| `assets/` | Design/dev | CSS, JS, logo NAVE |
| `tools/conversor/js/` | Dev | Parser e gerador |
| `README.md` | Todos | Como rodar |
| `docs/CURRENT_STATE.md` | Time | O que funciona hoje |
| `docs/SDD.md` | Gestão/time | Visão do produto |

---

## Fluxos por perfil

### Sou da equipe de conteúdo

1. Recebo `.docx` no template NAVE  
2. Abro conversor → envio → baixo ZIP  
3. Reviso HTML (prévia ou pasta gerada)  
4. Peço ajustes ou corrijo textos/imagens em `images/`  
5. Alguém adiciona entrada em `oficinas.json` e dá push  

### Sou dev (ou uso Cursor)

1. Leio `docs/CURRENT_STATE.md` (5 min)  
2. Trabalho em `tools/conversor/js/` ou `oficinas/`  
3. Se for mudança grande: veja `openspec/changes/calibrar-conversor-docx-nave/tasks.md`  
4. Teste com servidor local + `.docx` de referência  

### Uso IA (Cursor)

Cole no chat:

```
Leia docs/COMECAR_AQUI.md e docs/CURRENT_STATE.md.
Estou calibrando o conversor: compare saída com o-espelho-tecnologico.
Siga openspec/changes/calibrar-conversor-docx-nave/tasks.md
```

---

## Documentação vs código — analogia

| Metáfora | Pasta |
|----------|--------|
| **A casa** (site + conversor) | `oficinas/`, `assets/`, `tools/` |
| **A planta e o manual** (como deve ser) | `docs/SDD.md`, `openspec/specs/` |
| **A obra em andamento** (tarefa atual) | `openspec/changes/calibrar-conversor-docx-nave/` |
| **Fotos antes/depois** | `docs/EVIDENCES.md` |

Você mora na casa; consulta a planta quando reforma.

---

## Navegação das oficinas (modo painel)

Ao abrir uma oficina, o conteúdo aparece **uma seção por vez** — não mais a página inteira com rolagem gigante.

| Ação | O que acontece |
|------|----------------|
| Clicar no menu lateral (desktop) | Mostra só aquela seção (Visão geral, Preparar, …) |
| Barra inferior (mobile) | Mesmo comportamento para Preparar → Refletir |
| Anterior / Próxima | Rodapé do conteúdo; indicador “2 de 5 — Preparar” |
| Voltar ao site depois | Abre em Visão geral; banner oferece continuar na última seção |

Implementação centralizada em `assets/js/nave.js` — **não precisa alterar cada HTML** de oficina.

---

## Próximo passo recomendado (uma pessoa, ~2h)

1. Rodar servidor  
2. Converter o `.docx` de referência  
3. Abrir checklist em `openspec/changes/calibrar-conversor-docx-nave/tasks.md`  
4. Marcar o que passa / falha  
5. Corrigir 1–2 gaps no parser ou gerador  
6. Repetir  

Quando a maioria do checklist passar → segunda oficina piloto com `.docx` novo.
