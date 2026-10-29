const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasExactKeys = (value, keys) =>
  isRecord(value) &&
  Object.keys(value).length === keys.length &&
  keys.every((key) => Object.hasOwn(value, key));

export function reorderSubset(order, isIncluded, sourceId, targetId, after) {
  const slots = order
    .map((id, index) => (isIncluded(id) ? index : -1))
    .filter((index) => index >= 0);
  const items = slots.map((index) => order[index]);
  const sourceIndex = items.indexOf(sourceId);
  if (sourceIndex < 0 || !items.includes(targetId) || sourceId === targetId) {
    return null;
  }
  const [moved] = items.splice(sourceIndex, 1);
  const targetIndex = items.indexOf(targetId);
  items.splice(targetIndex + (after ? 1 : 0), 0, moved);
  const reordered = [...order];
  slots.forEach((slot, index) => {
    reordered[slot] = items[index];
  });
  return reordered;
}

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
  const latestKeys = [...currentKeys];
  const isLegacy = value?.schemaVersion === 1;
  const isCurrent = value?.schemaVersion === 2;

  if (
    !hasExactKeys(
      value,
      isLegacy ? legacyKeys : isCurrent ? currentKeys : latestKeys,
    ) ||
    ![1, 2, 3].includes(value.schemaVersion) ||
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
      hasExactKeys(
        widget,
        value.schemaVersion === 3
          ? ["included", "visible", "size", "label"]
          : ["included", "visible", "size"],
      ) &&
      typeof widget.included === "boolean" &&
      typeof widget.visible === "boolean" &&
      ["small", "medium", "large"].includes(widget.size) &&
      (value.schemaVersion !== 3 ||
        (typeof widget.label === "string" &&
          widget.label.trim().length > 0 &&
          widget.label.length <= 32)) &&
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
        hasExactKeys(
          app,
          value.schemaVersion === 3
            ? ["visible", "icon", "label"]
            : ["visible", "icon"],
        ) &&
        typeof app.visible === "boolean" &&
        dockIconNames.includes(app.icon) &&
        (value.schemaVersion !== 3 ||
          (typeof app.label === "string" &&
            app.label.trim().length > 0 &&
            app.label.length <= 32))
      );
    })
  );
}

export function migrateDashboardConfig(value, defaultConfig) {
  if (value.schemaVersion === 3) return value;
  const widgets = Object.fromEntries(
    Object.entries(value.widgets).map(([id, widget]) => [
      id,
      {
        ...widget,
        label: defaultConfig.widgets[id].label,
      },
    ]),
  );
  const dock =
    value.schemaVersion === 1
      ? {
          order: [...defaultConfig.dock.order],
          apps: Object.fromEntries(
            Object.entries(defaultConfig.dock.apps).map(([id, app]) => [
              id,
              { ...app },
            ]),
          ),
        }
      : {
          order: [...value.dock.order],
          apps: Object.fromEntries(
            Object.entries(value.dock.apps).map(([id, app]) => [
              id,
              { ...app, label: defaultConfig.dock.apps[id].label },
            ]),
          ),
        };
  return {
    ...value,
    schemaVersion: 3,
    widgets,
    dock,
  };
}
