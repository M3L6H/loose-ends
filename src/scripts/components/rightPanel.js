import { canZoomIn, canZoomOut, zoomIn, zoomOut } from "../canvas/index.js";

export function init() {
  const zoomInBtn = document.getElementById("zoom-in-btn");
  zoomInBtn.disabled = !canZoomIn();
  zoomInBtn.addEventListener("click", () => {
    zoomIn();
    zoomInBtn.disabled = !canZoomIn();
    zoomOutBtn.disabled = !canZoomOut();
  });

  const zoomOutBtn = document.getElementById("zoom-out-btn");
  zoomOutBtn.disabled = !canZoomOut();
  zoomOutBtn.addEventListener("click", () => { 
    zoomOut();
    zoomInBtn.disabled = !canZoomIn();
    zoomOutBtn.disabled = !canZoomOut();
  });
}