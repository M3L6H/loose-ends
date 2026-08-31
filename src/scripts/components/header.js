export function init() {
  const addEventBtn = document.getElementById("add-event-btn");
  const addEventModal = document.getElementById("add-event-modal");

  addEventBtn.addEventListener("click", () => addEventModal.classList.remove("hidden"));
}