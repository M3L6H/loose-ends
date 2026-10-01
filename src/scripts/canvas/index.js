import { getTimeZone } from "../settings/index.js";
import { BACKGROUND_COLOR } from "./colors.js";
import { drawEvents } from "./events.js";
import { drawGrid } from "./grid.js";
import { drawTimeline } from "./timeline.js";

const SCROLL_SPEED = 50;

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

let centeredOn = Temporal.Now.zonedDateTimeISO(getTimeZone()).epochMilliseconds;
let scaleIndex = DEFAULT_SCALE;

let dragging = false;
let initialCenteredOn = centeredOn;
let pointerDownPos;

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  canvas.height = Math.floor(content.clientHeight * dpr);
  canvas.width = Math.floor(content.clientWidth * dpr);

  canvas.style.height = `${content.clientHeight}px`;
  canvas.style.width = `${content.clientWidth}px`;

  canvas.getContext("2d").scale(dpr, dpr);

  drawContent();
}

/**
 * Draw canvas content.
 */
export function drawContent() {
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const scaleMs = getScaleMs();

  drawGrid(ctx);
  drawTimeline(ctx, centeredOn, scaleMs);
  drawEvents(ctx, centeredOn, scaleMs);
}

/**
 * Return true if user can zoom into timeline.
 */
export function canZoomIn() {
  return scaleIndex < SCALES.length - 1;
}

/**
 * Return true if user can zoom out from timeline.
 */
export function canZoomOut() {
  return scaleIndex > 0;
}

/**
 * Zoom into timeline.
 */
export function zoomIn() {
  scaleIndex = Math.min(scaleIndex + 1, SCALES.length - 1);
  drawContent();
}

/**
 * Zoom out from timeline.
 */
export function zoomOut() {
  scaleIndex = Math.max(scaleIndex - 1, 0);
  drawContent();
}

function getScaleMs() {
  return SCALES[scaleIndex] * 1000;
}

/**
 * Handle when user clicks on canvas
 * @param {PointerEvent} event - pointer down event
 */
function handlePointerDown(event) {
  dragging = true;
  initialCenteredOn = centeredOn;
  pointerDownPos = { x: event.clientX, y: event.clientY };
}

/**
 * Handle when user clicks and drags on canvas
 * @param {PointerEvent} event - pointer move event
 */
function handlePointerDrag(event) {
  if (!dragging) {
    return;
  }

  event.preventDefault();
  const diff = pointerDownPos.x - event.clientX;
  const scale = SCALES[scaleIndex];
  centeredOn = initialCenteredOn + diff * scale * SCROLL_SPEED;

  if (Math.abs(centeredOn - initialCenteredOn) > scale * 1000) {
    drawContent();
    initialCenteredOn = centeredOn;
    pointerDownPos.x = event.clientX;
  }
}

export function init() {
  canvas = document.getElementById("canvas");
  content = document.getElementById("content");

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointerup", () => (dragging = false));
  canvas.addEventListener("pointermove", handlePointerDrag);

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
}
