import { GRID_COLOR } from "./colors.js";
import { getTimelineSpace } from "./timeline.js";

const GRID_DOT_RADIUS = 2;
const GRID_SPACING = 64;

/**
 * Get the current height of the canvas after scaling
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function getCanvasHeight(ctx) {
  return ctx.canvas.height / ctx.getTransform().a;
}

/**
 * Get the current width of the canvas after scaling
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
export function getCanvasWidth(ctx) {
  return ctx.canvas.width / ctx.getTransform().a;
}

/**
 * Get the spacing in pixels between each grid dot
 */
export function getGridSpacing() {
  return GRID_SPACING;
}

/**
 * Get the number of columns that fit in the canvas
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 *
 * @returns {number[]} [halfCols, cols];
 */
export function getNumCols(ctx) {
  const width = getCanvasWidth(ctx);
  const halfWidth = width / 2;
  const halfCols = Math.floor(halfWidth / GRID_SPACING) + 1;
  const cols = halfCols * 2 + 1;
  return [halfCols, cols];
}

/**
 * Apply fn across the grid
 *
 * @param {Function} fn - The function to apply
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} startingY - The y position on the canvas to start at
 * @param {number} numRows - The number of rows to iterate over
 */
export function applyAcrossGrid(fn, ctx, startingY, numRows = 1) {
  const [halfNumCols, numCols] = getNumCols(ctx);
  const gridSpacing = getGridSpacing();

  ctx.save();
  ctx.translate(getCanvasWidth(ctx) / 2 - halfNumCols * gridSpacing, startingY);

  for (let i = 0; i < numRows; ++i) {
    for (let j = 0; j < numCols; ++j) {
      fn();
      ctx.translate(gridSpacing, 0);
    }
    ctx.translate(-numCols * gridSpacing, getGridSpacing());
  }
  ctx.restore();
}

/**
 * Call draw fn at point on grid
 *
 * @param {Function} fn - The function to apply
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} x - The grid column to draw in
 * @param {number} y - The grid row to draw in
 */
export function drawAtGridPoint(fn, ctx, x, y) {
  const [halfNumCols, _] = getNumCols(ctx);

  ctx.save();
  ctx.translate(
    getCanvasWidth(ctx) / 2 + (x - halfNumCols) * GRID_SPACING,
    getTimelineSpace() + y * GRID_SPACING,
  );
  fn();
  ctx.restore();
}

/**
 * Call draw fn at point on grid
 *
 * @param {Function} fn - The function to apply
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} x - The grid column to draw in
 * @param {number} y - The grid row to draw in
 */
export function drawLineThroughGridPoints(ctx, points) {
  if (points.length < 2) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...scaleGridPointToCanvasPoint(ctx, ...points[0]));

  for (let i = 1; i < points.length; ++i) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const xc1 = px + 0.5;
    const yc1 = py;
    const xc2 = x;
    const yc2 = y;

    ctx.quadraticCurveTo(
      ...scaleGridPointToCanvasPoint(ctx, xc1, yc1),
      ...scaleGridPointToCanvasPoint(ctx, xc2, yc2),
      ...scaleGridPointToCanvasPoint(ctx, x, y),
    );
  }

  ctx.lineWidth = 3;
  ctx.strokeStyle = "green";
  ctx.stroke();
  ctx.restore();
}

function scaleGridPointToCanvasPoint(ctx, x, y) {
  const [halfNumCols, _] = getNumCols(ctx);

  const halfCanvasWidth = getCanvasWidth(ctx) / 2;
  const yOffset = getTimelineSpace();

  const sx = halfCanvasWidth + (x - halfNumCols) * GRID_SPACING;
  const sy = yOffset + y * GRID_SPACING;

  return [sx, sy];
}

/**
 * Draw a grid on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 */
export function drawGrid(ctx) {
  const topOffset = getTimelineSpace();
  const height = getCanvasHeight(ctx) - topOffset;
  const rows = Math.floor(height / GRID_SPACING) + 1;

  applyAcrossGrid(
    () => {
      ctx.fillStyle = GRID_COLOR;
      ctx.beginPath();
      ctx.arc(0, 0, GRID_DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    },
    ctx,
    topOffset,
    rows,
  );
}
