import { insertInSortedArr, sortInPlace } from "../algs/index.js";
import { getTimeZone } from "../settings/index.js";

export const START = "start";
export const UPDATE = "update";
export const END = "end";

/**
 * @typedef {Object} Event
 * @property {string} name - The name of the event
 * @property {number} timestamp - The epoch timestamp of the event
 * @property {object} threads - The threads affected by this event
 */

let events = [
  {
    name: "Other",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 8,
      day: 21,
    },
    threads: {
      "My Test": UPDATE,
      "Other Stuff": START,
      "Third Item": START,
    },
  },
  {
    name: "Test",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 8,
      day: 17,
    },
    threads: {
      "My Test": START,
    },
  },
  {
    name: "The End",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 8,
      day: 28,
    },
    threads: {
      "My Test": END,
      "Third Item": END,
    },
  },
  {
    name: "The Future",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 9,
      day: 10,
    },
    threads: {
      "Other Stuff": END,
    },
  },
  {
    name: "A",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 9,
      day: 1,
    },
    threads: {
      Alphabet: START,
    },
  },
  {
    name: "Crossover",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 9,
      day: 5,
    },
    threads: {
      Alphabet: UPDATE,
      "Other Stuff": UPDATE,
    },
  },
  {
    name: "A New Thread Starts",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 8,
      day: 22,
    },
    threads: {
      Creation: START,
    },
  },
];

let enrichedEvents = null;

const eventCmp = (a, b) => a.timestamp - b.timestamp;

export function addEvent(event) {
  insertInSortedArr(enrichEvent(event), getEvents(), eventCmp);
}

/**
 * Returns whether the event is the start of the given timeline.
 *
 * @param {Event} event - The event to check
 * @param {string} thread - The thread in question
 */
export function isThreadStart(event, thread) {
  return (event.threads ?? {})[thread] === START;
}

/**
 * Returns whether the event is the end of the given thread.
 *
 * @param {Event} event - The event to check
 * @param {string} thread - The thread in question
 */
export function isThreadEnd(event, thread) {
  return (event.threads ?? {})[thread] === END;
}

/**
 * Get the complete list of events.
 *
 * @returns {Event[]} list of events
 */
export function getEvents() {
  if (!enrichedEvents) {
    enrichedEvents = events.map(enrichEvent);
    sortInPlace(enrichedEvents, eventCmp);
  }

  return enrichedEvents;
}

/**
 * Enrich event with timestamp
 *
 * @param {Event} event - The event to enrich
 */
function enrichEvent(event) {
  return {
    ...event,
    timestamp: Temporal.ZonedDateTime.from(event.date).epochMilliseconds,
  };
}
