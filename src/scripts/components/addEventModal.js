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
}