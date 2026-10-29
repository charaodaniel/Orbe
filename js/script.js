"use strict";
import { WidgetManager, clockWidget, systemWidget } from "./widgets.js";
import { checkLinuxAgent, initializeLinuxAgent } from "./linux.js";
import { registerServiceWorker } from "./pwa.js";
import { loadValue, saveValue } from "./storage.js";
import {
  isDashboardConfig,
  migrateDashboardConfig,
  reorderSubset,
} from "./dashboard-config.js";
import { calendarWidget } from "./calendar.js";
import { weatherWidget } from "./weather.js";

// 01. Dados e configurações
const apps = [
  ["Navegador", "globe", "blue", "https://www.google.com", "browser"],
  ["Editor de Código", "code-2", "blue", "https://vscode.dev", "code-editor"],
  ["Gerenciador de Arquivos", "folder", "yellow", "", "file-manager"],
  ["Terminal", "terminal", "dark", "", "terminal"],
  ["WhatsApp", "message-circle", "green", "https://web.whatsapp.com", "whatsapp"],
  ["Discord", "gamepad-2", "purple", "https://discord.com/app", "discord"],
  ["YouTube", "youtube", "red", "https://youtube.com", "youtube"],
  ["Música", "music", "pink", "https://music.youtube.com", "music"],
  ["Fotos", "images", "cyan", "", "photos"],
  ["Calculadora", "calculator", "dark", "", "calculator"],
  ["Notas", "notebook-pen", "yellow", "", "notes"],
  ["Configurações", "settings", "dark", "", "settings"],
];
const appIds = apps.map((app) => app[4]);
const defaultDockAppIds = [
  "browser",
  "code-editor",
  "file-manager",
  "terminal",
  "whatsapp",
  "discord",
  "youtube",
  "music",
];
const dockIconOptions = [
  ["globe", "Globo"],
  ["code-2", "Código"],
  ["folder", "Pasta"],
  ["terminal", "Terminal"],
  ["message-circle", "Mensagem"],
  ["gamepad-2", "Controle"],
  ["youtube", "Vídeo"],
  ["music", "Música"],
  ["images", "Fotos"],
  ["calculator", "Calculadora"],
  ["notebook-pen", "Notas"],
  ["settings", "Configurações"],
  ["star", "Estrela"],
  ["heart", "Coração"],
  ["mail", "E-mail"],
  ["calendar-days", "Calendário"],
  ["camera", "Câmera"],
  ["image", "Imagem"],
  ["download", "Download"],
  ["file-text", "Documento"],
];
const quick = [
  ["Projetos", "folder", "yellow"],
  ["Documentos", "file-text", "blue"],
  ["Downloads", "download", "green"],
  ["Imagens", "image", "purple"],
  ["Vídeos", "film", "red"],
  ["Música", "music", "pink"],
  ["GitHub", "github", "dark", "https://github.com"],
  ["Lixeira", "trash-2", "dark"],
];
const nav = [
  ["Início", "house"],
  ["Aplicativos", "layout-grid"],
  ["Arquivos", "file"],
  ["Atalhos", "gauge"],
  ["Internet", "globe"],
  ["Multimídia", "music-2"],
  ["Configurações", "settings"],
];
const widgetDefinitions = [
  {
    id: "weather",
    label: "Clima",
    elementId: "weatherWidget",
    defaultSize: "small",
    lifecycleId: "weather",
  },
  {
    id: "clock",
    label: "Relógio",
    elementId: "clockWidget",
    defaultSize: "small",
    lifecycleId: "clock",
  },
  {
    id: "agenda",
    label: "Agenda",
    elementId: "agendaWidget",
    defaultSize: "small",
  },
  {
    id: "calendar",
    label: "Calendário",
    elementId: "calendarWidget",
    defaultSize: "medium",
    lifecycleId: "calendar",
  },
  {
    id: "apps",
    label: "Aplicativos",
    elementId: "appsPanel",
    defaultSize: "large",
  },
  {
    id: "quick",
    label: "Acesso rápido",
    elementId: "quickPanel",
    defaultSize: "large",
  },
  {
    id: "system",
    label: "Sistema",
    elementId: "systemPanel",
    defaultSize: "small",
    lifecycleId: "system",
  },
  {
    id: "media",
    label: "Mídia",
    elementId: "mediaWidget",
    defaultSize: "small",
  },
  {
    id: "notes",
    label: "Notas rápidas",
    elementId: "notesWidget",
    defaultSize: "small",
  },
];
const widgetIds = widgetDefinitions.map(({ id }) => id);
const dashboardThemes = ["ocean", "violet", "forest"];
const dashboardWallpapers = ["landscape", "aurora", "sunset", "ocean"];
const dockIconNames = dockIconOptions.map(([name]) => name);
const $ = (id) => document.getElementById(id);
const icons = () => window.lucide?.createIcons();
let notificationTimer;
function notify(message, persistent = false) {
  const status = $("appStatus");
  if (!status) return;
  clearTimeout(notificationTimer);
  status.textContent = message;
  status.hidden = !message;
  if (message && !persistent) {
    notificationTimer = setTimeout(() => {
      if (status.textContent === message) status.hidden = true;
    }, 5000);
  }
}
function persist(name, value, validate) {
  try {
    saveValue(name, value, validate);
    notify("");
    return true;
  } catch (error) {
    notify(error.message, true);
    return false;
  }
}
function updateConnectionStatus() {
  const status = $("connectionStatus");
  const online = navigator.onLine;
  status.textContent = online
    ? "Conectado à internet"
    : "Sem conexão. Modo offline ativo.";
  status.dataset.state = online ? "online" : "offline";
}
const isNoteList = (value) =>
  Array.isArray(value) &&
  value.every(
    (note) =>
      note && typeof note.text === "string" && typeof note.done === "boolean",
  );
const isAgendaList = (value) =>
  Array.isArray(value) &&
  value.every(
    (event) =>
      event &&
      typeof event.time === "string" &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time) &&
      typeof event.title === "string" &&
      (event.date === undefined || isDateKey(event.date)),
  );
function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function isDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T12:00:00`);
  return dateKey(date) === value;
}
const today = dateKey(new Date());
const notesState = loadValue(
  "notes",
  [],
  isNoteList,
  ["metro-start-notes"],
);
const agendaState = loadValue(
  "agenda",
  [],
  isAgendaList,
  ["metro-start-agenda"],
);
let notes = notesState.value;
const agendaNeedsDateMigration = agendaState.value.some((event) => !event.date);
let agenda = agendaState.value.map((event) => ({
  ...event,
  date: event.date || today,
}));
const defaultPreferences = {
  clockFormat: "24",
  temperatureUnit: "celsius",
};
const isPreferences = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value).length === 2 &&
  ["12", "24"].includes(value.clockFormat) &&
  ["celsius", "fahrenheit"].includes(value.temperatureUnit);
const preferencesState = loadValue(
  "preferences",
  defaultPreferences,
  isPreferences,
);
const defaultDashboardConfig = {
  schemaVersion: 3,
  order: [...widgetIds],
  widgets: Object.fromEntries(
    widgetDefinitions.map(({ id, label, defaultSize }) => [
      id,
      { included: true, visible: true, size: defaultSize, label },
    ]),
  ),
  theme: "ocean",
  wallpaper: "landscape",
  preferences: { ...defaultPreferences },
  dock: {
    order: [...appIds],
    apps: Object.fromEntries(
      apps.map((app) => [
        app[4],
        {
          visible: defaultDockAppIds.includes(app[4]),
          icon: app[1],
          label: app[0],
        },
      ]),
    ),
  },
};
const dashboardConfigOptions = {
  widgetIds,
  widgetDefinitions,
  dashboardThemes,
  dashboardWallpapers,
  appIds,
  dockIconNames,
};
const isValidDashboardConfig = (value) =>
  isDashboardConfig(value, dashboardConfigOptions);
const dashboardState = loadValue(
  "dashboard-config",
  defaultDashboardConfig,
  isValidDashboardConfig,
);
const dashboardNeedsMigration =
  dashboardState.found && dashboardState.value.schemaVersion < 3;
let dashboardConfig = dashboardState.found
  ? migrateDashboardConfig(dashboardState.value, defaultDashboardConfig)
  : {
      ...defaultDashboardConfig,
      preferences: { ...preferencesState.value },
    };
let preferences = { ...dashboardConfig.preferences };
let selectedCalendarDate = today;
const widgetManager = new WidgetManager();
const essentialWidgets = [
  clockWidget,
  systemWidget,
  calendarWidget,
  weatherWidget,
];
essentialWidgets.forEach((widget) => widgetManager.register(widget));
const widgetContext = {
  getCalendarEvents: () => agenda,
  getSelectedCalendarDate: () => selectedCalendarDate,
  selectCalendarDate,
  preferences,
};
let widgetLifecycleQueue = Promise.resolve();
const widgetElements = new Map(
  widgetDefinitions.map(({ id, elementId }) => [id, $(elementId)]),
);
// 02. Construção segura dos elementos
function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function icon(name) {
  const i = element("i");
  i.setAttribute("data-lucide", name);
  return i;
}
function actionButton(iconName, label, onClick) {
  const button = element("button", "entry-action");
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.append(icon(iconName));
  button.onclick = onClick;
  return button;
}
function configWithChanges(change) {
  const next = {
    ...dashboardConfig,
    order: [...dashboardConfig.order],
    widgets: Object.fromEntries(
      widgetIds.map((id) => [id, { ...dashboardConfig.widgets[id] }]),
    ),
    preferences: { ...preferences },
    dock: {
      order: [...dashboardConfig.dock.order],
      apps: Object.fromEntries(
        appIds.map((id) => [id, { ...dashboardConfig.dock.apps[id] }]),
      ),
    },
  };
  change(next);
  return next;
}
function commitDashboardConfig(nextConfig, message) {
  if (!persist("dashboard-config", nextConfig, isValidDashboardConfig)) {
    updatePersonalizationControls();
    renderWidgetCatalog();
    renderDockCatalog();
    renderDock();
    return false;
  }

  const lifecycleChanged = widgetDefinitions.some(({ id, lifecycleId }) => {
    if (!lifecycleId) return false;
    const previous = dashboardConfig.widgets[id];
    const next = nextConfig.widgets[id];
    return (
      previous.included !== next.included ||
      previous.visible !== next.visible
    );
  });
  const preferencesChanged =
    nextConfig.preferences.clockFormat !== preferences.clockFormat ||
    nextConfig.preferences.temperatureUnit !== preferences.temperatureUnit;
  const appPresentationChanged = appIds.some(
    (id) =>
      dashboardConfig.dock.apps[id].label !== nextConfig.dock.apps[id].label ||
      dashboardConfig.dock.apps[id].icon !== nextConfig.dock.apps[id].icon,
  );
  dashboardConfig = nextConfig;
  Object.assign(preferences, nextConfig.preferences);
  applyDashboardConfig();
  if (appPresentationChanged) {
    renderApps($("search").value);
    renderFavorites();
  }
  if (lifecycleChanged) {
    syncWidgetLifecycles().catch((error) => notify(error.message, true));
  }
  if (preferencesChanged) {
    document.dispatchEvent(new Event("orbe:preferences-change"));
  }
  if (message) notify(message);
  return true;
}
function updatePersonalizationControls() {
  $("clockFormat").value = preferences.clockFormat;
  $("temperatureUnit").value = preferences.temperatureUnit;
  $("dashboardTheme").value = dashboardConfig.theme;
  $("dashboardWallpaper").value = dashboardConfig.wallpaper;
}
function showCustomizationPanel() {
  const panel = $("widgetSettings");
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}
function hideCustomizationPanel() {
  $("widgetSettings").hidden = true;
}
function getAppById(id) {
  return apps.find((app) => app[4] === id);
}
function getAppLabel(id) {
  return dashboardConfig.dock.apps[id]?.label || getAppById(id)[0];
}
function getAppIcon(id) {
  return dashboardConfig.dock.apps[id]?.icon || getAppById(id)[1];
}
function getWidgetLabel(id) {
  return (
    dashboardConfig.widgets[id]?.label ||
    widgetDefinitions.find((widget) => widget.id === id).label
  );
}
function makeControlButton(label, text, onClick) {
  const button = element("button", "widget-control", text);
  button.type = "button";
  button.title = label;
  button.setAttribute("aria-label", label);
  button.onclick = onClick;
  return button;
}
function renderWidgetCatalog() {
  const catalog = $("widgetCatalog");
  catalog.replaceChildren();

  dashboardConfig.order.forEach((id) => {
    const definition = widgetDefinitions.find((widget) => widget.id === id);
    const state = dashboardConfig.widgets[id];
    const row = element("div", "widget-catalog-row");
    const labelInput = element("input", "widget-label-input");
    labelInput.type = "text";
    labelInput.value = state.label;
    labelInput.maxLength = 32;
    labelInput.setAttribute(
      "aria-label",
      `Nome do widget ${getWidgetLabel(id)}`,
    );
    labelInput.addEventListener("change", () => {
      const label = labelInput.value.trim();
      if (!label) {
        notify("O nome do widget não pode ficar vazio.");
        labelInput.value = state.label;
        return;
      }
      changeWidget(id, { label });
    });
    row.append(labelInput);
    const actions = element("div", "widget-catalog-actions");

    if (!state.included) {
      actions.append(
        makeControlButton(`Adicionar ${getWidgetLabel(id)}`, "Adicionar", () =>
          changeWidget(id, { included: true, visible: true }),
        ),
      );
    } else {
      actions.append(
        makeControlButton(
          `${state.visible ? "Ocultar" : "Mostrar"} ${getWidgetLabel(id)}`,
          state.visible ? "Ocultar" : "Mostrar",
          () => changeWidget(id, { visible: !state.visible }),
        ),
        makeControlButton(`Remover ${getWidgetLabel(id)}`, "Remover", () =>
          changeWidget(id, { included: false, visible: false }),
        ),
      );
    }
    row.append(actions);
    catalog.append(row);
  });
}
function renderDockCatalog() {
  const catalog = $("dockCatalog");
  catalog.replaceChildren();

  dashboardConfig.dock.order.forEach((id) => {
    const app = getAppById(id);
    const state = dashboardConfig.dock.apps[id];
    const row = element("div", "dock-catalog-row");
    const appLabel = element("input", "dock-catalog-app");
    appLabel.type = "text";
    appLabel.value = state.label;
    appLabel.maxLength = 32;
    appLabel.setAttribute("aria-label", `Nome do aplicativo ${state.label}`);
    appLabel.addEventListener("change", () => {
      const label = appLabel.value.trim();
      if (!label) {
        notify("O nome do aplicativo não pode ficar vazio.");
        appLabel.value = state.label;
        return;
      }
      updateDockApp(id, { label });
    });
    const iconSelect = element("select", "dock-icon-select");
    iconSelect.setAttribute("aria-label", `Ícone de ${state.label}`);
    dockIconOptions.forEach(([iconName, label]) => {
      const option = element("option", "", label);
      option.value = iconName;
      option.selected = state.icon === iconName;
      iconSelect.append(option);
    });
    iconSelect.onchange = () => updateDockApp(id, { icon: iconSelect.value });

    const actions = element("div", "widget-catalog-actions");
    const visibleApps = dashboardConfig.dock.order.filter(
      (appId) => dashboardConfig.dock.apps[appId].visible,
    );
    const visiblePosition = visibleApps.indexOf(id);
    const moveUp = makeControlButton(
      `Mover ${state.label} para a esquerda`,
      "←",
      () => moveDockApp(id, -1),
    );
    moveUp.disabled = !state.visible || visiblePosition === 0;
    const moveDown = makeControlButton(
      `Mover ${state.label} para a direita`,
      "→",
      () => moveDockApp(id, 1),
    );
    moveDown.disabled =
      !state.visible || visiblePosition === visibleApps.length - 1;
    actions.append(
      moveUp,
      moveDown,
      makeControlButton(
        `${state.visible ? "Remover" : "Adicionar"} ${state.label} ${state.visible ? "da" : "à"} dock`,
        state.visible ? "Remover" : "Adicionar",
        () => updateDockApp(id, { visible: !state.visible }),
      ),
    );
    row.append(appLabel, iconSelect, actions);
    catalog.append(row);
  });
}
function updateDockApp(id, changes) {
  const nextConfig = configWithChanges((next) => {
    Object.assign(next.dock.apps[id], changes);
  });
  commitDashboardConfig(nextConfig, "Dock atualizada.");
}
function moveDockApp(id, direction) {
  const visibleIds = dashboardConfig.dock.order.filter(
    (appId) => dashboardConfig.dock.apps[appId].visible,
  );
  const position = visibleIds.indexOf(id);
  const targetId = visibleIds[position + direction];
  if (!targetId) return;
  const nextConfig = configWithChanges((next) => {
    next.dock.order =
      reorderSubset(
        next.dock.order,
        (appId) => next.dock.apps[appId].visible,
        id,
        targetId,
        direction > 0,
      ) || next.dock.order;
  });
  commitDashboardConfig(nextConfig, "Ordem da dock atualizada.");
}
function reorderWidgets(sourceId, targetId, after = false) {
  const nextConfig = configWithChanges((next) => {
    next.order =
      reorderSubset(
        next.order,
        (id) => next.widgets[id].included,
        sourceId,
        targetId,
        after,
      ) || next.order;
  });
  commitDashboardConfig(nextConfig, "Ordem dos widgets atualizada.");
}
function changeWidget(id, changes) {
  const nextConfig = configWithChanges((next) => {
    Object.assign(next.widgets[id], changes);
  });
  commitDashboardConfig(nextConfig, "Widgets atualizados.");
}
function moveWidget(id, direction) {
  const nextConfig = configWithChanges((next) => {
    const included = next.order.filter(
      (widgetId) => next.widgets[widgetId].included,
    );
    const position = included.indexOf(id);
    const neighbor = included[position + direction];
    if (!neighbor) return;
    const currentIndex = next.order.indexOf(id);
    const neighborIndex = next.order.indexOf(neighbor);
    [next.order[currentIndex], next.order[neighborIndex]] = [
      next.order[neighborIndex],
      next.order[currentIndex],
    ];
  });
  commitDashboardConfig(nextConfig, "Ordem dos widgets atualizada.");
}
function setWidgetHeading(id, label) {
  const widgetElement = widgetElements.get(id);
  const selectors = {
    weather: ".weather-label",
    clock: null,
    agenda: ".section-head h2",
    calendar: ".calendar-heading h2",
    apps: ".section-head h2",
    quick: ".section-head h2",
    system: "h2",
    media: "h2",
    notes: ".section-head h2",
  };
  const heading = selectors[id]
    ? widgetElement.querySelector(selectors[id])
    : null;
  if (!heading) return;
  const textNode = [...heading.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );
  if (textNode) {
    textNode.textContent = ` ${label}`;
  } else {
    heading.append(document.createTextNode(label));
  }
}
function resizeWidget(id, direction) {
  const sizes = ["small", "medium", "large"];
  const nextConfig = configWithChanges((next) => {
    const current = sizes.indexOf(next.widgets[id].size);
    const target = Math.max(0, Math.min(sizes.length - 1, current + direction));
    next.widgets[id].size = sizes[target];
  });
  commitDashboardConfig(nextConfig, "Tamanho do widget atualizado.");
}
function addWidgetToolbar(definition, elementNode) {
  elementNode.querySelector(".widget-toolbar")?.remove();
  const state = dashboardConfig.widgets[definition.id];
  const included = dashboardConfig.order.filter(
    (id) => dashboardConfig.widgets[id].included,
  );
  const position = included.indexOf(definition.id);
  const sizeIndex = ["small", "medium", "large"].indexOf(state.size);
  const toolbar = element("div", "widget-toolbar");
  const sizeLabels = {
    small: "pequeno",
    medium: "médio",
    large: "grande",
  };
  toolbar.append(
    element(
      "span",
      "widget-toolbar-title",
      `${state.label} · ${sizeLabels[state.size]}`,
    ),
  );
  const controls = element("div", "widget-toolbar-actions");
  const dragHandle = makeControlButton(
    `Arrastar ${state.label} para reorganizar`,
    "⠿",
    () => {},
  );
  dragHandle.classList.add("widget-drag-handle");
  dragHandle.draggable = true;
  dragHandle.addEventListener("dragstart", (event) => {
    event.dataTransfer?.setData("text/plain", definition.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    elementNode.classList.add("is-dragging");
  });
  dragHandle.addEventListener("dragend", () =>
    elementNode.classList.remove("is-dragging"),
  );
  elementNode.ondragover = (event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("text/plain")) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    elementNode.classList.add("is-drop-target");
  };
  elementNode.ondragleave = (event) => {
    if (!elementNode.contains(event.relatedTarget)) {
      elementNode.classList.remove("is-drop-target");
    }
  };
  elementNode.ondrop = (event) => {
    event.preventDefault();
    elementNode.classList.remove("is-drop-target");
    const sourceId = event.dataTransfer?.getData("text/plain");
    if (!sourceId || sourceId === definition.id) return;
    const bounds = elementNode.getBoundingClientRect();
    reorderWidgets(sourceId, definition.id, event.clientY > bounds.top + bounds.height / 2);
  };
  const moveUp = makeControlButton(
    `Mover ${state.label} para cima`,
    "↑",
    () => moveWidget(definition.id, -1),
  );
  moveUp.disabled = position === 0;
  const moveDown = makeControlButton(
    `Mover ${state.label} para baixo`,
    "↓",
    () => moveWidget(definition.id, 1),
  );
  moveDown.disabled = position === included.length - 1;
  const resizeDown = makeControlButton(
    `Diminuir ${state.label}`,
    "−",
    () => resizeWidget(definition.id, -1),
  );
  resizeDown.disabled = sizeIndex === 0;
  const resizeUp = makeControlButton(
    `Aumentar ${state.label}`,
    "+",
    () => resizeWidget(definition.id, 1),
  );
  resizeUp.disabled = sizeIndex === 2;
  controls.append(
    dragHandle,
    moveUp,
    moveDown,
    resizeDown,
    resizeUp,
    makeControlButton(`Ocultar ${state.label}`, "Ocultar", () =>
      changeWidget(definition.id, { visible: false }),
    ),
    makeControlButton(`Remover ${state.label}`, "Remover", () =>
      changeWidget(definition.id, { included: false, visible: false }),
    ),
  );
  toolbar.append(controls);
  elementNode.prepend(toolbar);
  elementNode.classList.remove(
    "widget-size-small",
    "widget-size-medium",
    "widget-size-large",
  );
  elementNode.classList.add("widget-card", `widget-size-${state.size}`);
  elementNode.dataset.widgetId = definition.id;
}
function applyDashboardConfig() {
  const main = document.querySelector("main");
  const settings = $("widgetSettings");
  const grid = element("div", "dashboard-grid");
  grid.id = "dashboardGrid";
  main.replaceChildren(settings, grid);
  document.querySelector(".right")?.remove();

  dashboardConfig.order.forEach((id) => {
    const state = dashboardConfig.widgets[id];
    if (!state.included) return;
    const definition = widgetDefinitions.find((widget) => widget.id === id);
    const widgetElement = widgetElements.get(id);
    widgetElement.hidden = !state.visible;
    setWidgetHeading(id, state.label);
    addWidgetToolbar(definition, widgetElement);
    grid.append(widgetElement);
  });

  document.body.dataset.theme = dashboardConfig.theme;
  document.body.dataset.wallpaper = dashboardConfig.wallpaper;
  updatePersonalizationControls();
  renderWidgetCatalog();
  renderDockCatalog();
  renderDock();
  icons();
}
function syncWidgetLifecycles() {
  const synchronize = async () => {
    for (const definition of widgetDefinitions) {
      if (!definition.lifecycleId) continue;
      const state = dashboardConfig.widgets[definition.id];
      if (state.included && state.visible) {
        await widgetManager.mount(definition.lifecycleId);
      } else {
        await widgetManager.unmount(definition.lifecycleId);
      }
    }
  };
  widgetLifecycleQueue = widgetLifecycleQueue.then(synchronize, synchronize);
  return widgetLifecycleQueue;
}
function launch(app) {
  if (app[3]) window.open(app[3], "_blank", "noopener,noreferrer");
  else if (app[4] === "notes")
    $("notesWidget").scrollIntoView({ behavior: "smooth" });
  else alert(`${getAppLabel(app[4])}: integração ainda não configurada.`);
}
// 03. Aplicativos e atalhos
function renderApps(filter = "") {
  const root = $("apps");
  root.replaceChildren();
  const filteredApps = apps.filter((app) =>
    getAppLabel(app[4]).toLowerCase().includes(filter.toLowerCase()),
  );
  if (filteredApps.length === 0) {
    root.append(element("p", "empty-state", "Nenhum aplicativo encontrado."));
  } else {
    filteredApps.forEach((app) => {
      const button = element("button", `app ${app[2]}`);
      button.append(
        icon(getAppIcon(app[4])),
        element("span", "", getAppLabel(app[4])),
      );
      button.onclick = () => launch(app);
      root.append(button);
    });
  }
  icons();
}
function renderQuick() {
  const root = $("quick");
  quick.forEach((a) => {
    const b = element("button", `quick-item ${a[2]}`);
    b.append(icon(a[1]), element("span", "", a[0]));
    b.onclick = () =>
      a[3]
        ? window.open(a[3], "_blank", "noopener,noreferrer")
        : alert(`Configure o atalho ${a[0]}.`);
    root.append(b);
  });
  icons();
}
function renderNav() {
  const root = $("nav");
  root.replaceChildren();
  nav.forEach((a, i) => {
    const b = element("button", `nav-item ${i === 0 ? "active" : ""}`);
    b.append(icon(a[1]), element("span", "", a[0]));
    b.onclick = () => {
      root
        .querySelectorAll("button")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      if (a[0] === "Configurações") {
        showCustomizationPanel();
        return;
      }
      hideCustomizationPanel();
      (a[0] === "Início"
        ? $("dashboardGrid")
        : a[0] === "Multimídia"
          ? $("mediaWidget")
          : a[0] === "Arquivos"
            ? $("quickPanel")
            : $("appsPanel")
      ).scrollIntoView({ behavior: "smooth" });
    };
    root.append(b);
  });
  renderFavorites();
  icons();
}
function renderFavorites() {
  const fav = $("favorites");
  fav.replaceChildren();
  apps.slice(0, 6).forEach((a) => {
    const b = element("button", "favorite");
    b.append(
      icon(getAppIcon(a[4])),
      element("span", "", getAppLabel(a[4])),
    );
    b.onclick = () => launch(a);
    fav.append(b);
  });
  icons();
}
// 05. Agenda e notas persistentes
function selectCalendarDate(date) {
  if (!isDateKey(date)) return;
  selectedCalendarDate = date;
  renderAgenda();
}
function refreshCalendar() {
  document.dispatchEvent(new Event("orbe:calendar-events-change"));
}
function renderAgenda() {
  const root = $("agenda");
  root.replaceChildren();
  $("agendaDate").textContent = new Date(
    `${selectedCalendarDate}T12:00:00`,
  ).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const dayEvents = agenda
    .map((event, index) => ({ event, index }))
    .filter(({ event }) => event.date === selectedCalendarDate);
  if (dayEvents.length === 0) {
    root.append(element("p", "empty-state", "Nenhum evento agendado."));
    return;
  }
  dayEvents
    .sort((left, right) => left.event.time.localeCompare(right.event.time))
    .forEach(({ event, index }) => {
      const row = element("div", "event");
      const actions = element("span", "entry-actions");
      row.append(
        element("time", "", event.time),
        element("span", "event-title", event.title),
      );
      actions.append(
        actionButton("pencil", `Editar evento ${event.title}`, () =>
          editEvent(index),
        ),
        actionButton("trash-2", `Excluir evento ${event.title}`, () =>
          deleteEvent(index),
        ),
      );
      row.append(actions);
      root.append(row);
    });
  icons();
}
function renderNotes() {
  const root = $("notes");
  root.replaceChildren();
  if (notes.length === 0) {
    root.append(element("p", "empty-state", "Nenhuma nota criada."));
    return;
  }
  notes.forEach((note, index) => {
    const row = element("div", "note");
    const checkbox = element("input");
    const actions = element("span", "entry-actions");
    checkbox.type = "checkbox";
    checkbox.checked = note.done;
    checkbox.setAttribute("aria-label", `Concluir ${note.text}`);
    checkbox.onchange = () => {
      const updatedNotes = notes.map((item, itemIndex) =>
        itemIndex === index ? { ...item, done: checkbox.checked } : item,
      );
      if (persist("notes", updatedNotes, isNoteList)) {
        notes = updatedNotes;
        renderNotes();
      } else {
        checkbox.checked = notes[index].done;
      }
    };
    row.append(checkbox, element("span", "note-text", note.text));
    actions.append(
      actionButton("pencil", `Editar nota ${note.text}`, () => editNote(index)),
      actionButton("trash-2", `Excluir nota ${note.text}`, () =>
        deleteNote(index),
      ),
    );
    row.append(actions);
    root.append(row);
  });
  icons();
}
function editNote(index) {
  const text = prompt("Editar nota:", notes[index].text);
  if (text === null) return;
  if (!text.trim()) {
    notify("A nota não pode ficar vazia.");
    return;
  }
  const updatedNotes = notes.map((note, itemIndex) =>
    itemIndex === index ? { ...note, text: text.trim() } : note,
  );
  if (persist("notes", updatedNotes, isNoteList)) {
    notes = updatedNotes;
    renderNotes();
  }
}
function deleteNote(index) {
  if (!confirm(`Excluir a nota “${notes[index].text}”?`)) return;
  const updatedNotes = notes.filter((_note, itemIndex) => itemIndex !== index);
  if (persist("notes", updatedNotes, isNoteList)) {
    notes = updatedNotes;
    renderNotes();
  }
}
function editEvent(index) {
  const date = prompt("Data (AAAA-MM-DD):", agenda[index].date);
  if (date === null) return;
  if (!isDateKey(date)) {
    notify("Data inválida. Use o formato AAAA-MM-DD.");
    return;
  }
  const time = prompt("Horário (HH:MM):", agenda[index].time);
  if (time === null) return;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    notify("Horário inválido. Use o formato HH:MM.");
    return;
  }
  const title = prompt("Descrição do evento:", agenda[index].title);
  if (title === null) return;
  if (!title.trim()) {
    notify("A descrição do evento não pode ficar vazia.");
    return;
  }
  const updatedAgenda = agenda.map((event, eventIndex) =>
    eventIndex === index ? { date, time, title: title.trim() } : event,
  );
  if (!persist("agenda", updatedAgenda, isAgendaList)) return;
  agenda = updatedAgenda;
  renderAgenda();
  refreshCalendar();
}
function deleteEvent(index) {
  if (!confirm(`Excluir o evento “${agenda[index].title}”?`)) return;
  const updatedAgenda = agenda.filter(
    (_event, eventIndex) => eventIndex !== index,
  );
  if (!persist("agenda", updatedAgenda, isAgendaList)) return;
  agenda = updatedAgenda;
  renderAgenda();
  refreshCalendar();
}
// 06. Dock e interações
function renderDock() {
  const root = $("dockApps");
  root.replaceChildren();
  const homeButton = element("button", "dock-home");
  homeButton.type = "button";
  homeButton.title = "Início do Orbe";
  homeButton.setAttribute("aria-label", "Início do Orbe");
  homeButton.append(icon("layout-grid"));
  homeButton.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  root.append(homeButton);

  dashboardConfig.dock.order.forEach((id) => {
    const state = dashboardConfig.dock.apps[id];
    if (!state.visible) return;
    const app = getAppById(id);
    const button = element("button", "dock-app");
    button.type = "button";
    button.title = state.label;
    button.setAttribute("aria-label", state.label);
    button.append(icon(state.icon));
    button.onclick = () => launch(app);
    button.draggable = true;
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer?.setData("text/plain", id);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
      button.classList.add("is-dragging");
    });
    button.addEventListener("dragend", () =>
      button.classList.remove("is-dragging"),
    );
    button.addEventListener("dragover", (event) => {
      if (!Array.from(event.dataTransfer?.types || []).includes("text/plain")) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      button.classList.add("is-drop-target");
    });
    button.addEventListener("dragleave", () =>
      button.classList.remove("is-drop-target"),
    );
    button.addEventListener("drop", (event) => {
      event.preventDefault();
      button.classList.remove("is-drop-target");
      const sourceId = event.dataTransfer?.getData("text/plain");
      if (!sourceId || sourceId === id) return;
      const bounds = button.getBoundingClientRect();
      const nextConfig = configWithChanges((next) => {
        next.dock.order =
          reorderSubset(
            next.dock.order,
            (appId) => next.dock.apps[appId].visible,
            sourceId,
            id,
            event.clientX > bounds.left + bounds.width / 2,
          ) || next.dock.order;
      });
      commitDashboardConfig(nextConfig, "Ordem da dock atualizada.");
    });
    root.append(button);
  });
  icons();
}
function exportDashboardConfig() {
  try {
    const file = new Blob([JSON.stringify(dashboardConfig, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = element("a");
    link.href = url;
    link.download = "orbe-config.json";
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    notify("Configuração exportada.");
  } catch {
    notify("Não foi possível exportar a configuração.", true);
  }
}
async function importDashboardConfig(file) {
  if (file.size > 1_000_000) {
    notify("O arquivo excede o limite de 1 MB.", true);
    return;
  }
  try {
    const imported = JSON.parse(await file.text());
    if (!isValidDashboardConfig(imported)) {
      notify(
        "Configuração inválida ou incompatível. Nenhuma alteração foi aplicada.",
        true,
      );
      return;
    }
    const migratedConfig = migrateDashboardConfig(
      imported,
      defaultDashboardConfig,
    );
    if (commitDashboardConfig(migratedConfig, "Configuração importada.")) {
      showCustomizationPanel();
    }
  } catch {
    notify("Não foi possível ler o arquivo de configuração.", true);
  }
}
function initialize() {
  applyDashboardConfig();
  widgetManager.setContext(widgetContext);
  renderApps();
  renderQuick();
  renderNav();
  renderAgenda();
  renderNotes();
  if (
    dashboardNeedsMigration &&
    persist("dashboard-config", dashboardConfig, isValidDashboardConfig)
  ) {
    notify("Configuração existente atualizada para o novo formato.");
  }
  if (agendaNeedsDateMigration) {
    persist("agenda", agenda, isAgendaList);
  }
  if (
    notesState.warning ||
    agendaState.warning ||
    preferencesState.warning ||
    dashboardState.warning
  ) {
    notify(
      notesState.warning ||
        agendaState.warning ||
        preferencesState.warning ||
        dashboardState.warning,
      true,
    );
  }
  updateConnectionStatus();
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  syncWidgetLifecycles().catch((error) => notify(error.message, true));
  window.addEventListener("pagehide", () => widgetManager.destroyAll(), {
    once: true,
  });
  checkLinuxAgent();
  initializeLinuxAgent();
  registerServiceWorker(notify);
  const updatePreferences = () => {
    const nextConfig = configWithChanges((next) => {
      next.preferences.clockFormat = $("clockFormat").value;
      next.preferences.temperatureUnit = $("temperatureUnit").value;
    });
    commitDashboardConfig(nextConfig, "Preferências salvas.");
  };
  $("clockFormat").addEventListener("change", updatePreferences);
  $("temperatureUnit").addEventListener("change", updatePreferences);
  $("dashboardTheme").addEventListener("change", () => {
    const nextConfig = configWithChanges((next) => {
      next.theme = $("dashboardTheme").value;
    });
    commitDashboardConfig(nextConfig, "Tema atualizado.");
  });
  $("dashboardWallpaper").addEventListener("change", () => {
    const nextConfig = configWithChanges((next) => {
      next.wallpaper = $("dashboardWallpaper").value;
    });
    commitDashboardConfig(nextConfig, "Papel de parede atualizado.");
  });
  $("exportConfig").addEventListener("click", exportDashboardConfig);
  $("importConfig").addEventListener("click", () => $("configFile").click());
  $("configFile").addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    await importDashboardConfig(file);
    event.target.value = "";
  });
  $("search").oninput = (e) => renderApps(e.target.value);
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      $("search").focus();
    }
    if (e.key === "Escape") $("search").blur();
  });
  $("addNote").onclick = () => {
    const value = prompt("Nova nota:");
    if (value === null) return;
    if (!value.trim()) {
      notify("A nota não pode ficar vazia.");
      return;
    }
    const updatedNotes = [...notes, { text: value.trim(), done: false }];
    if (persist("notes", updatedNotes, isNoteList)) {
      notes = updatedNotes;
      renderNotes();
    }
  };
  $("addEvent").onclick = () => {
    const date = prompt("Data (AAAA-MM-DD):", selectedCalendarDate);
    if (date === null) return;
    if (!isDateKey(date)) {
      notify("Data inválida. Use o formato AAAA-MM-DD.");
      return;
    }
    const time = prompt("Horário (HH:MM):");
    if (time === null) return;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      notify("Horário inválido. Use o formato HH:MM.");
      return;
    }
    const title = prompt("Descrição do evento:");
    if (title === null) return;
    if (!title.trim()) {
      notify("A descrição do evento não pode ficar vazia.");
      return;
    }
    const updatedAgenda = [...agenda, { date, time, title: title.trim() }];
    if (!persist("agenda", updatedAgenda, isAgendaList)) return;
    agenda = updatedAgenda;
    selectedCalendarDate = date;
    renderAgenda();
    refreshCalendar();
  };
  $("showApps").onclick = () => {
    $("search").value = "";
    renderApps();
  };
  const profileDialog = $("profileDialog");
  $("profileButton").addEventListener("click", () => profileDialog.showModal());
  $("closeProfileDialog").addEventListener("click", () =>
    profileDialog.close(),
  );
  profileDialog.addEventListener("click", (event) => {
    if (event.target === profileDialog) profileDialog.close();
  });
  $("openDashboard").addEventListener("click", () => {
    profileDialog.close();
    hideCustomizationPanel();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("openDashboardCustomization").addEventListener("click", () => {
    profileDialog.close();
    showCustomizationPanel();
  });
  let playing = false;
  $("play").onclick = () => {
    playing = !playing;
    $("play").replaceChildren(icon(playing ? "pause" : "play"));
    icons();
  };
  icons();
}
document.addEventListener("DOMContentLoaded", initialize);
