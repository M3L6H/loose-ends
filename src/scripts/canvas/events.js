import { getEvents } from "../events/index.js";
import { EVENT_COLOR } from "./colors.js";
import { drawAtGridPoint } from "./grid.js";
import { getStartAndEndTimes } from "./timeline.js";

const EVENT_DOT_RADIUS = 6;

/**
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} centeredOn - Epoch timestamp to center on
 * @param {number} scaleMs - Scale (in ms) to render the timeline at
 */
export function drawEvents(ctx, centeredOn, scaleMs) {
  const [startTime, endTime] = getStartAndEndTimes(ctx, centeredOn, scaleMs);
  const visibleEvents = selectVisibleEvents(getEvents(), startTime, endTime);
  const priorityByTimeline = prioritizeTimelines(
    extractTimelines(visibleEvents),
  );
  visibleEvents.forEach((event) =>
    drawEvent(ctx, event, priorityByTimeline, scaleMs, startTime),
  );
}

/**
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {Event} event - The event to draw
 * @param {object} priorityByTimeline - Timeline to priority map
 * @param {number} scaleMs - Scale (in ms) to render the timeline at
 * @param {number} startTime - Timestamp that the timeline starts at
 */
function drawEvent(ctx, event, priorityByTimeline, scaleMs, startTime) {
  const x = Math.ceil((event.timestamp - startTime) / scaleMs);
  const [_, priority] = getPrimaryTimeline(event, priorityByTimeline);
  const y = priority + (Object.keys(event.timelines).length > 1 ? 0.5 : 0);
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
 * Get the primary timeline and priority for the given event.
 *
 * @param {Event} event - The event to get the primary timeline from
 * @param {object} priorityByTimeline - Map of timelines to priority
 *
 * @returns {number[]} [primaryTimeline, primaryTimelinePriority];
 */
function getPrimaryTimeline(event, priorityByTimeline) {
  let currTimeline = null;
  let currPriority = Infinity;

  Object.keys(event.timelines).forEach((timeline) => {
    if (priorityByTimeline[timeline] < currPriority) {
      currTimeline = timeline;
      currPriority = priorityByTimeline[timeline];
    }
  });

  return [currTimeline, currPriority];
}

/**
 * Extract the timelines touched by the events.
 *
 * @param {Event[]} events - Events to search
 */
function extractTimelines(events) {
  const timelinesSet = new Set();
  events.forEach(({ timelines }) =>
    Object.keys(timelines).forEach((t) => timelinesSet.add(t)),
  );
  return timelinesSet;
}

/**
 * Prioritizes timelines
 *
 * @param {string[]} timelines - Timelines to prioritize
 */
function prioritizeTimelines(timelines) {
  const priorityByTimeline = {};
  let currPriority = 0;
  timelines.forEach((timeline) => {
    priorityByTimeline[timeline] = currPriority;
    ++currPriority;
  });
  return priorityByTimeline;
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
