// The form has a date box and a time box; the card stores one ISO instant with an offset ("2027-03-20T11:00:00+08:00").
// Plain JavaScript (see sample-merge.js for why).
import { partsIn } from "./dates.js";

export const DEFAULT_TZ = "Asia/Kuala_Lumpur";
const pad = (n) => String(n).padStart(2, "0");

function offsetString(timeZone, instantMs) {
  const p = partsIn(new Date(instantMs).toISOString(), timeZone);
  const minutes = Math.round((Date.UTC(p.y, p.m - 1, p.d, p.h, p.min) - Math.floor(instantMs / 60000) * 60000) / 60000);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** ("2027-03-20", "11:00") -> "2027-03-20T11:00:00+08:00", or null when the date or time is not real. */
export function toIso(date, time, timeZone = DEFAULT_TZ) {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date)), t = /^(\d{2}):(\d{2})$/.exec(String(time));
  if (!d || !t) return null;
  const [y, m, day, h, min] = [d[1], d[2], d[3], t[1], t[2]].map(Number);
  const check = new Date(Date.UTC(y, m - 1, day, h, min));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== day || h > 23 || min > 59) return null;
  const guess = Date.UTC(y, m - 1, day, h, min);
  let offset = offsetString(timeZone, guess);
  const sign = offset[0] === "-" ? -1 : 1;
  const instant = guess - sign * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6))) * 60000;
  offset = offsetString(timeZone, instant);                       // once more, for a zone that changes offset on that day
  return `${y}-${pad(m)}-${pad(day)}T${pad(h)}:${pad(min)}:00${offset}`;
}

/** "2027-03-20T11:00:00+08:00" -> { date: "2027-03-20", time: "11:00" } as the wall clock of that zone, or null. */
export function fromIso(iso, timeZone = DEFAULT_TZ) {
  if (!iso || Number.isNaN(Date.parse(iso))) return null;
  const p = partsIn(iso, timeZone);
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.min)}` };
}

/** The ISO instant `hours` after `iso` (the end time defaults to the start plus five hours). */
export function addHours(iso, hours, timeZone = DEFAULT_TZ) {
  const parts = fromIso(new Date(Date.parse(iso) + hours * 3600000).toISOString(), timeZone);
  return parts ? toIso(parts.date, parts.time, timeZone) : null;
}
