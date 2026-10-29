const AGENT_URL = "http://127.0.0.1:4317";
let authorizationToken = "";
let applicationIconController;
const applicationIconUrls = new Set();
const applicationIcons = [];

function isLinuxPlatform() {
  const platform = navigator.userAgentData?.platform || navigator.platform;
  return platform.toLowerCase().includes("linux") && !/Android/i.test(navigator.userAgent);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "Indisponível";
  const gibibytes = bytes / 1024 ** 3;
  return `${gibibytes.toFixed(1)} GB`;
}

async function requestAgent(path, token = "", body) {
  const response = await fetch(`${AGENT_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(body
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      : {}),
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(2500),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("O agente retornou uma resposta inválida.");
  }
  if (!response.ok) {
    throw new Error(result.error || `Falha do agente (${response.status}).`);
  }
  return result;
}

function setAgentMessage(message, persistent = false) {
  const status = document.getElementById("linuxAgentMessage");
  if (!status) return;
  status.textContent = message;
  status.dataset.persistent = String(persistent);
}

function renderApplications(applications) {
  const container = document.getElementById("linuxApplications");
  const list = document.getElementById("linuxApplicationList");
  if (!container || !list) return;
  applicationIconController?.abort();
  applicationIconController = new AbortController();
  for (const url of applicationIconUrls) URL.revokeObjectURL(url);
  applicationIconUrls.clear();
  applicationIcons.length = 0;
  list.replaceChildren();

  if (!applications.length) {
    list.append(document.createTextNode("Nenhum aplicativo foi encontrado."));
    container.hidden = false;
    return;
  }

  for (const application of applications) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    const icon = document.createElement("span");
    const image = document.createElement("img");
    const name = document.createElement("span");
    const iconName = application.icon;
    button.type = "button";
    button.className = "linux-app-button";
    button.setAttribute("aria-label", `Abrir ${application.name}`);
    icon.className = "linux-app-icon";
    icon.textContent = application.name.trim().charAt(0).toUpperCase();
    image.alt = "";
    image.hidden = true;
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    name.textContent = application.name;
    button.append(icon, image, name);
    applicationIcons.push({ application, image, fallback: icon });
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await requestAgent("/api/apps/launch", authorizationToken, {
          id: application.id,
        });
        setAgentMessage(`${application.name} iniciado.`);
      } catch (error) {
        setAgentMessage(error.message, true);
      } finally {
        button.disabled = false;
      }
    });
    item.append(button);
    if (application.comment) {
      const description = document.createElement("span");
      description.textContent = application.comment;
      item.append(description);
    }
    if (application.categories.length) {
      const categories = document.createElement("small");
      categories.textContent = application.categories.join(", ");
      item.append(categories);
    }
    list.append(item);
  }
  container.hidden = false;
  loadApplicationIcons();
}

async function loadApplicationIcons() {
  const items = applicationIcons.filter(
    ({ application }) =>
      /^[A-Za-z0-9][A-Za-z0-9_.-]{0,119}$/.test(application.icon),
  );
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const { application, image, fallback } = items[nextIndex];
      nextIndex += 1;
      try {
        const response = await fetch(
          `${AGENT_URL}/api/icons/${encodeURIComponent(application.icon)}`,
          {
            headers: { Authorization: `Bearer ${authorizationToken}` },
            cache: "no-store",
            credentials: "omit",
            signal: AbortSignal.any([
              applicationIconController.signal,
              AbortSignal.timeout(2500),
            ]),
          },
        );
        if (
          !response.ok ||
          !response.headers.get("content-type")?.startsWith("image/")
        ) {
          continue;
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (!image.isConnected) {
          URL.revokeObjectURL(url);
          continue;
        }
        applicationIconUrls.add(url);
        image.addEventListener(
          "error",
          () => {
            URL.revokeObjectURL(url);
            applicationIconUrls.delete(url);
            image.hidden = true;
            fallback.hidden = false;
          },
          { once: true },
        );
        image.addEventListener(
          "load",
          () => {
            fallback.hidden = true;
          },
          { once: true },
        );
        image.src = url;
        image.hidden = false;
      } catch {
        fallback.hidden = false;
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(6, items.length) }, () => worker()),
  );
}

function renderSystemMetrics(metrics) {
  const cpu = document.getElementById("systemAgentCpu");
  const memory = document.getElementById("systemAgentMemory");
  const note = document.getElementById("systemNote");
  if (!cpu || !memory || !note) return;

  cpu.textContent =
    Number.isInteger(metrics.logicalCpus) &&
    Number.isFinite(metrics.loadAverage1m)
      ? `${metrics.loadAverage1m.toFixed(2)} (1 min, ${metrics.logicalCpus} CPUs)`
      : "Indisponível";
  memory.textContent = metrics.memory
    ? `${formatBytes(metrics.memory.freeBytes)} livres de ${formatBytes(metrics.memory.totalBytes)}`
    : "Indisponível";
  note.textContent =
    "Métricas fornecidas pelo agente Linux. O armazenamento exibido é apenas deste site.";
  document.getElementById("systemAgentMetrics").hidden = false;
}

async function authorizeAgent(token) {
  const [applications, system] = await Promise.all([
    requestAgent("/api/apps", token),
    requestAgent("/api/system", token),
  ]);
  if (
    !Array.isArray(applications.applications) ||
    !applications.applications.every(
      (application) =>
        application &&
        typeof application.id === "string" &&
        typeof application.name === "string" &&
        typeof application.comment === "string" &&
        typeof application.icon === "string" &&
        Array.isArray(application.categories),
    ) ||
    !system.metrics
  ) {
    throw new Error("O agente retornou dados incompatíveis.");
  }

  authorizationToken = token;
  renderApplications(applications.applications);
  renderSystemMetrics(system.metrics);
  const status = document.getElementById("linuxStatus");
  if (status) status.textContent = "Agente Linux autorizado";
  setAgentMessage("Agente autorizado para esta sessão.");
}

export async function checkLinuxAgent() {
  const status = document.getElementById("linuxStatus");
  const controls = document.getElementById("linuxAgentControls");
  if (!isLinuxPlatform()) {
    if (status) status.hidden = true;
    if (controls) controls.hidden = true;
    return;
  }

  if (status) {
    status.hidden = false;
    status.textContent = "Agente Linux não conectado";
  }
  if (controls) controls.hidden = false;

  try {
    const health = await requestAgent("/health");
    if (health.status !== "ok") {
      throw new Error("O agente não confirmou sua disponibilidade.");
    }
    if (status) status.textContent = "Agente Linux conectado · autorização necessária";
    setAgentMessage(
      "Informe o token exibido no terminal do agente. Ele fica apenas nesta sessão.",
    );
    const tokenInput = document.getElementById("linuxAgentToken");
    if (tokenInput) {
      tokenInput.value = "";
      tokenInput.autocomplete = "off";
    }
  } catch {
    if (status) status.textContent = "Agente Linux não conectado";
    setAgentMessage(
      "Agente indisponível. Inicie o agente local e tente novamente.",
      true,
    );
  }
}

export function initializeLinuxAgent() {
  const connectButton = document.getElementById("linuxAgentConnect");
  const tokenInput = document.getElementById("linuxAgentToken");
  const revokeButton = document.getElementById("linuxAgentRevoke");
  if (!connectButton || !tokenInput || !revokeButton) return;

  revokeButton.addEventListener("click", () => {
    authorizationToken = "";
    renderApplications([]);
    document.getElementById("linuxApplications").hidden = true;
    document.getElementById("systemAgentMetrics").hidden = true;
    document.getElementById("systemMemory").textContent =
      "Conecte o agente Linux para consultar";
    document.getElementById("systemNote").textContent =
      "O navegador não fornece métricas do sistema; conecte o agente Linux para consultar carga média e memória livre. O armazenamento exibido é apenas deste site.";
    document.getElementById("linuxStatus").textContent =
      "Agente Linux conectado · autorização necessária";
    revokeButton.hidden = true;
    setAgentMessage("Autorização removida desta sessão.");
  });
  connectButton.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) {
      setAgentMessage("O token deve ter entre 32 e 256 caracteres seguros.", true);
      tokenInput.focus();
      return;
    }

    connectButton.disabled = true;
    setAgentMessage("Validando autorização...");
    try {
      await authorizeAgent(token);
      tokenInput.value = "";
      revokeButton.hidden = false;
    } catch (error) {
      authorizationToken = "";
      renderApplications([]);
      document.getElementById("linuxApplications").hidden = true;
      document.getElementById("systemAgentMetrics").hidden = true;
      revokeButton.hidden = true;
      setAgentMessage(error.message, true);
    } finally {
      connectButton.disabled = false;
    }
  });
}
