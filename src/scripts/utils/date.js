/**
 * @typedef {Object} DateParts
 * @property {number} year - The year
 * @property {number} month - The month
 * @property {number} day - The day
 * @property {number} hour - The hour
 * @property {number} minute - The minute
 * @property {number} second - The second
 * @property {string} timeZone - The timeZone
 */

/**
 * Parse a (ISO-8061) date string into date parts.
 *
 * @param {string} dateStr - The date string to parse
 * @param {string} timeZone - The time zone to parse with
 *
 * @returns {DateParts} The date decomposed into parts
 */
export function parseDate(dateStr, timeZone) {
  const date = Temporal.PlainDateTime.from(dateStr);
  return {
    year: date.year,
    month: date.month,
    day: date.day,
    hour: date.hour,
    minute: date.minute,
    second: date.second,
    timeZone,
  };
}
