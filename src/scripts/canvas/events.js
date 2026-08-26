import { getEvents, isThreadEnd, isThreadStart } from "../events/index.js";
import { EVENT_COLOR, stringToColor } from "./colors.js";
import { drawAtGridPoint, drawLineThroughGridPoints, getCanvasHeight } from "./grid.js";
import { getStartAndEndTimes } from "./timeline.js";

const EVENT_DOT_RADIUS = 6;

/**
 * Draw the thread element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {number} centeredOn - Epoch timestamp to center on
 * @param {number} scaleMs - Scale (in ms) to render the thread at
 */
export function drawEvents(ctx, centeredOn, scaleMs) {
  const [startTime, endTime] = getStartAndEndTimes(ctx, centeredOn, scaleMs);
  const timeData = { startTime, endTime, scaleMs };
  const events = getEvents();
  const eventsByThread = extractEventsByThread(events);
  const eventsByVisibleThread = selectVisibleThreads(
    eventsByThread,
    startTime,
    endTime,
  );
  const visibleThreads = Object.keys(eventsByVisibleThread);
  const yByThreadByX = getYByThreadByX(eventsByVisibleThread, timeData);
  visibleThreads.forEach((thread) => {
    const events = eventsByVisibleThread[thread];
    if (!events.start) return;
    const points = getPointsForThread(thread, events, yByThreadByX, timeData);

    drawThread(ctx, thread, points);
  });
  const visibleEvents = selectVisibleEvents(events, startTime, endTime);
  visibleEvents.forEach((event) => {
    const [x, y] = getEventCoords(event, yByThreadByX, timeData);
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
 * Draw the thread element on the canvas.
 *
 * @param {CanvasRenderingContext2D } ctx - Canvas context
 * @param {string} thread - Name of the thread
 * @param {object} points - Points to draw the thread through
 */
function drawThread(ctx, thread, points) {
  if (points.length < 2) return;
  drawLineThroughGridPoints(
    (ctx) => {
      ctx.lineWidth = 3;
      ctx.strokeStyle = stringToColor(thread);
      ctx.stroke();
    },
    ctx,
    points,
  );
}

/**
 * Calculate the x and y grid position of the event based on its threads
 *
 * @param {Event} event - The event to calculate y position for
 * @param {object} yByThreadByX - Grid X to thread to grid Y map
 * @param {object} timeData - Object containing startTime, endTime, and scaleMs
 */
function getEventCoords(event, yByThreadByX, timeData) {
  const x = getXFromTimestamp(event.timestamp, timeData);

  const [_, threadY] = getPrimaryThreadY(event, yByThreadByX[x]);

  // If this event merges threads, offset its Y by 0.5
  const y = threadY + (Object.keys(event.threads).length > 1 ? 0.5 : 0);

  return [x, y];
}

function getXFromTimestamp(timestamp, { scaleMs, startTime }) {
  return Math.ceil(Math.max(0, timestamp - startTime) / scaleMs);
}

function mkPseudoEvent(timestamp, thread) {
  return {
    timestamp,
    threads: {
      [thread]: "",
    },
  };
}

function getPointsForThread(thread, events, yByThreadByX, timeData) {
  const points = [];
  const startCoords = getEventCoords(events.start, yByThreadByX, timeData);
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
    updatesByX[endX] = mkPseudoEvent(timeData.endTime, thread);
  } else {
    endX = getXFromTimestamp(events.end.timestamp, timeData);
    updatesByX[endX] = events.end;
  }

  for (let i = startX + 1; i <= endX; ++i) {
    const timestamp = i * timeData.scaleMs + timeData.startTime;
    const event = updatesByX[i] ?? mkPseudoEvent(timestamp, thread);
    updatePointsForEvent(points, event, thread, yByThreadByX, timeData);
  }

  return points;
}

function updatePointsForEvent(points, event, thread, yByThreadByX, timeData) {
  const coords = getEventCoords(event, yByThreadByX, timeData);
  const [x, y] = coords;
  const [lpx, lpy] = points[points.length - 1];
  const dx = x - lpx;

  if (!Number.isInteger(lpy) && dx > 1) {
    const xp = lpx + 1;
    points.push([xp, yByThreadByX[xp][thread]]);
  }
  if (!Number.isInteger(y) && dx > 1) {
    const xp = x - 1;
    points.push([xp, yByThreadByX[xp][thread]]);
  }

  points.push(coords);

  return points;
}

/**
 * Get the primary thread and priority for the given event.
 *
 * @param {Event} event - The event to get the primary thread from
 * @param {object} yByThread - Map of threads to priority
 *
 * @returns {number[]} [primaryThread, primaryThreadPriority];
 */
function getPrimaryThreadY(event, yByThread) {
  let currThread = null;
  let threadY = Infinity;

  Object.keys(event.threads).forEach((thread) => {
    if (yByThread[thread] < threadY) {
      currThread = thread;
      threadY = yByThread[thread];
    }
  });

  return [currThread, threadY];
}

/**
 * Extract the threads touched by the events with their start and end timestamps.
 *
 * @param {Event[]} events - Events to search
 */
function extractEventsByThread(events) {
  const eventsByThread = {};
  events.forEach((event) => {
    for (const thread in event.threads) {
      const events = eventsByThread[thread] ?? {};
      eventsByThread[thread] = updateEventsForThread(event, thread, events);
    }
  });
  return eventsByThread;
}

/**
 * Updates and returns the passed timestamps if event starts/ends the given thread.
 *
 * @param {Event} event - The event in question
 * @param {string} thread - The thread to check
 * @param {object} events - Object to update containing start/update/end timestamps
 */
function updateEventsForThread(event, thread, events) {
  const updates = events.updates ?? [];
  if (isThreadStart(event, thread)) {
    events.start = event;
  } else if (isThreadEnd(event, thread)) {
    events.end = event;
  } else {
    updates.push(event);
  }
  events.updates = updates;

  return events;
}

/**
 * Sorts threads vertically based on the gridX coordinate
 *
 * @param {object} eventsByThread - Map of threads to events to prioritize
 * @param {number} startTime - Epoch timestamp of timeframe start
 * @param {number} endTime - Epoch timestamp of timeframe end
 * @param {number} scaleMs - Scale (in ms) that the thread is rendered at
 */
function getYByThreadByX(eventsByThread, { startTime, endTime, scaleMs }) {
  const threadYByThreadByX = {};
  for (let time = startTime; time <= endTime; time += scaleMs) {
    const x = Math.floor((time - startTime) / scaleMs);
    const yByThread = {};

    let currY = 0;

    for (const thread in eventsByThread) {
      const { start, end } = eventsByThread[thread];
      if (start && Math.ceil((start.timestamp - startTime) / scaleMs) > x)
        continue;
      if (end && Math.ceil((end.timestamp - startTime) / scaleMs) < x) continue;

      yByThread[thread] = currY++;
    }

    threadYByThreadByX[x] = yByThread;
  }
  return threadYByThreadByX;
}

/**
 * Filter the map of threads down to the list of visible threads.
 *
 * @param {object} eventsByThread - Threads to filter
 * @param {number} startTime - Epoch timestamp of timeframe start
 * @param {number} endTime - Epoch timestamp of timeframe end
 */
function selectVisibleThreads(eventsByThread, startTime, endTime) {
  const selectedThreads = {};
  for (const thread in eventsByThread) {
    const events = eventsByThread[thread];
    const { start, end } = events;
    const startsAfter = !!start && start.timestamp > endTime;
    const endsBefore = !!end && end.timestamp < startTime;

    if (startsAfter || endsBefore) {
      continue;
    }

    selectedThreads[thread] = events;
  }
  return selectedThreads;
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
