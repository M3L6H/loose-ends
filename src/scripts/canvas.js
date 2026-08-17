let canvas;
let content;

function resizeCanvas() {
  canvas.height = content.clientHeight;
  canvas.width = content.clientWidth;

  drawContent();
}

function drawContent() {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#3498db";
  ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
}

export function init() {
  canvas = document.getElementById("canvas");
  content = document.getElementById("content");

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
}
