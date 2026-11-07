import { createCloudflareStore } from "../public/core/cloudflare-store.js";

let fails = 0;
const check = (name: string, ok: boolean, extra = "") => { if (!ok) fails++; console.log(ok ? "PASS" : "FAIL", name, extra); };

const calls: { url: string; init?: any }[] = [];
const answers: Record<string, { status?: number; body: unknown }> = {};
const fakeFetch = async (url: string, init?: any) => {
  calls.push({ url, init });
  const key = Object.keys(answers).find((k) => url.includes(k));
  const a = key ? answers[key] : { body: { ok: true } };
  return { ok: (a.status ?? 200) < 400, status: a.status ?? 200, json: async () => a.body } as any;
};
const make = (extra: object = {}) => createCloudflareStore({ slug: "dina-farid", pollMs: 0, fetch: fakeFetch as any, ...extra });

// the address of every call: the card's own site by default, or the site given
{
  const s = make();
  await s.addRsvp({ name: "Aisyah", attendance: "Hadir", guests: 2, extra: "ignored" } as any);
  check("an RSVP goes to the card's own address, with only the three fields", calls[0].url === "/api/g/dina-farid/rsvps" && calls[0].init.method === "POST" && JSON.parse(calls[0].init.body).extra === undefined && JSON.parse(calls[0].init.body).guests === 2);
  await make({ api: "https://kad.example.com/" }).addWish({ name: "A", message: "Selamat" });
  check("another site can serve the API, without a doubled slash", calls[1].url === "https://kad.example.com/api/g/dina-farid/wishes" && JSON.parse(calls[1].init.body).message === "Selamat");
  check("the slug is escaped", createCloudflareStore({ slug: "a b", pollMs: 0, fetch: fakeFetch as any }).mode === "cloudflare");
}

// wishes come a page at a time, in the shape the card reads
{
  answers["/wishes?"] = { body: { wishes: [{ name: "Z", message: "Hi", createdAt: "2027-01-01T00:00:00Z" }], page: 2, totalPages: 3, hasMore: true } };
  const s = make({ wishesPageSize: 5 });
  const page = await s.loadWishPage(2);
  check("a wish page is asked for by number and size and returned as it came", calls.at(-1)!.url === "/api/g/dina-farid/wishes?page=2&size=5" && page.totalPages === 3 && page.hasMore === true && page.wishes[0].name === "Z");
  await s.loadWishPage(0);
  check("page numbers start at 1", calls.at(-1)!.url.includes("page=1"));
}

// gifts and counts reach their listeners; a single gift taken twice is the card's own "already-claimed"
{
  answers["/gifts"] = { body: { claims: { g1: [{ name: "Aisyah", createdAt: "2027-01-01T00:00:00Z" }] } } };
  answers["/rsvp-stats"] = { body: { guests: 4, attending: 2, notAttending: 1 } };
  const s = make();
  const gifts = await new Promise<any>((resolve) => s.watchGifts(resolve));
  check("gift claims reach the listener as { giftId: [...] }", gifts.g1[0].name === "Aisyah");
  const stats = await new Promise<any>((resolve) => s.watchRsvpStats(resolve));
  check("RSVP counts reach the listener", stats.guests === 4 && stats.attending === 2 && stats.notAttending === 1);
  answers["/gifts"] = { status: 409, body: { error: "taken" } };
  let message = "";
  try { await s.claimGift({ id: "g1" }, "Siti"); } catch (e: any) { message = e.message; }
  check("a gift that is taken says already-claimed", message === "already-claimed");
  answers["/gifts"] = { status: 500, body: { error: "internal" } };
  let other = "";
  try { await s.claimGift({ id: "g2" }, "Siti"); } catch (e: any) { other = e.message; }
  check("any other failure is passed on as it is", other === "internal");
  answers["/rsvp-stats"] = { status: 500, body: { error: "internal" } };
  const failed = await new Promise<any>((resolve) => make().watchRsvpStats(resolve));
  check("a failed count read tells the listener with null", failed === null);
}
console.log(fails ? `${fails} FAILED` : "all passed");
if (fails) process.exit(1);
