import { getEvents, isTimelineEnd, isTimelineStart } from "../events/index.js";
import { EVENT_COLOR } from "./colors.js";
import { drawAtGridPoint, drawLineThroughGridPoints } from "./grid.js";
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
  const gridXEnd = Math.floor((endTime - startTime) / scaleMs);
  const events = getEvents();
  const eventsByTimeline = extractEventsByTimeline(events);
  const eventsByVisibleTimeline = selectVisibleTimelines(
    eventsByTimeline,
    startTime,
    endTime,
  );
  const visibleTimelines = Object.keys(eventsByVisibleTimeline);
  const priorityByTimeline = prioritizeTimelines(visibleTimelines);
  visibleTimelines.forEach((timeline) => {
    const points = [];
    const events = eventsByVisibleTimeline[timeline];
    if (!events.start) return;

    points.push(
      getEventCoords(events.start, priorityByTimeline, scaleMs, startTime),
    );
    events.updates.forEach((event) => {
      const coords = getEventCoords(
        event,
        priorityByTimeline,
        scaleMs,
        startTime,
      );
      const lastPoint = points[points.length - 1];
      if (
        lastPoint[1] !== Math.floor(lastPoint[1]) &&
        coords[0] - lastPoint[0] > 1
      ) {
        points.push([lastPoint[0] + 1, priorityByTimeline[timeline]]);
      } else if (
        coords[1] !== Math.floor(coords[1]) &&
        coords[0] - lastPoint[0] > 1
      ) {
        points.push([coords[0] - 1, priorityByTimeline[timeline]]);
      }
      points.push(coords);
    });

    if (!events.end) {
      const lastPoint = points[points.length - 1];
      if (lastPoint[1] !== Math.floor(lastPoint[1])) {
        points.push([lastPoint[0] + 1, priorityByTimeline[timeline]]);
      }
      points.push([gridXEnd, priorityByTimeline[timeline]]);
    } else {
      const event = events.end;
      const coords = getEventCoords(
        event,
        priorityByTimeline,
        scaleMs,
        startTime,
      );
      const lastPoint = points[points.length - 1];
      if (
        lastPoint[1] !== Math.floor(lastPoint[1]) &&
        coords[0] - lastPoint[0] > 1
      ) {
        points.push([lastPoint[0] + 1, priorityByTimeline[timeline]]);
      } else if (
        coords[1] !== Math.floor(coords[1]) &&
        coords[0] - lastPoint[0] > 1
      ) {
        points.push([coords[0] - 1, priorityByTimeline[timeline]]);
      }
      points.push(coords);
    }

    drawTimeline(ctx, timeline, points);
  });
  const visibleEvents = selectVisibleEvents(events, startTime, endTime);
  visibleEvents.forEach((event) => {
    const [x, y] = getEventCoords(
      event,
      priorityByTimeline,
      scaleMs,
      startTime,
    );
    drawEvent(ctx, x, y);
  });
}

/**
 * Draw an event element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {Event} event - The event to draw
 * @param {number} x - Grid x position of the event
 * @param {number} y - Grid y position of the event
 */
function drawEvent(ctx, x, y) {
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
 * Draw the timeline element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {string} timeline - Name of the timeline
 * @param {object} points - Points to draw the timeline through
 */
function drawTimeline(ctx, timeline, points) {
  if (points.length < 2) return;
  drawLineThroughGridPoints(ctx, points);
}

/**
 * Calculate the x and y grid position of the event based on its timelines
 *
 * @param {Event} event - The event to calculate y position for
 * @param {object} priorityByTimeline - Timeline to priority map
 * @param {number} scaleMs - Scale (in ms) to render the timeline at
 * @param {number} startTime - Timestamp that the timeline starts at
 */
function getEventCoords(event, priorityByTimeline, scaleMs, startTime) {
  const x = Math.ceil(Math.max(0, event.timestamp - startTime) / scaleMs);

  const [_, priority] = getPrimaryTimeline(event, priorityByTimeline);
  const y = priority + (Object.keys(event.timelines).length > 1 ? 0.5 : 0);

  return [x, y];
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
 * Extract the timelines touched by the events with their start and end timestamps.
 *
 * @param {Event[]} events - Events to search
 */
function extractEventsByTimeline(events) {
  const eventsByTimeline = {};
  events.forEach((event) => {
    for (const timeline in event.timelines) {
      const events = eventsByTimeline[timeline] ?? {};
      eventsByTimeline[timeline] = updateEventsForTimeline(
        event,
        timeline,
        events,
      );
    }
  });
  return eventsByTimeline;
}

/**
 * Updates and returns the passed timestamps if event starts/ends the given timeline.
 *
 * @param {Event} event - The event in question
 * @param {string} timeline - The timeline to check
 * @param {object} events - Object to update containing start/update/end timestamps
 */
function updateEventsForTimeline(event, timeline, events) {
  const updates = events.updates ?? [];
  if (isTimelineStart(event, timeline)) {
    events.start = event;
  } else if (isTimelineEnd(event, timeline)) {
    events.end = event;
  } else {
    updates.push(event);
  }
  events.updates = updates;

  return events;
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
 * Filter the map of timelines down to the list of visible timelines.
 *
 * @param {object} eventsByTimeline - Timelines to filter
 * @param {number} startTime - Epoch timestamp of timeframe start
 * @param {number} endTime - Epoch timestamp of timeframe end
 */
function selectVisibleTimelines(eventsByTimeline, startTime, endTime) {
  const selectedTimelines = {};
  for (const timeline in eventsByTimeline) {
    const events = eventsByTimeline[timeline];
    const { start, end } = events;
    const startsAfter = !!start && start.timestamp > endTime;
    const endsBefore = !!end && end.timestamp < startTime;

    if (startsAfter || endsBefore) {
      continue;
    }

    selectedTimelines[timeline] = events;
  }
  return selectedTimelines;
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
