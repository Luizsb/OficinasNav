(function () {
    "use strict";

    var state = {
        parsed: null,
        fileName: "",
        previewBlobUrls: []
    };

    var dropZone = document.getElementById("drop-zone");
    var fileInput = document.getElementById("file-input");
    var statusEl = document.getElementById("status");
    var previewEl = document.getElementById("preview");
    var metaEl = document.getElementById("meta-preview");
    var jsonEntryEl = document.getElementById("json-entry");
    var btnDownload = document.getElementById("btn-download");
    var btnPreview = document.getElementById("btn-preview");

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
                    revokePreviewUrls();
                    state.parsed = parsed;
                    var html = NaveHtmlGenerator.generate(parsed);
                    var entry = NaveHtmlGenerator.generateOficinasJsonEntry(parsed.meta);

                    previewEl.textContent = html.slice(0, 3000) + (html.length > 3000 ? "\n\n… (prévia truncada)" : "");
                    metaEl.innerHTML =
                        "<li><strong>ID:</strong> " + escape(entry.id) + "</li>" +
                        "<li><strong>Título:</strong> " + escape(entry.titulo) + "</li>" +
                        "<li><strong>Subtítulo:</strong> " + escape(entry.subtitulo) + "</li>" +
                        "<li><strong>Ano:</strong> " + escape(entry.ano) + "</li>" +
                        "<li><strong>Duração:</strong> " + escape(entry.duracao) + "</li>" +
                        "<li><strong>Imagens:</strong> " + Object.keys(parsed.images).length + "</li>";
                    jsonEntryEl.textContent = JSON.stringify(entry, null, 4);

                    btnDownload.disabled = false;
                    btnPreview.disabled = false;
                    setStatus("Conversão concluída! Revise a prévia e baixe o pacote.", "success");
                })
                .catch(function (err) {
                    console.error(err);
                    setStatus("Erro: " + (err.message || err), "error");
                    btnDownload.disabled = true;
                    btnPreview.disabled = true;
                });
        };
        reader.onerror = function () {
            setStatus("Não foi possível ler o arquivo.", "error");
        };
        reader.readAsArrayBuffer(file);
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
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
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
})();