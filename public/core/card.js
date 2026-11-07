// Warkah card engine (shared by every card). Do not put client details here:
// they come from events/<client>/event.json, rendered into the page as #warkah-data.
const DATA = JSON.parse(document.getElementById("warkah-data").textContent);
const INVITATION = DATA.invitation;
const THEME = DATA.theme || {};
const FEATURES = INVITATION.features || {};
const STORE = DATA.store || { mode: "local" };

const FIREBASE_VERSION = "12.15.0";

// Gifts above this price (RM) can be shared: several guests can put their name on them.
const GROUP_GIFT_MIN_PRICE = INVITATION.groupGiftMinPrice ?? 500;

const WISHES_PAGE_SIZE = THEME.wishesPerPage ?? 3;   // per theme (theme.ts client.wishesPerPage), 3 by default
const KEY_PREFIX = DATA.keyPrefix || `warkah-${DATA.slug}`;
const LOCAL_WISHES_KEY = `${KEY_PREFIX}-wishes`;
const LOCAL_GIFTS_KEY = `${KEY_PREFIX}-gifts`;
const LOCAL_RSVPS_KEY = `${KEY_PREFIX}-rsvps`;

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

const body = document.body;
const opening = $("#opening");
const card = $("#card");
const panelOverlay = $("#panelOverlay");
const panels = $$(".bottom-panel");
const bgAudio = $("#bgAudio");
const musicToggle = $("#musicToggle");
const musicStatus = $("#musicStatus");
const musicNavButton = $("#musicNavButton");
const rsvpGuestCount = $("#rsvpGuestCount");
const wishList = $("#wishList");

let musicPlaying = false;
let petalInterval = null;
let unlocked = false;

/* ---------- Guest name (?to=Nama) ---------- */

const params = new URLSearchParams(window.location.search);
const guest = (params.get("to") || params.get("guest") || "").trim();

if (guest && FEATURES.guestName) {
  const guestLine = $("#guestLine");
  guestLine.textContent = guest;
  guestLine.hidden = false;

  const openGuest = $("#openGuest");
  const label = document.createElement("span");
  label.textContent = "Kepada";
  openGuest.append(label, document.createTextNode(guest));
  openGuest.hidden = false;
}

/* ---------- Full-page scenes ---------- */

function initScenes() {
  const shell = $(".phone-shell");
  const pages = $$("#card > [data-scene]");
  const dots = $(".page-dots");

  // Each section's content goes into one floating panel so the scene shows around it.
  $$("#card > .section-card").forEach((section) => {
    const panel = document.createElement("div");
    panel.className = "page-panel";
    panel.append(...Array.from(section.childNodes).filter((node) => !(node.classList && node.classList.contains("model-figure"))));
    section.append(panel);
    Array.from(panel.children).forEach((child, childIndex) => child.style.setProperty("--i", childIndex));
  });

  pages.forEach(() => dots.append(document.createElement("span")));

  const layers = {};
  $$(".scene-layer").forEach((layer) => {
    layers[layer.className.match(/scene-(\w+)/g).find((name) => name !== "scene-layer").slice(6)] = layer;
  });

  let currentScene = null;
  let currentIndex = 0;

  // Camera move between scenes: the scene we leave zooms past us, the next one settles in,
  // like the pan through the dais in the concept video. Scrolling back reverses it.
  const showScene = (name, direction) => {
    if (name === currentScene) return;
    const previous = layers[currentScene];
    const next = layers[name];
    if (!next) return;

    if (previous) {
      previous.classList.remove("is-on");
      previous.style.transform = `scale(${direction >= 0 ? 1.28 : 1})`;
    }

    next.style.transition = "none";
    next.style.transform = `scale(${direction >= 0 ? 1 : 1.28})`;
    void next.offsetWidth;
    next.style.transition = "";
    next.style.transform = "";
    next.classList.add("is-on");
    currentScene = name;
  };

  const setActive = (page) => {
    const index = pages.indexOf(page);
    shell.dataset.scene = page.dataset.scene;
    showScene(page.dataset.scene, index - currentIndex);
    currentIndex = index;
    Array.from(dots.children).forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
  };

  setActive(pages[0]);

  if (!("IntersectionObserver" in window)) return;

  // The scene whose page covers the middle of the screen sets the background.
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target);
    });
  }, { root: card, rootMargin: "-45% 0px -45% 0px" });

  pages.forEach((page) => sceneObserver.observe(page));
}

if (THEME.scenes && $$("#card > [data-scene]").length) initScenes();

// The swipe-up hint is only needed until the guest's first swipe.
card.addEventListener("scroll", () => {
  if (card.scrollTop > 40) body.classList.add("has-swiped");
}, { passive: true });

/* ---------- Opening ---------- */

if ("inert" in card) {
  card.inert = true;
}

function unlockCard({ instant = false } = {}) {
  if (unlocked) return;
  unlocked = true;

  opening.classList.add("is-entering");
  loadCardAssets();
  startMusic();

  const reveal = () => {
    body.classList.remove("card-closed");
    body.classList.add("card-opened");
    card.classList.remove("is-locked");
    if ("inert" in card) {
      card.inert = false;
    }
    card.scrollTop = 0;
    opening.classList.add("is-hidden");
    opening.setAttribute("aria-hidden", "true");
    startAmbience();
    window.setTimeout(() => {
      opening.hidden = true;
    }, 1500);
  };

  if (instant) {
    reveal();
  } else {
    // Let the zoom into the carved frame play before the dais appears.
    window.setTimeout(reveal, THEME.openingDelay ?? 250);
  }
}

$("#openInvite").addEventListener("click", (event) => {
  event.stopPropagation();
  unlockCard();
});

opening.addEventListener("click", () => unlockCard());

/* ---------- Countdown ---------- */

function updateCountdown() {
  if (!$("#days")) return;
  const now = Date.now();
  const start = new Date(INVITATION.startDate).getTime();
  const end = new Date(INVITATION.endDate).getTime();
  const state = now >= end ? "over" : now >= start ? "live" : "before";

  // Once the event starts, the countdown gives way to a message.
  const note = $("#countdownOver");
  if (note) {
    note.hidden = state === "before";
    note.textContent = state === "live"
      ? "Majlis sedang berlangsung. Jemput hadir!"
      : state === "over"
        ? "Terima kasih atas kehadiran dan doa anda. Semoga Allah membalas kebaikan anda."
        : "";
    $$("[data-countdown]").forEach((element) => { element.hidden = state !== "before"; });
  }

  const difference = Math.max(start - now, 0);
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  $("#days").textContent = Math.floor(difference / day);
  $("#hours").textContent = Math.floor((difference % day) / hour);
  $("#minutes").textContent = Math.floor((difference % hour) / minute);
  $("#seconds").textContent = Math.floor((difference % minute) / second);
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

/* ---------- Reveal on scroll ---------- */

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { root: card, threshold: 0.12 });

  $$(".reveal").forEach((element) => revealObserver.observe(element));
} else {
  $$(".reveal").forEach((element) => element.classList.add("is-visible"));
}

/* ---------- Panels ---------- */

function openPanel(panelId) {
  if (body.classList.contains("card-closed")) return;

  panels.forEach((panel) => {
    panel.hidden = true;
  });

  const panel = document.getElementById(panelId);
  if (!panel) return;

  panel.hidden = false;
  panelOverlay.hidden = false;
}

function closePanels() {
  panels.forEach((panel) => {
    panel.hidden = true;
  });
  panelOverlay.hidden = true;
}

$$("[data-panel]").forEach((button) => {
  button.addEventListener("click", () => {
    const page = button.dataset.page && document.getElementById(button.dataset.page);
    if (!page) {
      openPanel(button.dataset.panel);
      return;
    }

    // Nav shortcut: land on the related page first, so closing the panel leaves the guest there.
    card.scrollTo({ top: page.offsetTop - 16, behavior: "smooth" });
    if (button.dataset.panel) {
      window.setTimeout(() => openPanel(button.dataset.panel), 450);
    }
  });
});

/* ---------- Tab bars (Hadiah: Senarai Hadiah | DuitNow). Only drawn when there is more than one tab. ---------- */

$$("[data-tabs]").forEach((group) => {
  const tabs = $$("[data-tab]", group);
  const panes = $$("[data-tab-pane]", group);
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    tabs.forEach((other) => {
      const on = other === tab;
      other.classList.toggle("is-active", on);
      other.setAttribute("aria-selected", String(on));
    });
    panes.forEach((pane) => { pane.hidden = pane.dataset.tabPane !== tab.dataset.tab; });
  }));
});

$$(".panel-close, [data-close]").forEach((button) => button.addEventListener("click", closePanels));
panelOverlay.addEventListener("click", closePanels);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closePanels();
});

const toast = $("#toast");
let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  // Next frame so the entrance transition runs.
  window.requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => { toast.hidden = true; }, 350);
  }, 3800);
}

/* ---------- Calendar & location ---------- */

function formatCalendarDate(dateString) {
  return new Date(dateString).toISOString().replace(/-|:|\.\d{3}/g, "");
}

function escapeIcsText(value) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function setupCalendarLinks() {
  const start = formatCalendarDate(INVITATION.startDate);
  const end = formatCalendarDate(INVITATION.endDate);
  const calendarParams = new URLSearchParams({
    action: "TEMPLATE",
    text: INVITATION.eventTitle,
    dates: `${start}/${end}`,
    details: INVITATION.calendarDescription,
    location: INVITATION.address
  });

  $("#googleCalendar").href = `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;

  $("#appleCalendar").addEventListener("click", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Warkah//Kad Digital//MS",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@${DATA.slug}.warkah`,
      `DTSTAMP:${formatCalendarDate(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${escapeIcsText(INVITATION.eventTitle)}`,
      `DESCRIPTION:${escapeIcsText(INVITATION.calendarDescription)}`,
      `LOCATION:${escapeIcsText(INVITATION.address)}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${DATA.slug}-majlis.ics`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

function setupLocationLinks() {
  $("#googleMaps").href = INVITATION.googleMapsUrl;
  $("#waze").href = INVITATION.wazeUrl;
}

function setupDuitnow() {
  const { image, accountName } = INVITATION.duitnow || {};
  if (!image || !$("#giftQr")) return;

  $("#giftQr").src = image;
  $("#giftSave").href = image;
  if (accountName) $("#giftName").textContent = accountName;
  $("#giftDuitnow").hidden = false;
}

function renderContacts() {
  const list = $("#contactList");
  list.innerHTML = "";

  if (INVITATION.contacts.length === 0) {
    const note = document.createElement("p");
    note.className = "small-note";
    note.textContent = "Maklumat untuk dihubungi akan dikemas kini.";
    list.append(note);
    return;
  }

  INVITATION.contacts.forEach((contact) => {
    const item = document.createElement("a");
    item.className = "contact-card";
    item.href = `tel:+6${contact.phone.replace(/[^\d]/g, "")}`;

    const name = document.createElement("strong");
    name.textContent = contact.name;
    const role = document.createElement("small");
    role.textContent = contact.role;
    const phone = document.createElement("span");
    phone.textContent = contact.phone;

    item.append(name, role, phone);
    list.append(item);
  });
}

setupCalendarLinks();
setupLocationLinks();
renderContacts();
setupDuitnow();

/* ---------- Gallery carousel ---------- */

function initCarousel(root) {
  const track = $("[data-carousel-track]", root);
  const slides = $$(".carousel-slide", root);
  const prevButton = $("[data-carousel-prev]", root);
  const nextButton = $("[data-carousel-next]", root);
  const dots = $("[data-carousel-dots]", root);

  if (!track || !prevButton || !nextButton || !dots || slides.length === 0) {
    return;
  }

  let currentIndex = 0;
  let autoplayId = null;
  let touchStartX = null;

  function stopAutoplay() {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  const viewport = $(".carousel-viewport", root);

  function fitViewport() {
    viewport.style.height = `${slides[currentIndex].offsetHeight}px`;
  }

  function setIndex(nextIndex) {
    currentIndex = ((nextIndex % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    fitViewport();

    Array.from(dots.children).forEach((dot, slideIndex) => {
      const active = slideIndex === currentIndex;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });

    prevButton.disabled = slides.length < 2;
    nextButton.disabled = slides.length < 2;
  }

  function restartAutoplay() {
    stopAutoplay();
    if (slides.length < 2) return;
    autoplayId = window.setInterval(() => setIndex(currentIndex + 1), 4200);
  }

  function moveTo(nextIndex) {
    setIndex(nextIndex);
    restartAutoplay();
  }

  dots.innerHTML = "";

  slides.forEach((slide, slideIndex) => {
    // Slides differ in height (portrait vs landscape); resize the frame once each photo loads.
    const img = $("img", slide);
    if (img && !img.complete) {
      img.addEventListener("load", fitViewport);
    }

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Pergi ke slaid ${slideIndex + 1}`);
    dot.addEventListener("click", () => moveTo(slideIndex));
    dots.append(dot);
  });

  prevButton.addEventListener("click", () => moveTo(currentIndex - 1));
  nextButton.addEventListener("click", () => moveTo(currentIndex + 1));

  window.addEventListener("resize", fitViewport);

  viewport.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
    stopAutoplay();
  }, { passive: true });
  viewport.addEventListener("touchend", (event) => {
    if (touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(deltaX) > 40) {
      moveTo(currentIndex + (deltaX < 0 ? 1 : -1));
    } else {
      restartAutoplay();
    }
  });

  root.addEventListener("pointerenter", stopAutoplay);
  root.addEventListener("pointerleave", restartAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", (event) => {
    if (!root.contains(event.relatedTarget)) {
      restartAutoplay();
    }
  });

  setIndex(0);
  restartAutoplay();
}

const galleryCarousel = $("[data-carousel]");
if (galleryCarousel) {
  initCarousel(galleryCarousel);
}

/* ---------- Data store: Firebase when configured, otherwise this device ---------- */

function readLocal(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private mode); the submission is simply not kept.
  }
}

function createLocalStore() {
  const rsvpListeners = new Set();

  const stats = () => summariseRsvps(readLocal(LOCAL_RSVPS_KEY));

  return {
    mode: "local",
    async loadWishPage(pageNumber) {
      const wishes = readLocal(LOCAL_WISHES_KEY).slice().reverse();
      const totalPages = Math.max(1, Math.ceil(wishes.length / WISHES_PAGE_SIZE));
      const page = Math.min(Math.max(1, pageNumber), totalPages);
      const start = (page - 1) * WISHES_PAGE_SIZE;
      return { wishes: wishes.slice(start, start + WISHES_PAGE_SIZE), page, totalPages, hasMore: page < totalPages };
    },
    async addWish(wish) {
      const wishes = readLocal(LOCAL_WISHES_KEY);
      wishes.push({ ...wish, createdAt: new Date().toISOString() });
      writeLocal(LOCAL_WISHES_KEY, wishes);
    },
    async addRsvp(rsvp) {
      const rsvps = readLocal(LOCAL_RSVPS_KEY);
      rsvps.push({ ...rsvp, submittedAt: new Date().toISOString() });
      writeLocal(LOCAL_RSVPS_KEY, rsvps);
      rsvpListeners.forEach((listener) => listener(stats()));
    },
    watchRsvpStats(listener) {
      rsvpListeners.add(listener);
      listener(stats());
    },
    watchGifts(listener) {
      giftListeners.add(listener);
      listener(readGiftsLocal());
    },
    async claimGift(gift, name) {
      const list = readRawGiftsLocal();
      if (!gift.group && list.some((entry) => entry.id === gift.id)) throw new Error("already-claimed");
      list.push({ id: gift.id, name, createdAt: new Date().toISOString() });
      try {
        localStorage.setItem(LOCAL_GIFTS_KEY, JSON.stringify(list));
      } catch {
        // Storage unavailable; the claim is simply not kept.
      }
      giftListeners.forEach((listener) => listener(readGiftsLocal()));
    }
  };
}

const giftListeners = new Set();

function readRawGiftsLocal() {
  try {
    const value = JSON.parse(localStorage.getItem(LOCAL_GIFTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

// { giftId: [{ name, createdAt }, ...] } in the order people chose.
function readGiftsLocal() {
  return readRawGiftsLocal().reduce((claims, entry) => {
    (claims[entry.id] ||= []).push({ name: entry.name, createdAt: entry.createdAt });
    return claims;
  }, {});
}

async function createFirebaseStore(config) {
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [{ initializeApp }, firestore] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-firestore.js`)
  ]);
  const {
    getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit,
    startAfter, getDocs, getCountFromServer, serverTimestamp, doc, setDoc, writeBatch
  } = firestore;

  const db = getFirestore(initializeApp(config));
  // Shared Warkah project: events/<client>/<collection>. Legacy single-card projects: root collections.
  const path = (name) => (STORE.root ? `${STORE.root}/${name}` : name);
  const wishesCollection = collection(db, path("wishes"));
  const rsvpsCollection = collection(db, path("rsvps"));
  // Guest names in RSVPs are private (only the couple can read them). The card counts guests from
  // rsvpPublic, which holds only attendance + number of guests.
  const countsCollection = STORE.publicCounts ? collection(db, path("rsvpPublic")) : rsvpsCollection;
  const pageEnds = new Map();

  async function loadWishPage(pageNumber) {
    const page = Math.max(1, pageNumber);
    if (page === 1) pageEnds.clear();

    const cursor = page > 1 ? pageEnds.get(page - 1) : null;
    if (page > 1 && !cursor) {
      return loadWishPage(1);
    }

    const constraints = [orderBy("createdAt", "desc")];
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(WISHES_PAGE_SIZE));

    const [countResult, pageResult] = await Promise.allSettled([
      getCountFromServer(wishesCollection),
      getDocs(query(wishesCollection, ...constraints))
    ]);

    if (pageResult.status !== "fulfilled") {
      throw pageResult.reason;
    }

    const snapshot = pageResult.value;
    if (snapshot.docs.length > 0) {
      pageEnds.set(page, snapshot.docs[snapshot.docs.length - 1]);
    }

    let totalPages = null;
    if (countResult.status === "fulfilled") {
      totalPages = Math.max(1, Math.ceil((Number(countResult.value.data().count) || 0) / WISHES_PAGE_SIZE));
    } else {
      console.error("Error counting wishes:", countResult.reason);
    }

    return {
      wishes: snapshot.docs.map((doc) => doc.data()),
      page,
      totalPages,
      hasMore: totalPages ? page < totalPages : snapshot.docs.length === WISHES_PAGE_SIZE
    };
  }

  return {
    mode: "firebase",
    loadWishPage,
    async addWish(wish) {
      await addDoc(wishesCollection, { ...wish, createdAt: serverTimestamp() });
    },
    async addRsvp(rsvp) {
      if (!STORE.publicCounts) {
        await addDoc(rsvpsCollection, { ...rsvp, submittedAt: serverTimestamp() });
        return;
      }
      const ref = doc(rsvpsCollection);
      const batch = writeBatch(db);
      batch.set(ref, { ...rsvp, submittedAt: serverTimestamp() });
      batch.set(doc(countsCollection, ref.id), { attendance: rsvp.attendance, guests: rsvp.guests, submittedAt: serverTimestamp() });
      await batch.commit();
    },
    watchGifts(listener) {
      onSnapshot(
        collection(db, path("gifts")),
        (snapshot) => {
          const claims = {};
          snapshot.docs.forEach((item) => {
            const data = item.data();
            const giftId = item.id.split("-")[0];
            (claims[giftId] ||= []).push({ name: data.name, createdAt: data.createdAt?.toDate?.() ?? null });
          });
          Object.values(claims).forEach((list) => list.sort((first, second) => (first.createdAt?.getTime?.() ?? 0) - (second.createdAt?.getTime?.() ?? 0)));
          listener(claims);
        },
        (error) => console.error("Error watching gifts:", error)
      );
    },
    // One gift = one document named after it, so a second claim is refused.
    // A group gift (price above the limit) gets a document per person: <id>-<random>.
    async claimGift(gift, name) {
      const docId = gift.group ? `${gift.id}-${Math.random().toString(36).slice(2, 10)}` : gift.id;
      await setDoc(doc(db, path("gifts"), docId), { name, createdAt: serverTimestamp() });
    },
    watchRsvpStats(listener) {
      onSnapshot(
        countsCollection,
        (snapshot) => listener(summariseRsvps(snapshot.docs.map((doc) => doc.data()))),
        (error) => {
          console.error("Error watching RSVPs:", error);
          listener(null);
        }
      );
    }
  };
}

async function createStore() {
  if (STORE.mode !== "firebase" || !STORE.config || !STORE.config.apiKey) {
    return createLocalStore();
  }

  try {
    return await createFirebaseStore(STORE.config);
  } catch (error) {
    console.error("Firebase unavailable, falling back to this device:", error);
    return createLocalStore();
  }
}

function summariseRsvps(rsvps) {
  return rsvps.reduce((stats, rsvp) => {
    if (rsvp.attendance === "Tidak Hadir") {
      stats.notAttending += 1;
    } else {
      stats.attending += 1;
      stats.guests += getRsvpGuestCount(rsvp);
    }
    return stats;
  }, { guests: 0, attending: 0, notAttending: 0 });
}

function getRsvpGuestCount(rsvp) {
  const guests = Number.parseInt(String(rsvp.guests ?? "0"), 10);
  return Number.isFinite(guests) && guests >= 0 ? guests : 0;
}


/* ---------- Gifts (Hadiah) ---------- */

const MY_GIFTS_KEY = `${KEY_PREFIX}-my-gifts`;

function readMyGifts() {
  try {
    const value = JSON.parse(localStorage.getItem(MY_GIFTS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function rememberMyGift(id) {
  try {
    localStorage.setItem(MY_GIFTS_KEY, JSON.stringify([...new Set([...readMyGifts(), id])]));
  } catch {
    // Not remembered; harmless.
  }
}

function forgetMyGift(id) {
  try {
    localStorage.setItem(MY_GIFTS_KEY, JSON.stringify(readMyGifts().filter((item) => item !== id)));
  } catch {
    // Nothing to forget.
  }
}

const GIFT_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" /><path d="M12 7c-1.2-3.2-5-3.4-5-1.2C7 7 9 7 12 7Zm0 0c1.2-3.2 5-3.4 5-1.2 0 1.2-2 1.2-5 1.2Z" /></svg>';

function initGifts(store) {
  const list = $("#giftList");
  if (!list || INVITATION.gifts.length === 0) return;
  let claims = {};
  INVITATION.gifts.forEach((gift) => {
    gift.group = Number.parseFloat(gift.price.replace(/,/g, "")) > GROUP_GIFT_MIN_PRICE;
  });
  let openForm = null;
  let draftName = "";

  function render() {
    // The list is rebuilt whenever someone's claim arrives. Keep what this guest was typing.
    const hadFocus = Boolean(list.querySelector(".gift-form input:focus"));
    list.innerHTML = "";
    const mine = readMyGifts();

    INVITATION.gifts.forEach((gift) => {
      const claimers = claims[gift.id] || [];
      const isMine = mine.includes(gift.id);
      // A single gift is taken after one claim. A group gift stays open, except for the guest who already joined.
      const claimed = gift.group ? isMine : claimers.length > 0;
      const item = document.createElement("article");
      item.className = `gift-card${!gift.group && claimers.length ? " is-claimed" : ""}`;

      const icon = document.createElement("span");
      icon.className = "gift-icon";
      icon.innerHTML = GIFT_ICON;

      // Photo: ./assets/gifts/<id>.webp. If the file is missing the gold icon stays.
      const photo = document.createElement("img");
      photo.className = "gift-photo";
      photo.alt = gift.name;
      photo.decoding = "async";
      photo.addEventListener("load", () => item.classList.add("has-photo"));
      photo.addEventListener("error", () => photo.remove());
      photo.src = `${DATA.assets}gifts/${gift.id}.webp?v=1`;

      const body = document.createElement("div");
      body.className = "gift-body";
      const title = document.createElement("strong");
      title.textContent = gift.name;
      const note = document.createElement("span");
      note.className = "gift-desc";
      note.textContent = gift.note;
      const price = document.createElement("span");
      price.className = "gift-price";
      price.textContent = `Anggaran RM${gift.price}`;
      body.append(title, note, price);

      if (gift.group) {
        const tag = document.createElement("span");
        tag.className = "gift-group";
        tag.textContent = claimers.length
          ? `Boleh dikongsi. Dipilih oleh: ${claimers.map((claimer) => claimer.name).join(", ")}`
          : "Boleh dikongsi. Beberapa tetamu boleh menyertai";
        body.append(tag);
      }

      const actions = document.createElement("div");
      actions.className = "gift-actions";

      const link = document.createElement("a");
      link.className = "gift-link";
      link.href = gift.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `Lihat di ${INVITATION.giftShop || "Shopee"}`;
      actions.append(link);

      if (claimed) {
        const badge = document.createElement("span");
        badge.className = "gift-badge";
        badge.textContent = isMine ? "Pilihan anda" : "Sudah dipilih";
        actions.append(badge);
      } else if (openForm === gift.id) {
        const form = document.createElement("form");
        form.className = "gift-form";
        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 80;
        input.required = true;
        input.placeholder = "Nama anda";
        input.setAttribute("aria-label", "Nama anda");
        try {
          input.value = draftName || localStorage.getItem(RSVP_DONE_KEY) || "";
        } catch {
          input.value = draftName;
        }
        input.addEventListener("input", () => { draftName = input.value; });
        if (hadFocus) window.requestAnimationFrame(() => input.focus());
        const confirm = document.createElement("button");
        confirm.type = "submit";
        confirm.className = "gift-confirm";
        confirm.textContent = "Sahkan";
        const status = document.createElement("span");
        status.className = "gift-status";
        status.setAttribute("role", "status");
        form.append(input, confirm, status);

        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const name = input.value.trim().slice(0, 80);
          if (!name) return;
          confirm.disabled = true;
          status.textContent = "";
          // Remember it first: the live list may refresh before the save call returns.
          rememberMyGift(gift.id);
          openForm = null;
          draftName = "";
          try {
            await store.claimGift(gift, name);
            showToast(`Terima kasih, ${name}! Hadiah itu telah ditanda untuk anda.`);
            render();
          } catch (error) {
            console.error("Error claiming gift:", error);
            forgetMyGift(gift.id);
            openForm = gift.id;
            draftName = name;
            render();
            const retry = $(".gift-form .gift-status", list);
            if (retry) retry.textContent = "Maaf, tidak dapat disimpan. Hadiah ini mungkin sudah dipilih, atau sambungan terputus. Sila cuba lagi.";
            confirm.disabled = false;
          }
        });
        actions.append(form);
      } else {
        const claim = document.createElement("button");
        claim.type = "button";
        claim.className = "gift-claim";
        claim.textContent = gift.group ? "Saya nak sertai" : "Saya akan beli ini";
        claim.addEventListener("click", () => {
          openForm = gift.id;
          render();
          const input = $(".gift-form input", list);
          if (input) input.focus();
        });
        actions.append(claim);
      }

      item.append(icon, photo, body, actions);
      list.append(item);
    });
  }

  store.watchGifts((next) => {
    claims = next;
    render();
  });
  render();
}

/* ---------- Wishes & RSVP UI ---------- */

const WISH_ROTATE_MS = 6000;

let wishCurrentPage = 1;
let wishHasMore = false;
let wishLoading = false;
let wishLoadToken = 0;
let wishRotateId = null;

function renderWishes(wishes) {
  if (!wishList) return;
  wishList.innerHTML = "";

  wishes.forEach((wish, wishIndex) => {
    const item = document.createElement("div");
    item.className = "wish-card";
    item.style.setProperty("--wish-delay", `${wishIndex * 55}ms`);

    const avatar = document.createElement("span");
    avatar.className = "wish-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = (String(wish.name).trim().charAt(0) || "?").toUpperCase();

    const content = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = wish.name;
    const message = document.createElement("p");
    message.textContent = wish.message;
    content.append(name, message);

    item.append(avatar, content);
    wishList.append(item);
  });

  wishList.classList.remove("is-changing");
}

function showDefaultWishes() {
  renderWishes(INVITATION.defaultWishes);
  wishCurrentPage = 1;
  wishHasMore = false;
}

// Pages already fetched ahead of time, so the auto-rotation swaps instantly instead of
// dimming the list while it waits on the network.
const wishPageCache = new Map();

function prefetchWishPage(store, pageNumber) {
  if (wishPageCache.has(pageNumber)) return;
  wishPageCache.set(pageNumber, store.loadWishPage(pageNumber).catch(() => {
    wishPageCache.delete(pageNumber);
    return null;
  }));
}

async function loadWishPage(store, pageNumber) {
  const loadToken = ++wishLoadToken;
  wishLoading = true;

  try {
    if (pageNumber === 1) wishPageCache.clear();
    let pending = wishPageCache.get(pageNumber);
    wishPageCache.delete(pageNumber);
    let result = pending ? await pending : null;
    if (!result) result = await store.loadWishPage(pageNumber);
    if (loadToken !== wishLoadToken) return;

    if (result.wishes.length === 0 && result.page === 1) {
      showDefaultWishes();
      return;
    }

    let wishes = result.wishes;
    if (result.page > 1 && wishes.length < WISHES_PAGE_SIZE) {
      // Short last page: top it up from the newest wishes so every page shows a full set.
      const firstPage = await store.loadWishPage(1);
      if (loadToken !== wishLoadToken) return;
      wishes = wishes.concat(firstPage.wishes.slice(0, WISHES_PAGE_SIZE - wishes.length));
    }

    // Only fade once the data is in hand, so the list is never left dimmed during a fetch.
    wishList?.classList.add("is-changing");
    await new Promise((resolve) => window.setTimeout(resolve, 220));
    if (loadToken !== wishLoadToken) return;

    renderWishes(wishes);
    wishCurrentPage = result.page;
    wishHasMore = result.hasMore;
    if (result.hasMore) prefetchWishPage(store, result.page + 1);
  } catch (error) {
    if (loadToken !== wishLoadToken) return;
    console.error("Error loading wishes:", error);
    if (pageNumber === 1) showDefaultWishes();
    wishList?.classList.remove("is-changing");
  } finally {
    if (loadToken === wishLoadToken) {
      wishLoading = false;
    }
  }
}

// Wishes rotate on their own: next page every few seconds, back to page 1 after the last.
// With a single page there is nothing to rotate, so the list stays put.
function startWishRotation(store) {
  if (wishRotateId) window.clearInterval(wishRotateId);

  wishRotateId = window.setInterval(() => {
    if (wishLoading || document.hidden) return;
    if (wishHasMore) {
      void loadWishPage(store, wishCurrentPage + 1);
    } else if (wishCurrentPage > 1) {
      void loadWishPage(store, 1);
    }
  }, WISH_ROTATE_MS);
}

function setRsvpStats(stats) {
  if (!rsvpGuestCount) return;
  rsvpGuestCount.textContent = stats ? String(stats.guests) : "-";
}

// Remember on this phone that the guest has RSVP'd, so they are not asked again by default.
const RSVP_DONE_KEY = `${KEY_PREFIX}-rsvp-done`;

function showRsvpDone(name) {
  if (!name || !$("#rsvpDone")) return;
  const note = $("#rsvpDone");
  note.textContent = `\u2713 Terima kasih, ${name}. Kehadiran anda telah disahkan.`;
  note.hidden = false;
  const button = $("#rsvpOpenButton");
  button.textContent = "Sahkan Untuk Tetamu Lain";
  button.classList.replace("primary-button", "secondary-button");
}

try {
  showRsvpDone(localStorage.getItem(RSVP_DONE_KEY));
} catch {
  // Storage unavailable; the note simply is not shown.
}

async function initGuestbook() {
  const store = await createStore();

  if (store.mode === "local") {
    console.info("RSVP & wishes are in demo mode (saved on this device only).");
  }

  initGifts(store);
  if (wishList) {
    void loadWishPage(store, 1);
    startWishRotation(store);
  }
  if (rsvpGuestCount) store.watchRsvpStats(setRsvpStats);

  const rsvpFormElement = $("#rsvpForm");
  if (!rsvpFormElement) return;

  // "Tidak Hadir" always counts as 0 guests, so the field is hidden instead of asked.
  const rsvpForm = $("#rsvpForm");
  const attendanceSelect = $("select[name='attendance']", rsvpForm);
  const guestsField = $("#guestsField");
  const guestsInput = $("select[name='guests']", guestsField);

  function syncGuestsField() {
    const notAttending = attendanceSelect.value === "Tidak Hadir";
    guestsField.hidden = notAttending;
    guestsInput.disabled = notAttending;
  }

  attendanceSelect.addEventListener("change", syncGuestsField);
  rsvpForm.addEventListener("reset", () => window.setTimeout(syncGuestsField));

  $("#rsvpForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const attendance = String(form.get("attendance") || "");
    const parsedGuests = Number.parseInt(String(form.get("guests") || "0"), 10);
    const rsvp = {
      name: String(form.get("name") || "").trim().slice(0, 80),
      attendance,
      guests: attendance === "Tidak Hadir" ? 0 : Math.min(Math.max(Number.isFinite(parsedGuests) ? parsedGuests : 1, 1), INVITATION.maxGuests || 2)
    };

    // The wish is optional; when given, it is posted to Ucapan Tetamu as well.
    const message = String(form.get("message") || "").trim().slice(0, 180);

    if (!rsvp.name || !rsvp.attendance) return;

    const submitButton = $("button[type='submit']", formElement);
    const status = $("#rsvpStatus");
    submitButton.disabled = true;
    status.textContent = "Menghantar RSVP...";

    try {
      await Promise.all([
        store.addRsvp(rsvp),
        message ? store.addWish({ name: rsvp.name, message }) : null
      ]);
      if (wishList) {
        await loadWishPage(store, 1);
        startWishRotation(store);
      }
      status.textContent = "";
      formElement.reset();
      closePanels();
      try {
        localStorage.setItem(RSVP_DONE_KEY, rsvp.name);
      } catch {
        // Not remembered; harmless.
      }
      showRsvpDone(rsvp.name);
      showToast(`Terima kasih, ${rsvp.name}! ${message ? "RSVP dan ucapan anda telah dihantar." : "RSVP anda telah dihantar."}`);
      // Bring the guest to their ucapan, now at the top of Ucapan Tetamu.
      // Scroll only the card: scrollIntoView would also shift the clipped shell/body and expose the gap around it.
      if (message && $("#wishesSection")) {
        const section = $("#wishesSection");
        const cardBox = card.getBoundingClientRect();
        const sectionBox = section.getBoundingClientRect();
        const top = card.scrollTop + sectionBox.top - cardBox.top - (cardBox.height - sectionBox.height) / 2;
        card.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error sending RSVP:", error);
      status.textContent = "Maaf, RSVP tidak dapat dihantar. Sila cuba lagi.";
    } finally {
      submitButton.disabled = false;
    }
  });
}

// The card's heavy parts (background images, Firebase SDK) start loading once the
// opening screen has finished loading, or straight away if the guest opens the card first.
let cardAssetsRequested = false;

function loadCardAssets() {
  if (cardAssetsRequested) return;
  cardAssetsRequested = true;
  body.classList.add("assets-ready");
  void initGuestbook();
}

if (document.readyState === "complete") {
  loadCardAssets();
} else {
  window.addEventListener("load", () => {
    const whenIdle = window.requestIdleCallback || ((callback) => window.setTimeout(callback, 200));
    whenIdle(loadCardAssets);
  });
}

/* ---------- Ambience: fairy lights & petals ---------- */

function createFairyLights() {
  const field = $(".fairy-lights");
  if (!field) return;
  const count = THEME.fairyLights ?? 22;
  for (let index = 0; index < count; index += 1) {
    const light = document.createElement("span");
    light.className = "fairy-light";
    light.style.left = `${Math.random() * 100}%`;
    light.style.top = `${Math.random() * 100}%`;
    light.style.setProperty("--size", `${3 + Math.random() * 4}px`);
    light.style.setProperty("--duration", `${3 + Math.random() * 4}s`);
    light.style.setProperty("--delay", `${Math.random() * 4}s`);
    field.append(light);
  }
}

const PETAL_COLORS = THEME.petals || [];

function createPetal() {
  const petal = document.createElement("span");
  petal.className = "petal";
  petal.style.left = `${Math.random() * 100}%`;
  petal.style.setProperty("--size", `${9 + Math.random() * 9}px`);
  petal.style.setProperty("--duration", `${9 + Math.random() * 7}s`);
  petal.style.setProperty("--drift", `${-60 + Math.random() * 120}px`);
  petal.style.setProperty("--spin", `${180 + Math.random() * 360}deg`);
  petal.style.setProperty("--petal", PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)]);
  const petalField = $(".petal-field");
  if (!petalField) return;
  petalField.append(petal);
  window.setTimeout(() => petal.remove(), 17000);
}

function startAmbience() {
  if (petalInterval) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  createFairyLights();
  if (PETAL_COLORS.length === 0) return;
  createPetal();
  petalInterval = window.setInterval(createPetal, 1400);
}

/* ---------- Music ---------- */

function setMusicUI(playing, statusText) {
  musicPlaying = playing;
  if (!musicToggle) return;
  musicToggle.textContent = playing ? "Hentikan Lagu" : "Mainkan Lagu";
  musicNavButton?.classList.toggle("is-playing", playing);
  body.classList.toggle("is-music-playing", playing);
  if (statusText) musicStatus.textContent = statusText;
}

async function startMusic() {
  if (!bgAudio) return;

  try {
    bgAudio.volume = 0.6;
    await bgAudio.play();
    setMusicUI(true, "Lagu sedang dimainkan.");
  } catch (error) {
    setMusicUI(false, bgAudio.error || bgAudio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE
      ? "Fail lagu belum tersedia."
      : "Lagu tidak dapat dimainkan. Sila tekan butang sekali lagi.");
  }
}

function stopMusic() {
  if (!bgAudio) return;
  bgAudio.pause();
  setMusicUI(false, "Lagu dihentikan.");
}

bgAudio?.addEventListener("error", () => {
  setMusicUI(false, "Fail lagu belum tersedia.");
});

musicToggle?.addEventListener("click", () => {
  if (musicPlaying) {
    stopMusic();
  } else {
    startMusic();
  }
});

// Pause when the guest leaves the tab, resume when they return.
document.addEventListener("visibilitychange", () => {
  if (!bgAudio || !musicPlaying) return;
  if (document.hidden) {
    bgAudio.pause();
  } else {
    bgAudio.play().catch(() => setMusicUI(false));
  }
});

/* ---------- Lightbox (Galeri & Potret) ---------- */

const lightbox = $("#lightbox");
const lightboxImg = $(".lightbox-img", lightbox);
const lightboxPrev = $(".lightbox-prev", lightbox);
const lightboxNext = $(".lightbox-next", lightbox);
const lightboxCount = $(".lightbox-count", lightbox);
let lightboxGroup = [];
let lightboxIndex = 0;
let lightboxTouchX = null;

function showLightboxImage(index) {
  lightboxIndex = (index + lightboxGroup.length) % lightboxGroup.length;
  const source = lightboxGroup[lightboxIndex];
  lightboxImg.src = source.currentSrc || source.src;
  lightboxImg.alt = source.alt;
  lightboxCount.textContent = lightboxGroup.length > 1 ? `${lightboxIndex + 1} / ${lightboxGroup.length}` : "";
}

function openLightbox(image) {
  lightboxGroup = $$(`[data-lightbox="${image.dataset.lightbox}"]`);
  const multiple = lightboxGroup.length > 1;
  lightboxPrev.hidden = !multiple;
  lightboxNext.hidden = !multiple;
  showLightboxImage(lightboxGroup.indexOf(image));
  lightbox.hidden = false;
  $(".lightbox-close", lightbox).focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.removeAttribute("src");
}

$$("[data-lightbox]").forEach((image) => {
  image.addEventListener("click", () => openLightbox(image));
});

lightboxPrev.addEventListener("click", (event) => {
  event.stopPropagation();
  showLightboxImage(lightboxIndex - 1);
});
lightboxNext.addEventListener("click", (event) => {
  event.stopPropagation();
  showLightboxImage(lightboxIndex + 1);
});
$(".lightbox-close", lightbox).addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightbox.addEventListener("touchstart", (event) => {
  lightboxTouchX = event.touches[0].clientX;
}, { passive: true });
lightbox.addEventListener("touchend", (event) => {
  if (lightboxTouchX === null || lightboxGroup.length < 2) return;
  const deltaX = event.changedTouches[0].clientX - lightboxTouchX;
  lightboxTouchX = null;
  if (Math.abs(deltaX) > 40) showLightboxImage(lightboxIndex + (deltaX < 0 ? 1 : -1));
});
window.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft" && lightboxGroup.length > 1) showLightboxImage(lightboxIndex - 1);
  if (event.key === "ArrowRight" && lightboxGroup.length > 1) showLightboxImage(lightboxIndex + 1);
});

// Runs last so everything the card uses on open (ambience, music) is already defined.
if (params.get("open") === "1") {
  unlockCard({ instant: true });
}
