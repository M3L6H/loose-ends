import { TIMELINE_COLOR } from "./colors.js";

const TIMELINE_THICKNESS = 4;
const TIMELINE_V_OFFSET = 32;

const TICK_HEIGHT = 16;
const TICK_OFFSET = 64;
const TICK_WIDTH = TIMELINE_THICKNESS;

/**
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} scale - Scale to render the canvas at
 */
export function drawTimeline(ctx, scale) {
  const width = ctx.canvas.width;
  const halfWidth = width / 2;

  ctx.fillStyle = TIMELINE_COLOR;
  ctx.translate(halfWidth, TIMELINE_V_OFFSET);
  drawCenteredRect(ctx, width, TIMELINE_THICKNESS);

  const halfNumTicks = Math.floor(halfWidth / TICK_OFFSET);
  const numTicks = halfNumTicks * 2;

  ctx.translate(-halfNumTicks * TICK_OFFSET, 0);

  for (let i = 0; i <= numTicks; ++i) {
    drawTick(ctx);
    ctx.translate(TICK_OFFSET, 0);
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

/**
 * Draw a "tick" on the timeline
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 */
function drawTick(ctx) {
  drawCenteredRect(ctx, TICK_WIDTH, TICK_HEIGHT, TIMELINE_COLOR);
}

/**
 * Draw a rectangle centered on 0, 0 with the given height and width
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} w - width of the rectangle
 * @param {number} h - height of the rectangle
 * @param {string} color - color of the rectangle
 */
function drawCenteredRect(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
}
