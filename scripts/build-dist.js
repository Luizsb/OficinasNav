#!/usr/bin/env node
/**
 * Gera dist/ com o artefato estático pronto para S3 ou upload manual.
 * Copia index.html, oficinas.json, assets/ e oficinas/ (sem fonte/ e .docx).
 */
"use strict";

var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var dist = path.join(root, "dist");

var ROOT_FILES = ["index.html", "oficinas.json"];
var ROOT_DIRS = ["assets", "oficinas"];
var SKIP_DIR_NAMES = new Set(["fonte"]);
var SKIP_FILE_NAMES = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);

function shouldSkip(relPath, isDir) {
    var parts = relPath.split(path.sep).filter(Boolean);
    if (parts.some(function (part) { return SKIP_DIR_NAMES.has(part); })) {
        return true;
    }
    var base = parts[parts.length - 1];
    if (!isDir && (SKIP_FILE_NAMES.has(base) || base.endsWith(".docx"))) {
        return true;
    }
    return false;
}

function copyEntry(src, dest, rel) {
    var stat = fs.statSync(src);

    if (stat.isDirectory()) {
        if (shouldSkip(rel, true)) {
            return { skipped: 1, copied: 0, bytes: 0 };
        }
        fs.mkdirSync(dest, { recursive: true });
        return copyDir(src, dest, rel);
    }

    if (shouldSkip(rel, false)) {
        return { skipped: 1, copied: 0, bytes: 0 };
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return { skipped: 0, copied: 1, bytes: stat.size };
}

function copyDir(srcDir, destDir, relDir) {
    var totals = { skipped: 0, copied: 0, bytes: 0 };

    fs.readdirSync(srcDir).forEach(function (name) {
        var src = path.join(srcDir, name);
        var dest = path.join(destDir, name);
        var rel = path.join(relDir, name);
        var result = copyEntry(src, dest, rel);
        totals.skipped += result.skipped;
        totals.copied += result.copied;
        totals.bytes += result.bytes;
    });

    return totals;
}

function removeDist() {
    if (fs.existsSync(dist)) {
        fs.rmSync(dist, { recursive: true, force: true });
    }
    fs.mkdirSync(dist, { recursive: true });
}

function main() {
    var totals = { skipped: 0, copied: 0, bytes: 0 };

    removeDist();

    ROOT_FILES.forEach(function (name) {
        var src = path.join(root, name);
        if (!fs.existsSync(src)) {
            console.error("Arquivo obrigatório ausente:", name);
            process.exit(1);
        }
        var result = copyEntry(src, path.join(dist, name), name);
        totals.skipped += result.skipped;
        totals.copied += result.copied;
        totals.bytes += result.bytes;
    });

    ROOT_DIRS.forEach(function (name) {
        var src = path.join(root, name);
        if (!fs.existsSync(src)) {
            console.error("Pasta obrigatória ausente:", name);
            process.exit(1);
        }
        var result = copyDir(src, path.join(dist, name), name);
        totals.skipped += result.skipped;
        totals.copied += result.copied;
        totals.bytes += result.bytes;
    });

    var mb = (totals.bytes / 1024 / 1024).toFixed(1);
    console.log("dist/ gerada em:", dist);
    console.log("Arquivos copiados:", totals.copied, "| omitidos:", totals.skipped, "| tamanho:", mb, "MB");
    console.log("Suba o conteudo de dist/ para public/NAVEaVELA/OFICINAS/ no S3.");
}

main();
