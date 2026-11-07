// Date helpers shared by the card (event.ts), the language tables (i18n.ts) and the builder's system fields (system-fields.js).
// Plain JavaScript so the builder's Worker and the Node scripts can import it too.

export const DAYS = {
  ms: ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
};
export const MONTHS = {
  ms: ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

/** The wall-clock parts of an ISO instant in a time zone ("2026-12-12T11:00:00+08:00", "Asia/Kuala_Lumpur"). weekday: 0 = Sunday. */
export function partsIn(iso, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short"
  });
  const p = Object.fromEntries(fmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(String(p.weekday));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour), min: Number(p.minute), weekday };
}

export function time12(h, min) {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(min).padStart(2, "0")} ${suffix}`;
}
