"use strict";

const assert = require("node:assert/strict");
const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { test } = require("node:test");

const moduleSource = readFile(
  path.join(__dirname, "../js/dashboard-config.js"),
  "utf8",
);

async function loadConfigModule() {
  const source = await moduleSource;
  const encoded = Buffer.from(source).toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const options = {
  widgetIds: ["clock", "apps"],
  widgetDefinitions: [{ id: "clock" }, { id: "apps" }],
  dashboardThemes: ["ocean", "violet"],
  dashboardWallpapers: ["landscape", "sunset"],
  appIds: ["browser", "notes"],
  dockIconNames: ["globe", "notebook-pen", "star"],
};

function createConfig(schemaVersion = 2) {
  const config = {
    schemaVersion,
    order: ["clock", "apps"],
    widgets: {
      clock: { included: true, visible: true, size: "small" },
      apps: { included: true, visible: false, size: "large" },
    },
    theme: "ocean",
    wallpaper: "landscape",
    preferences: { clockFormat: "24", temperatureUnit: "celsius" },
  };
  if (schemaVersion === 2) {
    config.dock = {
      order: ["browser", "notes"],
      apps: {
        browser: { visible: true, icon: "globe" },
        notes: { visible: false, icon: "notebook-pen" },
      },
    };
  }
  return config;
}

test("legacy dashboard settings validate and migrate while preserving preferences", async () => {
  const { isDashboardConfig, migrateDashboardConfig } =
    await loadConfigModule();
  const legacy = createConfig(1);
  const defaults = createConfig(2);

  assert.equal(isDashboardConfig(legacy, options), true);
  const migrated = migrateDashboardConfig(legacy, defaults);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.theme, legacy.theme);
  assert.deepEqual(migrated.order, legacy.order);
  assert.deepEqual(migrated.dock, defaults.dock);
  assert.notEqual(migrated.dock.apps.browser, defaults.dock.apps.browser);
});

test("dock configuration validates app visibility, ordering, and local icons", async () => {
  const { isDashboardConfig } = await loadConfigModule();
  const config = createConfig();

  assert.equal(isDashboardConfig(config, options), true);
  config.dock.order[1] = "browser";
  assert.equal(isDashboardConfig(config, options), false);

  const invalidIcon = createConfig();
  invalidIcon.dock.apps.notes.icon = "https://example.com/icon.svg";
  assert.equal(isDashboardConfig(invalidIcon, options), false);
});
