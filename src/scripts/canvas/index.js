import { BACKGROUND_COLOR } from "./colors.js";
import { drawTimeline } from "./timeline.js";

const DEFAULT_SCALE = 8;
// Defines a list of predefined scales where each entry is the number of seconds per unit on the
// timeline
const SCALES = [
  52 * 7 * 24 * 3600, // 52 weeks
  32 * 7 * 24 * 3600, // 32 weeks
  16 * 7 * 24 * 3600, // 16 weeks
  8 * 7 * 24 * 3600, // 8 weeks
  4 * 7 * 24 * 3600, // 4 weeks
  2 * 7 * 24 * 3600, // 2 weeks
  7 * 24 * 3600, // 1 week
  3 * 24 * 3600, // 3 days
  24 * 3600, // 1 day
  12 * 3600, // 12 hours
  4 * 3600, // 4 hours
  3600, // 1 hour
  1200, // 20 minutes
  300, // 5 minutes
  60, // 1 minute
  45,
  10,
  5,
  1,
];

let canvas;
let content;

function resizeCanvas() {
  canvas.height = content.clientHeight;
  canvas.width = content.clientWidth;

  drawContent();
}

/**
 * Draw canvas content.
 * @param {number} scaleIndex - Index of scale in {@link SCALES}
 */
function drawContent(scaleIndex = DEFAULT_SCALE) {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scaleMs = SCALES[scaleIndex] * 1000;

  drawTimeline(ctx, Date.now(), scaleMs);
}

export function init() {
  canvas = document.getElementById("canvas");
  content = document.getElementById("content");

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
}
