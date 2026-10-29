export class WidgetManager {
  #widgets = new Map();
  #cleanups = new Map();
  #context;

  setContext(context) {
    this.#context = context;
  }

  register(widget) {
    if (!widget?.id || typeof widget.mount !== "function") {
      throw new TypeError("Widget precisa de id e função mount().");
    }
    if (this.#widgets.has(widget.id)) {
      throw new Error(`Widget duplicado: ${widget.id}`);
    }
    this.#widgets.set(widget.id, widget);
  }

  async mountAll(context) {
    this.#context = context;
    for (const widget of this.#widgets.values()) {
      await this.#mount(widget);
    }
  }

  async mount(id) {
    const widget = this.#widgets.get(id);
    if (widget) await this.#mount(widget);
  }

  async unmount(id) {
    await this.#unmount(id);
  }

  async refresh(id) {
    const widget = this.#widgets.get(id);
    if (!widget) return;
    await this.#unmount(id);
    await this.#mount(widget);
  }

  async destroyAll() {
    for (const id of [...this.#cleanups.keys()].reverse()) {
      await this.#unmount(id);
    }
  }

  async #mount(widget) {
    if (this.#cleanups.has(widget.id)) return;
    const cleanup = await widget.mount(this.#context);
    if (typeof cleanup === "function") {
      this.#cleanups.set(widget.id, cleanup);
    }
  }

  async #unmount(id) {
    const cleanup = this.#cleanups.get(id);
    this.#cleanups.delete(id);
    await cleanup?.();
  }
}

export function updateClock(format = "24") {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12",
  });
  document.getElementById("clockTime").textContent = time;
  document.getElementById("dockTime").textContent = time;
  document.getElementById("clockDate").textContent = now.toLocaleDateString(
    "pt-BR",
    { weekday: "short", day: "numeric", month: "short" },
  );
  document.getElementById("dockDate").textContent =
    now.toLocaleDateString("pt-BR");
}

export const clockWidget = {
  id: "clock",
  mount({ preferences }) {
    const update = () => updateClock(preferences.clockFormat);
    const onPreferencesChange = () => update();
    update();
    const timer = setInterval(update, 1000);
    document.addEventListener("orbe:preferences-change", onPreferencesChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener(
        "orbe:preferences-change",
        onPreferencesChange,
      );
    };
  },
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Indisponível";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024 * 1024 >= bytes ? 1024 * 1024 : 1024 * 1024 * 1024)).toFixed(1)} ${bytes >= 1024 * 1024 * 1024 ? "GB" : "MB"}`;
}

function getPlatformName() {
  const platform =
    navigator.userAgentData?.platform || navigator.platform || "";
  if (/android/i.test(platform) || /Android/i.test(navigator.userAgent)) {
    return "Android";
  }
  if (/win/i.test(platform)) return "Windows";
  if (/mac/i.test(platform)) return "macOS";
  if (/linux/i.test(platform)) return "Linux";
  return platform || "Não identificado";
}

export const systemWidget = {
  id: "system",
  mount() {
    const platform = document.getElementById("systemPlatform");
    const compute = document.getElementById("systemCompute");
    const storage = document.getElementById("systemStorage");
    platform.textContent = getPlatformName();
    compute.textContent = Number.isInteger(navigator.hardwareConcurrency)
      ? `${navigator.hardwareConcurrency} núcleos lógicos informados`
      : "Não informado pelo navegador";

    const updateStorage = async () => {
      if (!navigator.storage?.estimate) {
        storage.textContent = "API indisponível";
        return;
      }
      try {
        const { usage, quota } = await navigator.storage.estimate();
        storage.textContent =
          Number.isFinite(usage) && Number.isFinite(quota) && quota > 0
            ? `${formatBytes(usage)} de ${formatBytes(quota)}`
            : "Indisponível";
      } catch {
        storage.textContent = "Indisponível";
      }
    };

    updateStorage();
    return () => {};
  },
};
