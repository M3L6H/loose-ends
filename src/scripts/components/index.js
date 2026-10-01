import * as addEventModal from "./addEventModal.js"
import * as header from "./header.js";
import * as modal from "./modal.js";
import * as rightPanel from "./rightPanel.js";

export function init() {
  addEventModal.init();
  header.init();
  modal.init();
  rightPanel.init();
}
