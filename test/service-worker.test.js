"use strict";

const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const vm = require("node:vm");
const { before, test } = require("node:test");

let source;
let cacheName;

before(async () => {
  source = await readFile(new URL("../sw.js", `file://${__filename}`), "utf8");
  cacheName = source.match(/const CACHE_NAME = "([^"]+)";/)[1];
});

function createServiceWorker({
  fetchRequest = async () => {
    throw new TypeError("offline");
  },
} = {}) {
  const handlers = new Map();
  const cacheStores = new Map();
  const cacheKey = (request) =>
    new URL(
      typeof request === "string" ? request : request.url,
      "https://orbe.example/app/sw.js",
    ).href;
  const cache = {
    added: [],
    async addAll(files) {
      this.added = [...files];
      for (const file of files) {
        cacheStores.get(cacheName).set(
          new URL(file, "https://orbe.example/app/").href,
          new Response(`cached:${file}`),
        );
      }
    },
    async match(request) {
      return cacheStores.get(cacheName).get(cacheKey(request));
    },
    async put(request, response) {
      cacheStores.get(cacheName).set(cacheKey(request), response);
    },
  };
  const caches = {
    async open(name) {
      if (!cacheStores.has(name)) cacheStores.set(name, new Map());
      return cache;
    },
    async match(request) {
      for (const store of cacheStores.values()) {
        const response = store.get(cacheKey(request));
        if (response) return response;
      }
      return undefined;
    },
    async keys() {
      return [...cacheStores.keys()];
    },
    async delete(name) {
      return cacheStores.delete(name);
    },
  };
  const self = {
    location: { origin: "https://orbe.example" },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
  };
  vm.runInNewContext(source, {
    self,
    caches,
    fetch: fetchRequest,
    URL,
    Response,
    Promise,
  });
  return { handlers, caches, cache, cacheStores };
}

test("install pre-caches the offline application shell", async () => {
  const { handlers, cache } = createServiceWorker();
  let installPromise;
  handlers.get("install")({ waitUntil(promise) { installPromise = promise; } });
  await installPromise;

  assert.ok(cache.added.includes("./index.html"));
  assert.ok(cache.added.includes("./js/script.js"));
  assert.ok(cache.added.includes("./js/vendor/lucide.min.js"));
});

test("navigation falls back to the cached app shell when offline", async () => {
  const { handlers, cacheStores } = createServiceWorker();
  cacheStores.set(
    cacheName,
    new Map([
      [
        "https://orbe.example/app/index.html",
        new Response("offline shell"),
      ],
    ]),
  );
  let navigationResponse;
  handlers.get("fetch")({
    request: {
      method: "GET",
      url: "https://orbe.example/app/notes",
      mode: "navigate",
    },
    respondWith(promise) {
      navigationResponse = promise;
    },
  });

  const response = await navigationResponse;
  assert.equal(await response.text(), "offline shell");
});

test("online navigations are cached for later offline visits", async () => {
  let online = true;
  const { handlers } = createServiceWorker({
    fetchRequest: async () => {
      if (!online) throw new TypeError("offline");
      return new Response("online page");
    },
  });
  const navigation = {
    method: "GET",
    url: "https://orbe.example/app/events",
    mode: "navigate",
  };
  const fetchNavigation = async () => {
    let responsePromise;
    handlers.get("fetch")({
      request: navigation,
      respondWith(promise) {
        responsePromise = promise;
      },
    });
    return responsePromise;
  };

  assert.equal(await (await fetchNavigation()).text(), "online page");
  online = false;
  assert.equal(await (await fetchNavigation()).text(), "online page");
});

test("same-origin assets are cache-first and new responses are cached", async () => {
  let networkCalls = 0;
  const { handlers, cacheStores } = createServiceWorker({
    fetchRequest: async () => {
      networkCalls += 1;
      return new Response("network asset");
    },
  });
  cacheStores.set(
    cacheName,
    new Map([["https://orbe.example/js/cached.js", new Response("cache asset")]]),
  );
  let cachedResponse;
  handlers.get("fetch")({
    request: {
      method: "GET",
      url: "https://orbe.example/js/cached.js",
      mode: "same-origin",
    },
    respondWith(promise) {
      cachedResponse = promise;
    },
  });
  assert.equal(await (await cachedResponse).text(), "cache asset");
  assert.equal(networkCalls, 0);

  let newResponse;
  handlers.get("fetch")({
    request: {
      method: "GET",
      url: "https://orbe.example/js/new.js",
      mode: "same-origin",
    },
    respondWith(promise) {
      newResponse = promise;
    },
  });
  assert.equal(await (await newResponse).text(), "network asset");
  assert.equal(networkCalls, 1);
  assert.ok(
    cacheStores.get(cacheName).has("https://orbe.example/js/new.js"),
  );
});
