"use strict";

const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { before, test } = require("node:test");

let storage;
let store;

function installStorage({
  failReads = false,
  failWrites = false,
} = {}) {
  store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      if (failReads) throw new Error("Read denied");
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (failWrites) throw new Error("Quota exceeded");
      store.set(key, String(value));
    },
  };
}

before(async () => {
  const source = await readFile(
    new URL("../js/storage.js", `file://${__filename}`),
    "utf8",
  );
  storage = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
});

test("legacy data is migrated without deleting the original key", () => {
  installStorage();
  store.set("metro-start-notes", JSON.stringify([{ text: "nota", done: false }]));

  const result = storage.loadValue(
    "notes",
    [],
    Array.isArray,
    ["metro-start-notes"],
  );

  assert.deepEqual(result.value, [{ text: "nota", done: false }]);
  assert.equal(result.found, true);
  assert.match(result.warning, /migrados/);
  assert.equal(store.has("metro-start-notes"), true);
  assert.deepEqual(JSON.parse(store.get("orbe:notes")), result.value);
});

test("values persist and survive a new load", () => {
  installStorage();
  const value = { theme: "ocean" };

  storage.saveValue("settings", value, (candidate) => candidate.theme === "ocean");

  assert.deepEqual(
    storage.loadValue(
      "settings",
      {},
      (candidate) => candidate.theme === "ocean",
    ),
    { value, warning: "", found: true },
  );
});

test("corrupt values fall back with an explicit warning", () => {
  installStorage();
  store.set("orbe:settings", "{");

  const result = storage.loadValue("settings", { theme: "default" });

  assert.deepEqual(result.value, { theme: "default" });
  assert.equal(result.found, false);
  assert.match(result.warning, /inválidos/);
});

test("unavailable storage and write failures are surfaced", () => {
  installStorage({ failReads: true });
  const result = storage.loadValue("notes", []);
  assert.deepEqual(result.value, []);
  assert.match(result.warning, /indisponível/);

  installStorage({ failWrites: true });
  assert.throws(
    () => storage.saveValue("notes", []),
    /Não foi possível salvar/,
  );
});

test("invalid values are rejected before writing", () => {
  installStorage();
  assert.throws(
    () => storage.saveValue("notes", ["bad"], () => false),
    /passaram na validação/,
  );
  assert.equal(store.size, 0);
});
