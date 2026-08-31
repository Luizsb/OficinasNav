#!/usr/bin/env node
/**
 * Servidor estático local para o Oficinas NAVE.
 * Serve index.html em pastas e não usa glob (funciona com [colchetes] no caminho).
 */
"use strict";

var http = require("http");
var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var port = Number(process.env.PORT || 3000);

var MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".txt": "text/plain; charset=utf-8",
    ".md": "text/markdown; charset=utf-8",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

function send(res, status, body) {
    res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(body);
}

function streamFile(abs, res) {
    var ext = path.extname(abs).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(abs).on("error", function () {
        send(res, 500, "Erro ao ler arquivo");
    }).pipe(res);
}

function resolvePath(urlPath) {
    var decoded;
    try {
        decoded = decodeURIComponent(urlPath || "/");
    } catch (err) {
        return { error: 400 };
    }
    decoded = decoded.split("?")[0].split("#")[0].replace(/\\/g, "/");
    var parts = decoded.split("/").filter(function (part) {
        return part && part !== ".";
    });
    if (parts.some(function (part) { return part === ".."; })) {
        return { error: 400 };
    }
    var abs = parts.length ? path.join.apply(path, [root].concat(parts)) : root;
    var relCheck = path.relative(root, abs);
    if (relCheck.indexOf("..") === 0 || path.isAbsolute(relCheck)) {
        return { error: 400 };
    }
    return { abs: abs };
}

var server = http.createServer(function (req, res) {
    var parsed;
    try {
        parsed = new URL(req.url || "/", "http://127.0.0.1");
    } catch (err) {
        send(res, 400, "Bad request");
        return;
    }

    var resolved = resolvePath(parsed.pathname);
    if (resolved.error) {
        send(res, resolved.error, resolved.error === 400 ? "Bad request" : "Not found");
        return;
    }

    fs.stat(resolved.abs, function (err, st) {
        if (err || !st) {
            send(res, 404, "Not found");
            return;
        }
        if (st.isDirectory()) {
            var indexFile = path.join(resolved.abs, "index.html");
            fs.stat(indexFile, function (indexErr, indexSt) {
                if (indexErr || !indexSt || !indexSt.isFile()) {
                    send(res, 404, "Not found");
                    return;
                }
                streamFile(indexFile, res);
            });
            return;
        }
        streamFile(resolved.abs, res);
    });
});

server.on("error", function (err) {
    if (err.code === "EADDRINUSE") {
        console.error("Porta " + port + " ocupada. Feche o outro servidor (npx serve / Ctrl+C) e rode npm run dev de novo.");
        process.exit(1);
    }
    throw err;
});

server.listen(port, function () {
    console.log("Home:      http://localhost:" + port + "/");
    console.log("Conversor: http://localhost:" + port + "/tools/conversor/index.html");
    console.log("Nao use npx serve nesta pasta. Deixe este processo aberto.");
});
