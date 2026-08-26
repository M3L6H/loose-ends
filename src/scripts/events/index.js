import { sortInPlace } from "../algs/index.js";
import { getTimeZone } from "../settings/index.js";

const START = "start";
const UPDATE = "update";
const END = "end";

/**
 * @typedef {Object} Event
 * @property {string} name - The name of the event
 * @property {number} timestamp - The epoch timestamp of the event
 * @property {object} timelines - The timelines affected by this event
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
    timelines: {
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
    timelines: {
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
    timelines: {
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
    timelines: {
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
    timelines: {
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
    timelines: {
      Alphabet: UPDATE,
      "Other Stuff": UPDATE,
    },
  },
];

let enrichedEvents = null;

/**
 * Returns whether the event is the start of the given timeline.
 *
 * @param {Event} event - The event to check
 * @param {string} timeline - The timeline in question
 */
export function isTimelineStart(event, timeline) {
  return (event.timelines ?? {})[timeline] === START;
}

/**
 * Returns whether the event is the end of the given timeline.
 *
 * @param {Event} event - The event to check
 * @param {string} timeline - The timeline in question
 */
export function isTimelineEnd(event, timeline) {
  return (event.timelines ?? {})[timeline] === END;
}

/**
 * Get the complete list of events.
 *
 * @returns {Event[]} list of events
 */
export function getEvents() {
  if (!enrichedEvents) {
    enrichedEvents = events.map((event) => ({
      ...event,
      timestamp: Temporal.ZonedDateTime.from(event.date).epochMilliseconds,
    }));
    sortInPlace(enrichedEvents, (a, b) => a.timestamp - b.timestamp);
  }

  return enrichedEvents;
}
