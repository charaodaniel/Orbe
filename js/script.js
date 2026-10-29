"use strict";
import { WidgetManager, clockWidget, systemWidget } from "./widgets.js";
import { checkLinuxAgent } from "./linux.js";
import { registerServiceWorker } from "./pwa.js";
import { loadValue, saveValue } from "./storage.js";
import { calendarWidget } from "./calendar.js";
import { weatherWidget } from "./weather.js";

// 01. Dados e configurações
const apps = [
  ["Navegador", "globe", "blue", "https://www.google.com"],
  ["Editor de Código", "code-2", "blue", "https://vscode.dev"],
  ["Gerenciador de Arquivos", "folder", "yellow", ""],
  ["Terminal", "terminal", "dark", ""],
  ["WhatsApp", "message-circle", "green", "https://web.whatsapp.com"],
  ["Discord", "gamepad-2", "purple", "https://discord.com/app"],
  ["YouTube", "youtube", "red", "https://youtube.com"],
  ["Música", "music", "pink", "https://music.youtube.com"],
  ["Fotos", "images", "cyan", ""],
  ["Calculadora", "calculator", "dark", ""],
  ["Notas", "notebook-pen", "yellow", ""],
  ["Configurações", "settings", "dark", ""],
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
  [
    { text: "Finalizar relatório", done: false },
    { text: "Estudar JavaScript", done: false },
    { text: "Organizar arquivos", done: false },
    { text: "Responder cliente", done: false },
  ],
  isNoteList,
  ["metro-start-notes"],
);
const agendaState = loadValue(
  "agenda",
  [
    { time: "09:00", title: "Reunião do projeto" },
    { time: "14:00", title: "Desenvolvimento" },
    { time: "17:00", title: "Planejamento" },
  ],
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
  ["12", "24"].includes(value.clockFormat) &&
  ["celsius", "fahrenheit"].includes(value.temperatureUnit);
const preferencesState = loadValue(
  "preferences",
  defaultPreferences,
  isPreferences,
);
let preferences = { ...defaultPreferences, ...preferencesState.value };
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
function launch(app) {
  if (app[3]) window.open(app[3], "_blank", "noopener,noreferrer");
  else if (app[0] === "Notas")
    document.querySelector(".right").scrollIntoView({ behavior: "smooth" });
  else alert(`${app[0]}: integração ainda não configurada.`);
}
// 03. Aplicativos e atalhos
function renderApps(filter = "") {
  const root = $("apps");
  root.replaceChildren();
  const filteredApps = apps.filter((app) =>
    app[0].toLowerCase().includes(filter.toLowerCase()),
  );
  if (filteredApps.length === 0) {
    root.append(element("p", "empty-state", "Nenhum aplicativo encontrado."));
  } else {
    filteredApps.forEach((app) => {
      const button = element("button", `app ${app[2]}`);
      button.append(icon(app[1]), element("span", "", app[0]));
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
  nav.forEach((a, i) => {
    const b = element("button", `nav-item ${i === 0 ? "active" : ""}`);
    b.append(icon(a[1]), element("span", "", a[0]));
    b.onclick = () => {
      root
        .querySelectorAll("button")
        .forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      (a[0] === "Início"
        ? document.querySelector(".topwidgets")
        : a[0] === "Multimídia"
          ? document.querySelector(".right")
          : a[0] === "Arquivos"
            ? $("quickPanel")
            : $("appsPanel")
      ).scrollIntoView({ behavior: "smooth" });
    };
    root.append(b);
  });
  const fav = $("favorites");
  apps.slice(0, 6).forEach((a) => {
    const b = element("button", "favorite");
    b.append(icon(a[1]), element("span", "", a[0]));
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
      notes[index].done = checkbox.checked;
      persist("notes", notes, isNoteList);
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
  notes[index].text = text.trim();
  persist("notes", notes, isNoteList);
  renderNotes();
}
function deleteNote(index) {
  if (!confirm(`Excluir a nota “${notes[index].text}”?`)) return;
  notes.splice(index, 1);
  persist("notes", notes, isNoteList);
  renderNotes();
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
  agenda[index] = { date, time, title: title.trim() };
  persist("agenda", agenda, isAgendaList);
  renderAgenda();
  refreshCalendar();
}
function deleteEvent(index) {
  if (!confirm(`Excluir o evento “${agenda[index].title}”?`)) return;
  agenda.splice(index, 1);
  persist("agenda", agenda, isAgendaList);
  renderAgenda();
  refreshCalendar();
}
// 06. Dock e interações
function renderDock() {
  const root = $("dockApps");
  [
    ["Orbe", "layout-grid", "", ""],
    ...apps.slice(0, 5),
    apps[6],
    apps[7],
  ].forEach((a) => {
    const b = element("button");
    b.title = a[0];
    b.append(icon(a[1]));
    b.onclick = () =>
      a[0] === "Orbe"
        ? window.scrollTo({ top: 0, behavior: "smooth" })
        : launch(a);
    root.append(b);
  });
  icons();
}
function initialize() {
  $("clockFormat").value = preferences.clockFormat;
  $("temperatureUnit").value = preferences.temperatureUnit;
  renderApps();
  renderQuick();
  renderNav();
  renderAgenda();
  renderNotes();
  renderDock();
  if (agendaNeedsDateMigration) {
    persist("agenda", agenda, isAgendaList);
  }
  if (notesState.warning || agendaState.warning || preferencesState.warning) {
    notify(
      notesState.warning || agendaState.warning || preferencesState.warning,
      true,
    );
  }
  updateConnectionStatus();
  window.addEventListener("online", updateConnectionStatus);
  window.addEventListener("offline", updateConnectionStatus);
  widgetManager.mountAll(widgetContext).catch((error) => notify(error.message));
  window.addEventListener("pagehide", () => widgetManager.destroyAll(), {
    once: true,
  });
  checkLinuxAgent();
  registerServiceWorker(notify);
  const updatePreferences = () => {
    const updatedPreferences = {
      clockFormat: $("clockFormat").value,
      temperatureUnit: $("temperatureUnit").value,
    };
    if (!persist("preferences", updatedPreferences, isPreferences)) {
      $("clockFormat").value = preferences.clockFormat;
      $("temperatureUnit").value = preferences.temperatureUnit;
      return;
    }
    Object.assign(preferences, updatedPreferences);
    document.dispatchEvent(new Event("orbe:preferences-change"));
  };
  $("clockFormat").addEventListener("change", updatePreferences);
  $("temperatureUnit").addEventListener("change", updatePreferences);
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
    notes.push({ text: value.trim(), done: false });
    persist("notes", notes, isNoteList);
    renderNotes();
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
    agenda.push({ date, time, title: title.trim() });
    selectedCalendarDate = date;
    persist("agenda", agenda, isAgendaList);
    renderAgenda();
    refreshCalendar();
  };
  $("showApps").onclick = () => {
    $("search").value = "";
    renderApps();
  };
  let playing = false;
  $("play").onclick = () => {
    playing = !playing;
    $("play").replaceChildren(icon(playing ? "pause" : "play"));
    icons();
  };
  icons();
}
document.addEventListener("DOMContentLoaded", initialize);
