import { getEvents, isTimelineEnd, isTimelineStart } from "../events/index.js";
import { EVENT_COLOR, stringToColor } from "./colors.js";
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
  const timeData = { startTime, endTime, scaleMs };
  const events = getEvents();
  const eventsByTimeline = extractEventsByTimeline(events);
  const eventsByVisibleTimeline = selectVisibleTimelines(
    eventsByTimeline,
    startTime,
    endTime,
  );
  const visibleTimelines = Object.keys(eventsByVisibleTimeline);
  const yByTimelineByX = getYByTimelineByX(eventsByVisibleTimeline, timeData);
  visibleTimelines.forEach((timeline) => {
    const events = eventsByVisibleTimeline[timeline];
    if (!events.start) return;
    const points = getPointsForTimeline(
      timeline,
      events,
      yByTimelineByX,
      timeData,
    );

    drawTimeline(ctx, timeline, points);
  });
  const visibleEvents = selectVisibleEvents(events, startTime, endTime);
  visibleEvents.forEach((event) => {
    const [x, y] = getEventCoords(event, yByTimelineByX, timeData);
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
    (ctx) => {
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
  drawLineThroughGridPoints(
    (ctx) => {
      ctx.lineWidth = 3;
      ctx.strokeStyle = stringToColor(timeline);
      ctx.stroke();
    },
    ctx,
    points,
  );
}

/**
 * Calculate the x and y grid position of the event based on its timelines
 *
 * @param {Event} event - The event to calculate y position for
 * @param {object} yByTimelineByX - Grid X to timeline to grid Y map
 * @param {object} timeData - Object containing startTime, endTime, and scaleMs
 */
function getEventCoords(event, yByTimelineByX, timeData) {
  const x = getXFromTimestamp(event.timestamp, timeData);

  const [_, timelineY] = getPrimaryTimelineY(event, yByTimelineByX[x]);

  // If this event merges timelines, offset its Y by 0.5
  const y = timelineY + (Object.keys(event.timelines).length > 1 ? 0.5 : 0);

  return [x, y];
}

function getXFromTimestamp(timestamp, { scaleMs, startTime }) {
  return Math.ceil(Math.max(0, timestamp - startTime) / scaleMs);
}

function mkPseudoEvent(timestamp, timeline) {
  return {
    timestamp,
    timelines: {
      [timeline]: "",
    },
  };
}

function getPointsForTimeline(timeline, events, yByTimelineByX, timeData) {
  const points = [];
  const startCoords = getEventCoords(events.start, yByTimelineByX, timeData);
  points.push(startCoords);

  const [startX, _] = startCoords;
  const updatesByX = {};

  events.updates.forEach((event) => {
    if (event.timestamp < timeData.endTime) {
      updatesByX[getXFromTimestamp(event.timestamp, timeData)] = event;
    }
  });

  let endX = getXFromTimestamp(timeData.endTime, timeData);

  if (!events.end || events.end.timestamp > timeData.endTime) {
    updatesByX[endX] = mkPseudoEvent(timeData.endTime, timeline);
  } else {
    endX = getXFromTimestamp(events.end.timestamp, timeData);
    updatesByX[endX] = events.end;
  }

  for (let i = startX + 1; i <= endX; ++i) {
    const timestamp = i * timeData.scaleMs + timeData.startTime;
    const event = updatesByX[i] ?? mkPseudoEvent(timestamp, timeline);
    updatePointsForEvent(points, event, timeline, yByTimelineByX, timeData);
  }

  return points;
}

function updatePointsForEvent(
  points,
  event,
  timeline,
  yByTimelineByX,
  timeData,
) {
  const coords = getEventCoords(event, yByTimelineByX, timeData);
  const [x, y] = coords;
  const [lpx, lpy] = points[points.length - 1];
  const dx = x - lpx;

  if (!Number.isInteger(lpy) && dx > 1) {
    const xp = lpx + 1;
    points.push([xp, yByTimelineByX[xp][timeline]]);
  }
  if (!Number.isInteger(y) && dx > 1) {
    const xp = x - 1;
    points.push([xp, yByTimelineByX[xp][timeline]]);
  }

  points.push(coords);

  return points;
}

/**
 * Get the primary timeline and priority for the given event.
 *
 * @param {Event} event - The event to get the primary timeline from
 * @param {object} yByTimeline - Map of timelines to priority
 *
 * @returns {number[]} [primaryTimeline, primaryTimelinePriority];
 */
function getPrimaryTimelineY(event, yByTimeline) {
  let currTimeline = null;
  let timelineY = Infinity;

  Object.keys(event.timelines).forEach((timeline) => {
    if (yByTimeline[timeline] < timelineY) {
      currTimeline = timeline;
      timelineY = yByTimeline[timeline];
    }
  });

  return [currTimeline, timelineY];
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
 * Sorts timelines vertically based on the gridX coordinate
 *
 * @param {object} eventsByTimeline - Map of timelines to events to prioritize
 * @param {number} startTime - Epoch timestamp of timeframe start
 * @param {number} endTime - Epoch timestamp of timeframe end
 * @param {number} scaleMs - Scale (in ms) that the timeline is rendered at
 */
function getYByTimelineByX(eventsByTimeline, { startTime, endTime, scaleMs }) {
  const timelineYByTimelineByX = {};
  for (let time = startTime; time <= endTime; time += scaleMs) {
    const x = Math.floor((time - startTime) / scaleMs);
    const yByTimeline = {};

    let currY = 0;

    for (const timeline in eventsByTimeline) {
      const { start, end } = eventsByTimeline[timeline];
      if (start && Math.ceil((start.timestamp - startTime) / scaleMs) > x)
        continue;
      if (end && Math.ceil((end.timestamp - startTime) / scaleMs) < x) continue;

      yByTimeline[timeline] = currY++;
    }

    timelineYByTimelineByX[x] = yByTimeline;
  }
  return timelineYByTimelineByX;
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
