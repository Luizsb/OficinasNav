/** Oficinas NAVE — navegação, links externos, lightbox e retomada de leitura */
(function () {
    var SCROLL_KEY_PREFIX = "nave-scroll:";
    var CHECKBOX_KEY_PREFIX = "nave-checkboxes:";
    var SCROLL_SAVE_MS = 400;
    var scrollSaveTimer = null;

    /* —— Scroll suave (âncoras internas) —— */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener("click", function (e) {
            var targetId = this.getAttribute("href");
            if (!targetId || targetId === "#") return;

            var targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            e.preventDefault();
            var headerOffset = 100;
            var offsetPosition =
                targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;

            window.scrollTo({ top: offsetPosition, behavior: "smooth" });
        });
    });

    /* —— Destaque da seção ativa no menu —— */
    var sections = document.querySelectorAll("section[id]");
    var navLinks = document.querySelectorAll("#sidebar-nav .nav-link");
    var mobileNavLinks = document.querySelectorAll("#bottom-nav .nav-link-mobile");

    if (sections.length) {
        var sectionBorderColors = {
            view: "primary",
            prepare: "prepare",
            materials: "tertiary",
            create: "secondary",
            reflect: "primary-container"
        };

        window.addEventListener("scroll", function () {
            var current = "";
            sections.forEach(function (section) {
                if (pageYOffset >= section.offsetTop - 150) {
                    current = section.getAttribute("id");
                }
            });

            navLinks.forEach(function (link) {
                link.classList.remove("nav-active");
                link.style.borderColor = "";
                link.style.color = "";
                link.style.backgroundColor = "";
                if (link.getAttribute("href").includes(current) && current !== "") {
                    link.classList.add("nav-active");
                    var accent = sectionBorderColors[current] || "primary";
                    link.style.borderColor = "var(--tw-colors-" + accent + ")";
                    link.style.color = "var(--tw-colors-" + accent + ")";
                    link.style.backgroundColor =
                        accent === "primary-container"
                            ? "color-mix(in srgb, var(--tw-colors-primary-container) 8%, transparent)"
                            : "color-mix(in srgb, var(--tw-colors-" + accent + ") 8%, transparent)";
                }
            });

            mobileNavLinks.forEach(function (link) {
                link.classList.remove("nav-active-mobile", "text-primary");
                link.classList.add("text-on-surface-variant");
                var icon = link.querySelector(".material-symbols-outlined");
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";

                if (link.getAttribute("href").includes(current) && current !== "") {
                    link.classList.add("nav-active-mobile", "text-primary");
                    link.classList.remove("text-on-surface-variant");
                    if (icon) icon.style.fontVariationSettings = "'FILL' 1";
                }
            });
        });
    }

    /* —— 1. Links e vídeos externos em nova aba —— */
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

    /* —— 2. Lightbox com zoom (sem galeria lateral) —— */
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

        viewport.addEventListener("wheel", function (e) {
            if (!overlay.classList.contains("nave-lightbox--open")) return;
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            setZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
        }, { passive: false });

        document.addEventListener("keydown", function (e) {
            if (!overlay.classList.contains("nave-lightbox--open")) return;
            if (e.key === "Escape") closeLightbox();
            if (e.key === "+" || e.key === "=") setZoom(ZOOM_STEP);
            if (e.key === "-") setZoom(-ZOOM_STEP);
            if (e.key === "0") setZoom("reset");
        });
    }

    /* —— 4. Voltar ao topo —— */
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

    /* —— 3. Retomar leitura (localStorage) —— */
    function scrollStorageKey() {
        return SCROLL_KEY_PREFIX + window.location.pathname;
    }

    function saveScrollPosition() {
        try {
            localStorage.setItem(scrollStorageKey(), String(window.pageYOffset));
        } catch (err) {
            /* storage indisponível */
        }
    }

    function initScrollRestore() {
        var main = document.querySelector("main");
        if (!main) return;

        var saved = 0;
        try {
            saved = parseInt(localStorage.getItem(scrollStorageKey()) || "0", 10);
        } catch (err) {
            return;
        }

        if (!saved || saved < 120) return;

        var banner = document.createElement("div");
        banner.className = "nave-resume-banner";
        banner.setAttribute("role", "status");
        banner.innerHTML =
            '<div class="nave-resume-banner__inner">' +
            '<span class="material-symbols-outlined nave-resume-banner__icon">bookmark</span>' +
            '<p class="nave-resume-banner__text"><strong>Continuar de onde parou?</strong> Retomamos sua última posição nesta oficina.</p>' +
            '<div class="nave-resume-banner__actions">' +
            '<button type="button" class="nave-resume-banner__btn nave-resume-banner__btn--primary">Continuar leitura</button>' +
            '<button type="button" class="nave-resume-banner__btn nave-resume-banner__btn--ghost">Ir ao início</button>' +
            "</div></div>";
        document.body.appendChild(banner);

        requestAnimationFrame(function () {
            banner.classList.add("nave-resume-banner--visible");
        });

        banner.querySelector(".nave-resume-banner__btn--primary").addEventListener("click", function () {
            window.scrollTo({ top: saved, behavior: "smooth" });
            dismissBanner();
        });

        banner.querySelector(".nave-resume-banner__btn--ghost").addEventListener("click", function () {
            try {
                localStorage.removeItem(scrollStorageKey());
            } catch (err) {
                /* ignore */
            }
            dismissBanner();
        });

        function dismissBanner() {
            banner.classList.remove("nave-resume-banner--visible");
            setTimeout(function () {
                banner.remove();
            }, 300);
        }

        window.addEventListener(
            "scroll",
            function () {
                if (scrollSaveTimer) clearTimeout(scrollSaveTimer);
                scrollSaveTimer = setTimeout(saveScrollPosition, SCROLL_SAVE_MS);
            },
            { passive: true }
        );

        window.addEventListener("beforeunload", saveScrollPosition);
    }

    /* —— 5. Salvar marcações de checkbox (localStorage) —— */
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

    initExternalLinks();
    initImageLightbox();
    initScrollRestore();
    initBackToTop();
    initCheckboxPersist();
})();
