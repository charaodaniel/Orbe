export async function registerServiceWorker(setStatus) {
  if (!("serviceWorker" in navigator)) {
    setStatus("Este navegador não oferece suporte ao modo offline.");
    return;
  }

  const promptedWorkers = new WeakSet();
  let reloadAfterUpdate = false;

  try {
    const registration = await navigator.serviceWorker.register("./sw.js");
    const offerUpdate = (worker) => {
      if (
        !worker ||
        !navigator.serviceWorker.controller ||
        promptedWorkers.has(worker)
      ) {
        return;
      }

      promptedWorkers.add(worker);
      if (
        window.confirm(
          "Uma atualização do Orbe está disponível. Deseja aplicá-la agora?",
        )
      ) {
        reloadAfterUpdate = true;
        worker.postMessage({ type: "SKIP_WAITING" });
      } else {
        setStatus(
          "Atualização disponível. Recarregue quando quiser aplicá-la.",
        );
      }
    };

    if (registration.waiting) offerUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      installing?.addEventListener("statechange", () => {
        if (installing.state === "installed") offerUpdate(installing);
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadAfterUpdate) window.location.reload();
    });
    registration.update().catch(() => {});
  } catch {
    setStatus("Não foi possível preparar o cache offline neste navegador.");
  }
}
