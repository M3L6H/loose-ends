import { getEvents } from "../events/index.js";
import { EVENT_COLOR } from "./colors.js";
import { drawAtGridPoint, getNumCols } from "./grid.js";

const EVENT_DOT_RADIUS = 6;

/**
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} centeredOn - Epoch timestamp to center on
 * @param {number} scaleMs - Scale (in ms) to render the timeline at
 */
export function drawEvents(ctx, centeredOn, scaleMs) {
  const [halfCols, _] = getNumCols(ctx);
  const startTime = centeredOn - scaleMs * halfCols;
  const endTime = centeredOn + scaleMs * halfCols;

  const visibleEvents = selectVisibleEvents(getEvents(), startTime, endTime);
  visibleEvents.forEach((event) => drawEvent(ctx, event, scaleMs, startTime));
}

/**
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {Event} event - The event to draw
 * @param {number} scaleMs - Scale (in ms) to render the timeline at
 * @param {number} startTime - Timestamp that the timeline starts at
 */
function drawEvent(ctx, event, scaleMs, startTime) {
  const x = Math.ceil((event.timestamp - startTime) / scaleMs);
  const y = 0;
  drawAtGridPoint(
    () => {
      ctx.fillStyle = EVENT_COLOR;
      ctx.beginPath();
      ctx.arc(0, 0, EVENT_DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    },
    ctx,
    x,
    y,
  );
}

/**
 * Filter the list of events down to the list of visible events.
 *
 * @param {Event[]} events - Events to filter
 * @param {number} startTime - Epoch timestamp of timeframe start
 * @param {number} endTime - Epoch timestamp of timeframe end
 */
function selectVisibleEvents(events, startTime, endTime) {
  return events.filter(
    ({ timestamp }) => startTime <= timestamp && timestamp <= endTime,
  );
}
