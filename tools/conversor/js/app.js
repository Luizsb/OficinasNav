(function () {
    "use strict";

    var state = {
        parsed: null,
        fileName: "",
        previewBlobUrls: [],
        extraImages: {}
    };

    var dropZone = document.getElementById("drop-zone");
    var fileInput = document.getElementById("file-input");
    var statusEl = document.getElementById("status");
    var previewEl = document.getElementById("preview");
    var metaEl = document.getElementById("meta-preview");
    var jsonEntryEl = document.getElementById("json-entry");
    var btnDownload = document.getElementById("btn-download");
    var btnPreview = document.getElementById("btn-preview");
    var btnPublish = document.getElementById("btn-publish");
    var publishHint = document.getElementById("publish-hint");
    var imagesInput = document.getElementById("images-input");
    var imagesStatus = document.getElementById("images-status");

    function setStatus(msg, type) {
        statusEl.textContent = msg;
        statusEl.className = "text-body-md " + (type === "error" ? "text-red-600" : type === "success" ? "text-green-700" : "text-on-surface-variant");
    }

    function handleFile(file) {
        if (!file) return;
        if (!/\.docx$/i.test(file.name)) {
            setStatus("Selecione um arquivo .docx", "error");
            return;
        }

        state.fileName = file.name;
        setStatus("Processando " + file.name + "…");

        var reader = new FileReader();
        reader.onload = function (e) {
            NaveDocxParser.parse(e.target.result, file.name)
                .then(function (parsed) {
                    mergeExtraImages(parsed);
                    applyParsed(parsed);
                    setStatus("Conversão concluída. Revise, baixe o ZIP ou envie para a home.", "success");
                })
                .catch(function (err) {
                    console.error(err);
                    setStatus("Erro: " + (err.message || err), "error");
                    btnDownload.disabled = true;
                    btnPreview.disabled = true;
                    if (btnPublish) btnPublish.disabled = true;
                });
        };
        reader.onerror = function () {
            setStatus("Não foi possível ler o arquivo.", "error");
        };
        reader.readAsArrayBuffer(file);
    }

    function mergeExtraImages(parsed) {
        if (!parsed.images) parsed.images = {};
        Object.keys(state.extraImages).forEach(function (name) {
            parsed.images[name] = state.extraImages[name];
        });
    }

    function applyParsed(parsed) {
        revokePreviewUrls();
        state.parsed = parsed;
        var html = NaveHtmlGenerator.generate(parsed);
        var entry = NaveHtmlGenerator.generateOficinasJsonEntry(parsed.meta);
        var extraCount = Object.keys(state.extraImages).length;

        previewEl.textContent = html.slice(0, 3000) + (html.length > 3000 ? "\n\n… (prévia truncada)" : "");
        metaEl.innerHTML =
            "<li><strong>ID:</strong> " + escape(entry.id) + "</li>" +
            "<li><strong>Título:</strong> " + escape(entry.titulo) + "</li>" +
            "<li><strong>Subtítulo:</strong> " + escape(entry.subtitulo) + "</li>" +
            "<li><strong>Ano:</strong> " + escape(entry.ano) + "</li>" +
            "<li><strong>Duração:</strong> " + escape(entry.duracao) + "</li>" +
            "<li><strong>Imagens:</strong> " + Object.keys(parsed.images).length +
            (extraCount ? " (" + extraCount + " da pasta enviada)" : "") + "</li>";
        jsonEntryEl.textContent = JSON.stringify(buildCatalogEntry(parsed), null, 4);

        btnDownload.disabled = false;
        btnPreview.disabled = false;
        if (btnPublish) btnPublish.disabled = false;
        setPublishHint("");
    }

    function ingestImageFiles(fileList) {
        var files = Array.prototype.slice.call(fileList || []);
        var jobs = [];
        state.extraImages = {};
        files.forEach(function (file) {
            if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) return;
            var name = String(file.webkitRelativePath || file.name).split(/[/\\]/).pop();
            jobs.push(
                file.arrayBuffer().then(function (buf) {
                    state.extraImages[name] = new Uint8Array(buf);
                })
            );
        });
        if (!jobs.length) {
            setStatus("Nenhuma imagem encontrada nessa pasta.", "error");
            return Promise.resolve();
        }
        return Promise.all(jobs).then(function () {
            var count = Object.keys(state.extraImages).length;
            if (imagesStatus) {
                imagesStatus.textContent = count + " imagem(ns) pronta(s) para copiar com a oficina";
            }
            if (state.parsed) {
                mergeExtraImages(state.parsed);
                applyParsed(state.parsed);
                setStatus("Imagens anexadas à conversão. Envie para a home quando quiser.", "success");
            } else {
                setStatus(count + " imagens carregadas. Envie o .docx para converter.", "success");
            }
        });
    }

    function escape(s) {
        var d = document.createElement("div");
        d.textContent = s || "";
        return d.innerHTML;
    }

    function mimeForFilename(name) {
        var ext = (name.split(".").pop() || "").toLowerCase();
        if (ext === "gif") return "image/gif";
        if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
        if (ext === "webp") return "image/webp";
        if (ext === "svg") return "image/svg+xml";
        return "image/png";
    }

    function revokePreviewUrls() {
        state.previewBlobUrls.forEach(function (url) {
            try { URL.revokeObjectURL(url); } catch (err) { /* ignore */ }
        });
        state.previewBlobUrls = [];
    }

    /** Prepara HTML da prévia: imagens embutidas viram URLs temporárias no navegador. */
    function preparePreviewHtml(html, parsed) {
        revokePreviewUrls();

        Object.keys(parsed.images || {}).forEach(function (name) {
            var bytes = parsed.images[name];
            if (!bytes) return;
            var blob = new Blob([bytes], { type: mimeForFilename(name) });
            var blobUrl = URL.createObjectURL(blob);
            state.previewBlobUrls.push(blobUrl);
            var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            html = html.replace(new RegExp('src="images/' + escaped + '"', "g"), 'src="' + blobUrl + '"');
        });

        return html;
    }

    function openStyledPreview() {
        if (!state.parsed) return;

        var html = preparePreviewHtml(NaveHtmlGenerator.generate(state.parsed), state.parsed);

        try {
            localStorage.setItem("nave-preview-html", html);
            localStorage.setItem("nave-preview-ts", String(Date.now()));
        } catch (err) {
            setStatus("A prévia é grande demais para o navegador. Use Baixar pacote ZIP.", "error");
            return;
        }

        var link = document.createElement("a");
        link.href = "preview.html";
        link.target = "_blank";
        link.rel = "noopener";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function setPublishHint(html) {
        if (!publishHint) return;
        publishHint.innerHTML = html || "";
        publishHint.classList.toggle("hidden", !html);
    }

    function buildCatalogEntry(parsed) {
        var entry = NaveHtmlGenerator.generateOficinasJsonEntry(parsed.meta);
        var names = Object.keys(parsed.images || {});
        if (names.length) {
            entry.capa = "oficinas/" + entry.id + "/images/" + names[0];
        }
        if (!entry.icone) entry.icone = "school";
        return entry;
    }

    function toUint8(value) {
        if (!value) return new Uint8Array();
        if (value instanceof Uint8Array) return value;
        if (value instanceof ArrayBuffer) return new Uint8Array(value);
        if (ArrayBuffer.isView(value)) {
            return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        }
        return new Uint8Array(value);
    }

    function canWriteToDisk() {
        return typeof window.showDirectoryPicker === "function";
    }

    function fileExists(dir, name) {
        return dir.getFileHandle(name).then(
            function () { return true; },
            function () { return false; }
        );
    }

    function writeFile(dir, name, data) {
        return dir.getFileHandle(name, { create: true }).then(function (handle) {
            return handle.createWritable().then(function (writable) {
                return writable.write(data).then(function () {
                    return writable.close();
                });
            });
        });
    }

    function ensureDir(parent, name) {
        return parent.getDirectoryHandle(name, { create: true });
    }

    function readTextFile(dir, name) {
        return dir.getFileHandle(name).then(function (handle) {
            return handle.getFile().then(function (file) {
                return file.text();
            });
        });
    }

    function upsertOficinasEmbed(indexHtml, oficinas) {
        var json = JSON.stringify(oficinas, null, 4);
        var replaced = indexHtml.replace(
            /<script type="application\/json" id="oficinas-data">[\s\S]*?<\/script>/,
            '<script type="application/json" id="oficinas-data">\n' + json + "\n    </script>"
        );
        if (replaced === indexHtml) {
            throw new Error("Não encontrei o bloco #oficinas-data em index.html.");
        }
        return replaced;
    }

    function mergeCatalog(existing, entry) {
        var list = Array.isArray(existing) ? existing.slice() : [];
        var idx = -1;
        for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === entry.id) {
                idx = i;
                break;
            }
        }
        if (idx >= 0) list[idx] = entry;
        else list.push(entry);
        return list;
    }

    function collectDirListing(dir) {
        if (typeof dir.entries !== "function") {
            return Promise.all([
                fileExists(dir, "oficinas.json"),
                fileExists(dir, "index.html"),
                dir.getDirectoryHandle("oficinas").then(function (h) { return h; }, function () { return null; }),
                dir.getDirectoryHandle("o-espelho-tecnologico").then(function (h) { return h; }, function () { return null; })
            ]).then(function (flags) {
                var files = {};
                var dirs = {};
                if (flags[0]) files["oficinas.json"] = { name: "oficinas.json" };
                if (flags[1]) files["index.html"] = { name: "index.html" };
                if (flags[2]) dirs["oficinas"] = { name: "oficinas", handle: flags[2] };
                if (flags[3]) dirs["o-espelho-tecnologico"] = { name: "o-espelho-tecnologico", handle: flags[3] };
                return { files: files, dirs: dirs, name: dir.name || "" };
            });
        }
        var files = {};
        var dirs = {};
        var it = dir.entries();
        function step() {
            return it.next().then(function (res) {
                if (res.done) return { files: files, dirs: dirs, name: dir.name || "" };
                var entryName = res.value[0];
                var handle = res.value[1];
                var key = String(entryName).toLowerCase();
                if (handle.kind === "directory") dirs[key] = { name: entryName, handle: handle };
                else files[key] = { name: entryName, handle: handle };
                return step();
            });
        }
        return step();
    }

    function detectPublishLayout(dir) {
        return collectDirListing(dir).then(function (listed) {
            var name = String(listed.name || "").toLowerCase();
            var hasJson = !!listed.files["oficinas.json"];
            var hasIndex = !!listed.files["index.html"];
            var hasOficinas = !!listed.dirs["oficinas"];
            var hasModelo = !!listed.dirs["o-espelho-tecnologico"];
            var looksOficinas = name === "oficinas" || hasModelo;

            if (hasIndex && listed.dirs["images"] && !hasJson && !hasOficinas && name !== "oficinas") {
                throw new Error("Essa pasta parece ser de uma oficina já publicada. Escolha a pasta OficinasNave (com oficinas.json) ou a pasta oficinas.");
            }

            if (hasJson || hasOficinas) {
                var oficinasHandle = hasOficinas
                    ? Promise.resolve(listed.dirs["oficinas"].handle)
                    : ensureDir(dir, "oficinas");
                return oficinasHandle.then(function (oficinasDir) {
                    return {
                        root: dir,
                        oficinasDir: oficinasDir,
                        updateCatalog: hasJson || hasIndex,
                        jsonName: listed.files["oficinas.json"] ? listed.files["oficinas.json"].name : "oficinas.json",
                        indexName: listed.files["index.html"] ? listed.files["index.html"].name : "index.html"
                    };
                });
            }

            if (looksOficinas) {
                return {
                    root: null,
                    oficinasDir: dir,
                    updateCatalog: false,
                    jsonName: "oficinas.json",
                    indexName: "index.html"
                };
            }

            throw new Error("Não reconheci essa pasta. Escolha a pasta OficinasNave (a que contém oficinas.json e index.html) ou a pasta oficinas, onde ficam as oficinas.");
        });
    }

    function writeWorkshopFiles(slugDir, parsed, html) {
        return Promise.all([
            ensureDir(slugDir, "images"),
            ensureDir(slugDir, "fonte")
        ]).then(function (dirs) {
            var imagesDir = dirs[0];
            var fonteDir = dirs[1];
            var writes = [writeFile(slugDir, "index.html", html)];
            if (parsed.originalDocx) {
                writes.push(
                    writeFile(
                        fonteDir,
                        parsed.originalFileName || state.fileName || "fonte.docx",
                        parsed.originalDocx
                    )
                );
            }
            Object.keys(parsed.images || {}).forEach(function (name) {
                writes.push(writeFile(imagesDir, name, toUint8(parsed.images[name])));
            });
            return Promise.all(writes);
        });
    }

    function updateCatalogFiles(root, jsonName, indexName, entry) {
        return readTextFile(root, jsonName).then(
            function (text) {
                var current = [];
                try { current = JSON.parse(text); } catch (err) { current = []; }
                return mergeCatalog(current, entry);
            },
            function () {
                return mergeCatalog([], entry);
            }
        ).then(function (catalog) {
            return writeFile(root, jsonName, JSON.stringify(catalog, null, 4) + "\n").then(function () {
                return fileExists(root, indexName).then(function (hasIndex) {
                    if (!hasIndex) return catalog;
                    return readTextFile(root, indexName).then(function (indexHtml) {
                        return writeFile(root, indexName, upsertOficinasEmbed(indexHtml, catalog));
                    }).then(function () { return catalog; });
                });
            });
        });
    }

    function publishToHome() {
        if (!state.parsed) return;
        if (!canWriteToDisk()) {
            setStatus("O envio para a home precisa do Chrome ou Edge. Neste navegador, use Baixar pacote ZIP e copie a pasta oficinas/.", "error");
            return;
        }

        var parsed = state.parsed;
        var entry = buildCatalogEntry(parsed);
        var id = entry.id;
        var html = NaveHtmlGenerator.generate(parsed);

        setStatus("Selecione a pasta OficinasNave (raiz) ou a pasta oficinas…");

        window.showDirectoryPicker({ id: "nave-oficinas-root", mode: "readwrite" })
            .then(function (picked) {
                return detectPublishLayout(picked).then(function (layout) {
                    return layout.oficinasDir.getDirectoryHandle(id).then(
                        function () { return true; },
                        function () { return false; }
                    ).then(function (exists) {
                        if (exists && !window.confirm("Já existe oficinas/" + id + ". Sobrescrever os arquivos gerados?")) {
                            var cancel = new Error("cancel");
                            cancel.code = "cancel";
                            throw cancel;
                        }
                        return ensureDir(layout.oficinasDir, id);
                    }).then(function (slugDir) {
                        return writeWorkshopFiles(slugDir, parsed, html).then(function () {
                            if (!layout.updateCatalog || !layout.root) {
                                return { catalogUpdated: false };
                            }
                            return updateCatalogFiles(layout.root, layout.jsonName, layout.indexName, entry)
                                .then(function () { return { catalogUpdated: true }; });
                        });
                    });
                });
            })
            .then(function (result) {
                var homeHref = "../../index.html";
                var oficinaHref = "../../oficinas/" + id + "/index.html";
                var catalogNote = result && result.catalogUpdated
                    ? "O card já entra na home."
                    : "Para o card aparecer na home, na próxima vez escolha a pasta OficinasNave (a que tem oficinas.json).";
                setStatus("Oficina salva em oficinas/" + id + "/. " + catalogNote + " Abra o código para ajustar o que precisar.", "success");
                setPublishHint(
                    'Estrutura igual à oficina modelo: <code>oficinas/' + escape(id) + '/index.html</code>, <code>images/</code> e <code>fonte/</code>. ' +
                    '<a class="text-primary underline" href="' + homeHref + '">Ver na home</a> · ' +
                    '<a class="text-primary underline" href="' + oficinaHref + '">Abrir a oficina</a>'
                );
            })
            .catch(function (err) {
                if (err && (err.code === "cancel" || err.name === "AbortError")) {
                    setStatus("Envio cancelado.", "");
                    return;
                }
                console.error(err);
                setStatus("Erro ao enviar para a home: " + (err.message || err), "error");
            });
    }

    function buildZip() {
        if (!state.parsed) return Promise.reject(new Error("Nenhum documento processado"));

        var parsed = state.parsed;
        var html = NaveHtmlGenerator.generate(parsed);
        var id = parsed.meta.id;
        var zip = new JSZip();
        var root = zip.folder("oficinas").folder(id);

        root.file("index.html", html);
        var fonteFolder = root.folder("fonte");
        if (parsed.originalDocx) {
            fonteFolder.file(parsed.originalFileName || state.fileName, parsed.originalDocx);
        }

        var imagesFolder = root.folder("images");
        Object.keys(parsed.images).forEach(function (name) {
            imagesFolder.file(name, parsed.images[name]);
        });

        var readme = [
            "Oficina gerada pelo Conversor NAVE",
            "",
            "1. Copie a pasta oficinas/" + id + "/ para o repositório OficinasNave",
            "2. Adicione a entrada em oficinas.json:",
            "",
            JSON.stringify(NaveHtmlGenerator.generateOficinasJsonEntry(parsed.meta), null, 4),
            "",
            "3. Coloque o .docx original em oficinas/" + id + "/fonte/ manualmente"
        ].join("\n");
        root.file("LEIA-ME.txt", readme);

        return zip.generateAsync({ type: "blob" });
    }

    dropZone.addEventListener("click", function () {
        fileInput.click();
    });

    fileInput.addEventListener("change", function () {
        if (fileInput.files[0]) handleFile(fileInput.files[0]);
    });

    dropZone.addEventListener("dragover", function (e) {
        e.preventDefault();
        dropZone.classList.add("border-primary", "bg-primary/5");
    });

    dropZone.addEventListener("dragleave", function () {
        dropZone.classList.remove("border-primary", "bg-primary/5");
    });

    dropZone.addEventListener("drop", function (e) {
        e.preventDefault();
        dropZone.classList.remove("border-primary", "bg-primary/5");
        var files = Array.prototype.slice.call(e.dataTransfer.files || []);
        var docx = files.filter(function (f) { return /\.docx$/i.test(f.name); })[0];
        var images = files.filter(function (f) { return /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name); });
        var chain = images.length ? ingestImageFiles(images) : Promise.resolve();
        chain.then(function () {
            if (docx) handleFile(docx);
            else if (!images.length) setStatus("Envie um arquivo .docx ou uma pasta de imagens.", "error");
        }).catch(function (err) {
            setStatus("Erro ao ler os arquivos: " + (err.message || err), "error");
        });
    });

    btnDownload.addEventListener("click", function () {
        buildZip().then(function (blob) {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = (state.parsed.meta.id || "oficina") + ".zip";
            a.click();
            URL.revokeObjectURL(a.href);
        }).catch(function (err) {
            setStatus("Erro ao gerar ZIP: " + err.message, "error");
        });
    });

    btnPreview.addEventListener("click", openStyledPreview);
    if (btnPublish) btnPublish.addEventListener("click", publishToHome);
    if (imagesInput) {
        imagesInput.addEventListener("change", function () {
            ingestImageFiles(imagesInput.files).then(function () {
                imagesInput.value = "";
            });
        });
    }
})();