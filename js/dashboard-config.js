const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (value, keys) =>
  isRecord(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));

export function isDashboardConfig(
  value,
  { widgetIds, widgetDefinitions, dashboardThemes, dashboardWallpapers, appIds, dockIconNames },
) {
  const legacyKeys = [
    "schemaVersion",
    "order",
    "widgets",
    "theme",
    "wallpaper",
    "preferences",
  ];
  const currentKeys = [...legacyKeys, "dock"];
  const isLegacy = value?.schemaVersion === 1;

  if (
    !hasExactKeys(value, isLegacy ? legacyKeys : currentKeys) ||
    ![1, 2].includes(value.schemaVersion) ||
    !Array.isArray(value.order) ||
    value.order.length !== widgetIds.length ||
    new Set(value.order).size !== widgetIds.length ||
    !widgetIds.every((id) => value.order.includes(id)) ||
    !hasExactKeys(value.widgets, widgetIds) ||
    !dashboardThemes.includes(value.theme) ||
    !dashboardWallpapers.includes(value.wallpaper) ||
    !hasExactKeys(value.preferences, ["clockFormat", "temperatureUnit"]) ||
    !["12", "24"].includes(value.preferences.clockFormat) ||
    !["celsius", "fahrenheit"].includes(value.preferences.temperatureUnit)
  ) {
    return false;
  }

  const widgetsValid = widgetDefinitions.every(({ id }) => {
    const widget = value.widgets[id];
    return (
      hasExactKeys(widget, ["included", "visible", "size"]) &&
      typeof widget.included === "boolean" &&
      typeof widget.visible === "boolean" &&
      ["small", "medium", "large"].includes(widget.size) &&
      (widget.included || !widget.visible)
    );
  });
  if (!widgetsValid) return false;
  if (isLegacy) return true;

  return (
    hasExactKeys(value.dock, ["order", "apps"]) &&
    Array.isArray(value.dock.order) &&
    value.dock.order.length === appIds.length &&
    new Set(value.dock.order).size === appIds.length &&
    appIds.every((id) => value.dock.order.includes(id)) &&
    hasExactKeys(value.dock.apps, appIds) &&
    appIds.every((id) => {
      const app = value.dock.apps[id];
      return (
        hasExactKeys(app, ["visible", "icon"]) &&
        typeof app.visible === "boolean" &&
        dockIconNames.includes(app.icon)
      );
    })
  );
}

export function migrateDashboardConfig(value, defaultConfig) {
  if (value.schemaVersion !== 1) return value;
  return {
    ...value,
    schemaVersion: 2,
    dock: {
      order: [...defaultConfig.dock.order],
      apps: Object.fromEntries(
        Object.entries(defaultConfig.dock.apps).map(([id, app]) => [
          id,
          { ...app },
        ]),
      ),
    },
  };
}
