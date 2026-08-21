import { TIMELINE_COLOR, TIMELINE_TEXT_COLOR } from "./colors.js";
import { applyAcrossGrid, getNumCols } from "./grid.js";

const TIMELINE_BOTTOM_MARGIN = 16;
const TIMELINE_THICKNESS = 2;
const TIMELINE_V_OFFSET = 24;

const TICK_FONT = "Tahoma, Segoe UI, sans-serif";
const TICK_FONT_SIZE = 10;
const TICK_HEIGHT = 8;
const TICK_WIDTH = TIMELINE_THICKNESS;

/**
 * Get the vertical space that should be reserved for the timeline
 * @returns {number} space reserved for timeline at the top of the canvas
 */
export function getTimelineSpace() {
  return (
    TIMELINE_V_OFFSET +
    TIMELINE_THICKNESS +
    TICK_HEIGHT +
    TIMELINE_BOTTOM_MARGIN
  );
}

/**
 * Get the start and end times of the visible interval
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} centeredOn - Epoch timestamp the view is centered on
 * @param {number} scaleMs - Scale (in ms) the view is rendered at
 *
 * @returns {number[]} [startTime, endTime]
 */
export function getStartAndEndTimes(ctx, centeredOn, scaleMs) {
  const [halfCols, _] = getNumCols(ctx);
  const startTime = centeredOn - scaleMs * halfCols;
  const endTime = centeredOn + scaleMs * halfCols;
  return [startTime, endTime];
}

/**
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} centeredOn - Epoch timestamp to center on
 * @param {number} scaleMs - Scale (in ms) to render the timeline at
 */
export function drawTimeline(ctx, centeredOn, scaleMs) {
  drawTimelineLine(ctx);
  drawTicks(ctx, centeredOn, scaleMs);
}

/**
 * Draw the "line" for the timeline
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 */
function drawTimelineLine(ctx) {
  const width = ctx.canvas.width;
  const halfWidth = width / 2;

  ctx.save();
  ctx.fillStyle = TIMELINE_COLOR;
  ctx.translate(halfWidth, TIMELINE_V_OFFSET);
  drawCenteredRect(ctx, width, TIMELINE_THICKNESS);
  ctx.restore();
}

/**
 * Draw the ticks on the timeline
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} centeredOn - Epoch timestamp to center on
 * @param {number} scaleMs - Scale (in ms) to render the tick labels at
 */
function drawTicks(ctx, centeredOn, scaleMs) {
  const [startTime, _] = getStartAndEndTimes(ctx, centeredOn, scaleMs);
  let tickTime = startTime;

  applyAcrossGrid(
    () => {
      drawTick(ctx, tickTime, scaleMs);
      tickTime += scaleMs;
    },
    ctx,
    TIMELINE_V_OFFSET,
  );
}

/**
 * Draw a "tick" on the timeline
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} tickTime - Epoch timestamp of the tick
 * @param {number} scaleMs - Scale used to format {@link tickTime}
 */
function drawTick(ctx, tickTime, scaleMs) {
  drawCenteredRect(ctx, TICK_WIDTH, TICK_HEIGHT, TIMELINE_COLOR);
  const labelText = formatTickTime(tickTime, scaleMs);
  drawTickLabel(ctx, labelText);
}

/**
 * Draw a "tick" on the timeline
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {string} labelText - Text of the label
 */
function drawTickLabel(ctx, labelText) {
  ctx.textAlign = "center";
  ctx.font = `${TICK_FONT_SIZE}px ${TICK_FONT}`;
  ctx.fillStyle = TIMELINE_TEXT_COLOR;
  ctx.fillText(labelText, 0, -TICK_HEIGHT);
}

const MINUTE_AND_SECOND_FORMAT = new Intl.DateTimeFormat("en-US", {
  hourCycle: "h24",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const HOUR_AND_MINUTE_FORMAT = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

const WEEKDAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  weekday: "short",
  day: "2-digit",
});

const DAY = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Format the tickTime given a scale
 *
 * @param {number} tickTime - Epoch timestamp of the tick
 * @param {number} scaleMs - Scale used to format {@link tickTime}
 */
function formatTickTime(tickTime, scaleMs) {
  let formatter = DAY;
  if (scaleMs < 3600000) {
    formatter = MINUTE_AND_SECOND_FORMAT;
  } else if (scaleMs < 86400000) {
    formatter = HOUR_AND_MINUTE_FORMAT;
  } else if (scaleMs < 604800000) {
    formatter = WEEKDAY;
  }

  return formatter.format(tickTime);
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
