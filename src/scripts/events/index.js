/**
 * @typedef {Object} Event
 * @property {string} name - The name of the event
 * @property {number} timestamp - The epoch timestamp of the event
 * @property {object} timelines - The timelines affected by this event
 */

let events = [
  {
    name: "Test",
    date: "2026-08-17",
    timelines: {
      "My Test": "create",
    },
  },
  {
    name: "Other",
    date: "2026-08-21",
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
    timestamp: Date.parse(event.date),
  }));
}
