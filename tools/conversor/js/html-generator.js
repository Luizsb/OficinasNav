/**
 * Gera index.html de oficina NAVE a partir da estrutura parseada.
 */
(function (global) {
    "use strict";

    function escapeHtml(str) {
        return String(str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function renderMetaChip(type, value, variant, options) {
        if (!value) return "";
        variant = variant || "badge";
        options = options || {};
        var hints = {
            audience: "Público-alvo",
            duration: "Tempo para desenvolvimento da oficina",
            focus: "Eixo / foco pedagógico"
        };
        var icons = {
            audience: "school",
            duration: "timer",
            focus: "account_tree"
        };
        var hint = options.hint || hints[type] || "";
        var icon = icons[type] || "info";
        var chipClass = "nave-meta-chip";
        if (variant === "badge") {
            chipClass += " flex items-center gap-2 bg-surface px-4 py-2 rounded-DEFAULT border border-outline-variant shadow-sm";
        } else if (variant === "compact") {
            chipClass += " nave-meta-chip--compact text-label-sm font-label-sm text-on-surface-variant";
        }
        var iconClass =
            variant === "badge"
                ? ' class="material-symbols-outlined"'
                : ' class="material-symbols-outlined" aria-hidden="true"';
        var valueClass =
            variant === "badge"
                ? ' class="nave-meta-chip__value text-label-sm font-label-sm"'
                : ' class="nave-meta-chip__value"';
        var extraAttrs = "";
        if (options.hint) {
            extraAttrs += ' data-nave-meta-hint="' + escapeHtml(options.hint) + '"';
        }
        if (options.expandId) {
            extraAttrs += ' data-nave-meta-expand="' + escapeHtml(options.expandId) + '"';
        }
        if (options.modalId) {
            extraAttrs += ' data-nave-meta-modal="' + escapeHtml(options.modalId) + '"';
        }
        return (
            '<span class="' + chipClass + '" data-nave-meta="' + type + '" tabindex="0" title="' + escapeHtml(hint) + '"' + extraAttrs + ">" +
            "<span" + iconClass + ">" + icon + "</span>" +
            "<span" + valueClass + ">" + escapeHtml(value) + "</span>" +
            '<span class="nave-meta-chip__hint" role="tooltip">' + escapeHtml(hint) + "</span></span>"
        );
    }

    function linkify(text) {
        var escaped = escapeHtml(text);
        return escaped.replace(
            /(https?:\/\/[^\s<]+)/g,
            '<a class="text-prepare hover:underline" href="$1" rel="noopener noreferrer" target="_blank">$1</a>'
        );
    }

    function renderParagraph(text, cls) {
        cls = cls || "text-body-md font-body-md text-on-surface-variant";
        return '<p class="' + cls + '">' + linkify(text) + "</p>";
    }

    function renderBlocks(blocks, sectionColor) {
        if (!blocks || !blocks.length) return "";
        return blocks.map(function (block) {
            if (block.type === "paragraph") return renderParagraph(block.text);
            if (block.type === "list") return renderList(block);
            if (block.type === "figure") return renderFigure(block);
            if (block.type === "table") return renderTable(block);
            if (block.type === "dica") return renderDica(block, sectionColor || "prepare");
            if (block.type === "cta") return renderCta(block, sectionColor || "prepare");
            if (block.type === "qr") return renderQr(block, sectionColor || "prepare");
            if (block.type === "heading") {
                return '<h4 class="text-headline-sm font-headline-sm text-primary-container">' + escapeHtml(block.text) + "</h4>";
            }
            if (block.type === "option_card") return renderOptionCard(block);
            return "";
        }).join("");
    }

    function renderCta(block, color) {
        color = color || "prepare";
        return (
            '<a class="inline-flex items-center gap-2 text-label-md font-label-md bg-' + color + ' text-on-' + color + ' px-5 py-3 rounded-DEFAULT smooth-transition hover:bg-' + color + '/90" href="#video-tutorial" title="' + escapeHtml(block.text) + '">' +
            '<span class="material-symbols-outlined">play_circle</span>' + escapeHtml(block.text) + "</a>"
        );
    }

    function renderQr(block, color) {
        color = color || "prepare";
        return (
            '<div class="flex flex-col sm:flex-row items-center gap-6 p-4 bg-surface-container-low rounded-xl border border-outline-variant w-full max-w-md">' +
            '<div class="w-32 h-32 bg-white border-2 border-outline-variant rounded-lg p-2 shrink-0 flex items-center justify-center" aria-label="QR-code simulado">' +
            '<svg class="w-full h-full text-on-surface" viewBox="0 0 29 29" fill="currentColor" aria-hidden="true"><path d="M0 0h7v7H0V0zm22 0h7v7h-7V0zM0 22h7v7H0v-7zm22 0h7v7h-7v-7zM9 0h2v2H9V0zm0 4h2v2H9V4zm0 4h2v2H9V8zm4-8h2v2h-2V0zm4 0h2v2h-2V0zm-4 4h2v2h-2V4zm4 0h2v2h-2V4zm-8 4h2v2H9v-2zm8 0h2v2h-2v-2zm-8 4h2v2H9v-2zm0 4h2v2H9v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4-4h2v2h-2v-2zm0 4h2v2h-2v-2zM9 22h2v2H9v-2zm8 0h2v2h-2v-2z"/></svg></div>' +
            '<div class="space-y-2 text-center sm:text-left"><p class="text-body-sm font-body-md text-on-surface-variant">' + escapeHtml(block.text) + '</p>' +
            '<a class="text-' + color + ' text-label-md font-label-md hover:underline" href="#video-tutorial">Link do vídeo tutorial (em breve)</a></div></div>'
        );
    }

    function renderVideoExtras(extras, color) {
        if (!extras || !extras.length) return "";
        var blocks = extras
            .map(function (ex) {
                if (ex.type === "cta") return renderCta(ex, color);
                if (ex.type === "qr") return renderQr(ex, color);
                return "";
            })
            .filter(Boolean)
            .join("");
        if (!blocks) return "";
        return '<div class="flex flex-col items-center gap-5 pt-1">' + blocks + "</div>";
    }

    function renderOptionCard(block) {
        var m = block.text.match(/^Op[cç][aã]o\s*\d+\s*[–—-]\s*([^:]+):\s*(.+)/i);
        if (m) {
            return (
                '<div class="bg-surface p-5 sm:p-6 rounded-xl border border-outline-variant">' +
                '<p class="text-body-md font-body-md text-on-surface-variant"><strong class="text-on-surface">Opção — ' + escapeHtml(m[1].trim()) + ":</strong> " + linkify(m[2].trim()) + "</p></div>"
            );
        }
        return '<div class="bg-surface p-5 sm:p-6 rounded-xl border border-outline-variant"><p class="text-body-md font-body-md text-on-surface-variant">' + linkify(block.text) + "</p></div>";
    }

    function renderList(block, cls) {
        cls = cls || "text-body-md font-body-md text-on-surface-variant";
        var tag = block.ordered ? "ol" : "ul";
        var listCls = block.ordered ? "list-decimal pl-5 space-y-2" : "list-disc pl-5 space-y-2";
        var items = block.items.map(function (item) {
            return '<li class="' + cls + '">' + linkify(item) + "</li>";
        }).join("");
        return "<" + tag + ' class="' + listCls + '">' + items + "</" + tag + ">";
    }

    function renderFigure(block) {
        var cap = block.caption
            ? '<figcaption class="mt-2 text-label-sm font-label-sm text-on-surface-variant">' +
              escapeHtml(block.caption) + "</figcaption>"
            : "";
        return (
            '<figure class="max-w-xl mx-auto my-4 text-center">' +
            '<img alt="' + escapeHtml(block.alt || block.caption || "") + '" class="w-full rounded-xl border border-outline-variant shadow-sm" src="' + escapeHtml(block.src) + '"/>' +
            cap + "</figure>"
        );
    }

    function renderTable(block) {
        if (!block.rows || !block.rows.length) return "";
        var head = "";
        var body = "";
        block.rows.forEach(function (row, idx) {
            var cells = row.map(function (cell) {
                var tag = idx === 0 ? "th" : "td";
                var cls = idx === 0 ? "p-4 font-bold text-on-surface" : "p-4";
                return "<" + tag + ' class="' + cls + '">' + linkify(cell) + "</" + tag + ">";
            }).join("");
            if (idx === 0) {
                head = '<thead><tr class="bg-surface-container-low border-b border-outline-variant">' + cells + "</tr></thead>";
            } else {
                body += '<tr class="border-b border-outline-variant">' + cells + "</tr>";
            }
        });
        return '<table class="w-full text-left border-collapse mb-4">' + head + "<tbody>" + body + "</tbody></table>";
    }

    function renderDica(block, color) {
        color = color || "prepare";
        return (
            '<div class="rounded-xl border border-' + color + '/20 border-l-4 border-l-' + color + ' overflow-hidden bg-' + color + '/5">' +
            '<button type="button" class="w-full flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5 text-left hover:bg-' + color + '/10 transition-colors" onclick="this.nextElementSibling.classList.toggle(\'hidden\'); this.querySelector(\'.dica-chevron\').classList.toggle(\'rotate-180\')">' +
            '<span class="material-symbols-outlined text-' + color + ' text-xl">lightbulb</span>' +
            '<span class="text-label-md font-label-md font-bold text-' + color + ' flex-1">Dica</span>' +
            '<span class="material-symbols-outlined text-' + color + ' dica-chevron transition-transform duration-300 shrink-0">expand_more</span>' +
            "</button>" +
            '<div class="hidden border-t border-' + color + '/20 px-5 py-4 sm:px-6 sm:py-5">' +
            renderParagraph(block.content, "text-body-md font-body-md text-on-surface-variant leading-relaxed") +
            "</div></div>"
        );
    }

    function renderPerguntas(sub, color) {
        color = color || "prepare";
        var items = sub.items || [];
        (sub.blocks || []).forEach(function (b) {
            if (b.type === "list") items = items.concat(b.items);
            else if (b.type === "paragraph") items.push(b.text);
        });
        if (!items.length) return "";
        var lis = items.map(function (q) {
            return '<li class="text-body-md font-body-md text-on-surface-variant">' + linkify(q) + "</li>";
        }).join("");
        return (
            '<div class="bg-surface-container-low rounded-xl p-6 sm:p-7 border-l-4 border-' + color + '">' +
            '<h4 class="text-headline-sm font-headline-sm text-' + color + ' mb-4 flex items-center gap-2">' +
            '<span class="material-symbols-outlined">help</span>Perguntas reflexivas</h4>' +
            '<ul class="list-disc pl-5 space-y-2">' + lis + "</ul></div>"
        );
    }

    function renderElementoChave(blocks) {
        return (
            '<div class="rounded-xl overflow-hidden border border-outline-variant border-l-4 border-l-prepare box-elemento-chave">' +
            '<button type="button" class="box-elemento-chave__trigger w-full flex items-center justify-between gap-3 px-5 py-4 sm:px-6 sm:py-5 transition-colors text-left" onclick="this.nextElementSibling.classList.toggle(\'hidden\'); this.querySelector(\'.material-symbols-outlined:last-child\').classList.toggle(\'rotate-180\')">' +
            '<span class="flex items-center gap-2 text-label-md font-label-md font-bold text-prepare"><span class="material-symbols-outlined text-xl">key</span>Elemento-chave</span>' +
            '<span class="material-symbols-outlined text-prepare transition-transform duration-300">expand_more</span>' +
            "</button>" +
            '<div class="hidden border-t border-outline-variant bg-surface-container-lowest"><div class="p-5 sm:p-6 space-y-4 content-block">' +
            renderBlocks(blocks, "prepare") +
            "</div></div></div>"
        );
    }

    function renderDicasHeading(color) {
        color = color || "prepare";
        return (
            '<h3 class="text-headline-sm font-headline-sm heading-dicas heading-dicas--' +
            color +
            " mb-4 pb-2 border-b border-" +
            color +
            '/15 flex items-center gap-2"><span class="material-symbols-outlined text-xl">tips_and_updates</span>Dicas de condução</h3>'
        );
    }

    function renderDicasAccordion(cards, color, groupId) {
        color = color || "prepare";
        groupId = groupId || color;
        return cards
            .map(function (card, idx) {
                var itemId = groupId + "-" + (idx + 1);
                var panelId = "nave-dicas-panel-" + itemId;
                var triggerId = "nave-dicas-trigger-" + itemId;
                return (
                    '<div class="nave-dicas-accordion__item border border-outline-variant rounded-xl overflow-hidden" data-nave-dicas-item-id="' +
                    itemId +
                    '">' +
                    '<button type="button" class="nave-dicas-accordion__trigger w-full flex items-center gap-3 p-4 bg-surface hover:bg-surface-container-low transition-colors text-left" aria-expanded="false" aria-controls="' +
                    panelId +
                    '" id="' +
                    triggerId +
                    '">' +
                    '<span class="w-7 h-7 rounded-full bg-' +
                    color +
                    "/10 text-" +
                    color +
                    ' flex items-center justify-center text-label-sm font-label-md font-bold shrink-0">' +
                    (idx + 1) +
                    "</span>" +
                    '<span class="text-label-md font-label-md font-bold text-on-surface flex-1">' +
                    escapeHtml(card.title) +
                    "</span>" +
                    '<span class="material-symbols-outlined dicas-accordion-chevron transition-transform duration-300 shrink-0">expand_more</span>' +
                    "</button>" +
                    '<div class="nave-dicas-accordion__panel hidden border-t border-outline-variant bg-surface-container-lowest p-4 sm:p-5 space-y-5" id="' +
                    panelId +
                    '" role="region" aria-labelledby="' +
                    triggerId +
                    '">' +
                    renderParagraph(card.content, "text-body-sm font-body-md text-on-surface-variant") +
                    renderVideoExtras(
                        (card.extra || []).filter(function (ex) {
                            return ex.type === "cta" || ex.type === "qr";
                        }),
                        color
                    ) +
                    (card.extra
                        ? card.extra
                              .filter(function (ex) {
                                  return ex.type !== "cta" && ex.type !== "qr";
                              })
                              .map(function (ex) {
                                  if (ex.type === "figure") return renderFigure(ex);
                                  return renderBlocks([ex], color);
                              })
                              .join("")
                        : "") +
                    "</div></div>"
                );
            })
            .join("");
    }

    function renderDicasSection(cards, color, groupId) {
        if (!cards || !cards.length) return "";
        return (
            "<div>" +
            renderDicasHeading(color) +
            '<div class="space-y-2 nave-dicas-accordion" data-nave-dicas-accordion-id="' +
            groupId +
            '">' +
            renderDicasAccordion(cards, color, groupId) +
            "</div></div>"
        );
    }

    function renderAtencaoBlock(items) {
        if (!items || !items.length) return "";
        var lis = items
            .map(function (item) {
                return '<li class="text-body-sm font-body-md text-on-surface-variant">' + escapeHtml(item) + "</li>";
            })
            .join("");
        return (
            '<div class="rounded-xl border border-secondary/20 border-l-4 border-l-secondary overflow-hidden bg-secondary/5 mb-8">' +
            '<button type="button" class="w-full flex items-center gap-3 px-5 py-4 sm:px-6 sm:py-5 text-left hover:bg-secondary/10 transition-colors" onclick="this.nextElementSibling.classList.toggle(\'hidden\'); this.querySelector(\'.atencao-chevron\').classList.toggle(\'rotate-180\')">' +
            '<span class="material-symbols-outlined text-secondary text-xl">warning</span>' +
            '<span class="text-label-md font-label-md font-bold text-secondary flex-1">Atenção!</span>' +
            '<span class="material-symbols-outlined text-secondary atencao-chevron transition-transform duration-300 shrink-0">expand_more</span>' +
            "</button>" +
            '<div class="hidden border-t border-secondary/20 px-5 py-4 sm:px-6 sm:py-5">' +
            '<p class="text-label-md font-label-md font-bold text-on-surface mb-3">Estrutura sugerida da construção:</p>' +
            '<ul class="list-disc pl-5 space-y-2">' +
            lis +
            "</ul></div></div>"
        );
    }

    function renderWorkshopAccordions(accordions) {
        return accordions.map(function (acc) {
            var stepsHtml = acc.steps.map(function (step, si) {
                var stepTitle = step.title || "Etapa " + (si + 1);
                return (
                    '<div class="relative space-y-4">' +
                    '<div class="absolute w-6 h-6 bg-secondary rounded-full -left-[42px] sm:-left-[50px] top-1 border-4 border-background"></div>' +
                    '<h4 class="text-headline-sm font-headline-sm text-secondary">' + escapeHtml(stepTitle) + "</h4>" +
                    renderBlocks(step.blocks, "secondary") +
                    "</div>"
                );
            }).join("");

            var panelClass = "workshop-accordion__panel hidden";
            var chevronClass = "material-symbols-outlined accordion-chevron transition-transform duration-300 shrink-0";
            var stepCount = acc.steps.length;
            var expandedAttr = ' aria-expanded="false"';

            var atencaoHtml = acc.atencao && acc.atencao.length ? renderAtencaoBlock(acc.atencao) : "";
            var accordionId = acc.id || String(acc.title || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
            var triggerId = "workshop-trigger-" + accordionId;
            var panelId = "workshop-panel-" + accordionId;

            return (
                '<div class="workshop-accordion border border-secondary/30 rounded-xl overflow-hidden"' +
                (accordionId ? ' data-workshop-accordion-id="' + escapeHtml(accordionId) + '"' : "") +
                ">" +
                '<button type="button" class="workshop-accordion__trigger w-full flex items-center gap-4 px-6 py-5 min-h-[4.5rem] bg-secondary/5 hover:bg-secondary/10 transition-colors text-left" id="' +
                triggerId +
                '"' +
                expandedAttr +
                ' aria-controls="' +
                panelId +
                '">' +
                '<div class="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0"><span class="material-symbols-outlined">school</span></div>' +
                '<span class="text-headline-sm font-headline-sm text-secondary flex-1">' + escapeHtml(acc.title) + "</span>" +
                (stepCount ? '<span class="text-label-sm font-label-sm text-on-surface-variant hidden sm:inline mr-2">' + stepCount + " etapas</span>" : "") +
                '<span class="' + chevronClass + '">expand_more</span>' +
                "</button>" +
                '<div class="' + panelClass + ' border-t border-outline-variant bg-surface-container-lowest px-6 py-8 sm:px-8" id="' + panelId + '" role="region" aria-labelledby="' + triggerId + '">' +
                atencaoHtml +
                '<h3 class="text-headline-sm font-headline-sm subsection-create mb-6">Passo a passo</h3>' +
                '<div class="relative pl-10 sm:pl-12 ml-2 border-l-2 border-secondary/40 space-y-12">' +
                stepsHtml +
                "</div></div></div>"
            );
        }).join("");
    }

    function resolveEstruturaStyle(nome) {
        var n = (nome || "").toLowerCase();
        if (n.indexOf("além") >= 0 || n.indexOf("alem") >= 0 || n.indexOf("beyond") >= 0 || n.indexOf("ir al") >= 0) {
            return { color: "beyond", phaseClass: "nave-estrutura-card--beyond", optional: true };
        }
        if (n.indexOf("preparar") >= 0) {
            return { color: "prepare", phaseClass: "nave-estrutura-card--prepare", optional: false };
        }
        if (n.indexOf("criar") >= 0) {
            return { color: "secondary", phaseClass: "nave-estrutura-card--create", optional: false };
        }
        if (n.indexOf("refletir") >= 0) {
            return { color: "primary-container", phaseClass: "nave-estrutura-card--reflect", optional: false };
        }
        return { color: "prepare", phaseClass: "nave-estrutura-card--prepare", optional: false };
    }

    function estruturaGridClass(count) {
        if (count >= 4) return "nave-estrutura-grid nave-estrutura-grid--4";
        if (count === 3) return "nave-estrutura-grid nave-estrutura-grid--3";
        return "nave-estrutura-grid";
    }

    function renderEstruturaCardTitle(nome) {
        return (nome || "").replace(/\s*\(opcional\)\s*/gi, "").trim();
    }

    function renderEstruturaCards(estrutura) {
        return estrutura.map(function (card) {
            var style = resolveEstruturaStyle(card.nome);
            var title = renderEstruturaCardTitle(card.nome);
            var showOptional = style.optional;
            return (
                '<div class="nave-estrutura-card ' + style.phaseClass + '">' +
                '<div class="nave-estrutura-card__head">' +
                '<div class="nave-estrutura-card__title-row">' +
                '<h3 class="nave-estrutura-card__title text-headline-sm font-headline-sm text-' + style.color + '">' + escapeHtml(title) + "</h3>" +
                (card.duracao ? '<span class="duration-badge bg-' + style.color + "/10 text-" + style.color + '">' + escapeHtml(card.duracao) + "</span>" : "") +
                "</div>" +
                (showOptional ? '<span class="nave-estrutura-card__optional-tag">Opcional</span>' : "") +
                "</div>" +
                (card.descricao
                    ? '<p class="nave-estrutura-card__desc text-body-md font-body-md text-on-surface-variant">' + linkify(card.descricao) + "</p>"
                    : "") +
                "</div>"
            );
        }).join("");
    }

    function renderSectionPrepare(data) {
        var subsections = data.subsections || [];
        var html = "";
        var prepareDur = "";

        subsections.forEach(function (sub) {
            if (sub.kind === "apresentacao") {
                html += '<div><h3 class="text-headline-sm font-headline-sm subsection-neutral mb-4">Apresentação</h3><div class="space-y-4 content-block">' + renderBlocks(sub.blocks, "prepare") + "</div></div>";
            } else if (sub.kind === "perguntas_reflexivas") {
                html += renderPerguntas(sub, "prepare");
            } else if (sub.kind === "elemento_chave") {
                html += renderElementoChave(sub.blocks);
            } else if (sub.kind === "dicas" && sub.cards.length) {
                html += renderDicasSection(sub.cards, "prepare", "prepare");
            } else if (sub.kind === "embarque") {
                html += '<div><h3 class="text-headline-sm font-headline-sm subsection-neutral mb-4">Embarque</h3><div class="space-y-4 content-block">' + renderBlocks(sub.blocks, "prepare") + "</div></div>";
            } else if (sub.kind === "dicas" && sub.blocks.length) {
                html += "<div>" + renderDicasHeading("prepare") + '<div class="space-y-2 nave-dicas-accordion" data-nave-dicas-accordion-id="prepare">' + renderBlocks(sub.blocks, "prepare") + "</div></div>";
            } else if (sub.kind === "generic" && sub.blocks.length) {
                html += '<div><h3 class="text-headline-sm font-headline-sm subsection-neutral mb-4">' + escapeHtml(sub.title) + '</h3><div class="space-y-4 content-block">' + renderBlocks(sub.blocks, "prepare") + "</div></div>";
            }
        });

        return html;
    }

    function renderSectionMaterials(data) {
        var items = data.items || [];
        if (!items.length) return '<p class="text-body-md font-body-md text-on-surface-variant mb-6">Lista de materiais/softwares/componentes necessários</p><div class="bg-surface rounded-xl p-6 border border-outline-variant border-t-4 border-t-tertiary"><p class="text-body-md text-on-surface-variant">Nenhum material listado no documento.</p></div>';
        var lis = items.map(function (item, index) {
            var inputId = "nave-material-" + (index + 1);
            return (
                '<li><label class="flex items-center gap-3 cursor-pointer">' +
                '<input class="w-5 h-5 text-tertiary rounded border-outline-variant focus:ring-tertiary shrink-0" type="checkbox" id="' +
                inputId +
                '"/>' +
                '<span class="text-body-md font-body-md text-on-surface">' +
                escapeHtml(item) +
                "</span></label></li>"
            );
        }).join("");
        return '<p class="text-body-md font-body-md text-on-surface-variant mb-6">Lista de materiais/softwares/componentes necessários</p><div class="bg-surface rounded-xl p-6 border border-outline-variant border-t-4 border-t-tertiary"><ul class="space-y-3">' + lis + "</ul></div>";
    }

    function renderSectionCreate(data) {
        var html = '<div class="space-y-10">';
        (data.subsections || []).forEach(function (sub) {
            if (sub.kind === "prototype") {
                html += '<div class="space-y-4"><div class="bg-secondary/5 rounded-xl p-6 border border-secondary/20 border-l-4 border-l-secondary text-center">' +
                    '<p class="text-label-sm font-label-md text-secondary uppercase tracking-wide mb-2">Protótipo</p>' +
                    '<h3 class="text-headline-md font-headline-md text-on-surface">' + escapeHtml(sub.prototypeTitle || "Protótipo") + "</h3>" +
                    (sub.prototypeSubtitle ? '<p class="text-body-md font-body-md text-on-surface-variant mt-1">' + escapeHtml(sub.prototypeSubtitle) + "</p>" : "") +
                    "</div>" + renderBlocks(sub.blocks, "secondary") + "</div>";
            } else if (sub.kind === "passo_a_passo") {
                html += '<div class="space-y-4"><h3 class="text-headline-sm font-headline-sm subsection-create mb-4">Passo a passo</h3>' + renderBlocks(sub.blocks, "secondary") + "</div>";
            } else if (sub.kind === "workshop" && sub.accordions.length) {
                html += '<div class="workshop-accordions">' + renderWorkshopAccordions(sub.accordions) + "</div>";
            } else if (sub.kind === "dicas" && sub.cards.length) {
                html += renderDicasSection(sub.cards, "secondary", "create");
            } else if (sub.blocks && sub.blocks.length) {
                html += renderBlocks(sub.blocks, "secondary");
            }
        });
        html += "</div>";
        return html;
    }

    function renderSectionReflect(data) {
        var html = '<div class="space-y-10">';
        (data.subsections || []).forEach(function (sub) {
            if (sub.kind === "aprendizados") {
                html += '<div class="space-y-6"><h3 class="text-headline-sm font-headline-sm subsection-neutral mb-4">Aprendizados</h3><div class="space-y-4">' + renderBlocks(sub.blocks, "primary-container") + "</div></div>";
            } else if (sub.kind === "perguntas_reflexivas") {
                html += renderPerguntas(sub, "primary-container");
            } else if (sub.kind === "beyond") {
                /* renderizado em seção própria */
            } else if (sub.kind === "dicas" && sub.cards.length) {
                html += renderDicasSection(sub.cards, "primary-container", "reflect");
            } else if (sub.blocks && sub.blocks.length) {
                html += '<div class="space-y-4">' + renderBlocks(sub.blocks, "primary-container") + "</div>";
            }
        });
        html += "</div>";
        return html;
    }

    function findBeyondSubsection(reflectData) {
        var subs = (reflectData && reflectData.subsections) || [];
        for (var i = 0; i < subs.length; i++) {
            if (subs[i].kind === "beyond") return subs[i];
        }
        return null;
    }

    function renderSectionBeyond(sub, beyondDur) {
        if (!sub) return "";
        return (
            '<section class="mb-16 scroll-mt-24" id="beyond">' +
            '<div class="flex items-center gap-3 mb-8 flex-wrap">' +
            '<div class="w-10 h-10 rounded-full bg-beyond/15 text-beyond flex items-center justify-center shrink-0"><span class="material-symbols-outlined">rocket_launch</span></div>' +
            '<h2 class="text-headline-lg font-headline-lg text-beyond">Para ir além</h2>' +
            '<span class="nave-estrutura-card__optional-tag">Opcional</span>' +
            (beyondDur ? '<span class="duration-badge ml-auto bg-beyond/10 text-beyond">' + escapeHtml(beyondDur) + "</span>" : "") +
            '</div><div class="space-y-5 content-block">' +
            renderBlocks(sub.blocks, "beyond") +
            "</div></section>"
        );
    }

    function getSectionDuration(estrutura, sectionName) {
        var found = (estrutura || []).find(function (e) {
            return (e.nome || "").toLowerCase().indexOf(sectionName) >= 0;
        });
        return found ? found.duracao : "";
    }

    function generateHtml(parsed) {
        var meta = parsed.meta;
        var estrutura = parsed.estrutura || [];
        var sections = parsed.sections;
        var titulo = meta.titulo;
        var subtitulo = meta.subtitulo || "";
        var id = meta.id;

        var viewParagraphs = sections.view.blocks.filter(function (b) { return b.type === "paragraph"; });
        var viewIntro = viewParagraphs.map(function (b) { return renderParagraph(b.text, "text-body-lg font-body-lg text-on-surface-variant max-w-2xl"); }).join("");

        var badges = "";
        if (meta.ano) badges += renderMetaChip("audience", meta.ano, "badge");
        if (meta.duracao) badges += renderMetaChip("duration", meta.duracao, "badge");
        if (meta.foco) badges += renderMetaChip("focus", meta.foco, "badge");

        var estruturaHtml = estrutura.length
            ? '<section class="mb-16"><h2 class="text-headline-md font-headline-md text-on-surface mb-6">Estrutura da Oficina</h2><div class="' + estruturaGridClass(estrutura.length) + '">' + renderEstruturaCards(estrutura) + "</div></section>"
            : "";

        var prepareDur = getSectionDuration(estrutura, "preparar");
        var createDur = getSectionDuration(estrutura, "criar");
        var reflectDur = getSectionDuration(estrutura, "refletir");
        var beyondDur = getSectionDuration(estrutura, "além") || getSectionDuration(estrutura, "alem");
        var beyondSub = findBeyondSubsection(sections.reflect);
        var beyondHtml = renderSectionBeyond(beyondSub, beyondDur);
        var beyondNav = beyondHtml
            ? '<li><a class="flex items-center gap-3 py-3 text-on-surface-variant pl-4 text-label-md font-label-md hover:bg-surface-container-high transition-all group nav-link nav-link--optional" href="#beyond" data-section-color="beyond"><span class="material-symbols-outlined group-hover:text-beyond">rocket_launch</span><span class="nav-link__label-row">Para ir além <span class="nav-link__optional-tag">Opcional</span></span></a></li>\n'
            : "";

        var sidebarMeta = "";
        if (meta.ano) sidebarMeta += renderMetaChip("audience", meta.ano, "compact");
        if (meta.duracao) sidebarMeta += renderMetaChip("duration", meta.duracao, "compact");

        return '<!DOCTYPE html>\n' +
            '<!-- Oficina: ' + escapeHtml(id) + " | " + escapeHtml(titulo) + " -->\n" +
            '<html lang="pt-BR">\n<head>\n' +
            '    <meta charset="utf-8"/>\n' +
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n' +
            "    <title>" + escapeHtml(titulo) + " — Oficina NAVE</title>\n" +
            '    <link rel="icon" href="../../assets/images/nave_ico.png" type="image/png"/>\n' +
            '    <link rel="apple-touch-icon" href="../../assets/images/nave_ico.png"/>\n' +
            '    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"><\/script>\n' +
            '    <script src="../../assets/js/tailwind-config.js"><\/script>\n' +
            '    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap" rel="stylesheet"/>\n' +
            '    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>\n' +
            '    <link rel="stylesheet" href="../../assets/css/nave.css"/>\n' +
            "</head>\n" +
            '<body class="bg-background text-on-surface font-body-md antialiased overflow-x-hidden min-h-screen flex flex-col relative">\n\n' +
            '<header class="sticky top-0 z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-3 md:py-4 bg-surface-container-lowest/95 backdrop-blur-sm border-b border-outline-variant">\n' +
            '<div class="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">\n' +
            '<a class="shrink-0 smooth-transition opacity-95 hover:opacity-100" href="../../index.html" title="Oficinas NAVE — início">\n' +
            '<img alt="NAVE a vela" class="nave-logo" height="41" src="../../assets/images/Logo_Naveavela.svg" width="137"/>\n' +
            "</a>\n" +
            '<a class="hidden sm:flex items-center gap-1 text-label-sm text-on-surface-variant hover:text-primary shrink-0 border-l border-outline-variant pl-3 sm:pl-4" href="../../index.html" title="Voltar ao índice">\n' +
            '<span class="material-symbols-outlined text-lg">arrow_back</span>\n<span>Todas</span>\n</a>\n' +
            '<div class="min-w-0 flex-1 border-l border-outline-variant pl-3 sm:pl-4">\n' +
            '<span class="text-headline-sm font-headline-sm font-bold text-on-surface truncate block">' + escapeHtml(titulo) + "</span>\n" +
            (subtitulo ? '<span class="hidden lg:block text-label-md font-label-md text-on-surface-variant truncate">' + escapeHtml(subtitulo) + "</span>\n" : "") +
            "</div></div></header>\n" +
            '<div class="flex flex-1 w-full max-w-max-width mx-auto">\n\n' +
            '<aside class="nave-workshop-sidebar hidden lg:flex flex-col sticky top-24 ml-margin-desktop w-64 rounded-r-xl bg-surface-container-low shadow-sm flex-shrink-0 z-40 self-start">\n' +
            '<div class="nave-workshop-sidebar__head">\n' +
            '<div class="nave-workshop-sidebar__icon" aria-hidden="true"><span class="material-symbols-outlined">face</span></div>\n' +
            '<h2 class="nave-workshop-sidebar__title">' + escapeHtml(titulo) + "</h2>\n" +
            (sidebarMeta ? '<div class="nave-sidebar-meta">' + sidebarMeta + "</div>\n" : "") +
            "</div>\n<nav id=\"sidebar-nav\">\n<ul class=\"space-y-1\">\n" +
            '<li><a class="flex items-center gap-3 py-3 text-on-surface-variant pl-4 text-label-md font-label-md hover:bg-surface-container-high transition-all group nav-link" href="#view" data-section-color="primary"><span class="material-symbols-outlined group-hover:text-primary">visibility</span>Visão Geral</a></li>\n' +
            '<li><a class="flex items-center gap-3 py-3 text-on-surface-variant pl-4 text-label-md font-label-md hover:bg-surface-container-high transition-all group nav-link" href="#materials" data-section-color="tertiary"><span class="material-symbols-outlined group-hover:text-tertiary">inventory_2</span>Materiais</a></li>\n' +
            '<li><a class="flex items-center gap-3 py-3 text-on-surface-variant pl-4 text-label-md font-label-md hover:bg-surface-container-high transition-all group nav-link" href="#prepare" data-section-color="prepare"><span class="material-symbols-outlined group-hover:text-prepare">menu_book</span>Preparar</a></li>\n' +
            '<li><a class="flex items-center gap-3 py-3 text-on-surface-variant pl-4 text-label-md font-label-md hover:bg-surface-container-high transition-all group nav-link" href="#create" data-section-color="secondary"><span class="material-symbols-outlined group-hover:text-secondary">construction</span>Criar</a></li>\n' +
            '<li><a class="flex items-center gap-3 py-3 text-on-surface-variant pl-4 text-label-md font-label-md hover:bg-surface-container-high transition-all group nav-link" href="#reflect" data-section-color="primary-container"><span class="material-symbols-outlined group-hover:text-primary-container">psychology</span>Refletir</a></li>\n' +
            beyondNav +
            "</ul></nav></aside>\n\n" +
            '<main class="flex-1 w-full px-margin-mobile lg:px-margin-desktop py-8 pb-32 lg:pb-12 lg:ml-8">\n\n' +
            '<section class="relative rounded-2xl bg-surface-container-low overflow-hidden border border-outline-variant mb-16 scroll-mt-24" id="view">\n' +
            '<div class="absolute inset-0 pattern-grid z-0"></div>\n' +
            '<div class="relative z-10 p-8 lg:p-12"><div class="flex-1 space-y-6">\n' +
            '<h1 class="text-display-lg font-display-lg workshop-hero-title md:text-display-lg text-headline-lg-mobile">' + escapeHtml(titulo) + "</h1>\n" +
            viewIntro +
            (badges ? '<div class="nave-meta-chips-row flex flex-wrap gap-4 pt-4">' + badges + "</div>" : "") +
            "</div></div></section>\n" +
            estruturaHtml +
            '<section class="mb-16 scroll-mt-24" id="materials">\n' +
            '<div class="flex items-center gap-3 mb-8"><div class="w-10 h-10 rounded-full bg-tertiary/15 text-tertiary flex items-center justify-center"><span class="material-symbols-outlined">inventory_2</span></div>\n' +
            '<h2 class="text-headline-lg font-headline-lg text-tertiary">Materiais</h2></div>\n' +
            renderSectionMaterials(sections.materials) + "</section>\n" +
            '<section class="mb-16 scroll-mt-24" id="prepare">\n' +
            '<div class="flex items-center gap-3 mb-8"><div class="w-10 h-10 rounded-full bg-prepare text-on-prepare flex items-center justify-center"><span class="material-symbols-outlined">menu_book</span></div>\n' +
            '<h2 class="text-headline-lg font-headline-lg text-prepare">Preparar</h2>' +
            (prepareDur ? '<span class="duration-badge ml-auto bg-prepare/10 text-prepare">' + escapeHtml(prepareDur) + "</span>" : "") +
            "</div><div class=\"space-y-8\">" + renderSectionPrepare(sections.prepare) + "</div></section>\n" +
            '<section class="mb-16 scroll-mt-24" id="create">\n' +
            '<div class="flex items-center gap-3 mb-8"><div class="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center"><span class="material-symbols-outlined">construction</span></div>\n' +
            '<h2 class="text-headline-lg font-headline-lg text-secondary">Criar</h2>' +
            (createDur ? '<span class="duration-badge ml-auto bg-secondary/10 text-secondary">' + escapeHtml(createDur) + "</span>" : "") +
            "</div>" + renderSectionCreate(sections.create) + "</section>\n" +
            '<section class="mb-16 scroll-mt-24" id="reflect">\n' +
            '<div class="flex items-center gap-3 mb-8"><div class="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center"><span class="material-symbols-outlined">psychology</span></div>\n' +
            '<h2 class="text-headline-lg font-headline-lg text-primary-container">Refletir</h2>' +
            (reflectDur ? '<span class="duration-badge ml-auto bg-primary-container/10 text-primary-container">' + escapeHtml(reflectDur) + "</span>" : "") +
            "</div>" + renderSectionReflect(sections.reflect) + "</section>\n" +
            beyondHtml +
            "</main>\n" +
            '<nav class="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest border-t border-outline-variant shadow-lg rounded-t-xl" id="bottom-nav">\n' +
            '<a class="flex flex-col items-center justify-center text-on-surface-variant py-2 rounded-xl transition-colors nav-link-mobile" href="#view"><span class="material-symbols-outlined">visibility</span><span class="nav-link-mobile__label">Visão</span></a>\n' +
            '<a class="flex flex-col items-center justify-center text-on-surface-variant py-2 rounded-xl transition-colors nav-link-mobile" href="#materials"><span class="material-symbols-outlined">inventory_2</span><span class="nav-link-mobile__label">Materiais</span></a>\n' +
            '<a class="flex flex-col items-center justify-center text-on-surface-variant py-2 rounded-xl transition-colors nav-link-mobile" href="#prepare"><span class="material-symbols-outlined">menu_book</span><span class="nav-link-mobile__label">Preparar</span></a>\n' +
            '<a class="flex flex-col items-center justify-center text-on-surface-variant py-2 rounded-xl transition-colors nav-link-mobile" href="#create"><span class="material-symbols-outlined">construction</span><span class="nav-link-mobile__label">Criar</span></a>\n' +
            '<a class="flex flex-col items-center justify-center text-on-surface-variant py-2 rounded-xl transition-colors nav-link-mobile" href="#reflect"><span class="material-symbols-outlined">psychology</span><span class="nav-link-mobile__label">Refletir</span></a>\n' +
            '<a class="flex flex-col items-center justify-center text-on-surface-variant py-2 rounded-xl transition-colors nav-link-mobile nav-link--optional" href="#beyond"><span class="material-symbols-outlined">rocket_launch</span><span class="nav-link-mobile__label">Além</span></a>\n' +
            "</nav>\n\n" +
            '<script src="../../assets/js/nave.js"><\/script>\n' +
            "</body>\n</html>\n";
    }

    function generateOficinasJsonEntry(meta) {
        return {
            id: meta.id,
            titulo: meta.titulo,
            subtitulo: meta.subtitulo || "",
            arquivo: "oficinas/" + meta.id + "/index.html",
            ano: meta.ano || "",
            duracao: meta.duracao || "",
            tags: meta.tags || []
        };
    }

    global.NaveHtmlGenerator = {
        generate: generateHtml,
        generateOficinasJsonEntry: generateOficinasJsonEntry
    };
})(typeof window !== "undefined" ? window : globalThis);
