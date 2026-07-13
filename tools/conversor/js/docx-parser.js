/**
 * Parser de .docx NAVE — template com marcadores [Título da oficina], [Etapa 1], [Seção 1], etc.
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

    function parseTable(tbl) {
        var rows = getElementsByLocalName(tbl, "tr");
        var tableRows = [];
        for (var r = 0; r < rows.length; r++) {
            var cells = getElementsByLocalName(rows[r], "tc");
            var rowCells = [];
            for (var c = 0; c < cells.length; c++) {
                var paras = getElementsByLocalName(cells[c], "p");
                var cellText = "";
                for (var pi = 0; pi < paras.length; pi++) {
                    cellText += (cellText ? " " : "") + collectParagraphText(paras[pi]);
                }
                rowCells.push(normalizeText(cellText));
            }
            if (rowCells.some(Boolean)) tableRows.push(rowCells);
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

        var meta = { titulo: "", subtitulo: "", ano: "", duracao: "", tags: [], foco: "", id: "" };
        var estrutura = [];
        var sections = {
            view: { blocks: [] },
            prepare: { subsections: [] },
            materials: { items: [] },
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
        var dicaCardIndex = 0;

        function sectionKey() {
            if (etapa === 1) return "prepare";
            if (etapa === 2) return "create";
            if (etapa === 3) return "reflect";
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
            if (phase === "abertura" || !sectionKey()) return sections.view.blocks;
            if (currentStep) return currentStep.blocks;
            if (currentSub) return currentSub.blocks;
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
            targetBlocks().push(block);
        }

        function addParagraph(text) {
            if (text) addBlock({ type: "paragraph", text: text });
        }

        function flushPendingImage(caption) {
            if (!pendingImage) return;
            var filename = lastInserirName || pendingImage.hint || slugify(caption || pendingImage.media) + ".png";
            if (!/\.[a-z0-9]+$/i.test(filename)) filename += ".png";
            filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
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
            var figBlock = { type: "figure", src: "images/" + fileName, alt: fileName, caption: "", placeholder: !mediaBinaries[fileName] };
            if (pendingImage && pendingImage.media && mediaBinaries[pendingImage.media]) {
                outputImages[fileName] = mediaBinaries[pendingImage.media];
                figBlock.placeholder = false;
                pendingImage = null;
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

        function handleMarker(text, isList) {
            if (/^\[ABERTURA\]/i.test(text)) {
                phase = "abertura";
                return true;
            }
            var tituloOficina = text.match(/^\[T[ií]tulo da oficina\]\s*(.+)/i);
            if (tituloOficina) {
                meta.titulo = normalizeText(tituloOficina[1]);
                meta.id = slugify(meta.titulo);
                phase = "abertura";
                return true;
            }
            if (/^\[Texto\]/i.test(text)) {
                inTexto = true;
                return true;
            }
            if (/^\[x\]\s*(.+)/i.test(text)) {
                var checked = normalizeText(text.replace(/^\[x\]\s*/i, ""));
                if (/\d\s*[º°o]\s*ano|EFAF|EM/i.test(checked)) meta.ano = checked;
                else if (/min/i.test(checked)) meta.duracao = checked.replace(/\s*ou\s*$/i, "");
                else if (/foco\)/i.test(checked) || /computacional|digital|midi|fabric/i.test(checked)) meta.foco = checked;
                return true;
            }
            if (/^\[Quadro-resumo\]/i.test(text)) {
                expectQuadro = true;
                return true;
            }
            var etapaM = text.match(/^\[Etapa\s*(\d+)\]/i);
            if (etapaM) {
                etapa = parseInt(etapaM[1], 10);
                phase = "etapa";
                currentSub = null;
                currentAccordion = null;
                currentStep = null;
                inTexto = false;
                dicaCardIndex = 0;
                return true;
            }
            if (/^(Preparar|Criar|Refletir)$/i.test(text) && phase === "etapa") return true;

            var tempo = text.match(/^\[Tempo para a etapa\]\s*(.+)/i);
            if (tempo) return true;

            var secao = text.match(/^\[Se[cç][aã]o\s*\d+\]\s*(.+)/i);
            if (secao) {
                var name = normalizeText(secao[1]);
                var kind = "generic";
                if (/apresenta/i.test(name)) kind = "apresentacao";
                else if (/dicas de condu/i.test(name)) kind = "dicas";
                else if (/embarque/i.test(name)) kind = "embarque";
                else if (/passo a passo/i.test(name)) kind = "passo_a_passo";
                else if (/aprendizados/i.test(name)) kind = "aprendizados";
                else if (/para ir al[eé]m/i.test(name)) kind = "beyond";
                ensureSub(kind, name);
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
            if (/^\[Lista de materiais/i.test(text)) {
                ensureSub("materiais", "Materiais");
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
            var accTitle = text.match(/^\[T[ií]tulo\]\s*(.+)/i);
            if (accTitle && etapa === 2) {
                if (!workshopSub) ensureSub("workshop", "Atividades");
                currentAccordion = {
                    title: normalizeText(accTitle[1]),
                    steps: [],
                    open: !workshopSub.accordions.length
                };
                workshopSub.accordions.push(currentAccordion);
                currentStep = null;
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
            if (/^\[Imagem\s*\d+\]/i.test(text)) {
                var ins = parseInserir(text);
                if (ins) handleInserir(ins);
                return true;
            }
            if (/^<CONTE/i.test(text)) return true;
            if (/^\[estimativa/i.test(text)) return true;
            if (/^\[Sugest/i.test(text)) return true;
            if (/^\[Eixos/i.test(text)) return true;
            if (/^\[\s*\]/i.test(text)) return true;
            return false;
        }

        var children = body.childNodes;
        for (var n = 0; n < children.length; n++) {
            var node = children[n];
            if (node.nodeType !== 1) continue;
            var tag = node.localName;

            if (tag === "tbl") {
                if (expectQuadro) {
                    var rows = parseTable(node);
                    for (var ri = 1; ri < rows.length; ri++) {
                        estrutura.push({
                            nome: rows[ri][0] || "",
                            duracao: rows[ri][1] || "",
                            descricao: rows[ri][2] || ""
                        });
                    }
                    expectQuadro = false;
                } else if (currentSub) {
                    addBlock({ type: "table", rows: parseTable(node) });
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

            if (text && handleMarker(text, isList)) continue;

            if (/^Figura\s*[-–—:]\s*(.+)/i.test(text)) {
                flushPendingImage(normalizeText(text.replace(/^Figura\s*[-–—:]\s*/i, "")));
                continue;
            }

            var inserir = parseInserir(text);
            if (inserir) {
                handleInserir(inserir);
                continue;
            }

            if (isList) {
                if (currentSub && currentSub.kind === "dicas") {
                    dicaCardIndex++;
                    var card = splitTitleContent(text);
                    currentSub.cards.push({ title: card.title, content: card.content });
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
                addBlock({ type: "list", ordered: false, items: [text] });
                continue;
            }

            var stepM = text.match(/^(\d+)\.\s+(.+)/);
            if (stepM && etapa === 2 && currentAccordion) {
                currentStep = { title: normalizeText(stepM[2]), blocks: [] };
                currentAccordion.steps.push(currentStep);
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

            if (phase === "abertura" && inTexto && text && !/^\[/.test(text)) {
                sections.view.blocks.push({ type: "paragraph", text: text });
                continue;
            }

            if (phase === "etapa" && text) {
                if (currentSub && currentSub.kind === "dicas" && !/^\[/.test(text)) {
                    dicaCardIndex++;
                    var dc = splitTitleContent(text);
                    currentSub.cards.push({ title: dc.title, content: dc.content });
                    continue;
                }
                addParagraph(text);
            }
        }

        flushPendingImage("");

        if (!meta.titulo) throw new Error("Não foi possível identificar [Título da oficina] no documento.");
        if (!meta.id) meta.id = slugify(meta.titulo);

        sections.prepare.subsections.forEach(function (sub) {
            if (sub.kind === "perguntas_reflexivas" && sub.items) {
                sub.blocks = [{ type: "list", ordered: false, items: sub.items }];
            }
            if (sub.kind === "elemento_chave") sub.kind = "elemento_chave";
        });
        sections.reflect.subsections.forEach(function (sub) {
            if (sub.kind === "perguntas_reflexivas" && sub.items) {
                sub.blocks = [{ type: "list", ordered: false, items: sub.items }];
            }
        });

        return { meta: meta, estrutura: estrutura, sections: sections, images: outputImages };
    }

    global.NaveDocxParser = {
        parse: parseDocxArrayBuffer,
        slugify: slugify,
        normalizeText: normalizeText
    };
})(typeof window !== "undefined" ? window : globalThis);
