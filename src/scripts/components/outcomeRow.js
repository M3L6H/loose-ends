import { START, UPDATE, END, getThreadsAtDate } from "../events/index.js";
import { getTimeZone } from "../settings/index.js";
import { date, pattern } from "../utils/index.js";

const VALID_MODIFIERS = [START, UPDATE, END];
let threads = [];

/**
 * Checks whether the given modifier-thread combo is a valid outcome
 *
 * @param {string} modifier - The modifier of the outcome
 * @param {string} thread - The thread in question
 *
 * @returns {boolean} True if the modifier-thread outcome is valid
 */
export function isOutcomeValid(modifier, thread) {
  const isModifierValid = VALID_MODIFIERS.includes(modifier);
  const isModifierStart = isStart(modifier);
  const isNewThread = !threads.includes(thread);
  const isValidStartThread =
    isModifierStart && pattern.NAME_REGEX.test(thread ?? "") && isNewThread;
  const isValidOtherThread =
    !isModifierStart && isModifierValid && !isNewThread;
  return isValidStartThread || isValidOtherThread;
}

/**
 * Create an outcome row
 *
 * @param {number} id - The id of the row to create
 *
 * @returns {HTMLDivElement} The row created
 */
export function createOutcomeRow(id) {
  const input = createOutcomeInput(id);
  const select = createOutcomeSelect(id);
  const label = createOutcomeLabel(input, id);

  const row = document.createElement("div");
  row.classList.add("outcome-row");

  row.appendChild(select);
  row.appendChild(label);
  row.appendChild(input);
  row.dataset.outcomeId = id;

  return row;
}

/**
 * Extract the outcome from a row
 *
 * @param {HTMLDivElement} row - The outcome row
 *
 * @returns {string[]} The outcome
 */
export function getOutcome(row) {
  const modifier = row.querySelector("select")?.value?.trim() ?? "";
  const thread = row.querySelector("input")?.value?.trim() ?? "";
  return [modifier, thread];
}

/**
 * Create a select element for an outcome
 *
 * @param {number} id - The id of the row to create
 *
 * @returns {HTMLSelectElement} The select element
 */
function createOutcomeSelect(id) {
  const select = document.createElement("select");
  select.id = `outcome-modifier-${id}`;
  ["Start", "Update", "End"].forEach((opt) => appendOption(select, opt));

  return select;
}

/**
 * Append an option to the given select
 *
 * @param {HTMLSelectElement} select - The select element this option is for
 * @param {string} opt - The option text for this option
 *
 * @returns {HTMLOptionElement} The option appended to the passed select
 */
function appendOption(select, opt) {
  const option = document.createElement("option");
  option.innerText = opt;
  option.value = opt.toLowerCase().replaceAll(/\s+/g, "-");
  select.appendChild(option);
  return option;
}

/**
 * Create an outcome input element
 *
 * @param {number} id - The id of the input
 *
 * @returns {HTMLInputElement} The created input element
 */
function createOutcomeInput(id) {
  const input = document.createElement("input");
  input.id = `outcome-${id}`;
  input.placeholder = "Start My New Thread";
  input.setAttribute("list", "thread-suggestions");
  addOutcomeListeners(input);

  return input;
}

/**
 * Add listeners to the outcome input
 *
 * @param {HTMLInputElement} outcomeInput - The input to add listeners to
 */
function addOutcomeListeners(outcomeInput) {
  outcomeInput.addEventListener("focus", () => {
    updateThreads();
    filterThreadSuggestions(getModifier(outcomeInput), outcomeInput.value);
  });
  outcomeInput.addEventListener("beforeinput", outcomeBeforeInputListener);
  outcomeInput.addEventListener("input", outcomeInputListener);
}

/**
 * Create a label for an outcome input
 *
 * @param {HTMLInputElement} input - The input element this label is for
 * @param {number} id - The id of the input
 *
 * @returns {HTMLLabelElement} The created label
 */
function createOutcomeLabel(input, id) {
  const label = document.createElement("label");
  label.setAttribute("for", input.id);
  label.innerText = `Outcome ${id}`;
  return label;
}

function outcomeBeforeInputListener(e) {
  if (e.inputType !== "insertText") return;
  e.preventDefault();
  completeOutcomes(e);
  e.target.dispatchEvent(
    new Event("input", {
      bubbles: true,
    }),
  );
}

function outcomeInputListener(e) {
  const input = e.target;
  const modifier = getModifier(input);
  const thread = input.value;

  filterThreadSuggestions(modifier, thread);

  const outcomeParent = e.target.parentElement;
  const outcomes = outcomeParent.querySelectorAll(".outcome-row");

  if (isOutcomeValid(modifier, thread)) {
    if (parseInt(e.target.dataset.outcomeId) === outcomes.length) {
      appendOutcomeRow(outcomes.length + 1, outcomeParent);
    }
  // } else if (parseInt(e.target.dataset.outcomeId) === outcomes.length - 1) {
  //   popOutcomeInput();
  }
}

/**
 * Append a new outcome row to the list of outcomes.
 *
 * @param {number} id - Id for the new row
 * @param {HTMLElement} outcomeParent - Parent element for the row
 *
 * @returns {HTMLDivElement} The new row
 */
function appendOutcomeRow(id, outcomeParent) {
  const row = createOutcomeRow(id);
  outcomeParent.appendChild(row);
  return row; 
}

/**
 * Return whether the modifier is starting a new thread
 *
 * @param {string} modifier - The modifier to check
 *
 * @returns {boolean} True if modifier is the start modifier
 */
function isStart(modifier) {
  return modifier.trim() === "start";
}

function completeOutcomes(e) {
  const input = e.target;
  const prev = input.value;
  const pos = input.selectionStart;
  const text = e.data;
  const end = pos + text.length;
  const modifier = getModifier(input);

  let val = [];

  for (let i = 0; i < end; ++i) {
    const c = i < pos ? prev[i] : text[i - pos];
    const isFirstChar = i === 0;
    const isAlpha = /\w/.test(c);
    const isValidChar = (!isFirstChar && /[-_\w ]/.test(c)) || isAlpha;
    if (isStart(modifier) && isValidChar) {
      val.push(c);
    } else {
      const newVal = val.join("") + c;
      const filtered = threads.filter((t) => t.startsWith(newVal));
      if (filtered.length === 1) {
        val = filtered[0].split("");
        break;
      }
      if (filtered.length > 0) {
        val.push(filtered[0][val.length]);
      }
    }
  }

  val = val.join("");
  input.value = val;
}

/**
 * Update the suggestions list with the current thread
 *
 * @param {string} modifier - The modifier of the thread
 * @param {string} thread - The thread to filter by
 */
function filterThreadSuggestions(modifier, thread) {
  if (isStart(modifier)) {
    updateThreadSuggestions([]);
    return;
  }

  updateThreadSuggestions(threads.filter((t) => t.startsWith(thread)));
}

/**
 * Called to update available threads based on the current date.
 */
function updateThreads() {
  const dateInput = document.getElementById("event-date");
  threads = getThreadsAtDate(date.parseDate(dateInput.value, getTimeZone()));
}

/**
 * Get the selected modifier for an outcome input
 *
 * @param {HTMLInputElement} input - The input associated with the modifier
 */
function getModifier(input) {
  return input.parentElement.querySelector("select").value;
}

/**
 * Update the datalist of thread suggestions
 *
 * @param {string[]} suggestions - The list of suggestions to update with
 */
function updateThreadSuggestions(suggestions) {
  const threadSuggestions = document.getElementById("thread-suggestions");
  const newSuggestions = threadSuggestions.cloneNode(true);
  newSuggestions.innerHTML = "";
  suggestions.forEach((suggestion) => {
    const option = document.createElement("option");
    option.value = suggestion;
    newSuggestions.appendChild(option);
  });
  threadSuggestions.replaceWith(newSuggestions);
}
