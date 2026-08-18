import { TIMELINE_COLOR, TIMELINE_TEXT_COLOR } from "./colors.js";
import { getGridSpacing } from "./grid.js";

const TIMELINE_BOTTOM_MARGIN = 16;
const TIMELINE_THICKNESS = 2;
const TIMELINE_V_OFFSET = 24;

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
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} centeredOn - Epoch timestamp to center on
 * @param {number} scaleMs - Scale (in ms) to render the timeline at
 */
export function drawTimeline(ctx, centeredOn, scaleMs) {
  ctx.save();
  const width = ctx.canvas.width;
  const halfWidth = width / 2;

  ctx.fillStyle = TIMELINE_COLOR;
  ctx.translate(halfWidth, TIMELINE_V_OFFSET);
  drawCenteredRect(ctx, width, TIMELINE_THICKNESS);

  const halfNumTicks = Math.floor(halfWidth / getGridSpacing()) + 1;
  const numTicks = halfNumTicks * 2;

  let tickTime = centeredOn - scaleMs * halfNumTicks;
  ctx.translate(-halfNumTicks * getGridSpacing(), 0);

  for (let i = 0; i <= numTicks; ++i) {
    drawTick(ctx, tickTime, scaleMs);
    ctx.translate(getGridSpacing(), 0);
    tickTime += scaleMs;
  }

  ctx.restore();
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
  ctx.textAlign = "center";
  ctx.font = `${TICK_FONT_SIZE}px serif`;
  ctx.fillStyle = TIMELINE_TEXT_COLOR;
  ctx.fillText(formatTickTime(tickTime, scaleMs), 0, -TICK_HEIGHT);
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
  if (scaleMs < 3600000) {
    return MINUTE_AND_SECOND_FORMAT.format(tickTime);
  } else if (scaleMs < 86400000) {
    return HOUR_AND_MINUTE_FORMAT.format(tickTime);
  } else if (scaleMs < 604800000) {
    return WEEKDAY.format(tickTime);
  }
  return DAY.format(tickTime);
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
