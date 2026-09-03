export function showModal(id) {
  const modal = document.getElementById(id);

  if (!modal) return;
  
  modal.classList.remove("hidden");
  modal.dispatchEvent(new Event("open"));
}

export function init() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    const closeBtn = modal.querySelector(".close");
    const form = modal.querySelector("form");

    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");

      if (!!form) {
        form.reset();
      }
    });
  });
}
