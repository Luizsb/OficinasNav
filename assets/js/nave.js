/** Oficinas NAVE — modo painel, navegação, lightbox e persistência local */
(function () {
    var SECTION_KEY_PREFIX = "nave-section:";
    var CHECKBOX_KEY_PREFIX = "nave-checkboxes:";
    var COMPLETED_KEY_PREFIX = "nave-completed:";
    var SCROLL_SAVE_MS = 400;

    var CORE_SECTION_IDS = ["view", "materials", "prepare", "create", "reflect"];
    var OPTIONAL_SECTION_IDS = ["beyond"];
    var COMPLETION_PANELS = ["reflect", "beyond"];
    var SECTION_IDS = CORE_SECTION_IDS.slice();

    var SECTION_LABELS = {
        view: "Visão geral",
        prepare: "Preparar",
        materials: "Materiais",
        create: "Criar",
        reflect: "Refletir",
        beyond: "Para ir além"
    };

    var sectionAccentHex = {
        view: "#004ab3",
        prepare: "#94579e",
        materials: "#505050",
        create: "#b60057",
        reflect: "#1561de",
        beyond: "#9a6700"
    };

    function refreshSectionIds() {
        var main = document.querySelector("main");
        SECTION_IDS = CORE_SECTION_IDS.slice();
        if (main && main.querySelector("section#beyond")) {
            SECTION_IDS.push("beyond");
        }
    }

    function isOptionalPanel(panelId) {
        return OPTIONAL_SECTION_IDS.indexOf(panelId) >= 0;
    }

    function isCompletionPanel(panelId) {
        return COMPLETION_PANELS.indexOf(panelId) >= 0;
    }

    function hasBeyondSection() {
        return SECTION_IDS.indexOf("beyond") >= 0;
    }

    refreshSectionIds();

    var panelController = null;
    var suppressHashChange = false;

    /* —— Modo painel: uma seção visível por vez —— */
    function buildPanelGroups(main) {
        var panels = {};
        var currentPanel = "view";

        SECTION_IDS.forEach(function (id) {
            panels[id] = [];
        });

        Array.prototype.forEach.call(main.children, function (el) {
            if (el.tagName !== "SECTION") return;

            var id = el.getAttribute("id");
            if (id && SECTION_IDS.indexOf(id) !== -1) {
                currentPanel = id;
                panels[id].push(el);
            } else {
                panels[currentPanel].push(el);
            }
        });

        return panels;
    }

    function hasWorkshopSections(main) {
        return SECTION_IDS.some(function (id) {
            return main.querySelector("section#" + id);
        });
    }

    function getPanelFromHash() {
        var hash = (window.location.hash || "").replace(/^#/, "");
        if (hash && SECTION_IDS.indexOf(hash) !== -1) return hash;
        return "";
    }

    function sectionStorageKey() {
        return SECTION_KEY_PREFIX + window.location.pathname;
    }

    function saveActiveSection(panelId) {
        try {
            localStorage.setItem(sectionStorageKey(), panelId);
        } catch (err) {
            /* storage indisponível */
        }
    }

    function loadActiveSection() {
        try {
            var saved = localStorage.getItem(sectionStorageKey()) || "";
            if (saved && SECTION_IDS.indexOf(saved) !== -1) return saved;
        } catch (err) {
            /* ignore */
        }
        return "";
    }

    function getWorkshopSlug() {
        var match = window.location.pathname.match(/\/oficinas\/([^/]+)/);
        return match ? match[1] : "";
    }

    function completedStorageKey(slug) {
        return COMPLETED_KEY_PREFIX + slug;
    }

    function isWorkshopCompleted(slug) {
        if (!slug) return false;
        try {
            return !!localStorage.getItem(completedStorageKey(slug));
        } catch (err) {
            return false;
        }
    }

    function markWorkshopCompleted(slug) {
        if (!slug) return;
        try {
            localStorage.setItem(completedStorageKey(slug), new Date().toISOString());
        } catch (err) {
            /* storage indisponível */
        }
    }

    function getSavedSectionForSlug(slug) {
        if (!slug) return "";
        try {
            var needle = "/oficinas/" + slug + "/";
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (!key || key.indexOf(SECTION_KEY_PREFIX) !== 0) continue;
                if (key.indexOf(needle) === -1) continue;
                var section = localStorage.getItem(key) || "";
                if (section && SECTION_IDS.indexOf(section) !== -1) return section;
            }
        } catch (err) {
            /* ignore */
        }
        return "";
    }

    function getWorkshopProgress(slug) {
        if (isWorkshopCompleted(slug)) {
            return { percent: 100, section: "reflect", label: "Concluída", pendingFinish: false };
        }
        var section = getSavedSectionForSlug(slug);
        if (!section) {
            return { percent: 0, section: "", label: "", pendingFinish: false };
        }
        if (section === "beyond") {
            return {
                percent: 90,
                section: "beyond",
                label: SECTION_LABELS.beyond,
                pendingFinish: true
            };
        }
        var index = CORE_SECTION_IDS.indexOf(section);
        if (index < 0) {
            return { percent: 0, section: section, label: SECTION_LABELS[section] || section, pendingFinish: false };
        }
        if (section === "reflect") {
            return {
                percent: 90,
                section: "reflect",
                label: SECTION_LABELS.reflect,
                pendingFinish: true
            };
        }
        return {
            percent: Math.round(((index + 1) / CORE_SECTION_IDS.length) * 100),
            section: section,
            label: SECTION_LABELS[section] || section,
            pendingFinish: false
        };
    }

    function isWorkshopInProgress(slug) {
        if (isWorkshopCompleted(slug)) return false;
        var section = getSavedSectionForSlug(slug);
        return !!section && section !== "view";
    }

    function getHomeUrl() {
        return new URL("../../index.html", window.location.href).href;
    }

    function showCompletionModal() {
        if (document.querySelector(".nave-completion-modal")) return;

        var slug = getWorkshopSlug();
        if (slug && isWorkshopCompleted(slug)) {
            window.location.href = getHomeUrl();
            return;
        }

        if (slug) {
            markWorkshopCompleted(slug);
        }

        var modal = document.createElement("div");
        modal.className = "nave-completion-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "nave-completion-title");
        var completionText = hasBeyondSection()
            ? 'Parabéns! Você concluiu as etapas obrigatórias. A extensão "Para ir além" é opcional. O que deseja fazer agora?'
            : "Parabéns! Você percorreu todas as etapas. O que deseja fazer agora?";
        modal.innerHTML =
            '<div class="nave-completion-modal__inner">' +
            '<span class="material-symbols-outlined nave-completion-modal__icon" aria-hidden="true">celebration</span>' +
            '<h2 id="nave-completion-title" class="nave-completion-modal__title">Oficina concluída!</h2>' +
            '<p class="nave-completion-modal__text">' + completionText + "</p>" +
            '<div class="nave-completion-modal__actions">' +
            '<button type="button" class="nave-completion-modal__btn nave-completion-modal__btn--primary" data-action="home">Lista de oficinas</button>' +
            '<button type="button" class="nave-completion-modal__btn nave-completion-modal__btn--ghost" data-action="stay">Continuar na oficina</button>' +
            "</div></div>";
        document.body.appendChild(modal);
        document.body.classList.add("nave-completion-modal-active");

        requestAnimationFrame(function () {
            modal.classList.add("nave-completion-modal--visible");
        });

        function dismissModal() {
            modal.classList.remove("nave-completion-modal--visible");
            document.body.classList.remove("nave-completion-modal-active");
            setTimeout(function () {
                modal.remove();
                if (panelController && panelController.refreshFooter) {
                    panelController.refreshFooter();
                }
            }, 300);
        }

        modal.querySelector('[data-action="home"]').addEventListener("click", function () {
            window.location.href = getHomeUrl();
        });

        modal.querySelector('[data-action="stay"]').addEventListener("click", dismissModal);

        document.addEventListener("keydown", function onEscape(e) {
            if (e.key !== "Escape") return;
            document.removeEventListener("keydown", onEscape);
            dismissModal();
        });

        modal.querySelector('[data-action="home"]').focus();
    }

    function sectionColorHex(panelId) {
        return sectionAccentHex[panelId] || sectionAccentHex.view;
    }

    function setNavActiveState(navLinks, mobileNavLinks, panelId) {
        navLinks.forEach(function (link) {
            link.classList.remove("nav-active");
            link.style.borderColor = "";
            link.style.color = "";
            link.style.backgroundColor = "";
            link.style.removeProperty("--nav-section-color");
            link.removeAttribute("aria-current");

            var icon = link.querySelector(".material-symbols-outlined");
            if (icon) {
                icon.style.color = "";
                icon.style.fontVariationSettings = "'FILL' 0";
            }

            var href = link.getAttribute("href") || "";
            if (href === "#" + panelId) {
                link.classList.add("nav-active");
                link.setAttribute("aria-current", "page");
                var color = sectionColorHex(panelId);
                link.style.setProperty("--nav-section-color", color);
                link.style.borderColor = color;
                link.style.color = color;
                link.style.backgroundColor = "color-mix(in srgb, " + color + " 8%, transparent)";
                if (icon) {
                    icon.style.color = color;
                    icon.style.fontVariationSettings = "'FILL' 1";
                }
            }
        });

        mobileNavLinks.forEach(function (link) {
            link.classList.remove("nav-active-mobile", "text-primary");
            link.classList.add("text-on-surface-variant");
            link.style.color = "";
            link.removeAttribute("aria-current");
            var icon = link.querySelector(".material-symbols-outlined");
            if (icon) {
                icon.style.color = "";
                icon.style.fontVariationSettings = "'FILL' 0";
            }

            if (link.getAttribute("href") === "#" + panelId) {
                link.classList.add("nav-active-mobile");
                link.classList.remove("text-on-surface-variant");
                link.setAttribute("aria-current", "page");
                var color = sectionColorHex(panelId);
                link.style.color = color;
                if (icon) {
                    icon.style.color = color;
                    icon.style.fontVariationSettings = "'FILL' 1";
                }
            }
        });
    }

    function initSectionPanel() {
        refreshSectionIds();
        var main = document.querySelector("main");
        if (!main || !hasWorkshopSections(main)) return null;

        var panels = buildPanelGroups(main);
        var navLinks = document.querySelectorAll("#sidebar-nav .nav-link");
        var mobileNavLinks = document.querySelectorAll("#bottom-nav .nav-link-mobile");
        var activePanel = "view";

        SECTION_IDS.forEach(function (panelId) {
            panels[panelId].forEach(function (el) {
                el.setAttribute("data-nave-panel", panelId);
            });
        });

        main.classList.add("nave-panel-mode");

        var footer = document.createElement("nav");
        footer.className = "nave-section-footer";
        footer.setAttribute("aria-label", "Navegação entre seções da oficina");
        footer.innerHTML =
            '<div class="nave-section-footer__row">' +
            '<button type="button" class="nave-section-footer__btn nave-section-footer__btn--prev" data-nav="prev">' +
            '<span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>' +
            '<span class="nave-section-footer__btn-label">Anterior</span>' +
            "</button>" +
            '<div class="nave-section-footer__progress-track" role="progressbar" aria-valuemin="1" aria-valuemax="' +
            CORE_SECTION_IDS.length +
            '" aria-valuenow="1">' +
            '<div class="nave-section-footer__progress-fill"></div>' +
            "</div>" +
            '<button type="button" class="nave-section-footer__btn nave-section-footer__btn--next" data-nav="next">' +
            '<span class="nave-section-footer__btn-label">Próxima</span>' +
            '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>' +
            "</button>" +
            "</div>" +
            '<p class="nave-section-footer__progress-label" aria-live="polite"></p>' +
            '<p class="nave-section-footer__optional" hidden>' +
            '<button type="button" class="nave-section-footer__optional-btn" data-nav="beyond">' +
            "Para ir além (opcional)" +
            '<span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>' +
            "</button></p>";
        main.appendChild(footer);

        var btnPrev = footer.querySelector('[data-nav="prev"]');
        var btnNext = footer.querySelector('[data-nav="next"]');
        var btnNextLabel = btnNext.querySelector(".nave-section-footer__btn-label");
        var btnNextIcon = btnNext.querySelector(".material-symbols-outlined");
        var progressLabel = footer.querySelector(".nave-section-footer__progress-label");
        var progressFill = footer.querySelector(".nave-section-footer__progress-fill");
        var progressTrack = footer.querySelector(".nave-section-footer__progress-track");
        var optionalWrap = footer.querySelector(".nave-section-footer__optional");
        var optionalBtn = footer.querySelector('[data-nav="beyond"]');

        function hideAllPanels() {
            SECTION_IDS.forEach(function (panelId) {
                panels[panelId].forEach(function (el) {
                    el.classList.add("nave-panel-hidden");
                    el.setAttribute("aria-hidden", "true");
                });
            });
        }

        function updateFooter(panelId) {
            var coreIndex = CORE_SECTION_IDS.indexOf(panelId);
            var optional = isOptionalPanel(panelId);
            var label = SECTION_LABELS[panelId] || panelId;
            var step = coreIndex >= 0 ? coreIndex + 1 : CORE_SECTION_IDS.length;
            var percent = optional ? 100 : ((coreIndex + 1) / CORE_SECTION_IDS.length) * 100;

            progressLabel.textContent = optional
                ? "Opcional — " + label
                : step + " de " + CORE_SECTION_IDS.length + " — " + label;
            progressFill.style.width = percent + "%";
            progressFill.style.backgroundColor = sectionAccentHex[panelId] || "#1561de";
            progressTrack.setAttribute("aria-valuenow", String(step));
            progressTrack.setAttribute("aria-valuemax", String(CORE_SECTION_IDS.length));
            progressTrack.setAttribute(
                "aria-label",
                optional ? "Etapa opcional: " + label : "Progresso da oficina: " + label
            );

            btnPrev.disabled = panelId === "view";

            var panelIndex = SECTION_IDS.indexOf(panelId);
            var prevId = panelIndex > 0 ? SECTION_IDS[panelIndex - 1] : "";
            var nextId = panelIndex < SECTION_IDS.length - 1 ? SECTION_IDS[panelIndex + 1] : "";

            btnPrev.setAttribute("aria-label", prevId ? "Ir para " + SECTION_LABELS[prevId] : "Primeira seção");

            if (optionalWrap) {
                optionalWrap.hidden = !(panelId === "reflect" && hasBeyondSection());
            }

            if (isCompletionPanel(panelId)) {
                var alreadyCompleted = isWorkshopCompleted(getWorkshopSlug());
                btnNext.disabled = false;
                btnNext.classList.remove("nave-section-footer__btn--finish", "nave-section-footer__btn--home");

                if (alreadyCompleted) {
                    btnNextLabel.textContent = "Lista de oficinas";
                    btnNextIcon.textContent = "home";
                    btnNext.classList.add("nave-section-footer__btn--home");
                    btnNext.setAttribute("aria-label", "Voltar à lista de oficinas");
                } else {
                    btnNextLabel.textContent = "Concluir";
                    btnNextIcon.textContent = "check_circle";
                    btnNext.classList.add("nave-section-footer__btn--finish");
                    btnNext.setAttribute("aria-label", "Concluir oficina");
                }
            } else {
                btnNext.disabled = false;
                btnNextLabel.textContent = "Próxima";
                btnNextIcon.textContent = "arrow_forward";
                btnNext.classList.remove("nave-section-footer__btn--finish");
                btnNext.classList.remove("nave-section-footer__btn--home");
                btnNext.setAttribute("aria-label", "Ir para " + SECTION_LABELS[nextId]);
            }
        }

        function showPanel(panelId, options) {
            options = options || {};
            if (SECTION_IDS.indexOf(panelId) === -1) panelId = "view";

            activePanel = panelId;
            hideAllPanels();

            panels[panelId].forEach(function (el) {
                el.classList.remove("nave-panel-hidden");
                el.setAttribute("aria-hidden", "false");
            });

            setNavActiveState(navLinks, mobileNavLinks, panelId);
            updateFooter(panelId);

            if (!options.skipHash) {
                var newHash = "#" + panelId;
                if (window.location.hash !== newHash) {
                    suppressHashChange = true;
                    history.pushState({ navePanel: panelId }, "", newHash);
                    suppressHashChange = false;
                }
            }

            if (!options.skipSave) {
                saveActiveSection(panelId);
            }

            window.scrollTo({ top: 0, behavior: options.instant ? "auto" : "smooth" });

            if (!options.skipFocus) {
                var firstBlock = panels[panelId][0];
                var heading = firstBlock && firstBlock.querySelector("h1, h2");
                if (heading) {
                    heading.setAttribute("tabindex", "-1");
                    heading.focus({ preventScroll: true });
                }
            }
        }

        function navigateByOffset(offset) {
            var index = SECTION_IDS.indexOf(activePanel) + offset;
            if (index < 0 || index >= SECTION_IDS.length) return;
            showPanel(SECTION_IDS[index]);
        }

        function bindNavLink(link) {
            link.addEventListener("click", function (e) {
                var href = link.getAttribute("href") || "";
                if (!href.startsWith("#")) return;

                var panelId = href.slice(1);
                if (SECTION_IDS.indexOf(panelId) === -1) return;

                e.preventDefault();
                showPanel(panelId);
            });
        }

        navLinks.forEach(bindNavLink);
        mobileNavLinks.forEach(bindNavLink);

        btnPrev.addEventListener("click", function () {
            navigateByOffset(-1);
        });

        btnNext.addEventListener("click", function () {
            if (isCompletionPanel(activePanel)) {
                if (isWorkshopCompleted(getWorkshopSlug())) {
                    window.location.href = getHomeUrl();
                    return;
                }
                showCompletionModal();
                return;
            }
            navigateByOffset(1);
        });

        if (optionalBtn) {
            optionalBtn.addEventListener("click", function () {
                showPanel("beyond");
            });
        }

        window.addEventListener("popstate", function () {
            var panelId = getPanelFromHash() || "view";
            showPanel(panelId, { skipHash: true, skipSave: true });
        });

        window.addEventListener("hashchange", function () {
            if (suppressHashChange) return;
            var panelId = getPanelFromHash();
            if (panelId) showPanel(panelId, { skipHash: true });
        });

        var hashPanel = getPanelFromHash();
        var savedPanel = loadActiveSection();
        var initialPanel = hashPanel || "view";

        showPanel(initialPanel, {
            skipHash: !hashPanel,
            instant: true,
            skipFocus: true
        });

        if (hashPanel) {
            history.replaceState({ navePanel: initialPanel }, "", "#" + initialPanel);
        }

        return {
            showPanel: showPanel,
            getActivePanel: function () {
                return activePanel;
            },
            refreshFooter: function () {
                updateFooter(activePanel);
            },
            getSavedPanel: function () {
                return savedPanel;
            },
            hadHashOnLoad: function () {
                return !!hashPanel;
            }
        };
    }

    /* —— Âncoras internas (dentro da seção visível) —— */
    function initInSectionAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            if (anchor.closest("#sidebar-nav, #bottom-nav")) return;

            anchor.addEventListener("click", function (e) {
                var targetId = this.getAttribute("href");
                if (!targetId || targetId === "#") return;

                var panelId = targetId.slice(1);
                if (SECTION_IDS.indexOf(panelId) !== -1) return;

                var targetElement = document.querySelector(targetId);
                if (!targetElement || targetElement.classList.contains("nave-panel-hidden")) return;

                e.preventDefault();
                var headerOffset = 100;
                var offsetPosition =
                    targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
            });
        });
    }

    /* —— Links e vídeos externos em nova aba —— */
    function isExternalHref(href) {
        if (!href) return false;
        if (href.startsWith("#")) return false;
        if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
        if (href.startsWith("http://") || href.startsWith("https://")) return true;
        return false;
    }

    function initExternalLinks() {
        document.querySelectorAll("main a[href], header a[href]").forEach(function (link) {
            if (link.classList.contains("nave-logo") || link.querySelector(".nave-logo")) return;

            var href = link.getAttribute("href");
            if (!isExternalHref(href)) return;

            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
            if (!link.getAttribute("title")) {
                link.setAttribute("title", "Abre em nova aba");
            }
        });
    }

    /* —— Lightbox com zoom —— */
    function initImageLightbox() {
        var main = document.querySelector("main");
        if (!main) return;

        var images = [];
        main.querySelectorAll("figure img, img.nave-zoomable").forEach(function (img) {
            if (img.classList.contains("nave-logo") || img.closest("a .nave-logo")) return;
            if (img.closest("header")) return;
            images.push(img);
        });

        if (!images.length) return;

        var zoomLevel = 1;
        var ZOOM_MIN = 1;
        var ZOOM_MAX = 3;
        var ZOOM_STEP = 0.35;

        var overlay = document.createElement("div");
        overlay.className = "nave-lightbox";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML =
            '<button type="button" class="nave-lightbox__close" aria-label="Fechar">' +
            '<span class="material-symbols-outlined">close</span></button>' +
            '<div class="nave-lightbox__toolbar" role="toolbar" aria-label="Controles de zoom">' +
            '<button type="button" class="nave-lightbox__zoom" data-zoom="out" aria-label="Diminuir zoom">' +
            '<span class="material-symbols-outlined">zoom_out</span></button>' +
            '<span class="nave-lightbox__zoom-label">100%</span>' +
            '<button type="button" class="nave-lightbox__zoom" data-zoom="in" aria-label="Aumentar zoom">' +
            '<span class="material-symbols-outlined">zoom_in</span></button>' +
            '<button type="button" class="nave-lightbox__zoom nave-lightbox__zoom--reset" data-zoom="reset" aria-label="Tamanho original">' +
            '<span class="material-symbols-outlined">fit_screen</span></button>' +
            "</div>" +
            '<div class="nave-lightbox__viewport">' +
            '<div class="nave-lightbox__stage">' +
            '<img class="nave-lightbox__img" alt="" src="" draggable="false" />' +
            "</div></div>" +
            '<p class="nave-lightbox__caption"></p>';
        document.body.appendChild(overlay);

        var viewport = overlay.querySelector(".nave-lightbox__viewport");
        var lightboxImg = overlay.querySelector(".nave-lightbox__img");
        var captionEl = overlay.querySelector(".nave-lightbox__caption");
        var zoomLabel = overlay.querySelector(".nave-lightbox__zoom-label");
        var btnClose = overlay.querySelector(".nave-lightbox__close");

        function getCaption(img) {
            var figure = img.closest("figure");
            if (figure) {
                var cap = figure.querySelector("figcaption");
                if (cap && cap.textContent.trim()) return cap.textContent.trim();
            }
            return img.getAttribute("alt") || "";
        }

        function applyZoom() {
            lightboxImg.style.transform = "scale(" + zoomLevel + ")";
            zoomLabel.textContent = Math.round(zoomLevel * 100) + "%";
            overlay.querySelector('[data-zoom="out"]').disabled = zoomLevel <= ZOOM_MIN;
            overlay.querySelector('[data-zoom="in"]').disabled = zoomLevel >= ZOOM_MAX;
        }

        function setZoom(delta) {
            if (delta === "reset") {
                zoomLevel = 1;
            } else {
                zoomLevel = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomLevel + delta));
            }
            applyZoom();
        }

        function openLightbox(img) {
            zoomLevel = 1;
            lightboxImg.src = img.currentSrc || img.src;
            lightboxImg.alt = img.alt || "";
            var caption = getCaption(img);
            captionEl.textContent = caption;
            captionEl.hidden = !caption;
            applyZoom();
            viewport.scrollTop = 0;
            viewport.scrollLeft = 0;
            overlay.classList.add("nave-lightbox--open");
            overlay.setAttribute("aria-hidden", "false");
            document.body.classList.add("nave-lightbox-active");
            btnClose.focus();
        }

        function closeLightbox() {
            overlay.classList.remove("nave-lightbox--open");
            overlay.setAttribute("aria-hidden", "true");
            document.body.classList.remove("nave-lightbox-active");
            lightboxImg.removeAttribute("src");
            zoomLevel = 1;
        }

        images.forEach(function (img) {
            img.classList.add("nave-zoomable");
            img.setAttribute("tabindex", "0");
            img.setAttribute("role", "button");
            img.setAttribute(
                "aria-label",
                (img.getAttribute("alt") || "Imagem") + " — clique para ampliar"
            );

            img.addEventListener("click", function () {
                openLightbox(img);
            });
            img.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(img);
                }
            });
        });

        btnClose.addEventListener("click", function (e) {
            e.stopPropagation();
            closeLightbox();
        });

        overlay.querySelectorAll(".nave-lightbox__zoom").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                var action = btn.getAttribute("data-zoom");
                if (action === "in") setZoom(ZOOM_STEP);
                if (action === "out") setZoom(-ZOOM_STEP);
                if (action === "reset") setZoom("reset");
            });
        });

        overlay.querySelector(".nave-lightbox__toolbar").addEventListener("click", function (e) {
            e.stopPropagation();
        });

        lightboxImg.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        overlay.addEventListener("click", function () {
            closeLightbox();
        });

        viewport.addEventListener(
            "wheel",
            function (e) {
                if (!overlay.classList.contains("nave-lightbox--open")) return;
                if (!e.ctrlKey && !e.metaKey) return;
                e.preventDefault();
                setZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
            },
            { passive: false }
        );

        document.addEventListener("keydown", function (e) {
            if (!overlay.classList.contains("nave-lightbox--open")) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "+" || e.key === "=") setZoom(ZOOM_STEP);
            if (e.key === "-") setZoom(-ZOOM_STEP);
            if (e.key === "0") setZoom("reset");
        });
    }

    /* —— Voltar ao topo (dentro da seção longa) —— */
    function initBackToTop() {
        var main = document.querySelector("main");
        if (!main) return;

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "nave-back-to-top";
        btn.setAttribute("aria-label", "Voltar ao topo");
        btn.innerHTML = '<span class="material-symbols-outlined">keyboard_arrow_up</span>';
        document.body.appendChild(btn);

        var showAfter = 320;

        window.addEventListener(
            "scroll",
            function () {
                if (window.pageYOffset > showAfter) {
                    btn.classList.add("nave-back-to-top--visible");
                } else {
                    btn.classList.remove("nave-back-to-top--visible");
                }
            },
            { passive: true }
        );

        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    /* —— Retomar leitura (última seção visitada) —— */
    function initSectionRestore() {
        var main = document.querySelector("main");
        if (!main || !panelController) return;

        var saved = panelController.getSavedPanel();
        var current = panelController.getActivePanel();

        if (!saved || saved === current || saved === "view") return;
        if (panelController.hadHashOnLoad()) return;

        var banner = document.createElement("div");
        banner.className = "nave-resume-banner";
        banner.setAttribute("role", "status");
        banner.innerHTML =
            '<div class="nave-resume-banner__inner">' +
            '<span class="material-symbols-outlined nave-resume-banner__icon">bookmark</span>' +
            '<p class="nave-resume-banner__text"><strong class="nave-resume-banner__title">Continuar de onde parou?</strong> Retomamos na seção <strong class="nave-resume-banner__section">' +
            (SECTION_LABELS[saved] || saved) +
            "</strong>.</p>" +
            '<div class="nave-resume-banner__actions">' +
            '<button type="button" class="nave-resume-banner__btn nave-resume-banner__btn--primary">Continuar</button>' +
            '<button type="button" class="nave-resume-banner__btn nave-resume-banner__btn--ghost">Ficar aqui</button>' +
            "</div></div>";
        document.body.appendChild(banner);
        document.body.classList.add("nave-resume-active");

        requestAnimationFrame(function () {
            banner.classList.add("nave-resume-banner--visible");
        });

        banner.querySelector(".nave-resume-banner__btn--primary").addEventListener("click", function () {
            panelController.showPanel(saved);
            dismissBanner();
        });

        banner.querySelector(".nave-resume-banner__btn--ghost").addEventListener("click", function () {
            dismissBanner();
        });

        function dismissBanner() {
            banner.classList.remove("nave-resume-banner--visible");
            document.body.classList.remove("nave-resume-active");
            setTimeout(function () {
                banner.remove();
            }, 300);
        }
    }

    /* —— Salvar marcações de checkbox (localStorage) —— */
    function checkboxStorageKey() {
        return CHECKBOX_KEY_PREFIX + window.location.pathname;
    }

    function getCheckboxId(checkbox, globalIndex) {
        if (checkbox.id) return checkbox.id;

        var section = checkbox.closest("section[id]");
        var sectionId = section ? section.getAttribute("id") : "main";
        var list = checkbox.closest("ul, ol");

        if (list) {
            var items = list.querySelectorAll('input[type="checkbox"]');
            var indexInList = Array.prototype.indexOf.call(items, checkbox);
            if (indexInList >= 0) return sectionId + ":" + indexInList;
        }

        return sectionId + ":cb-" + globalIndex;
    }

    function loadCheckboxState() {
        try {
            return JSON.parse(localStorage.getItem(checkboxStorageKey()) || "{}");
        } catch (err) {
            return {};
        }
    }

    function saveCheckboxState(state) {
        try {
            localStorage.setItem(checkboxStorageKey(), JSON.stringify(state));
        } catch (err) {
            /* storage indisponível */
        }
    }

    function initCheckboxPersist() {
        var main = document.querySelector("main");
        if (!main) return;

        var checkboxes = main.querySelectorAll('input[type="checkbox"]');
        if (!checkboxes.length) return;

        var state = loadCheckboxState();

        checkboxes.forEach(function (checkbox, index) {
            var id = getCheckboxId(checkbox, index);
            checkbox.setAttribute("data-nave-check-id", id);

            if (state[id]) {
                checkbox.checked = true;
            }

            checkbox.addEventListener("change", function () {
                var current = loadCheckboxState();
                if (checkbox.checked) {
                    current[id] = true;
                } else {
                    delete current[id];
                }
                saveCheckboxState(current);
            });
        });
    }

    function initHomeOficinas() {
        var container = document.getElementById("lista-oficinas");
        if (!container) return;

        var isDecorating = false;

        function statusHtml(completed, inProgress, progressLabel) {
            if (completed) {
                return (
                    '<span class="nave-completed-badge">' +
                    '<span class="material-symbols-outlined" aria-hidden="true">check_circle</span>' +
                    "<span>Concluída</span></span>"
                );
            }
            if (inProgress) {
                return (
                    '<span class="nave-continue-badge">' +
                    '<span class="material-symbols-outlined" aria-hidden="true">bookmark</span>' +
                    "<span>Continuar em " + progressLabel + "</span></span>"
                );
            }
            return "";
        }

        function decorateCards() {
            if (isDecorating) return;
            isDecorating = true;

            container.querySelectorAll(".nave-oficina-card[data-oficina-id]").forEach(function (card) {
                var id = card.getAttribute("data-oficina-id");
                if (!id) return;

                var baseHref = card.getAttribute("data-oficina-href") || "";
                var coverLink = card.querySelector(".nave-oficina-card__cover-link");
                var completed = isWorkshopCompleted(id);
                var inProgress = isWorkshopInProgress(id);
                var progress = getWorkshopProgress(id);
                var nextHref =
                    inProgress && progress.section
                        ? baseHref.split("#")[0] + "#" + progress.section
                        : baseHref.split("#")[0];

                card.classList.toggle("nave-oficina-card--completed", completed);
                card.classList.toggle("nave-oficina-card--continue", inProgress);

                var statusSlot = card.querySelector(".nave-oficina-card__status-slot");
                if (statusSlot) {
                    var nextStatus = statusHtml(completed, inProgress, progress.label || "…");
                    if (statusSlot.innerHTML !== nextStatus) {
                        statusSlot.innerHTML = nextStatus;
                    }
                }

                var progressWrap = card.querySelector(".nave-oficina-card__progress");
                var progressFill = card.querySelector(".nave-oficina-card__progress-fill");
                var progressValue = card.querySelector(".nave-oficina-card__progress-value");
                var progressTrack = card.querySelector(".nave-oficina-card__progress-track");
                var progressSection = card.querySelector(".nave-oficina-card__progress-section");

                if (progressWrap && progressFill && progressValue && progressTrack) {
                    var showProgress = completed || inProgress;
                    progressWrap.hidden = !showProgress;
                    if (showProgress) {
                        var percentText = progress.percent + "%";
                        if (progressValue.textContent !== percentText) {
                            progressValue.textContent = percentText;
                        }
                        progressFill.style.width = progress.percent + "%";
                        progressTrack.setAttribute("aria-valuenow", String(progress.percent));
                        progressTrack.setAttribute(
                            "aria-label",
                            "Progresso da oficina: " + progress.percent + "%"
                        );
                        if (progressSection) {
                            var sectionText = completed
                                ? "Todas as etapas concluídas"
                                : progress.pendingFinish
                                  ? "Última etapa: " + progress.label + " — falta concluir"
                                  : "Última etapa: " + progress.label;
                            if (progressSection.textContent !== sectionText) {
                                progressSection.textContent = sectionText;
                            }
                        }
                    }
                }

                var cta = card.querySelector("[data-cta]");
                if (cta) {
                    var ctaText = completed
                        ? "Revisar oficina"
                        : inProgress
                          ? "Continuar"
                          : "Abrir oficina";
                    if (cta.textContent !== ctaText) {
                        cta.textContent = ctaText;
                    }
                }

                if (coverLink && coverLink.getAttribute("href") !== nextHref) {
                    coverLink.setAttribute("href", nextHref);
                }
            });

            isDecorating = false;
            initMetaHints(container);
        }

        decorateCards();

        var observer = new MutationObserver(function (mutations) {
            var hasNewCards = mutations.some(function (mutation) {
                return mutation.type === "childList" && mutation.addedNodes.length > 0;
            });
            if (hasNewCards) decorateCards();
        });
        observer.observe(container, { childList: true });
    }

    function getTemplateMarkup(template) {
        var contentMarkup = (template.innerHTML || "").trim();
        if (!contentMarkup && template.content) {
            contentMarkup = Array.from(template.content.childNodes)
                .map(function (node) {
                    return node.outerHTML || node.textContent;
                })
                .join("");
        }
        return contentMarkup;
    }

    function openMetaContentModal(templateId, triggerEl) {
        if (document.querySelector(".nave-meta-modal")) return;

        var template = document.getElementById(templateId);
        if (!template) return;

        var modal = document.createElement("div");
        modal.className = "nave-meta-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        var titleEl = template.content
            ? template.content.querySelector(".nave-meta-modal__title, h2")
            : null;
        var titleId = titleEl && titleEl.id ? titleEl.id : "nave-meta-modal-title";
        if (titleEl && !titleEl.id) {
            titleEl.id = titleId;
        }
        modal.setAttribute("aria-labelledby", titleId);

        var contentMarkup = getTemplateMarkup(template);

        modal.innerHTML =
            '<div class="nave-meta-modal__inner">' +
            '<button type="button" class="nave-meta-modal__close" aria-label="Fechar">' +
            '<span class="material-symbols-outlined">close</span></button>' +
            '<div class="nave-meta-modal__content">' +
            contentMarkup +
            "</div></div>";

        document.body.appendChild(modal);
        document.body.classList.add("nave-meta-modal-active");

        requestAnimationFrame(function () {
            modal.classList.add("nave-meta-modal--visible");
        });

        var btnClose = modal.querySelector(".nave-meta-modal__close");
        var lastFocus = triggerEl || document.activeElement;

        function dismissModal() {
            modal.classList.remove("nave-meta-modal--visible");
            document.body.classList.remove("nave-meta-modal-active");
            if (triggerEl) {
                triggerEl.setAttribute("aria-expanded", "false");
            }
            setTimeout(function () {
                modal.remove();
                if (lastFocus && typeof lastFocus.focus === "function") {
                    lastFocus.focus();
                }
            }, 300);
        }

        btnClose.addEventListener("click", dismissModal);
        modal.addEventListener("click", function (e) {
            if (e.target === modal) dismissModal();
        });

        document.addEventListener(
            "keydown",
            function onKey(e) {
                if (e.key === "Escape") {
                    dismissModal();
                    document.removeEventListener("keydown", onKey);
                }
            },
            { once: true }
        );

        btnClose.focus();
    }

    function setupMetaExpand(el, templateId) {
        var template = document.getElementById(templateId);
        if (!template) return;

        var chipsRow = el.closest(".nave-meta-chips-row") || el.parentElement;
        if (!chipsRow) return;

        var panelId = templateId + "-panel";
        var panel = document.getElementById(panelId);
        if (!panel) {
            panel = document.createElement("div");
            panel.className = "nave-meta-expand";
            panel.id = panelId;
            panel.hidden = true;
            panel.innerHTML =
                '<div class="nave-meta-expand__inner">' + getTemplateMarkup(template) + "</div>";
            chipsRow.insertAdjacentElement("afterend", panel);
        }

        if (!el.querySelector(".nave-meta-chip__chevron")) {
            var chevron = document.createElement("span");
            chevron.className = "material-symbols-outlined nave-meta-chip__chevron";
            chevron.setAttribute("aria-hidden", "true");
            chevron.textContent = "expand_more";
            el.appendChild(chevron);
        }

        el.classList.add("nave-meta-chip--expand");
        el.setAttribute("role", "button");
        el.setAttribute("aria-expanded", "false");
        el.setAttribute("aria-controls", panelId);

        var escapeHandler = null;

        function closePanel() {
            panel.classList.remove("nave-meta-expand--open");
            el.setAttribute("aria-expanded", "false");
            el.classList.remove("nave-meta-chip--expanded");
            if (escapeHandler) {
                document.removeEventListener("keydown", escapeHandler);
                escapeHandler = null;
            }
            window.setTimeout(function () {
                if (!panel.classList.contains("nave-meta-expand--open")) {
                    panel.hidden = true;
                }
            }, 320);
        }

        function openPanel() {
            document.querySelectorAll(".nave-meta-expand--open").forEach(function (openPanelEl) {
                if (openPanelEl === panel) return;
                openPanelEl.classList.remove("nave-meta-expand--open");
                window.setTimeout(function () {
                    if (!openPanelEl.classList.contains("nave-meta-expand--open")) {
                        openPanelEl.hidden = true;
                    }
                }, 320);
            });
            document.querySelectorAll(".nave-meta-chip--expanded").forEach(function (chip) {
                if (chip === el) return;
                chip.setAttribute("aria-expanded", "false");
                chip.classList.remove("nave-meta-chip--expanded");
            });

            panel.hidden = false;
            window.requestAnimationFrame(function () {
                panel.classList.add("nave-meta-expand--open");
            });
            el.setAttribute("aria-expanded", "true");
            el.classList.add("nave-meta-chip--expanded");

            escapeHandler = function (e) {
                if (e.key === "Escape") {
                    closePanel();
                }
            };
            document.addEventListener("keydown", escapeHandler);
        }

        function toggleExpand(e) {
            if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
            if (e.type === "keydown") e.preventDefault();
            e.stopPropagation();

            if (panel.classList.contains("nave-meta-expand--open")) {
                closePanel();
            } else {
                openPanel();
            }
        }

        el.addEventListener("click", toggleExpand);
        el.addEventListener("keydown", toggleExpand);
    }

    function initMetaHints(root) {
        var hints = {
            audience: "Público-alvo",
            duration: "Tempo para desenvolvimento da oficina",
            focus: "Eixo / foco pedagógico"
        };

        var scope = root && root.querySelectorAll ? root : document;

        scope.querySelectorAll("[data-nave-meta]").forEach(function (el) {
            if (el.getAttribute("data-nave-hint-ready") === "true") return;

            var type = el.getAttribute("data-nave-meta");
            var customHint = el.getAttribute("data-nave-meta-hint");
            var hintText = customHint || hints[type];
            if (!hintText) return;

            var modalTemplateId = el.getAttribute("data-nave-meta-modal");
            var expandTemplateId = el.getAttribute("data-nave-meta-expand");

            el.classList.add("nave-meta-chip");
            el.setAttribute("data-nave-hint-ready", "true");

            if (!el.closest("a")) {
                el.setAttribute("tabindex", "0");
            }

            var valueEl = el.querySelector(".nave-meta-chip__value");
            var value = valueEl ? valueEl.textContent.trim() : el.textContent.trim();
            el.setAttribute("title", hintText);
            el.setAttribute("aria-label", hintText + ": " + value);

            var hint = el.querySelector(".nave-meta-chip__hint");
            if (!hint) {
                hint = document.createElement("span");
                hint.className = "nave-meta-chip__hint";
                hint.setAttribute("role", "tooltip");
                el.appendChild(hint);
            }
            hint.textContent = hintText;

            if (expandTemplateId) {
                setupMetaExpand(el, expandTemplateId);
            } else if (modalTemplateId) {
                el.classList.add("nave-meta-chip--modal");
                el.setAttribute("role", "button");
                el.setAttribute("aria-haspopup", "dialog");
                el.setAttribute("aria-expanded", "false");

                function openFromChip(e) {
                    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
                    if (e.type === "keydown") e.preventDefault();
                    e.stopPropagation();
                    el.setAttribute("aria-expanded", "true");
                    openMetaContentModal(modalTemplateId, el);
                }

                el.addEventListener("click", openFromChip);
                el.addEventListener("keydown", openFromChip);
            } else {
                el.addEventListener("click", function (e) {
                    e.stopPropagation();
                });
            }
        });
    }

    function ensureWorkshopAccordionA11y(item) {
        var btn = item.querySelector(".workshop-accordion__trigger");
        var panel = item.querySelector(".workshop-accordion__panel");
        if (!btn || !panel) return;

        var accordionId = item.getAttribute("data-workshop-accordion-id") || "workshop";
        var triggerId = "workshop-trigger-" + accordionId;
        var panelId = "workshop-panel-" + accordionId;

        btn.setAttribute("type", "button");
        btn.id = triggerId;
        btn.setAttribute("aria-controls", panelId);
        if (!btn.hasAttribute("aria-expanded")) {
            btn.setAttribute("aria-expanded", panel.classList.contains("hidden") ? "false" : "true");
        }

        panel.id = panelId;
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", triggerId);
    }

    function setWorkshopAccordionItem(item, open) {
        var btn = item.querySelector(".workshop-accordion__trigger");
        var panel = item.querySelector(".workshop-accordion__panel");
        if (!btn || !panel) return;

        var chevron = btn.querySelector(".accordion-chevron");
        if (open) {
            panel.classList.remove("hidden");
            if (chevron) chevron.classList.add("rotate-180");
            btn.setAttribute("aria-expanded", "true");
        } else {
            panel.classList.add("hidden");
            if (chevron) chevron.classList.remove("rotate-180");
            btn.setAttribute("aria-expanded", "false");
        }
    }

    function initWorkshopAccordions() {
        document.querySelectorAll(".workshop-accordions").forEach(function (group) {
            var items = group.querySelectorAll(":scope > .workshop-accordion");

            items.forEach(function (item) {
                ensureWorkshopAccordionA11y(item);
                setWorkshopAccordionItem(item, false);
            });

            items.forEach(function (item) {
                var btn = item.querySelector(".workshop-accordion__trigger");
                if (!btn || btn.getAttribute("data-nave-accordion-ready") === "true") return;

                btn.setAttribute("data-nave-accordion-ready", "true");
                btn.addEventListener("click", function () {
                    var panel = item.querySelector(".workshop-accordion__panel");
                    var isOpen = panel && !panel.classList.contains("hidden");

                    items.forEach(function (other) {
                        setWorkshopAccordionItem(other, false);
                    });

                    if (!isOpen) {
                        setWorkshopAccordionItem(item, true);
                    }
                });
            });
        });
    }

    function setDicasAccordionItem(item, open) {
        var btn = item.querySelector(".nave-dicas-accordion__trigger");
        var panel = item.querySelector(".nave-dicas-accordion__panel");
        if (!btn || !panel) return;

        var chevron = btn.querySelector(".dicas-accordion-chevron");
        if (open) {
            panel.classList.remove("hidden");
            if (chevron) chevron.classList.add("rotate-180");
            btn.setAttribute("aria-expanded", "true");
        } else {
            panel.classList.add("hidden");
            if (chevron) chevron.classList.remove("rotate-180");
            btn.setAttribute("aria-expanded", "false");
        }
    }

    function ensureDicasAccordionA11y(item, groupId, itemIndex) {
        var itemId = item.getAttribute("data-nave-dicas-item-id") || groupId + "-" + (itemIndex + 1);
        var panelId = "nave-dicas-panel-" + itemId;
        var triggerId = "nave-dicas-trigger-" + itemId;

        item.classList.add("nave-dicas-accordion__item");
        item.setAttribute("data-nave-dicas-item-id", itemId);

        var btn = item.querySelector(".nave-dicas-accordion__trigger") || item.querySelector(":scope > button");
        var panel = item.querySelector(".nave-dicas-accordion__panel") || (btn && btn.nextElementSibling);
        if (!btn || !panel) return;

        btn.removeAttribute("onclick");
        btn.setAttribute("type", "button");
        btn.classList.add("nave-dicas-accordion__trigger");
        btn.id = triggerId;
        btn.setAttribute("aria-controls", panelId);
        btn.setAttribute("aria-expanded", panel.classList.contains("hidden") ? "false" : "true");

        panel.classList.add("nave-dicas-accordion__panel");
        panel.id = panelId;
        panel.setAttribute("role", "region");
        panel.setAttribute("aria-labelledby", triggerId);

        var chevron = btn.querySelector(".dicas-accordion-chevron, .material-symbols-outlined:last-child");
        if (chevron) chevron.classList.add("dicas-accordion-chevron");
    }

    function initDicasAccordions() {
        document.querySelectorAll(".nave-dicas-accordion").forEach(function (group, groupIndex) {
            var groupId = group.getAttribute("data-nave-dicas-accordion-id") || String(groupIndex);
            var items = Array.prototype.slice.call(group.children).filter(function (child) {
                return child.matches(".nave-dicas-accordion__item, .border");
            });

            items.forEach(function (item, itemIndex) {
                ensureDicasAccordionA11y(item, groupId, itemIndex);
            });

            items = group.querySelectorAll(":scope > .nave-dicas-accordion__item");
            items.forEach(function (item) {
                setDicasAccordionItem(item, false);
            });

            items.forEach(function (item) {
                var btn = item.querySelector(".nave-dicas-accordion__trigger");
                if (!btn || btn.getAttribute("data-nave-accordion-ready") === "true") return;

                btn.setAttribute("data-nave-accordion-ready", "true");
                btn.addEventListener("click", function () {
                    var panel = item.querySelector(".nave-dicas-accordion__panel");
                    var isOpen = panel && !panel.classList.contains("hidden");
                    setDicasAccordionItem(item, !isOpen);
                });
            });
        });
    }

    window.Nave = window.Nave || {};
    window.Nave.refreshMetaHints = initMetaHints;

    panelController = initSectionPanel();
    initInSectionAnchors();
    initExternalLinks();
    initImageLightbox();
    initSectionRestore();
    initBackToTop();
    initCheckboxPersist();
    initHomeOficinas();
    initMetaHints();
    initWorkshopAccordions();
    initDicasAccordions();
})();
