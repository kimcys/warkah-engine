// Couple's RSVP dashboard: live list of RSVPs, wishes and gift claims, with CSV export.
// Shared Warkah project: the couple signs in with Google; Firestore rules only let event owners read RSVPs.
// Legacy single-card projects (root collections) open without sign-in, as before.
const FIREBASE_VERSION = "12.15.0";
const DATA = JSON.parse(document.getElementById("warkah-admin").textContent);
const STORE = DATA.store || { mode: "local" };
const GIFTS = DATA.gifts || {};

const $ = (selector) => document.querySelector(selector);

let rsvps = [];
let wishes = [];
let claims = {};
let tab = "rsvp";

const toDate = (value) => (value && typeof value.toDate === "function" ? value.toDate() : null);
const formatTime = (value) => {
  const date = toDate(value);
  return date ? date.toLocaleString("ms-MY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
};

function renderStats() {
  const attending = rsvps.filter((rsvp) => rsvp.attendance !== "Tidak Hadir");
  $("#sGuests").textContent = attending.reduce((sum, rsvp) => sum + (Number.parseInt(rsvp.guests, 10) || 0), 0);
  $("#sYes").textContent = attending.length;
  $("#sNo").textContent = rsvps.length - attending.length;
  $("#sWishes").textContent = wishes.length;
}

function render() {
  const term = $("#q").value.trim().toLowerCase();
  const source = tab === "rsvp" ? rsvps : tab === "wishes" ? wishes : Object.entries(GIFTS).map(([id, title]) => ({ id, title, claimers: claims[id] || [] }));
  const rows = source.filter((row) => !term || String(row.name || row.title).toLowerCase().includes(term));
  const list = $("#list");
  list.innerHTML = "";
  $("#status").textContent = rows.length ? "" : (term ? "Tiada padanan." : "Belum ada data.");
  $("#status").hidden = rows.length > 0;

  rows.forEach((row) => {
    const item = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = tab === "gifts" ? row.title : row.name;
    item.append(name);

    if (tab === "gifts") {
      const pill = document.createElement("span");
      pill.className = `pill ${row.claimers.length ? "yes" : "no"}`;
      pill.textContent = row.claimers.length ? `Dipilih · ${row.claimers.length}` : "Belum dipilih";
      const who = document.createElement("small");
      who.textContent = row.claimers.map((claimer) => claimer.name).join(", ");
      item.append(pill, who);
    } else if (tab === "rsvp") {
      const pill = document.createElement("span");
      const attending = row.attendance !== "Tidak Hadir";
      pill.className = `pill ${attending ? "yes" : "no"}`;
      pill.textContent = attending ? `Hadir · ${row.guests}` : "Tidak hadir";
      const when = document.createElement("small");
      when.textContent = formatTime(row.submittedAt);
      item.append(pill, when);
    } else {
      const when = document.createElement("small");
      when.textContent = formatTime(row.createdAt);
      const message = document.createElement("p");
      message.textContent = row.message;
      item.append(when, message);
    }
    list.append(item);
  });
}

// Spreadsheet apps run text starting with = + - @ as formulas, so those cells are prefixed.
const csvCell = (value) => {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

$("#csv").addEventListener("click", () => {
  const lines = tab === "gifts"
    ? [["Hadiah", "Dipilih oleh", "Masa"], ...Object.entries(GIFTS).flatMap(([id, title]) => (claims[id]?.length ? claims[id].map((claimer) => [title, claimer.name, toDate(claimer.createdAt)?.toISOString() ?? ""]) : [[title, "", ""]]))]
    : tab === "rsvp"
      ? [["Nama", "Kehadiran", "Bilangan tetamu", "Masa"], ...rsvps.map((r) => [r.name, r.attendance, r.guests, toDate(r.submittedAt)?.toISOString() ?? ""])]
      : [["Nama", "Ucapan", "Masa"], ...wishes.map((w) => [w.name, w.message, toDate(w.createdAt)?.toISOString() ?? ""])];
  const blob = new Blob(["﻿" + lines.map((line) => line.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${tab === "rsvp" ? "rsvp" : tab === "wishes" ? "ucapan" : "hadiah"}-${DATA.slug}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
});

const setTab = (next) => {
  tab = next;
  $("#tabRsvp").setAttribute("aria-selected", String(next === "rsvp"));
  $("#tabWishes").setAttribute("aria-selected", String(next === "wishes"));
  $("#tabGifts")?.setAttribute("aria-selected", String(next === "gifts"));
  render();
};
$("#tabRsvp").addEventListener("click", () => setTab("rsvp"));
$("#tabWishes").addEventListener("click", () => setTab("wishes"));
$("#tabGifts")?.addEventListener("click", () => setTab("gifts"));
$("#q").addEventListener("input", render);

function showStatus(message) {
  $("#status").hidden = false;
  $("#status").textContent = message;
}

async function start() {
  if (STORE.mode !== "firebase" || !STORE.config?.apiKey) {
    $("#dashboard").hidden = false;
    showStatus("Kad contoh: data RSVP hanya disimpan pada telefon tetamu.");
    return;
  }

  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const [{ initializeApp }, firestore] = await Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-firestore.js`)
  ]);
  const { getFirestore, collection, onSnapshot, query, orderBy } = firestore;
  const app = initializeApp(STORE.config);
  const db = getFirestore(app);
  const path = (name) => (STORE.root ? `${STORE.root}/${name}` : name);

  const onError = (error) => {
    console.error(error);
    showStatus(error?.code === "permission-denied"
      ? "Akaun ini tiada akses ke senarai tetamu majlis ini. Hubungi Warkah untuk mendaftarkan e-mel anda."
      : "Tidak dapat memuatkan data. Cuba muat semula.");
  };

  const listen = () => {
    $("#dashboard").hidden = false;
    onSnapshot(query(collection(db, path("rsvps")), orderBy("submittedAt", "desc")), (snapshot) => {
      rsvps = snapshot.docs.map((doc) => doc.data());
      renderStats();
      render();
    }, onError);

    onSnapshot(query(collection(db, path("wishes")), orderBy("createdAt", "desc")), (snapshot) => {
      wishes = snapshot.docs.map((doc) => doc.data());
      renderStats();
      render();
    }, onError);

    if (DATA.features?.gifts) {
      onSnapshot(collection(db, path("gifts")), (snapshot) => {
        claims = {};
        snapshot.docs.forEach((item) => {
          const giftId = item.id.split("-")[0];
          (claims[giftId] ||= []).push(item.data());
        });
        Object.values(claims).forEach((list) => list.sort((first, second) => (toDate(first.createdAt)?.getTime() ?? 0) - (toDate(second.createdAt)?.getTime() ?? 0)));
        render();
      }, onError);
    }
  };

  // Legacy single-card projects keep their old open dashboard.
  if (!STORE.root) {
    listen();
    return;
  }

  const { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } = await import(`${base}/firebase-auth.js`);
  const auth = getAuth(app);
  let listening = false;

  $("#signinButton").addEventListener("click", async () => {
    $("#signinError").hidden = true;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error(error);
      $("#signinError").textContent = "Log masuk tidak berjaya. Sila cuba lagi.";
      $("#signinError").hidden = false;
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      $("#signin").hidden = false;
      $("#dashboard").hidden = true;
      return;
    }
    $("#signin").hidden = true;
    const who = $("#who");
    who.textContent = `Log masuk sebagai ${user.email} · `;
    const out = document.createElement("button");
    out.type = "button";
    out.textContent = "Log keluar";
    out.addEventListener("click", () => signOut(auth).then(() => window.location.reload()));
    who.append(out);
    who.hidden = false;
    if (!listening) {
      listening = true;
      listen();
    }
  });
}

start().catch((error) => {
  console.error(error);
  $("#dashboard").hidden = false;
  showStatus("Tidak dapat memuatkan data. Cuba muat semula.");
});
