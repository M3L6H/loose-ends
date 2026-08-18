import { GRID_COLOR } from "./colors.js";
import { getTimelineSpace } from "./timeline.js";

const GRID_DOT_RADIUS = 2;
const GRID_SPACING = 64;

export function getGridSpacing() {
  return GRID_SPACING;
}

/**
 * Draw a grid on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 */
export function drawGrid(ctx) {
  ctx.save();
  const topOffset = getTimelineSpace();
  const height = ctx.canvas.height - topOffset;
  const width = ctx.canvas.width;
  const halfWidth = width / 2;
  const halfCols = Math.floor(halfWidth / GRID_SPACING) + 1;
  const cols = halfCols * 2;
  const rows = Math.floor(height / GRID_SPACING) + 1;

  ctx.translate(halfWidth - halfCols * GRID_SPACING, topOffset);
  ctx.fillStyle = GRID_COLOR;

  for (let i = 0; i < rows; ++i) {
    for (let j = 0; j <= cols; ++j) {
      ctx.beginPath();
      ctx.arc(0, 0, GRID_DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.translate(GRID_SPACING, 0);
    }
    ctx.translate(-GRID_SPACING * (cols + 1), GRID_SPACING);
  }
  ctx.restore();
}
