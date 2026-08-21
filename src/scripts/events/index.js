import { getTimeZone } from "../settings/index.js";

/**
 * @typedef {Object} Event
 * @property {string} name - The name of the event
 * @property {number} timestamp - The epoch timestamp of the event
 * @property {object} timelines - The timelines affected by this event
 */

let events = [
  {
    name: "Test",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 8,
      day: 17,
    },
    timelines: {
      "My Test": "create",
    },
  },
  {
    name: "Other",
    date: {
      timeZone: getTimeZone(),
      year: 2026,
      month: 8,
      day: 21,
    },
    timelines: {
      "My Test": "update",
      "Other Stuff": "create",
    },
  },
];

/**
 * Get the complete list of events.
 *
 * @returns {Event[]} list of events
 */
export function getEvents() {
  return events.map((event) => ({
    ...event,
    timestamp: Temporal.ZonedDateTime.from(event.date).epochMilliseconds,
  }));
}
