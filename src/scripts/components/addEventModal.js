import { getTimeZone } from "../settings/index.js";

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
const insZero = (max) => (c, v) => {
  if (/[0-9]/.test(c) && parseInt(v[v.length - 1] + c) <= max) {
    v.push(c);
    return true;
  }

  v.splice(v.length - 1, 0, "0");
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
    return insZero(isLeap(v) ? 29 : 28)(c, v);
  }
  if ((smallMo && oddMo) || (!smallMo && !oddMo)) {
    return insZero(31)(c, v);
  }
  return insZero(30)(c, v);
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
const sep = (s) => (c, v) => {
  v.push(s);
  return s === c;
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
  insZero(12),
  sep("-"),
  upTo(3, getDay),
  insZeroDay,
  sep("T"),
  upTo(2, getHour),
  insZero(23),
  sep(":"),
  upTo(5, getMinute),
  insZero(59),
  sep(":"),
  upTo(5, getSecond),
  insZero(59),
];

function getNow() {
  return Temporal.Now.zonedDateTimeISO(getTimeZone());
}

function getSecond(d) {
  return (d ?? getNow()).toLocaleString("en-US", { second: "2-digit" });
}

function getMinute(d) {
  return (d ?? getNow()).toLocaleString("en-US", { minute: "2-digit" });
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
  const modal = document.getElementById("add-event-modal");

  modal.addEventListener("open", () => {
    const dateInput = modal.querySelector("#event-date");
    const now = getNow().toPlainDateTime().toString({
      fractionalSecondDigits: 0,
    });
    dateInput.placeholder = now;
    dateInput.value = now;
  });

  const dateInput = modal.querySelector("#event-date");

  dateInput.addEventListener("beforeinput", (e) => {
    if (e.inputType !== "insertText") {
      return;
    }

    e.preventDefault();
    const prev = dateInput.value;
    const text = e.data;
    const pos = dateInput.selectionStart;
    const end = pos + text.length;
    let val = [];

    for (let i = 0; i < end; ++i) {
      const c = i < pos ? prev[i] : text[i - pos];
      const parser = DATE_PARSERS[val.length];
      if (!parser) break;
      if (!parser(c, val)) --i;
    }

    for (let i = pos; i < prev.length; ++i) {
      const parser = DATE_PARSERS[val.length];
      if (!parser) break;
      if (!parser(prev[i], val)) --i;
    }

    val = val.join("");

    dateInput.value = val;
  });
}
