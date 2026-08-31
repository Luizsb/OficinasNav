/**
 * Parser de .docx NAVE — marcadores do template institucional.
 * Aceita o formato legado ([Texto], [Seção N], [Quadro-resumo]) e o atual
 * ([text]/[/text], [acordeon], [card], [check-list], [imagem N] <img>).
 */
(function (global) {
    "use strict";

    var W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    var R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
    var A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";

    function getElementsByLocalName(parent, localName) {
        var out = [];
        if (!parent) return out;
        var nodes = parent.getElementsByTagName("*");
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].localName === localName) out.push(nodes[i]);
        }
        return out;
    }

    function getFirstByLocalName(parent, localName) {
        var list = getElementsByLocalName(parent, localName);
        return list.length ? list[0] : null;
    }

    function normalizeText(s) {
        return (s || "").replace(/\s+/g, " ").trim();
    }

    function slugify(text) {
        return normalizeText(text)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    function splitTitleContent(text) {
        var idx = text.indexOf(": ");
        if (idx > 0 && idx < 80) {
            return { title: text.slice(0, idx).trim(), content: text.slice(idx + 2).trim() };
        }
        var words = text.split(" ");
        if (words.length > 8) {
            return { title: words.slice(0, 5).join(" ") + "…", content: text };
        }
        return { title: text.slice(0, 60), content: text };
    }

    function parseInserir(text) {
        var m = text.match(/<(?:inserir|Inserir)\s+([^>]+)>/i);
        return m ? normalizeText(m[1]) : null;
    }

    function findImageByStem(name, dict) {
        if (!name || !dict) return "";
        if (dict[name]) return name;
        var stem = String(name).replace(/\.[^.]+$/, "").toLowerCase();
        var keys = Object.keys(dict);
        for (var i = 0; i < keys.length; i++) {
            if (keys[i].replace(/\.[^.]+$/, "").toLowerCase() === stem) return keys[i];
        }
        return "";
    }

    function parseImgFiles(text) {
        var out = [];
        var re = /<img>\s*([^<]+?)\s*<\/img>/gi;
        var m;
        while ((m = re.exec(text || ""))) {
            var name = normalizeText(m[1]);
            if (name) out.push(name);
        }
        return out;
    }

    function isQuadroTable(rows) {
        if (!rows || !rows.length) return false;
        var header = (rows[0] || []).map(cellPlain).join(" ").toLowerCase();
        return /etapa/.test(header) && /tempo/.test(header);
    }

    function kindFromHeading(name) {
        var n = name || "";
        if (/apresenta/i.test(n)) return "apresentacao";
        if (/dicas de condu/i.test(n)) return "dicas";
        if (/embarque/i.test(n)) return "embarque";
        if (/passo a passo/i.test(n)) return "passo_a_passo";
        if (/aprendizados/i.test(n)) return "aprendizados";
        if (/para ir al[eé]m/i.test(n)) return "beyond";
        if (/perguntas reflex/i.test(n)) return "perguntas_reflexivas";
        if (/elemento[- ]chave/i.test(n)) return "elemento_chave";
        if (/materiais/i.test(n)) return "materiais";
        return "generic";
    }

    function isHeadingLike(text) {
        if (!text || text.length > 80) return false;
        if (/[.?!]$/.test(text)) return false;
        if (/^https?:\/\//i.test(text)) return false;
        return true;
    }

    function isInternalNote(text) {
        return /^<DIGI\b/i.test(text) || /^\[M[ií]ni experi/i.test(text);
    }

    function isMarkerOnly(text) {
        return /^\[[^\]]+\]$/.test(text) || /^\[\/[^\]]+\]$/.test(text);
    }

    function isListItem(p) {
        return !!getFirstByLocalName(p, "numPr");
    }

    function getEmbeddedMedia(p, relMap) {
        var blips = getElementsByLocalName(p, "blip");
        for (var i = 0; i < blips.length; i++) {
            var embed = blips[i].getAttributeNS(R_NS, "embed") || blips[i].getAttribute("r:embed");
            if (embed && relMap[embed]) return relMap[embed].split("/").pop();
        }
        return null;
    }

    function collectParagraphText(p) {
        var text = "";
        var runs = getElementsByLocalName(p, "r");
        for (var i = 0; i < runs.length; i++) {
            var ts = getElementsByLocalName(runs[i], "t");
            for (var j = 0; j < ts.length; j++) text += ts[j].textContent || "";
        }
        return normalizeText(text);
    }

    function boldValOn(el) {
        if (!el) return false;
        var val = el.getAttributeNS(W_NS, "val") || el.getAttribute("w:val") || "";
        return val !== "0" && !/^false$/i.test(val) && val !== "off";
    }

    function rPrIsBold(rPr) {
        if (!rPr) return false;
        var b = getFirstByLocalName(rPr, "b") || getFirstByLocalName(rPr, "bCs");
        return boldValOn(b);
    }

    function paragraphStyleName(p) {
        var pPr = getFirstByLocalName(p, "pPr");
        var pStyle = pPr ? getFirstByLocalName(pPr, "pStyle") : null;
        return pStyle ? (pStyle.getAttributeNS(W_NS, "val") || pStyle.getAttribute("w:val") || "") : "";
    }

    function paragraphIsHeadingStyle(p) {
        return /heading|titulo|título|subtitle|intense/i.test(paragraphStyleName(p));
    }

    function paragraphStyleBold(p) {
        var pPr = getFirstByLocalName(p, "pPr");
        return pPr ? rPrIsBold(getFirstByLocalName(pPr, "rPr")) : false;
    }

    function runIsBold(run, paraBold) {
        if (paraBold) return true;
        return rPrIsBold(getFirstByLocalName(run, "rPr"));
    }

    function isBoldParagraph(p) {
        if (paragraphStyleBold(p)) return true;
        var runs = getElementsByLocalName(p, "r");
        var sawText = false;
        for (var i = 0; i < runs.length; i++) {
            var ts = getElementsByLocalName(runs[i], "t");
            var runText = "";
            for (var j = 0; j < ts.length; j++) runText += ts[j].textContent || "";
            if (!normalizeText(runText)) continue;
            sawText = true;
            if (!runIsBold(runs[i], false)) return false;
        }
        return sawText;
    }

    function splitParagraphChunks(p) {
        var paraBold = paragraphStyleBold(p);
        var chunks = [];
        var buf = "";
        var bufBold = null;

        function flush() {
            var t = normalizeText(buf);
            if (t) chunks.push({ text: t, bold: bufBold === true });
            buf = "";
            bufBold = null;
        }

        function pushText(str, bold) {
            if (!str) return;
            if (bufBold === null) bufBold = bold;
            else if (bufBold !== bold && normalizeText(buf)) flush();
            buf += str;
            bufBold = bold;
        }

        function visit(el) {
            if (!el || el.nodeType !== 1) return;
            if (el.localName === "hyperlink" || el.localName === "sdt" || el.localName === "sdtContent") {
                var nested = el.childNodes;
                for (var n = 0; n < nested.length; n++) visit(nested[n]);
                return;
            }
            if (el.localName !== "r") return;
            var bold = runIsBold(el, paraBold);
            var kids = el.childNodes;
            for (var i = 0; i < kids.length; i++) {
                var node = kids[i];
                if (node.nodeType !== 1) continue;
                if (node.localName === "t") pushText(node.textContent || "", bold);
                else if (node.localName === "br" || node.localName === "cr") flush();
            }
        }

        var children = p.childNodes;
        for (var c = 0; c < children.length; c++) visit(children[c]);
        flush();
        return chunks;
    }

    function collectCellParagraphs(tc) {
        var paras = getElementsByLocalName(tc, "p");
        var out = [];
        for (var pi = 0; pi < paras.length; pi++) {
            var chunks = splitParagraphChunks(paras[pi]);
            if (paragraphIsHeadingStyle(paras[pi]) || paragraphStyleBold(paras[pi])) {
                chunks.forEach(function (ch) {
                    if (ch.text.length <= 70) ch.bold = true;
                });
            }
            if (chunks.length) Array.prototype.push.apply(out, chunks);
        }
        return out;
    }

    function cellPlain(cell) {
        if (!cell) return "";
        if (typeof cell === "string") return cell;
        return cell.text || "";
    }

    var ACTIVITY_VERBS = "Organizar|Criar|Pesquisar|Produzir|Montar|Elaborar|Desenvolver|Promover|Realizar|Construir|Propor|Explorar|Investigar|Registrar|Apresentar|Compartilhar|Planejar|Aplicar|Utilizar|Discutir|Refletir|Inventar|Reinventar|Adaptar";
    var BNCC_CODE_RE = /EF\d{2}[A-Z]{2}\d{2}/i;
    var EIXO_NAMES = [
        "Pensamento Computacional",
        "Mundo Digital e IA",
        "Cultura Digital e Midiática",
        "Cultura Maker"
    ];

    function matchKnownEixo(text) {
        var t = normalizeText(text);
        for (var i = 0; i < EIXO_NAMES.length; i++) {
            if (t.toLowerCase().indexOf(EIXO_NAMES[i].toLowerCase()) === 0) return EIXO_NAMES[i];
        }
        return null;
    }

    function isEixoName(text) {
        var t = normalizeText(text);
        if (!t || BNCC_CODE_RE.test(t)) return false;
        if (matchKnownEixo(t)) return true;
        return t.length <= 55 && !/[.?!]$/.test(t) && t.split(/\s+/).length <= 8;
    }

    function parseHabilidade(text) {
        var t = normalizeText(text);
        var m = t.match(/^(EF\d{2}[A-Z]{2}\d{2})\s*[:.–—-]*\s*[“"']?(.+?)[”"']?$/i);
        if (!m) return null;
        return { codigo: m[1].toUpperCase(), descricao: normalizeText(m[2]) };
    }

    function isTitleLike(p) {
        var t = (p && p.text) || "";
        if (!t || t.length > 70) return false;
        if (/[.?!]$/.test(t)) return false;
        var words = t.split(/\s+/);
        if (words.length > 8) return false;
        if (p.bold) return true;
        return words.length <= 6 && !new RegExp("^(" + ACTIVITY_VERBS + "|O|A|Os|As|Um|Uma|Para|Com|No|Na)\\b", "i").test(t);
    }

    function splitMergedActivityTitles(text) {
        if (!text) return null;
        var re = new RegExp("(^|\\.\\s+)([A-ZÁÉÍÓÚÂÊÔÃÕÀÜ][\\wÀ-ÿ]*(?:\\s+[\\wÀ-ÿ']+){0,7})\\s+(" + ACTIVITY_VERBS + ")\\b", "g");
        var hits = [];
        var m;
        while ((m = re.exec(text))) {
            hits.push({
                start: m.index + m[1].length,
                title: m[2]
            });
        }
        if (!hits.length) return null;
        if (hits.length === 1 && hits[0].start !== 0) return null;
        var blocos = [];
        for (var i = 0; i < hits.length; i++) {
            var bodyStart = hits[i].start + hits[i].title.length;
            var bodyEnd = i + 1 < hits.length ? hits[i + 1].start : text.length;
            blocos.push({
                title: hits[i].title,
                text: normalizeText(text.slice(bodyStart, bodyEnd)).replace(/\.$/, "")
            });
        }
        return blocos;
    }

    function paragraphsToBlocos(paras) {
        var blocos = [];
        var current = null;
        (paras || []).forEach(function (p) {
            if (isTitleLike(p)) {
                current = { title: p.text, text: "" };
                blocos.push(current);
                return;
            }
            var leading = splitMergedActivityTitles(p.text);
            if (leading && leading.length && leading[0].title) {
                leading.forEach(function (b) { blocos.push(b); });
                current = blocos[blocos.length - 1];
                return;
            }
            if (current) {
                current.text = current.text ? current.text + " " + p.text : p.text;
            } else {
                blocos.push({ title: "", text: p.text });
            }
        });
        return blocos;
    }

    function blocosFromDescCell(descCell) {
        var paras = (descCell && descCell.paragraphs) || [];
        var blocos = paragraphsToBlocos(paras);
        var titled = 0;
        for (var i = 0; i < blocos.length; i++) {
            if (blocos[i].title) titled++;
        }
        if (titled >= 2) return blocos;
        var merged = splitMergedActivityTitles(cellPlain(descCell));
        if (merged && merged.length >= 2) return merged;
        return blocos;
    }

    function parseTable(tbl) {
        var rows = getElementsByLocalName(tbl, "tr");
        var tableRows = [];
        for (var r = 0; r < rows.length; r++) {
            var cells = getElementsByLocalName(rows[r], "tc");
            var rowCells = [];
            for (var c = 0; c < cells.length; c++) {
                var paras = collectCellParagraphs(cells[c]);
                rowCells.push({
                    text: paras.map(function (p) { return p.text; }).join("\n"),
                    paragraphs: paras
                });
            }
            if (rowCells.some(function (cell) { return cellPlain(cell); })) tableRows.push(rowCells);
        }
        return tableRows;
    }

    function parseDocxArrayBuffer(arrayBuffer, originalFileName) {
        return JSZip.loadAsync(arrayBuffer).then(function (zip) {
            return Promise.all([
                zip.file("word/_rels/document.xml.rels").async("string"),
                zip.file("word/document.xml").async("string")
            ]).then(function (results) {
                var relDoc = new DOMParser().parseFromString(results[0], "application/xml");
                var relMap = {};
                var rels = relDoc.getElementsByTagName("Relationship");
                for (var i = 0; i < rels.length; i++) {
                    relMap[rels[i].getAttribute("Id")] = rels[i].getAttribute("Target");
                }

                var images = {};
                var imagePromises = [];
                var mediaFolder = zip.folder("word/media");
                if (mediaFolder) {
                    mediaFolder.forEach(function (_path, file) {
                        imagePromises.push(
                            file.async("uint8array").then(function (data) {
                                images[file.name.split("/").pop()] = data;
                            })
                        );
                    });
                }

                return Promise.all(imagePromises).then(function () {
                    var parsed = parseNaveDocument(results[1], relMap, images);
                    parsed.originalDocx = arrayBuffer;
                    parsed.originalFileName = originalFileName || "fonte.docx";
                    parsed.sourceZip = zip;
                    return parsed;
                });
            });
        });
    }

    function parseNaveDocument(docXml, relMap, mediaBinaries) {
        var doc = new DOMParser().parseFromString(docXml, "application/xml");
        var body = getFirstByLocalName(doc, "body");
        if (!body) throw new Error("Documento inválido.");

        var meta = { titulo: "", subtitulo: "", ano: "", duracao: "", tags: [], foco: "", eixos: [], id: "" };
        var estrutura = [];
        var sections = {
            view: { blocks: [] },
            prepare: { subsections: [] },
            materials: { items: [], notes: [] },
            create: { subsections: [] },
            reflect: { subsections: [] }
        };

        var phase = "idle";
        var etapa = 0;
        var currentSub = null;
        var workshopSub = null;
        var currentAccordion = null;
        var currentStep = null;
        var pendingImage = null;
        var lastInserirName = null;
        var imageExportCounter = 0;
        var outputImages = {};
        var expectQuadro = false;
        var inTexto = false;
        var textExpectHeading = false;
        var inModal = false;
        var inChecklist = false;
        var inAtencao = false;
        var inPassoAPasso = false;
        var awaitingAcordeonTitle = false;
        var awaitingAccordionTitle = false;
        var expectMeta = "";
        var atencaoBlock = null;
        var pendingWorkshopAtencao = [];
        var dicaCardIndex = 0;

        function sectionKey() {
            if (etapa === 1) return "prepare";
            if (etapa === 2) return "create";
            if (etapa === 3 || etapa === 4) return "reflect";
            return null;
        }

        function ensureSub(kind, title) {
            currentSub = { kind: kind, title: title || "", blocks: [], cards: [], accordions: [], items: [] };
            var sk = sectionKey();
            if (sk) sections[sk].subsections.push(currentSub);
            currentAccordion = null;
            currentStep = null;
            if (kind === "workshop") workshopSub = currentSub;
            return currentSub;
        }

        function targetBlocks() {
            if (inAtencao && atencaoBlock) return atencaoBlock.blocks;
            if (currentStep) return currentStep.blocks;
            if (currentAccordion && !inPassoAPasso && !currentStep) {
                if (!currentAccordion.intro) currentAccordion.intro = [];
                return currentAccordion.intro;
            }
            if (currentSub) return currentSub.blocks;
            if (phase === "abertura" || !sectionKey()) return sections.view.blocks;
            if (etapa === 4) {
                var beyondSub = sections.reflect.subsections.filter(function (s) { return s.kind === "beyond"; }).pop();
                if (beyondSub) {
                    currentSub = beyondSub;
                    return currentSub.blocks;
                }
                ensureSub("beyond", "Para ir além");
                return currentSub.blocks;
            }
            return sections.view.blocks;
        }

        function addBlock(block) {
            if (block.type === "list" && currentSub && currentSub.kind === "materiais") {
                sections.materials.items = sections.materials.items.concat(block.items);
                return;
            }
            if (block.type === "list" && currentSub && currentSub.kind === "perguntas_reflexivas") {
                if (!currentSub.items) currentSub.items = [];
                currentSub.items = currentSub.items.concat(block.items);
                return;
            }
            if (block.type === "figure" && currentSub && currentSub.kind === "embarque") {
                var destFig = targetBlocks();
                var lastFig = destFig[destFig.length - 1];
                if (lastFig && lastFig.type === "list" && lastFig.items && lastFig.items.length) {
                    var lastItem = lastFig.items[lastFig.items.length - 1];
                    if (typeof lastItem === "string") {
                        lastFig.items[lastFig.items.length - 1] = { text: lastItem, figure: block };
                    } else {
                        lastItem.figure = block;
                    }
                    return;
                }
            }
            targetBlocks().push(block);
        }

        function uniqueQuestionItems(arr) {
            var seen = {};
            var out = [];
            (arr || []).forEach(function (q) {
                var key = normalizeText(q).toLowerCase();
                if (!key || seen[key]) return;
                seen[key] = true;
                out.push(q);
            });
            return out;
        }

        function addParagraph(text) {
            if (text) addBlock({ type: "paragraph", text: text });
        }

        function currentEixo() {
            return meta.eixos.length ? meta.eixos[meta.eixos.length - 1] : null;
        }

        function ensureEixo(nome) {
            var last = currentEixo();
            if (last && last.nome === nome) return last;
            var eixo = { nome: nome, habilidades: [] };
            meta.eixos.push(eixo);
            return eixo;
        }

        function addHabilidadeToCurrent(text) {
            var hab = parseHabilidade(text);
            var eixo = currentEixo() || ensureEixo("Eixo da Nova BCCI");
            if (hab) eixo.habilidades.push(hab);
            else if (eixo.habilidades.length) {
                var last = eixo.habilidades[eixo.habilidades.length - 1];
                last.descricao = last.descricao ? last.descricao + " " + text : text;
            } else {
                eixo.habilidades.push({ codigo: "", descricao: text });
            }
        }

        function ingestFocoLine(text) {
            var t = normalizeText(text);
            if (!t) return;
            var known = matchKnownEixo(t);
            var mixed = t.match(/^(.+?)\s+(EF\d{2}[A-Z]{2}\d{2})\s*[:.–—-]*\s*(.+)$/i);
            if (mixed && isEixoName(mixed[1])) {
                ensureEixo(matchKnownEixo(mixed[1]) || mixed[1]);
                addHabilidadeToCurrent(mixed[2] + ": " + mixed[3]);
                return;
            }
            if (known && !BNCC_CODE_RE.test(t)) {
                ensureEixo(known);
                return;
            }
            if (isEixoName(t)) {
                ensureEixo(t);
                return;
            }
            if (BNCC_CODE_RE.test(t)) {
                addHabilidadeToCurrent(t);
                return;
            }
            if (currentEixo()) addHabilidadeToCurrent(t);
            else ensureEixo(t);
        }

        function syncFocoFromEixos() {
            if (meta.eixos.length) {
                meta.foco = meta.eixos.map(function (e) { return e.nome; }).join("; ");
            }
        }

        function emitBlocos(blocos) {
            (blocos || []).forEach(function (b) {
                if (b.title) addBlock({ type: "heading", text: b.title });
                if (b.text) addParagraph(b.text);
            });
        }

        function addEtapaParagraph(pNode, text) {
            var inBeyond = etapa === 4 || (currentSub && currentSub.kind === "beyond");
            if (inBeyond) {
                var chunks = splitParagraphChunks(pNode);
                if (chunks.length >= 2) {
                    emitBlocos(paragraphsToBlocos(chunks));
                    return;
                }
                if (isBoldParagraph(pNode) && isTitleLike({ text: text, bold: true })) {
                    addBlock({ type: "heading", text: text });
                    return;
                }
                var merged = splitMergedActivityTitles(text);
                if (merged && merged.length > 1) {
                    emitBlocos(merged);
                    return;
                }
            }
            addParagraph(text);
        }

        function isDicaSubItem(text) {
            var t = String(text || "")
                .replace(/[\u200B-\u200F\uFEFF]/g, "")
                .trim();
            if (/^[a-z][.)]\s/i.test(t)) return true;
            if (/^(Google Play|App Store)\s*:/i.test(t)) return true;
            if (/^https?:\/\//i.test(t)) return true;
            return false;
        }

        function addDicaCard(text) {
            if (!currentSub || currentSub.kind !== "dicas") return false;
            if (currentSub.cards.length && isDicaSubItem(text)) {
                var last = currentSub.cards[currentSub.cards.length - 1];
                if (/^https?:\/\//i.test(String(text).trim()) && last.items && last.items.length) {
                    last.items[last.items.length - 1] += " " + String(text).trim();
                    return true;
                }
                if (!last.items) last.items = [];
                last.items.push(text);
                return true;
            }
            dicaCardIndex++;
            var card = splitTitleContent(text);
            currentSub.cards.push({ title: card.title, content: card.content, items: [] });
            return true;
        }

        function closeAtencao() {
            if (!inAtencao || !atencaoBlock) {
                inAtencao = false;
                atencaoBlock = null;
                return;
            }
            var lines = (atencaoBlock.blocks || [])
                .filter(function (b) { return b.type === "paragraph"; })
                .map(function (b) { return b.text; });
            var note = atencaoBlock;
            inAtencao = false;
            atencaoBlock = null;
            if (phase === "materiais" || inChecklist || etapa === 0) {
                sections.materials.notes.push(note);
            } else if (currentStep) {
                addBlock(note);
            } else if (currentAccordion) {
                currentAccordion.atencao = lines;
            } else if (etapa === 2) {
                pendingWorkshopAtencao = pendingWorkshopAtencao.concat(lines);
            } else {
                addBlock(note);
            }
        }

        function flushPendingWorkshopAtencao() {
            if (!pendingWorkshopAtencao.length) return;
            if (!workshopSub) ensureSub("workshop", "Atividades");
            workshopSub.atencao = (workshopSub.atencao || []).concat(pendingWorkshopAtencao);
            pendingWorkshopAtencao = [];
        }

        function startEtapa(num, label) {
            closeAtencao();
            etapa = num;
            phase = "etapa";
            currentSub = null;
            currentAccordion = null;
            currentStep = null;
            workshopSub = null;
            inTexto = false;
            inChecklist = false;
            inPassoAPasso = false;
            textExpectHeading = false;
            dicaCardIndex = 0;
            expectMeta = "";
            var name = normalizeText(label || "");
            if (num === 4 || /al[eé]m/i.test(name)) {
                etapa = 4;
                var existingBeyond = sections.reflect.subsections.filter(function (s) { return s.kind === "beyond"; }).pop();
                if (existingBeyond) currentSub = existingBeyond;
                else ensureSub("beyond", "Para ir além");
            }
        }

        function flushPendingImage(caption) {
            if (!pendingImage) return;
            var filename = lastInserirName || pendingImage.hint || slugify(caption || pendingImage.media) + ".png";
            if (!/\.[a-z0-9]+$/i.test(filename)) filename += ".png";
            filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
            if (pendingImage.media) {
                var mediaExt = (String(pendingImage.media).split(".").pop() || "").toLowerCase();
                var reqExt = (filename.split(".").pop() || "").toLowerCase();
                if (mediaExt && reqExt && mediaExt !== reqExt) {
                    filename = filename.replace(/\.[^.]+$/, "." + mediaExt);
                }
            }
            var stemMatch = findImageByStem(filename, mediaBinaries) || findImageByStem(filename, outputImages);
            if (stemMatch) filename = stemMatch;
            if (outputImages[filename] && pendingImage.media && mediaBinaries[pendingImage.media]) {
                imageExportCounter++;
                var ext = filename.replace(/^.*\./, "") || "png";
                filename = slugify(caption || "imagem") + "-" + imageExportCounter + "." + ext;
            }
            if (pendingImage.media && mediaBinaries[pendingImage.media]) {
                outputImages[filename] = mediaBinaries[pendingImage.media];
            }
            var figBlock = {
                type: "figure",
                src: "images/" + filename,
                alt: caption || filename,
                caption: caption || ""
            };
            if (pendingImage.attachTo) {
                if (!pendingImage.attachTo.extra) pendingImage.attachTo.extra = [];
                pendingImage.attachTo.extra.push(figBlock);
            } else {
                addBlock(figBlock);
            }
            pendingImage = null;
            lastInserirName = null;
        }

        function handleInserir(name) {
            lastInserirName = name;
            var fileName = name;
            if (!/\.[a-z0-9]+$/i.test(fileName)) {
                if (/gif/i.test(fileName)) fileName += ".gif";
                else fileName += ".png";
            }
            var resolved = findImageByStem(fileName, mediaBinaries) || findImageByStem(fileName, outputImages);
            if (resolved) fileName = resolved;
            var figBlock = { type: "figure", src: "images/" + fileName, alt: fileName, caption: "", placeholder: !mediaBinaries[fileName] && !outputImages[fileName] };
            if (pendingImage && pendingImage.media && mediaBinaries[pendingImage.media]) {
                var mediaExt = (String(pendingImage.media).split(".").pop() || "").toLowerCase();
                var reqExt = (fileName.split(".").pop() || "").toLowerCase();
                if (mediaExt && reqExt && mediaExt !== reqExt) {
                    fileName = fileName.replace(/\.[^.]+$/, "." + mediaExt);
                    figBlock.src = "images/" + fileName;
                    figBlock.alt = fileName;
                }
                outputImages[fileName] = mediaBinaries[pendingImage.media];
                figBlock.placeholder = false;
                pendingImage = null;
            } else if (mediaBinaries[fileName]) {
                outputImages[fileName] = mediaBinaries[fileName];
                figBlock.placeholder = false;
            }
            if (currentSub && currentSub.kind === "dicas" && currentSub.cards.length) {
                var lc = currentSub.cards[currentSub.cards.length - 1];
                if (!lc.extra) lc.extra = [];
                lc.extra.push(figBlock);
                lastInserirName = null;
                return;
            }
            addBlock(figBlock);
            lastInserirName = null;
        }

        function handleImagesInText(text) {
            var files = parseImgFiles(text);
            var inserir = parseInserir(text);
            if (inserir) files.push(inserir);
            files.forEach(handleInserir);
            return files.length > 0;
        }

        function handleMarker(text) {
            if (expectMeta === "foco" && /^\[/.test(text) && !/^\[Eixos/i.test(text)) {
                expectMeta = "";
            }
            if (/^\[modal\]/i.test(text)) {
                inModal = true;
                expectMeta = "";
                return true;
            }
            if (/^\[\/modal\]/i.test(text)) {
                inModal = false;
                return true;
            }
            if (inModal) return true;

            if (/^\[\/text(?:o)?\]/i.test(text)) {
                inTexto = false;
                textExpectHeading = false;
                return true;
            }
            if (/^\[\/card\]/i.test(text)) {
                inChecklist = false;
                return true;
            }
            if (/^\[\/acordeon\]/i.test(text)) {
                awaitingAcordeonTitle = false;
                if (currentSub && currentSub.kind !== "workshop" && currentSub.kind !== "prototype" && currentSub.kind !== "beyond") {
                    currentSub = null;
                }
                return true;
            }
            if (/^\[\/passo a passo\]/i.test(text)) {
                inPassoAPasso = false;
                currentStep = null;
                return true;
            }
            if (/^\[\/Aten/i.test(text)) {
                closeAtencao();
                return true;
            }

            if (/^\[ABERTURA\]/i.test(text)) {
                phase = "abertura";
                return true;
            }

            if (/^\[card\]/i.test(text)) {
                if (/check-list/i.test(text)) inChecklist = true;
                return true;
            }

            if (/^\[check-list\]/i.test(text) || /^\[Lista de materiais/i.test(text)) {
                phase = "materiais";
                inChecklist = true;
                etapa = 0;
                currentSub = null;
                return true;
            }

            if (/^\[p[uú]blico-alvo\]/i.test(text)) {
                expectMeta = "ano";
                return true;
            }
            if (/^\[tempo para desenvolvimento/i.test(text)) {
                expectMeta = "duracao";
                return true;
            }
            if (/^\[Eixos/i.test(text)) {
                expectMeta = "foco";
                if (!meta.eixos) meta.eixos = [];
                return true;
            }

            var tituloOficina = text.match(/^\[T[ií]tulo da oficina\]\s*(.*)/i);
            if (tituloOficina) {
                var titleValue = normalizeText(tituloOficina[1]);
                if (titleValue) {
                    meta.titulo = titleValue;
                    meta.id = slugify(meta.titulo);
                }
                phase = "abertura";
                expectMeta = titleValue ? "" : "titulo";
                return true;
            }

            var textoM = text.match(/^\[text(?:o)?\]\s*(.*)/i);
            if (textoM) {
                inTexto = true;
                textExpectHeading = etapa > 0;
                var leftover = normalizeText(textoM[1]);
                if (leftover) addParagraph(leftover);
                return true;
            }

            if (/^\[x\]\s*(.+)/i.test(text)) {
                var checked = normalizeText(text.replace(/^\[x\]\s*/i, ""));
                if (/\d\s*[º°o]\s*ano|EFAF|EM|a partir de/i.test(checked)) meta.ano = checked;
                else if (/min/i.test(checked)) meta.duracao = checked.replace(/\s*ou\s*$/i, "");
                else if (/foco\)/i.test(checked) || /computacional|digital|midi|fabric/i.test(checked)) {
                    ingestFocoLine(checked.replace(/\s*\(foco\)\s*/i, ""));
                    syncFocoFromEixos();
                }
                return true;
            }

            if (/^\[Quadro-resumo\]/i.test(text)) {
                expectQuadro = true;
                return true;
            }

            var etapaM = text.match(/^\[Etapa\s*(\d+)\]\s*(.*)/i);
            if (etapaM) {
                startEtapa(parseInt(etapaM[1], 10), etapaM[2]);
                return true;
            }
            if (/^(Preparar|Criar|Refletir)$/i.test(text) && phase === "etapa") return true;

            var tempo = text.match(/^\[Tempo para a etapa\]\s*(.+)/i);
            if (tempo) return true;

            if (/^\[acordeon\]/i.test(text)) {
                closeAtencao();
                awaitingAcordeonTitle = true;
                return true;
            }

            if (/^\[passo a passo\]/i.test(text)) {
                closeAtencao();
                inPassoAPasso = true;
                if (etapa === 2) {
                    if (!workshopSub) ensureSub("workshop", "Atividades");
                    flushPendingWorkshopAtencao();
                }
                return true;
            }

            var secao = text.match(/^\[Se[cç][aã]o\s*\d+\]\s*(.+)/i);
            if (secao) {
                var name = normalizeText(secao[1]);
                ensureSub(kindFromHeading(name), name);
                return true;
            }
            if (/^\[Perguntas reflexivas\]/i.test(text)) {
                ensureSub("perguntas_reflexivas", "Perguntas reflexivas");
                return true;
            }
            if (/^\[Elemento-chave\]/i.test(text)) {
                ensureSub("elemento_chave", "Elemento-chave");
                return true;
            }

            var proto = text.match(/^\[T[ií]tulo do prot[oó]tipo\]\s*(.+)/i);
            if (proto) {
                var full = normalizeText(proto[1]);
                var parts = full.split(/\s[-–—]\s/);
                ensureSub("prototype", "Protótipo");
                currentSub.prototypeTitle = parts[0] || full;
                currentSub.prototypeSubtitle = parts[1] || "";
                return true;
            }

            if (/^\[T[ií]tulo\]\s*$/i.test(text) && etapa === 2) {
                closeAtencao();
                inPassoAPasso = false;
                currentStep = null;
                awaitingAccordionTitle = true;
                if (!workshopSub) ensureSub("workshop", "Atividades");
                return true;
            }
            var accTitle = text.match(/^\[T[ií]tulo\]\s*(.+)/i);
            if (accTitle && etapa === 2) {
                closeAtencao();
                inPassoAPasso = false;
                currentStep = null;
                if (!workshopSub) ensureSub("workshop", "Atividades");
                flushPendingWorkshopAtencao();
                currentAccordion = {
                    title: normalizeText(accTitle[1]),
                    steps: [],
                    intro: [],
                    open: !workshopSub.accordions.length
                };
                workshopSub.accordions.push(currentAccordion);
                currentStep = null;
                return true;
            }

            var atencaoOpen = text.match(/^\[Aten[cç][aã]o!?\]\s*(.*)/i);
            if (atencaoOpen) {
                if (inAtencao) closeAtencao();
                inAtencao = true;
                atencaoBlock = {
                    type: "atencao",
                    title: normalizeText(atencaoOpen[1]) || "Atenção!",
                    blocks: []
                };
                return true;
            }

            var dicaBox = text.match(/^\[Box:\s*Dica\]\s*(.*)/i);
            if (dicaBox) {
                addBlock({ type: "dica", content: normalizeText(dicaBox[1]) || "" });
                return true;
            }
            var dica = text.match(/^\[Dica\]\s*(.*)/i);
            if (dica) {
                addBlock({ type: "dica", content: normalizeText(dica[1]) || "" });
                return true;
            }
            var cta = text.match(/^\[CTA\]\s*(.+)/i);
            if (cta) {
                var ctaBlock = { type: "cta", text: normalizeText(cta[1]) };
                if (currentSub && currentSub.kind === "dicas" && currentSub.cards.length) {
                    var lc = currentSub.cards[currentSub.cards.length - 1];
                    if (!lc.extra) lc.extra = [];
                    lc.extra.push(ctaBlock);
                } else addBlock(ctaBlock);
                return true;
            }
            if (/^\[QR-code/i.test(text)) {
                var qrBlock = { type: "qr", text: normalizeText(text) };
                if (currentSub && currentSub.kind === "dicas" && currentSub.cards.length) {
                    var lq = currentSub.cards[currentSub.cards.length - 1];
                    if (!lq.extra) lq.extra = [];
                    lq.extra.push(qrBlock);
                } else addBlock(qrBlock);
                return true;
            }
            if (/^\[Imagem/i.test(text)) {
                handleImagesInText(text);
                return true;
            }
            if (/^<CONTE/i.test(text)) return true;
            if (/^\[estimativa/i.test(text)) return true;
            if (/^\[Sugest/i.test(text)) return true;
            if (/^\[\s*\]/i.test(text)) return true;
            if (isMarkerOnly(text)) return true;
            if (/^\[[^\]]+\]/.test(text) && parseImgFiles(text).length) {
                handleImagesInText(text);
                return true;
            }
            return false;
        }

        var children = body.childNodes;
        for (var n = 0; n < children.length; n++) {
            var node = children[n];
            if (node.nodeType !== 1) continue;
            var tag = node.localName;

            if (tag === "tbl") {
                var rows = parseTable(node);
                if (expectQuadro || isQuadroTable(rows)) {
                    for (var ri = 1; ri < rows.length; ri++) {
                        var descCell = rows[ri][2] || {};
                        estrutura.push({
                            nome: cellPlain(rows[ri][0]),
                            duracao: cellPlain(rows[ri][1]),
                            descricao: cellPlain(descCell),
                            blocos: blocosFromDescCell(descCell)
                        });
                    }
                    expectQuadro = false;
                } else {
                    addBlock({
                        type: "table",
                        rows: rows.map(function (row) {
                            return row.map(cellPlain);
                        })
                    });
                }
                continue;
            }

            if (tag !== "p") continue;

            var text = collectParagraphText(node);
            var embedded = getEmbeddedMedia(node, relMap);
            var isList = isListItem(node);

            if (embedded && !text) {
                pendingImage = { media: embedded, hint: lastInserirName };
                if (currentSub && currentSub.kind === "dicas" && currentSub.cards.length) {
                    pendingImage.attachTo = currentSub.cards[currentSub.cards.length - 1];
                }
                continue;
            }

            if (!text) continue;
            if (isInternalNote(text)) continue;

            if (handleMarker(text)) continue;

            if (expectMeta === "titulo") {
                meta.titulo = text;
                meta.id = slugify(meta.titulo);
                expectMeta = "";
                continue;
            }
            if (expectMeta === "ano") {
                meta.ano = text;
                expectMeta = "";
                continue;
            }
            if (expectMeta === "duracao") {
                meta.duracao = text;
                expectMeta = "";
                continue;
            }
            if (expectMeta === "foco") {
                ingestFocoLine(text);
                syncFocoFromEixos();
                continue;
            }

            if (awaitingAcordeonTitle) {
                awaitingAcordeonTitle = false;
                ensureSub(kindFromHeading(text), text);
                continue;
            }

            if (awaitingAccordionTitle) {
                awaitingAccordionTitle = false;
                if (!workshopSub) ensureSub("workshop", "Atividades");
                flushPendingWorkshopAtencao();
                currentAccordion = {
                    title: text,
                    steps: [],
                    intro: [],
                    open: !workshopSub.accordions.length
                };
                workshopSub.accordions.push(currentAccordion);
                currentStep = null;
                continue;
            }

            if (/^Figura\s*[-–—:]\s*(.+)/i.test(text)) {
                flushPendingImage(normalizeText(text.replace(/^Figura\s*[-–—:]\s*/i, "")));
                continue;
            }

            if (handleImagesInText(text) && !text.replace(/\[imagem[^\]]*\]/ig, "").replace(/<img>[\s\S]*?<\/img>/ig, "").trim()) {
                continue;
            }

            if (inAtencao) {
                if (isBoldParagraph(node) && (isTitleLike({ text: text, bold: true }) || paragraphIsHeadingStyle(node) || /^\(/.test(text) || (text.length <= 120 && !/[.!?]$/.test(text)))) {
                    addBlock({ type: "subtitle", text: text });
                } else if (isList || /^\d+\.\s+/.test(text)) {
                    var itemText = text.replace(/^\d+\.\s+/, "");
                    var dest = targetBlocks();
                    var lastBlock = dest[dest.length - 1];
                    if (lastBlock && lastBlock.type === "list") lastBlock.items.push(itemText);
                    else addBlock({ type: "list", ordered: true, items: [itemText] });
                } else {
                    addParagraph(text);
                }
                continue;
            }

            var stepM = text.match(/^(\d+)\.\s+(.+)/);
            if (stepM && etapa === 2 && (currentAccordion || inPassoAPasso)) {
                if (!workshopSub) ensureSub("workshop", "Atividades");
                if (!currentAccordion) {
                    currentAccordion = { title: "Atividade", steps: [], intro: [], open: !workshopSub.accordions.length };
                    workshopSub.accordions.push(currentAccordion);
                }
                currentStep = { title: normalizeText(stepM[2]), blocks: [] };
                currentAccordion.steps.push(currentStep);
                continue;
            }
            if (stepM && etapa === 4) {
                addBlock({ type: "heading", text: stepM[1] + ". " + stepM[2] });
                continue;
            }

            if (inChecklist || phase === "materiais") {
                if (/^recursos necess/i.test(text)) continue;
                sections.materials.items.push(text);
                continue;
            }

            if (isList || (currentSub && currentSub.kind === "embarque" && /^\d+\.\s+/.test(text))) {
                if (currentSub && currentSub.kind === "dicas") {
                    addDicaCard(text);
                    continue;
                }
                if (currentSub && currentSub.kind === "perguntas_reflexivas") {
                    if (!currentSub.items) currentSub.items = [];
                    currentSub.items.push(text);
                    continue;
                }
                if (currentSub && currentSub.kind === "materiais") {
                    sections.materials.items.push(text);
                    continue;
                }
                if (currentSub && currentSub.kind === "embarque") {
                    var embarqueItem = text.replace(/^\d+\.\s+/, "");
                    var destEmb = targetBlocks();
                    var lastEmb = destEmb[destEmb.length - 1];
                    if (lastEmb && lastEmb.type === "list" && lastEmb.ordered) {
                        lastEmb.items.push(embarqueItem);
                    } else {
                        addBlock({ type: "list", ordered: true, items: [embarqueItem] });
                    }
                    continue;
                }
                addBlock({ type: "list", ordered: false, items: [text] });
                continue;
            }

            if (/^DICA:\s*/i.test(text)) {
                addBlock({ type: "dica", content: text.replace(/^DICA:\s*/i, "") });
                continue;
            }

            if (/^Op[cç][aã]o\s*\d+/i.test(text) && currentSub && currentSub.kind === "aprendizados") {
                addBlock({ type: "option_card", text: text });
                continue;
            }

            if (/^Din[aâ]mica de compartilhamento:/i.test(text)) {
                addBlock({ type: "heading", text: text });
                continue;
            }

            if (textExpectHeading && isHeadingLike(text) && kindFromHeading(text) !== "generic") {
                ensureSub(kindFromHeading(text), text);
                textExpectHeading = false;
                continue;
            }
            if (textExpectHeading && isHeadingLike(text) && /^(Apresentação|Embarque|Aprendizados|Dicas de condução)$/i.test(text)) {
                ensureSub(kindFromHeading(text), text);
                textExpectHeading = false;
                continue;
            }
            textExpectHeading = false;

            if (/^Dicas de condu/i.test(text) && (!currentSub || currentSub.kind !== "dicas")) {
                ensureSub("dicas", "Dicas de condução");
                continue;
            }

            if (currentSub && currentSub.kind === "dicas") {
                addDicaCard(text);
                continue;
            }

            if (currentSub && currentSub.kind === "perguntas_reflexivas") {
                if (!currentSub.items) currentSub.items = [];
                currentSub.items.push(text);
                continue;
            }

            if (phase === "abertura" && inTexto && text && !/^\[/.test(text)) {
                sections.view.blocks.push({ type: "paragraph", text: text });
                continue;
            }

            if (phase === "etapa" && text) {
                addEtapaParagraph(node, text);
            }
        }

        flushPendingImage("");
        if (inAtencao) closeAtencao();

        if (!meta.titulo) throw new Error("Não foi possível identificar [Título da oficina] no documento.");
        if (!meta.id) meta.id = slugify(meta.titulo);

        sections.prepare.subsections.forEach(function (sub) {
            if (sub.kind === "perguntas_reflexivas" && sub.items && sub.items.length) {
                sub.items = uniqueQuestionItems(sub.items);
                sub.blocks = [{ type: "list", ordered: false, items: sub.items }];
            }
        });
        sections.reflect.subsections.forEach(function (sub) {
            if (sub.kind === "perguntas_reflexivas" && sub.items && sub.items.length) {
                sub.items = uniqueQuestionItems(sub.items);
                sub.blocks = [{ type: "list", ordered: false, items: sub.items }];
            }
        });

        if (workshopSub && pendingWorkshopAtencao.length) {
            flushPendingWorkshopAtencao();
        }

        var viewBlocks = sections.view.blocks || [];
        while (viewBlocks.length) {
            var first = viewBlocks[0];
            if (first.type !== "paragraph") break;
            if (isEixoName(first.text) || BNCC_CODE_RE.test(first.text)) {
                ingestFocoLine(first.text);
                viewBlocks.shift();
            } else break;
        }
        syncFocoFromEixos();

        return { meta: meta, estrutura: estrutura, sections: sections, images: outputImages };
    }

    global.NaveDocxParser = {
        parse: parseDocxArrayBuffer,
        slugify: slugify,
        normalizeText: normalizeText
    };
})(typeof window !== "undefined" ? window : globalThis);
