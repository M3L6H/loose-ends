export function init() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach(modal => {
    const closeBtn = modal.querySelector(".close");
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  });
}