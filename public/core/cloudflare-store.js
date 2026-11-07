// The guest store of a card built in Warkah Kad: RSVPs, wishes and gifts go to Warkah Kad's API on Cloudflare (/api/g/<slug>/...), and the
// customer reads them in their Warkah Kad account. It has the same shape as the other stores in card.js (local, Firebase), so the card does not care which it has:
//   loadWishPage(page) · addWish(wish) · addRsvp(rsvp) · watchRsvpStats(listener) · watchGifts(listener) · claimGift(gift, name)
// Cards that were already live on Firebase keep their Firebase store; this is only for cards whose event.json says store.mode "cloudflare".
//
// Plain browser JS with its dependencies passed in, so tests can run it in Node against a fake fetch.

/**
 * @param {object} options
 * @param {string} [options.api]        the site that serves the API; "" = the card's own site (the usual case: the card and the API share a host)
 * @param {string} options.slug         the card's address
 * @param {number} [options.wishesPageSize]
 * @param {number} [options.pollMs]     how often gifts and RSVP counts are refreshed while the page is open (0 = once)
 * @param {typeof fetch} [options.fetch]
 * @param {() => boolean} [options.visible] polling pauses while the page is hidden
 */
export function createCloudflareStore({ api = "", slug, wishesPageSize = 3, pollMs = 20000, fetch: fetchImpl, visible } = {}) {
  const send = fetchImpl || ((...args) => fetch(...args));
  const isVisible = visible || (() => typeof document === "undefined" || document.visibilityState !== "hidden");
  const base = `${api.replace(/\/$/, "")}/api/g/${encodeURIComponent(slug)}`;

  async function call(path, init) {
    const res = await send(`${base}${path}`, init);
    const body = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(body?.error || `http_${res.status}`), { status: res.status, code: body?.error || `http_${res.status}` });
    return body;
  }
  const post = (path, payload) => call(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

  /** Calls `read` now and then every pollMs while the page is visible. A failed read tells the listener with null once (like the Firebase store does). */
  function poll(read, listener) {
    const tick = async () => {
      try { listener(await read()); } catch (error) { console.error("Warkah Kad store:", error); listener(null); }
    };
    void tick();
    if (pollMs > 0) setInterval(() => { if (isVisible()) void tick(); }, pollMs);
  }

  return {
    mode: "cloudflare",
    async loadWishPage(pageNumber) {
      const page = Math.max(1, pageNumber);
      return call(`/wishes?page=${page}&size=${wishesPageSize}`);
    },
    async addWish(wish) { await post("/wishes", { name: wish.name, message: wish.message }); },
    async addRsvp(rsvp) { await post("/rsvps", { name: rsvp.name, attendance: rsvp.attendance, guests: rsvp.guests }); },
    watchRsvpStats(listener) { poll(() => call("/rsvp-stats"), listener); },
    // { giftId: [{ name, createdAt }, ...] } in the order people chose, as every store gives it
    watchGifts(listener) { poll(async () => (await call("/gifts")).claims, (claims) => { if (claims) listener(claims); }); },
    // The server decides whether a gift is shared (its price is above the limit); a second claim on a single gift is refused.
    async claimGift(gift, name) {
      try { await post("/gifts", { giftId: gift.id, name }); } catch (error) { throw error.status === 409 ? new Error("already-claimed") : error; }
    }
  };
}
