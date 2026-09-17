import { drawContent } from "../canvas/index.js";
import {
  START,
  UPDATE,
  END,
  addEvent,
  getThreadsAtDate,
} from "../events/index.js";
import { getTimeZone } from "../settings/index.js";
import { hideModal } from "./modal.js";

const NAME_REGEX = /[A-Za-z][-_A-Za-z ]*/;

let modal;
let nameInput;
let dateInput;
let descriptionInput;
let outcomesFieldset;
let threadSuggestions;
let submitButton;
let threads = [];

const yr = (i) => (c, v) => {
  if (/[0-9]/.test(c)) {
    v.push(c);
    return true;
  }
  v.splice(0, 0, getYear()[0]);
  for (let j = i; j < 3; ++j) {
    v.splice(1, 0, "0");
  }
  return false;
};
const insZero =
  (max, min = 0) =>
  (c, v) => {
    if (/[0-9]/.test(c)) {
      const n = parseInt(v[v.length - 1] + c);

      if (n >= min && n <= max) {
        v.push(c);
        return true;
      }
    }

    const lastI = v.length;
    v.splice(v.length - 1, 0, "0");
    v[lastI] = `${Math.max(parseInt(v[lastI]), min)}`;
    return false;
  };
const isLeap = (v) => {
  const year = parseInt(v[0] + v[1] + v[2] + v[3]);
  const isCentury = year % 100 === 0;

  return (isCentury && year % 400 === 0) || (!isCentury && year % 4 === 0);
};
const insZeroDay = (c, v) => {
  const mo = parseInt(v[5] + v[6]);
  const smallMo = mo < 8;
  const oddMo = mo % 2 === 1;
  if (mo === 2) {
    return insZero(isLeap(v) ? 29 : 28, 1)(c, v);
  }
  if ((smallMo && oddMo) || (!smallMo && !oddMo)) {
    return insZero(31, 1)(c, v);
  }
  return insZero(30, 1)(c, v);
};
const upTo = (n, altFn) => (c, v) => {
  if (/[0-9]/.test(c)) {
    if (parseInt(c) <= n) {
      v.push(c);
      return true;
    }

    v.push("0");
    v.push(c);
    return true;
  }

  altFn()
    .split("")
    .forEach((ch) => v.push(ch));
  return false;
};
const upToDay = (c, v) => {
  const mo = parseInt(v[5] + v[6]);
  return upTo(mo === 2 ? 2 : 3, getDay)(c, v);
};
const sep =
  (s, ...alt) =>
  (c, v) => {
    v.push(s);
    return s === c || alt.includes(c);
  };
const DATE_PARSERS = [
  (c, v) => {
    if (/[0-9]/.test(c)) {
      v.push(c);
      return true;
    }
    getYear()
      .split("")
      .forEach((ch) => v.push(ch));
    return false;
  },
  yr(1),
  yr(2),
  yr(3),
  sep("-"),
  upTo(1, getMonth),
  insZero(12, 1),
  sep("-", "–", "—"),
  upToDay,
  insZeroDay,
  sep("T"),
  upTo(2, getHour),
  insZero(23),
  sep(":"),
  upTo(5, getZeros),
  insZero(59),
  sep(":"),
  upTo(5, getZeros),
  insZero(59),
];

const modifiers = ["Start ", "Update ", "End "];

const isStart = (modifier) => modifier.trim() === "Start";

function parsePartialOutcomeModifier(c, v, mod) {
  for (let i = v.length; i < mod.length; ++i) {
    const ch = mod[i];
    v.push(ch);
    if (ch === c) return true;
  }
  return false;
}

function parseOutcomeModifier(c, v) {
  if (v.length === 0) {
    for (const m of modifiers) {
      if (c.toUpperCase() === m[0]) {
        v.push(m[0]);
      }
    }
    return true;
  }

  for (const m of modifiers) {
    if (v[0] === m[0]) {
      return parsePartialOutcomeModifier(c, v, m);
    }
  }

  return true;
}

function getNow() {
  return Temporal.Now.zonedDateTimeISO(getTimeZone());
}

function getZeros() {
  return "00";
}

function getHour(d) {
  return (d ?? getNow()).toLocaleString("en-US", {
    hourCycle: "h24",
    hour: "2-digit",
  });
}

function getDay(d) {
  return (d ?? getNow()).toLocaleString("en-US", { day: "2-digit" });
}

function getMonth(d) {
  return (d ?? getNow()).toLocaleString("en-US", { month: "2-digit" });
}

function getYear(d) {
  return (d ?? getNow()).toLocaleString("en-US", { year: "numeric" });
}

export function init() {
  modal = document.getElementById("add-event-modal");

  modal.addEventListener("open", () => {
    const dateInput = modal.querySelector("#event-date");
    const now = getNow().toPlainDateTime().toString({
      fractionalSecondDigits: 0,
    });
    dateInput.placeholder = now;
    dateInput.value = now;
    updateThreads();
    updateThreadSuggestions(modifiers);
  });

  const form = modal.querySelector("form");
  form.addEventListener("input", () => {
    checkValid();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submit();
  });

  nameInput = modal.querySelector("#event-name");
  dateInput = modal.querySelector("#event-date");

  dateInput.addEventListener("focus", () => dateInput.select());
  dateInput.addEventListener("beforeinput", (e) => {
    if (e.inputType !== "insertText") return;
    e.preventDefault();
    completeDate(e);
    e.target.dispatchEvent(new Event("input"));
  });
  dateInput.addEventListener("blur", (e) => {
    completeDate({
      ...e,
      data: "$",
    });
    updateThreads();
  });

  descriptionInput = modal.querySelector("#event-description");

  outcomesFieldset = modal.querySelector("#event-outcomes");
  outcomesFieldset.querySelectorAll("input").forEach((outcomeInput) => {
    outcomeInput.addEventListener("beforeinput", outcomeBeforeInputListener);
    outcomeInput.addEventListener("input", outcomeInputListener);
  });

  submitButton = modal.querySelector("button[type='submit']");
  threadSuggestions = document.getElementById("thread-suggestions");

  checkValid();
}

function submit() {
  const event = {
    name: nameInput.value,
    date: parseDate(dateInput.value),
    description: descriptionInput.value,
    threads: outcomesInput.value.split(/\s*\n\s*/).reduce((obj, line) => {
      const [outcome, ...threadParts] = line.split(/\s+/);
      const thread = threadParts.join(" ");
      switch (outcome.toLowerCase()) {
        case "create":
        case "start":
          obj[thread] = START;
          break;
        case "update":
          obj[thread] = UPDATE;
          break;
        case "end":
          obj[thread] = END;
          break;
      }
      return obj;
    }, {}),
  };
  addEvent(event);
  drawContent();
  hideModal("add-event-modal");
}

function completeDate(e) {
  const pos = dateInput.selectionStart;
  const prev =
    dateInput.value.substring(0, pos) +
    dateInput.value.substring(dateInput.selectionEnd);
  const text = e.data;
  const end = pos + text.length;
  let val = [];

  for (let i = 0; i < end; ++i) {
    const c = i < pos ? prev[i] : text[i - pos];
    const parser = DATE_PARSERS[val.length];
    if (!parser) break;
    if (!parser(c, val)) --i;
  }

  val = val.join("");
  dateInput.value = val;
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
  const { value } = e.target;
  const [modifier, thread] = value.split(/\s+/);
  if (thread === undefined) {
    updateThreadSuggestions(modifiers);
  } else {
    const filtered = isStart(modifier)
      ? []
      : filterThreadOutcomes(modifier + " ", value);
    updateThreadSuggestions(filtered);
  }

  e.target.showPicker();

  const outcomes = outcomesFieldset.querySelectorAll("input");

  if (isOutcomeValid(value)) {
    if (parseInt(e.target.dataset.outcomeId) === outcomes.length) {
      appendOutcomeInput();
    }
  } else if (parseInt(e.target.dataset.outcomeId) === outcomes.length - 1) {
    popOutcomeInput();
  }
}

function appendOutcomeInput() {
  const inputs = outcomesFieldset.querySelectorAll("input");
  const id = inputs.length + 1;

  const input = document.createElement("input");
  input.dataset.outcomeId = id;
  input.id = `outcome-${id}`;
  input.placeholder = "Start My New Thread";
  input.setAttribute("list", "thread-suggestions");
  input.addEventListener("beforeinput", outcomeBeforeInputListener);
  input.addEventListener("input", outcomeInputListener);

  const label = document.createElement("label");
  label.setAttribute("for", input.id);
  label.innerText = `Outcome ${id}`;

  outcomesFieldset.appendChild(label);
  outcomesFieldset.appendChild(input);
}

function popOutcomeInput() {
  const inputs = outcomesFieldset.querySelectorAll("input");
  inputs[inputs.length - 1].remove();
  const labels = outcomesFieldset.querySelectorAll("label");
  labels[labels.length - 1].remove();
}

function completeOutcomes(e) {
  const prev = e.target.value;
  const pos = e.target.selectionStart;
  const text = e.data;
  const end = pos + text.length;
  let val = [];
  let parseModifier = true;
  let modifier = "";

  for (let i = 0; i < end; ++i) {
    const c = i < pos ? prev[i] : text[i - pos];
    if (parseModifier) {
      if (!parseOutcomeModifier(c, val)) --i;
      parseModifier = val[val.length - 1] !== " ";

      if (!parseModifier) {
        modifier = val.join("");
        if (isStart(modifier)) {
          updateThreadSuggestions([]);
        } else {
          updateThreadSuggestions(threads.map((t) => `${modifier}${t}`));
        }
      }
      continue;
    }

    if (isStart(modifier) && /\w/.test(c)) {
      val.push(c);
    } else {
      const newVal = val.join("") + c;
      const filtered = filterThreadOutcomes(modifier, newVal);
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
  e.target.value = val;
}

/**
 * Parse a (ISO-8061) date string into date parts.
 *
 * @param {string} dateStr - The date string to parse
 */
function parseDate(dateStr) {
  const date = Temporal.PlainDateTime.from(dateStr);
  return {
    year: date.year,
    month: date.month,
    day: date.day,
    hour: date.hour,
    minute: date.minute,
    second: date.second,
    timeZone: getTimeZone(),
  };
}

function filterThreadOutcomes(modifier, outcome) {
  return threads
    .map((t) => `${modifier}${t}`)
    .filter((t) => t.startsWith(outcome));
}

function updateThreads() {
  threads = getThreadsAtDate(parseDate(dateInput.value));
}

function updateThreadSuggestions(suggestions) {
  const newSuggestions = threadSuggestions.cloneNode(true);
  newSuggestions.innerHTML = "";
  suggestions.forEach((suggestion) => {
    const option = document.createElement("option");
    option.value = suggestion;
    newSuggestions.appendChild(option);
  });
  threadSuggestions.replaceWith(newSuggestions);
  threadSuggestions = newSuggestions;
}

function isOutcomeValid(outcome) {
  const [modifier, thread] = outcome.split(/\s+/);
  const isValidModifier = modifiers.includes(modifier + " ");
  const isModifierStart = isStart(modifier);
  const isValidStartThread = isModifierStart && NAME_REGEX.test(thread ?? "");
  const isThreadValid = isValidStartThread || threads.includes(thread);
  return isValidModifier && isThreadValid;
}

function checkValid() {
  const nameValid = NAME_REGEX.test(nameInput.value);
  const dateValid = /[0-9]{4}-[0-9]{2}-[0-9]{2}T(?:[0-9]{2}:){2}[0-9]{2}/.test(
    dateInput.value,
  );
  const outcomes = [...outcomesFieldset.querySelectorAll("input")];
  const outcomesValid =
    outcomes.every(({ value }) => value === "" || isOutcomeValid(value)) &&
    outcomes.length > 1;

  submitButton.disabled = !(nameValid && dateValid && outcomesValid);
}
