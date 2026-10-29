export function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
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
