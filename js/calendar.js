const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const calendarWidget = {
  id: "calendar",
  mount(context) {
    const monthLabel = document.getElementById("calendarMonth");
    const grid = document.getElementById("calendarGrid");
    const previous = document.getElementById("calendarPrevious");
    const next = document.getElementById("calendarNext");
    const selected = context.getSelectedCalendarDate();
    let displayedMonth = new Date(`${selected}T12:00:00`);
    displayedMonth.setDate(1);

    const render = () => {
      const year = displayedMonth.getFullYear();
      const month = displayedMonth.getMonth();
      monthLabel.textContent = displayedMonth.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      grid.replaceChildren();

      const firstDay = new Date(year, month, 1);
      const offset = firstDay.getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;
      const today = dateKey(new Date());
      const selectedDate = context.getSelectedCalendarDate();
      const events = context.getCalendarEvents();
      const eventCounts = new Map();
      events.forEach((event) => {
        eventCounts.set(event.date, (eventCounts.get(event.date) ?? 0) + 1);
      });

      for (let index = 0; index < cellCount; index += 1) {
        const date = new Date(year, month, index - offset + 1);
        const key = dateKey(date);
        const dayEvents = eventCounts.get(key) ?? 0;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "calendar-day";
        button.classList.toggle("outside-month", date.getMonth() !== month);
        button.classList.toggle("today", key === today);
        button.classList.toggle("selected", key === selectedDate);
        button.setAttribute("aria-pressed", String(key === selectedDate));
        button.setAttribute(
          "aria-label",
          `${date.toLocaleDateString("pt-BR", { dateStyle: "full" })}${dayEvents ? `, ${dayEvents} evento(s)` : ""}`,
        );
        const number = document.createElement("span");
        number.className = "calendar-day-number";
        number.textContent = String(date.getDate());
        button.append(number);
        if (dayEvents) {
          const count = document.createElement("span");
          count.className = "calendar-event-count";
          count.textContent = String(dayEvents);
          count.setAttribute("aria-hidden", "true");
          button.append(count);
        }
        button.addEventListener("click", () => {
          displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          context.selectCalendarDate(key);
          render();
        });
        grid.append(button);
      }
    };

    const changeMonth = (amount) => {
      displayedMonth = new Date(
        displayedMonth.getFullYear(),
        displayedMonth.getMonth() + amount,
        1,
      );
      render();
    };
    const onPrevious = () => changeMonth(-1);
    const onNext = () => changeMonth(1);
    const onDateSelected = () => render();

    previous.addEventListener("click", onPrevious);
    next.addEventListener("click", onNext);
    document.addEventListener("orbe:calendar-events-change", onDateSelected);
    render();

    return () => {
      previous.removeEventListener("click", onPrevious);
      next.removeEventListener("click", onNext);
      document.removeEventListener(
        "orbe:calendar-events-change",
        onDateSelected,
      );
    };
  },
};
