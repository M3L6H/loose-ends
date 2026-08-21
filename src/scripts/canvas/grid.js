import { GRID_COLOR } from "./colors.js";
import { getTimelineSpace } from "./timeline.js";

const GRID_DOT_RADIUS = 2;
const GRID_SPACING = 64;

/**
 * Get the current height of the canvas after scaling
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 */
export function getCanvasHeight(ctx) {
  return ctx.canvas.height / ctx.getTransform().a;
}

/**
 * Get the current width of the canvas after scaling
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
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
 * @param {CanvasRenderingContext2D } ctx - Canvas context
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
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} startingY - The y position on the canvas to start at
 * @param {number} numRows - The number of rows to iterate over
 */
export function applyAcrossGrid(fn, ctx, startingY, numRows = 1) {
  const [halfNumCols, numCols] = getNumCols(ctx);
  const gridSpacing = getGridSpacing();

  ctx.save();
  ctx.translate(
    getCanvasWidth(ctx) / 2,
    // ctx.canvas.width / 2 /* - halfNumCols * gridSpacing*/,
    startingY,
  );

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
