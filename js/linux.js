export async function checkLinuxAgent() {
  const status = document.getElementById("linuxStatus");
  const platform = navigator.userAgentData?.platform || navigator.platform;
  if (
    !status ||
    !platform.toLowerCase().includes("linux") ||
    /Android/i.test(navigator.userAgent)
  ) {
    if (status) status.hidden = true;
    return;
  }

  status.textContent = "Agente Linux não conectado";
  try {
    const response = await fetch("http://127.0.0.1:4317/health", {
      signal: AbortSignal.timeout(1500),
    });
    const result = await response.json();
    if (response.ok && result.status === "ok") {
      status.textContent = "Agente Linux conectado";
    }
  } catch {
    // O agente é opcional e pode não estar instalado.
  }
}
