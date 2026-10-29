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

function createConfig(schemaVersion = 3) {
  const config = {
    schemaVersion,
    order: ["clock", "apps"],
    widgets: {
      clock: {
        included: true,
        visible: true,
        size: "small",
        ...(schemaVersion === 3 ? { label: "Relógio" } : {}),
      },
      apps: {
        included: true,
        visible: false,
        size: "large",
        ...(schemaVersion === 3 ? { label: "Aplicativos" } : {}),
      },
    },
    theme: "ocean",
    wallpaper: "landscape",
    preferences: { clockFormat: "24", temperatureUnit: "celsius" },
  };
  if (schemaVersion >= 2) {
    config.dock = {
      order: ["browser", "notes"],
      apps: {
        browser: {
          visible: true,
          icon: "globe",
          ...(schemaVersion === 3 ? { label: "Navegador" } : {}),
        },
        notes: {
          visible: false,
          icon: "notebook-pen",
          ...(schemaVersion === 3 ? { label: "Notas" } : {}),
        },
      },
    };
  }
  return config;
}

test("legacy dashboard settings validate and migrate while preserving preferences", async () => {
  const { isDashboardConfig, migrateDashboardConfig } =
    await loadConfigModule();
  const legacy = createConfig(1);
  const defaults = createConfig(3);

  assert.equal(isDashboardConfig(legacy, options), true);
  const migrated = migrateDashboardConfig(legacy, defaults);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(migrated.theme, legacy.theme);
  assert.deepEqual(migrated.order, legacy.order);
  assert.deepEqual(migrated.dock, defaults.dock);
  assert.notEqual(migrated.dock.apps.browser, defaults.dock.apps.browser);
  assert.equal(migrated.widgets.clock.label, "Relógio");
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

  const invalidLabel = createConfig();
  invalidLabel.widgets.apps.label = "  ";
  assert.equal(isDashboardConfig(invalidLabel, options), false);
});

test("schema version 2 migrates editable labels without losing dock preferences", async () => {
  const { isDashboardConfig, migrateDashboardConfig } =
    await loadConfigModule();
  const previous = createConfig(2);
  previous.dock.order.reverse();
  previous.dock.apps.browser.icon = "star";
  const migrated = migrateDashboardConfig(previous, createConfig(3));

  assert.equal(isDashboardConfig(previous, options), true);
  assert.equal(migrated.schemaVersion, 3);
  assert.deepEqual(migrated.dock.order, ["notes", "browser"]);
  assert.equal(migrated.dock.apps.browser.icon, "star");
  assert.equal(migrated.dock.apps.browser.label, "Navegador");
  assert.equal(migrated.widgets.clock.label, "Relógio");
});

test("drag ordering moves visible items without displacing hidden entries", async () => {
  const { reorderSubset } = await loadConfigModule();
  const order = ["browser", "hidden-app", "notes", "terminal"];
  const moved = reorderSubset(
    order,
    (id) => id !== "hidden-app",
    "terminal",
    "browser",
    false,
  );
  assert.deepEqual(moved, ["terminal", "hidden-app", "browser", "notes"]);

  const widgets = ["clock", "hidden-widget", "weather", "notes"];
  assert.deepEqual(
    reorderSubset(
      widgets,
      (id) => id !== "hidden-widget",
      "clock",
      "weather",
      true,
    ),
    ["weather", "hidden-widget", "clock", "notes"],
  );
  assert.equal(
    reorderSubset(order, (id) => id !== "hidden-app", "unknown", "browser", false),
    null,
  );
});
