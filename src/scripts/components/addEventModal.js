import { getTimeZone } from "../settings/index.js";

export function init() {
  const modal = document.getElementById("add-event-modal");

  modal.addEventListener("open", () => {
    const dateInput = modal.querySelector("#event-date");
    const now = Temporal.Now.zonedDateTimeISO(getTimeZone()).toString({ 
      timeZoneName: 'never', 
      fractionalSecondDigits: 0 
    });
    dateInput.placeholder = now;
    dateInput.value = now;
  });

  const dateInput = modal.querySelector("#event-date");
  dateInput.addEventListener("focus", () => {
    const pos = Math.max(0, dateInput.value.lastIndexOf("-"));
    setTimeout(() => {
      dateInput.setSelectionRange(pos, pos);
    }, 1);
  });
}