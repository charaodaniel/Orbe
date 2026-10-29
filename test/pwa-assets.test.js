"use strict";

const assert = require("node:assert/strict");
const { readFile, stat } = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");

const root = path.resolve(__dirname, "..");

test("manifest configures standalone installation with valid local icons", async () => {
  const manifest = JSON.parse(
    await readFile(path.join(root, "manifest.json"), "utf8"),
  );
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");

  for (const [filename, expectedSize] of [
    ["icons/icon-192.png", 192],
    ["icons/icon-512.png", 512],
  ]) {
    const icon = manifest.icons.find(
      (item) => item.src === `./${filename}` && item.sizes === `${expectedSize}x${expectedSize}`,
    );
    assert.ok(icon, `manifest must declare ${filename}`);
    const bytes = await readFile(path.join(root, filename));
    assert.equal(bytes.toString("hex", 1, 4), "504e47");
    assert.equal(bytes.readUInt32BE(16), expectedSize);
    assert.equal(bytes.readUInt32BE(20), expectedSize);
  }
});

test("offline application shell pre-caches every local entry asset", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const worker = await readFile(path.join(root, "sw.js"), "utf8");
  const cacheBlock = worker.match(/const APP_FILES = \[([\s\S]*?)\];/);
  assert.ok(cacheBlock, "service worker must declare its pre-cache list");
  const cachedFiles = new Set(
    [...cacheBlock[1].matchAll(/"(\.\/[^"]+)"/g)].map((match) =>
      match[1].replace(/^\.\//, ""),
    ),
  );

  const localAssets = [
    ...html.matchAll(/(?:src|href)="([^"]+)"/g),
  ]
    .map((match) => match[1])
    .filter((url) => !/^(?:[a-z]+:|#|\/\/)/i.test(url))
    .map((url) => url.split(/[?#]/, 1)[0]);

  for (const asset of localAssets) {
    assert.ok(cachedFiles.has(asset), `${asset} must be pre-cached`);
    await stat(path.join(root, asset));
  }
  const entryScript = await readFile(path.join(root, "js/script.js"), "utf8");
  for (const [, importedPath] of entryScript.matchAll(
    /from\s+["'](\.\/[^"']+\.js)["']/g,
  )) {
    const importedAsset = path.posix.normalize(
      path.posix.join("js", importedPath.slice(2)),
    );
    assert.ok(cachedFiles.has(importedAsset), `${importedAsset} must be pre-cached`);
    await stat(path.join(root, importedAsset));
  }
  assert.ok(cachedFiles.has("index.html"));
});

test("dashboard exposes named controls and responsive breakpoints", async () => {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const css = await readFile(path.join(root, "css/style.css"), "utf8");
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
  for (const id of [
    "search",
    "apps",
    "dockApps",
    "dockCatalog",
    "nav",
    "notes",
    "agenda",
  ]) {
    assert.ok(ids.includes(id), `missing interactive element #${id}`);
  }
  assert.match(html, /Gerenciar dock e ícones/);
  for (const breakpoint of [700, 1050, 1350]) {
    assert.ok(css.includes(`(max-width: ${breakpoint}px)`));
  }
});
