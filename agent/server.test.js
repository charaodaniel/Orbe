"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");
const {
  createAgentServer,
  getApplicationDirectories,
  getAllowedOrigins,
  getIconDirectories,
  getSystemMetrics,
  listApplications,
  parseDesktopEntry,
} = require("./server");

const ORIGIN = "http://localhost:5173";
const TOKEN = "0123456789abcdef0123456789abcdef";
let temporaryDirectory;
let applicationsDirectory;
let iconsDirectory;
let server;
let baseUrl;
const launched = [];

before(async () => {
  temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "orbe-agent-test-"),
  );
  applicationsDirectory = path.join(temporaryDirectory, "applications");
  await fs.mkdir(applicationsDirectory);
  iconsDirectory = path.join(temporaryDirectory, "icons");
  await fs.mkdir(path.join(iconsDirectory, "48x48", "apps"), { recursive: true });
  await fs.writeFile(
    path.join(iconsDirectory, "48x48", "apps", "sample-icon.svg"),
    '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"></svg>',
  );
  await fs.writeFile(
    path.join(applicationsDirectory, "sample.desktop"),
    [
      "[Desktop Entry]",
      "Type=Application",
      "Name=Sample App",
      "Comment=A test application",
      "Icon=sample-icon",
      "Categories=Utility;Development;",
      "Exec=sample-app %U",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(applicationsDirectory, "unsafe.desktop"),
    [
      "[Desktop Entry]",
      "Type=Application",
      "Name=Unsafe App",
      "Exec=sample-app;touch /tmp/not-allowed",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.join(applicationsDirectory, "hidden.desktop"),
    [
      "[Desktop Entry]",
      "Type=Application",
      "Name=Hidden App",
      "Exec=hidden-app",
      "NoDisplay=true",
      "",
    ].join("\n"),
  );

  const agent = createAgentServer({
    token: TOKEN,
    allowedOrigins: [ORIGIN],
    appDirectories: [applicationsDirectory],
    iconDirectories: [iconsDirectory],
    launchApplication: async (id) => launched.push(id),
    getMetrics: () => ({
      logicalCpus: 8,
      loadAverage1m: 0.25,
      memory: { totalBytes: 1024, freeBytes: 512 },
    }),
  });
  server = agent.server;
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (temporaryDirectory) {
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  }
});

async function request(pathname, { token, origin = ORIGIN, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (origin) headers.set("Origin", origin);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${baseUrl}${pathname}`, { ...options, headers });
}

test("only explicit HTTPS origins and loopback HTTP origins are accepted", () => {
  assert.deepEqual([...getAllowedOrigins("https://orbe.example")], [
    "https://orbe.example",
  ]);
  assert.throws(
    () => getAllowedOrigins("http://orbe.example"),
    /Unsafe allowed origin/,
  );
  assert.throws(
    () => createAgentServer({ token: TOKEN, allowedOrigins: ["*"] }),
    /Invalid allowed origin/,
  );
});

test("application and icon discovery follows absolute XDG directories", () => {
  assert.deepEqual(
    getApplicationDirectories({
      XDG_DATA_HOME: "relative",
      XDG_DATA_DIRS: "/opt/desktop:/custom/share",
    }),
    [
      path.join(os.homedir(), ".local", "share", "applications"),
      "/opt/desktop/applications",
      "/custom/share/applications",
    ],
  );
  assert.deepEqual(
    getIconDirectories({
      XDG_DATA_HOME: "/user/data",
      XDG_DATA_DIRS: "/custom/share",
    }),
    [
      "/user/data/icons/hicolor",
      "/custom/share/icons/hicolor",
      "/usr/share/pixmaps",
    ],
  );
});

test("desktop entries are parsed without exposing executable commands", async () => {
  const applications = await listApplications([applicationsDirectory]);
  assert.deepEqual(
    applications.map(({ id, name }) => ({ id, name })),
    [{ id: "sample", name: "Sample App" }],
  );
  assert.equal(Object.hasOwn(applications[0], "exec"), false);
  assert.equal(applications[0].icon, "sample-icon");
  assert.throws(
    () =>
      parseDesktopEntry(
        "[Desktop Entry]\nType=Application\nName=Unsafe\nExec=sh -c command",
        "unsafe.desktop",
      ),
    /Unsafe desktop Exec/,
  );
  const absoluteIcon = parseDesktopEntry(
    [
      "[Desktop Entry]",
      "Type=Application",
      "Name=Path Icon",
      "Icon=/home/private-name/icons/private-app.svg",
      "Exec=sample-app",
    ].join("\n"),
    "path-icon.desktop",
  );
  assert.equal(absoluteIcon.icon, "private-app");
});

test("health is available to an allowed origin and CORS is not wildcarded", async () => {
  const response = await request("/health");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), ORIGIN);
  assert.deepEqual(await response.json(), {
    status: "ok",
    service: "orbe-linux-agent",
  });
});

test("unapproved origins and authorization are rejected", async () => {
  assert.equal((await request("/health", { origin: "https://attacker.example" })).status, 403);
  assert.equal((await request("/api/apps")).status, 401);
  assert.equal((await request("/api/apps", { token: "wrongwrongwrongwrongwrongwrong12" })).status, 401);
});

test("preflight permits only the declared methods and headers", async () => {
  const response = await request("/api/apps", {
    method: "OPTIONS",
    headers: {
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "authorization,content-type",
    },
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, POST, OPTIONS");
  assert.equal((await request("/api/apps", { method: "OPTIONS", origin: "https://attacker.example" })).status, 403);
});

test("authenticated application and system endpoints return minimal data", async () => {
  const applicationsResponse = await request("/api/apps", { token: TOKEN });
  assert.equal(applicationsResponse.status, 200);
  const applications = await applicationsResponse.json();
  assert.equal(applications.applications.length, 1);
  assert.deepEqual(Object.keys(applications.applications[0]).sort(), [
    "categories",
    "comment",
    "icon",
    "id",
    "name",
  ]);

  const metricsResponse = await request("/api/system", { token: TOKEN });
  assert.equal(metricsResponse.status, 200);
  assert.deepEqual(await metricsResponse.json(), {
    metrics: {
      logicalCpus: 8,
      loadAverage1m: 0.25,
      memory: { totalBytes: 1024, freeBytes: 512 },
    },
  });
  assert.ok(getSystemMetrics().logicalCpus > 0);
});

test("icons are served only from trusted icon roots with authorization", async () => {
  const unauthorized = await request("/api/icons/sample-icon");
  assert.equal(unauthorized.status, 401);

  const response = await request("/api/icons/sample-icon", { token: TOKEN });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/svg+xml");
  assert.match(await response.text(), /<svg/);
  assert.equal((await request("/api/icons/..%2F..%2Fetc%2Fpasswd", { token: TOKEN })).status, 404);
});

test("launch accepts only an installed application identifier", async () => {
  const valid = await request("/api/apps/launch", {
    method: "POST",
    token: TOKEN,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "sample" }),
  });
  assert.equal(valid.status, 202);
  assert.deepEqual(launched, ["sample"]);

  const invalid = await request("/api/apps/launch", {
    method: "POST",
    token: TOKEN,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "../../bin/sh" }),
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(launched, ["sample"]);
});

test("launch rejects invalid JSON and non-JSON requests", async () => {
  const wrongContentType = await request("/api/apps/launch", {
    method: "POST",
    token: TOKEN,
    body: "id=sample",
  });
  assert.equal(wrongContentType.status, 415);

  const invalidJson = await request("/api/apps/launch", {
    method: "POST",
    token: TOKEN,
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(invalidJson.status, 400);

  const oversized = await request("/api/apps/launch", {
    method: "POST",
    token: TOKEN,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "x".repeat(5000) }),
  });
  assert.equal(oversized.status, 413);
});
