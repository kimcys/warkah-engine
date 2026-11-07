// Links the customer pastes (Google Maps, Waze, a gift shop). Checked before they are saved; the card shows them as links, so they must be https.
// Returns { ok: true, url } (normalised: http is upgraded, a missing scheme is added) or { ok: false, problem } with a Malay sentence. Plain JavaScript.

const MAPS_HOSTS = ["maps.app.goo.gl", "goo.gl", "maps.google.com", "g.page"];
const WAZE_HOSTS = ["waze.com", "www.waze.com", "ul.waze.com"];
const GOOGLE = /(^|\.)google\.[a-z]{2,3}(\.[a-z]{2})?$/;

export function checkUrl(kind, input) {
  let text = String(input ?? "").trim();
  if (!text) return { ok: false, problem: "Sila tampal pautan." };
  if (text.length > 500) return { ok: false, problem: "Pautan terlalu panjang." };
  if (/^(javascript|data|vbscript|file|ftp):/i.test(text)) return { ok: false, problem: "Pautan mesti bermula dengan https://" };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) text = `https://${text}`;
  text = text.replace(/^http:\/\//i, "https://");
  let url;
  try { url = new URL(text); } catch { return { ok: false, problem: "Pautan ini tidak sah. Salin pautan penuh dari pelayar atau aplikasi." }; }
  if (url.protocol !== "https:") return { ok: false, problem: "Pautan mesti bermula dengan https://" };
  if (url.username || url.password) return { ok: false, problem: "Pautan tidak boleh mengandungi nama pengguna atau kata laluan." };
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || /^\d+(\.\d+){3}$/.test(host) || host === "localhost") return { ok: false, problem: "Pautan ini tidak sah." };
  if (kind === "maps") {
    const googleMaps = GOOGLE.test(host) && url.pathname.startsWith("/maps");
    const goo = host === "goo.gl" ? url.pathname.startsWith("/maps") : MAPS_HOSTS.includes(host);
    if (!googleMaps && !goo) return { ok: false, problem: "Ini bukan pautan Google Maps. Buka tempat itu di Google Maps, tekan Kongsi, kemudian salin pautan." };
  } else if (kind === "waze") {
    if (!WAZE_HOSTS.includes(host)) return { ok: false, problem: "Ini bukan pautan Waze. Buka tempat itu di Waze, tekan Kongsi, kemudian salin pautan." };
  }
  return { ok: true, url: url.toString() };
}
