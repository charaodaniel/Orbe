"use strict";

const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const { before, test } = require("node:test");

let registerServiceWorker;
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

before(async () => {
  const source = await readFile(new URL("../js/pwa.js", `file://${__filename}`), "utf8");
  ({ registerServiceWorker } = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  ));
});

function setBrowserGlobals(navigatorValue, windowValue) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: navigatorValue,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowValue,
  });
}

function restoreBrowserGlobals() {
  if (originalNavigator) {
    Object.defineProperty(globalThis, "navigator", originalNavigator);
  } else {
    delete globalThis.navigator;
  }
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    delete globalThis.window;
  }
}

test("unsupported browsers receive an explicit status", async (context) => {
  context.after(restoreBrowserGlobals);
  setBrowserGlobals({}, {});
  let status = "";
  await registerServiceWorker((message) => (status = message));
  assert.match(status, /não oferece suporte/);
});

test("waiting updates require confirmation before skipWaiting and reload", async (context) => {
  context.after(restoreBrowserGlobals);
  const serviceWorker = new EventTarget();
  serviceWorker.controller = {};
  const posts = [];
  const waitingWorker = { postMessage: (message) => posts.push(message) };
  const registration = new EventTarget();
  registration.waiting = waitingWorker;
  registration.update = async () => {};
  let reloads = 0;
  setBrowserGlobals(
    { serviceWorker },
    {
      confirm: () => true,
      location: { reload: () => (reloads += 1) },
    },
  );
  serviceWorker.register = async () => registration;

  await registerServiceWorker(() => {});
  serviceWorker.dispatchEvent(new Event("controllerchange"));

  assert.deepEqual(posts, [{ type: "SKIP_WAITING" }]);
  assert.equal(reloads, 1);
});

test("update-check failures are surfaced to the user", async (context) => {
  context.after(restoreBrowserGlobals);
  const serviceWorker = new EventTarget();
  const registration = new EventTarget();
  registration.waiting = null;
  registration.update = async () => {
    throw new Error("offline");
  };
  serviceWorker.register = async () => registration;
  setBrowserGlobals(
    { serviceWorker },
    { confirm: () => false, location: { reload() {} } },
  );
  let status = "";

  await registerServiceWorker((message) => (status = message));
  await new Promise((resolve) => setImmediate(resolve));

  assert.match(status, /verificar atualizações/);
});
