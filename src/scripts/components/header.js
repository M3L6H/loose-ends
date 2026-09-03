import { showModal } from "./modal.js";

export function init() {
  const addEventBtn = document.getElementById("add-event-btn");
  addEventBtn.addEventListener("click", () => showModal("add-event-modal"));
}