/* ===== Shared: ভাষা, মেনু, ফুটার, লিড ফর্ম, WhatsApp চ্যাট, মাউস অ্যানিমেশন ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- storage ---------- */
const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

/* ---------- language ---------- */
let LANG = (() => { const q = new URLSearchParams(location.search).get("lang"); return q === "en" || q === "bn" ? q : store.get("bfs_lang", "bn"); })();
const isBn = () => LANG === "bn";
function t(key, vars) {
  const v = STR[key]; let s = v ? v[isBn() ? 0 : 1] : key;
  if (vars) for (const k in vars) s = s.split("{" + k + "}").join(vars[k]);
  return s;
}
const L = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x[LANG] ?? x.en : x ?? "");
const num = (n) => (isBn() ? String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]) : String(n));
/* সব অঙ্ক পূর্ণ সংখ্যায় — কোথাও দশমিক (.) দেখাবে না */
const money = (n) => num(Math.round(n).toLocaleString("en-US"));
const toBDT = (rm) => rm * CONFIG.myrToBdt;
const taka = (bdt) => "৳ " + num(Math.round(bdt).toLocaleString("en-IN"));
const lakh = taka;
const yrs = (y) => {
  const tm = Math.max(1, Math.round(y * 12)), Y = Math.floor(tm / 12), M = tm % 12;
  const part = (n, bn, en1, en) => (isBn() ? num(n) + " " + bn : n + " " + (n === 1 ? en1 : en));
  if (!Y) return part(M, "মাস", "month", "months");
  return part(Y, "বছর", "year", "years") + (M ? " " + part(M, "মাস", "month", "months") : "");
};
const LOGO_EXT = { taylors: "svg" };
const logoSrc = (id) => (String(id).startsWith("c-") ? "images/bfs-logo.png" : `images/logos/${id}.${LOGO_EXT[id] || "png"}`);   // CRM-এ যোগ করা university-র লোগো না থাকলে BFS লোগো
function applyLang() {
  document.documentElement.lang = LANG;
  $$("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $$("[data-i18n-ph]").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));
  $$("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  $$("[data-i18n-title]").forEach((el) => (el.title = t(el.dataset.i18nTitle)));
  $$(".lang-btn").forEach((b) => (b.textContent = isBn() ? "EN" : "BN"));
}
function setLang(l) { LANG = l; store.set("bfs_lang", l); applyLang(); document.dispatchEvent(new CustomEvent("bfs:lang")); }

/* ---------- icons (simple line icons) ---------- */
const ICONS = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>', doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>', home: '<path d="m3 11 9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>', family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 2.5-6 5-6s5 2 5 6M13 20c0-3 2-4.5 4-4.5s4 1.5 4 4.5"/>',
  plane: '<path d="M10 14 3 11l1-2 8 1 5-6c1-1 3-1 3 1l-5 6 1 8-2 1-3-7z"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>', hand: '<path d="M7 12V6a1.5 1.5 0 0 1 3 0v5M10 11V4.5a1.5 1.5 0 0 1 3 0V11M13 11V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7c-3 0-5-2-6.5-4L4 14a1.5 1.5 0 0 1 2.5-1.5L7 13"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>', puzzle: '<path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5c2.5.5 4 3 4 6.5"/>', briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>', map: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  check: '<path d="m5 12 5 5 9-10"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>', building: '<path d="M4 21V5l8-3 8 3v16M9 21v-5h6v5M8 8h2M14 8h2M8 12h2M14 12h2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', send: '<path d="m4 12 16-8-6 16-2-7z"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};
const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
const WA_SVG = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.7c-2 0-3.9-.5-5.6-1.5l-.4-.2-3.9 1 1-3.8-.3-.4A10.7 10.7 0 1 1 16 26.7zm5.9-8c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.8 8.8 0 0 1-4.3-3.8c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5 1.9.8 2.6.9 3.6.7.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.3z"/></svg>';

/* ---------- users ---------- */
const USERS = "bfs_users", CUR = "bfs_current";
/* ফোন নাম্বার সবসময় দেশের কোডসহ রাখা হয় (+8801XXXXXXXXX) — বিদেশ থেকেও নাম্বার দেওয়া যায় */
const COUNTRIES = [["880", "🇧🇩", "Bangladesh"], ["60", "🇲🇾", "Malaysia"], ["91", "🇮🇳", "India"], ["92", "🇵🇰", "Pakistan"], ["977", "🇳🇵", "Nepal"], ["94", "🇱🇰", "Sri Lanka"], ["975", "🇧🇹", "Bhutan"], ["95", "🇲🇲", "Myanmar"],
  ["966", "🇸🇦", "Saudi Arabia"], ["971", "🇦🇪", "UAE"], ["974", "🇶🇦", "Qatar"], ["968", "🇴🇲", "Oman"], ["965", "🇰🇼", "Kuwait"], ["973", "🇧🇭", "Bahrain"], ["962", "🇯🇴", "Jordan"], ["961", "🇱🇧", "Lebanon"],
  ["90", "🇹🇷", "Turkey"], ["20", "🇪🇬", "Egypt"], ["27", "🇿🇦", "South Africa"], ["234", "🇳🇬", "Nigeria"], ["254", "🇰🇪", "Kenya"], ["212", "🇲🇦", "Morocco"],
  ["65", "🇸🇬", "Singapore"], ["62", "🇮🇩", "Indonesia"], ["66", "🇹🇭", "Thailand"], ["84", "🇻🇳", "Vietnam"], ["63", "🇵🇭", "Philippines"], ["673", "🇧🇳", "Brunei"], ["86", "🇨🇳", "China"], ["852", "🇭🇰", "Hong Kong"],
  ["81", "🇯🇵", "Japan"], ["82", "🇰🇷", "South Korea"], ["886", "🇹🇼", "Taiwan"], ["61", "🇦🇺", "Australia"], ["64", "🇳🇿", "New Zealand"],
  ["44", "🇬🇧", "United Kingdom"], ["353", "🇮🇪", "Ireland"], ["49", "🇩🇪", "Germany"], ["33", "🇫🇷", "France"], ["39", "🇮🇹", "Italy"], ["34", "🇪🇸", "Spain"], ["351", "🇵🇹", "Portugal"], ["31", "🇳🇱", "Netherlands"],
  ["32", "🇧🇪", "Belgium"], ["41", "🇨🇭", "Switzerland"], ["43", "🇦🇹", "Austria"], ["46", "🇸🇪", "Sweden"], ["47", "🇳🇴", "Norway"], ["45", "🇩🇰", "Denmark"], ["358", "🇫🇮", "Finland"], ["48", "🇵🇱", "Poland"],
  ["30", "🇬🇷", "Greece"], ["40", "🇷🇴", "Romania"], ["7", "🇷🇺", "Russia"], ["1", "🇺🇸", "USA / Canada"], ["52", "🇲🇽", "Mexico"], ["55", "🇧🇷", "Brazil"]];
const ccInfo = (code) => COUNTRIES.find((c) => c[0] === code);
const ccOf = (e164) => COUNTRIES.map((c) => c[0]).sort((a, b) => b.length - a.length).find((c) => String(e164).startsWith("+" + c));
function normPhone(p) {
  const raw = String(p || "").trim(); let d = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) return "+" + d;
  if (d.startsWith("880")) return "+" + d;
  if (/^01\d{9}$/.test(d)) return "+880" + d.slice(1);
  if (/^1\d{9}$/.test(d)) return "+880" + d;
  return d;
}
function validPhone(p) { const n = normPhone(p); if (n.startsWith("+880")) return /^\+8801[3-9]\d{8}$/.test(n); return /^\+\d{8,15}$/.test(n); }
/* দেশের কোড + নাম্বারের ঘর — কোড টাইপ করা যায় (যেমন 971) বা দেশের নাম লিখে বাছা যায়; পতাকা নিজে বদলায় */
function phoneInput(id, value = "") {
  const n = normPhone(value), cc = (n.startsWith("+") && ccOf(n)) || "880", rest = n.startsWith("+" + cc) ? n.slice(cc.length + 1) : "";
  if (!$("#ccList")) document.body.insertAdjacentHTML("beforeend", `<datalist id="ccList">${COUNTRIES.map(([c, f, nm]) => `<option value="+${c}" label="${f} ${nm}">${f} ${nm}</option>`).join("")}</datalist>`);
  return `<div class="ph-in"><label class="cc-box" title="${esc(ccInfo(cc)?.[2] || "")}"><span class="cc-flag" id="${id}Flag">${ccInfo(cc)?.[1] || "🌐"}</span>` +
    `<input id="${id}Cc" class="cc-in" list="ccList" value="+${cc}" autocomplete="off" inputmode="tel" aria-label="country code"></label>` +
    `<input id="${id}" class="ph-num" type="tel" required autocomplete="tel-national" inputmode="tel" placeholder="${cc === "880" ? "1XXX-XXXXXX" : "XXXXXXXX"}" value="${esc(rest)}"></div>`;
}
const ccByName = (v) => { const q = String(v).trim().toLowerCase(); return q.length > 1 && /^[a-z .&/-]+$/.test(q) ? COUNTRIES.find((c) => c[2].toLowerCase().startsWith(q)) : null; };
function ccFix(inp, done) {   // কোডের ঘরে যা লেখা হলো, সেটা থেকে দেশ চিনে পতাকা বসানো (দেশের নাম লিখলে ঘর ছাড়ার পর কোড বসে)
  const v = inp.value.trim(), byName = ccByName(v);
  if (byName && done) inp.value = "+" + byName[0];
  const d = byName ? byName[0] : v.replace(/\D/g, ""), c = ccInfo(d), box = inp.closest(".ph-in");
  $(".cc-flag", box).textContent = c ? c[1] : "🌐"; inp.closest(".cc-box").title = c ? c[2] : "";
  $(".ph-num", box).placeholder = d === "880" ? "1XXX-XXXXXX" : "XXXXXXXX";
}
function readPhone(id) {
  const num = ($("#" + id).value || "").trim();
  if (num.startsWith("+") || /^00\d/.test(num)) return normPhone("+" + num.replace(/^\+|^00/, ""));   // পুরো নাম্বার কোডসহ লিখলে
  const ccv = $("#" + id + "Cc")?.value || "", cc = ccByName(ccv)?.[0] || ccv.replace(/\D/g, "") || "880"; let d = num.replace(/\D/g, "");
  if (d.startsWith(cc) && d.length > 10) d = d.slice(cc.length);   // কেউ কোডসহ লিখে ফেললে
  if (cc === "880") d = d.replace(/^0+/, "");
  return "+" + cc + d;
}
document.addEventListener("input", (e) => {
  if (e.target.matches?.(".cc-in")) ccFix(e.target);
  if (e.target.matches?.(".ph-num") && e.target.value.trim().startsWith("+")) {   // নাম্বারের ঘরে +কোড দিলে কোডের ঘরও বদলায়
    const n = normPhone(e.target.value), c = ccOf(n), cc = $(".cc-in", e.target.closest(".ph-in"));
    if (c && cc) { cc.value = "+" + c; ccFix(cc); }
  }
});
document.addEventListener("change", (e) => { if (e.target.matches?.(".cc-in")) ccFix(e.target, true); });
document.addEventListener("focusout", (e) => { if (e.target.matches?.(".cc-in")) ccFix(e.target, true); });
document.addEventListener("focusin", (e) => { if (e.target.matches?.(".cc-in")) e.target.select(); });
/* পুরনো/নতুন যেকোনো লেখা থেকে লেভেল-কী (ssc, hsc, diploma, bachelor, master) */
function eduKey(v) {
  const s = String(v || "").toLowerCase();
  if (EDU_LABEL[s]) return s;
  if (s.includes("ssc") || s.includes("o-level")) return "ssc";
  if (s.includes("hsc") || s.includes("a-level")) return "hsc";
  if (s.includes("diploma")) return "diploma";
  if (s.includes("bachelor")) return "bachelor";
  if (s.includes("master")) return "master";
  return "";
}
function getUser() { const ph = store.get(CUR); if (!ph) return null; return (store.get(USERS, {}))[ph] || null; }
/* প্রত্যেক স্টুডেন্টের আলাদা আইডি, যেমন BFS-2610-7K3Q */
function makeId() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", d = new Date(), r = new Uint32Array(4); (window.crypto || window.msCrypto).getRandomValues(r);
  return `BFS-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}-${[...r].map((x) => A[x % A.length]).join("")}`;
}
function saveUser(u) { if (!u.id && !window.BFSCRM) u.id = makeId(); const all = store.get(USERS, {}); all[u.phone] = u; store.set(USERS, all); store.set(CUR, u.phone); }
function updateUser(patch) { const u = getUser(); if (!u) return null; Object.assign(u, patch); saveUser(u); return u; }
function loginUser(name, phone, extra = {}) {
  const ph = normPhone(phone), all = store.get(USERS, {});
  const u = all[ph] || { phone: ph, created: new Date().toISOString(), saved: [], docs: {} };
  if (name) u.name = name.trim();
  Object.assign(u, extra); saveUser(u);
  if (!u.crm && window.BFSCRM) setTimeout(() => crmSync(extra.crmSource), 0);   // website-এ যেখানেই প্রোফাইল তৈরি হোক (ফর্ম, ড্যাশবোর্ড, বুকিং) — CRM-এ lead হয়
  return u;
}

/* ---------- লিড Google Sheet-এ পাঠানো ---------- */
function sendLead(type, data) {
  const row = { type, student_id: getUser()?.id || "", time: new Date().toLocaleString("en-GB"), page: location.pathname.split("/").pop() || "index.html", lang: LANG, ...data };
  if (!CONFIG.sheetUrl) return;
  try {
    const body = new URLSearchParams();
    Object.entries(row).forEach(([k, v]) => body.append(k, v == null ? "" : typeof v === "object" ? JSON.stringify(v) : v));
    fetch(CONFIG.sheetUrl, { method: "POST", mode: "no-cors", body }).catch(() => {});
  } catch {}
}
const waLink = (text) => `https://wa.me/${CONFIG.chatWhatsapp}?text=${encodeURIComponent(text)}`;
function toast(msg) {
  let el = $("#toast"); if (!el) { el = document.createElement("div"); el.id = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add("show"); clearTimeout(el._h); el._h = setTimeout(() => el.classList.remove("show"), 3000);
}

/* ---------- প্রোগ্রাম (সব ইউনিভার্সিটি একসাথে) ---------- */
const UNI = Object.fromEntries(UNIVERSITIES.map((u) => [u.id, u]));
const ALLPROGS = [];
UNIVERSITIES.forEach((u) => {
  (u.programs || []).forEach((p, i) => {
    const [lv, field, name, y, fee, feeMax] = p;
    ALLPROGS.push({ id: `${u.id}-${i}`, uni: u.id, lv, field, name, y, fee, feeMax, perYear: (feeMax ? (fee + feeMax) / 2 : fee) / Math.max(y, 1) });
  });
  if (!u.fields) u.fields = [...new Set((u.programs || []).map((p) => p[1]))].filter((f) => f !== "english");
});
const PROG = Object.fromEntries(ALLPROGS.map((p) => [p.id, p]));
function feeText(p) { return `RM ${money(p.fee)}${p.feeMax ? " – " + money(p.feeMax) : ""}`; }
const midFee = (p) => (p.feeMax ? (p.fee + p.feeMax) / 2 : p.fee);
const emgsOf = (uniId) => EMGS[uniId] || null;
/* একটা প্রোগ্রামের পুরো খরচের হিসাব (RM) */
function costOf(p) {
  const e = emgsOf(p.uni), emgsShown = e ? e.rm : CONFIG.emgsDefault, emgs = e?.inFee ? 0 : emgsShown, living = CONFIG.livingMonthly * 12;
  const tuition = midFee(p), firstTuition = p.y < 1 ? tuition : tuition / p.y;
  const renewEach = VISA_RENEW[p.uni] ?? VISA_RENEW.default, renewN = Math.max(0, Math.ceil(p.y) - 1), renew = renewEach * renewN;
  return { tuition, firstTuition, emgs, emgsShown, emgsKnown: !!e, living, renew, renewEach, renewN, first: firstTuition + emgs + living,
    full: tuition + emgs + renew + CONFIG.livingMonthly * Math.max(1, Math.round(p.y * 12)) };
}
function progCard(p, opts = {}) {
  const saved = (getUser()?.saved || []).includes(p.id), u = UNI[p.uni], c = costOf(p);
  return `<article class="prog tilt" data-prog="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)} — ${t("pc.see")}">
    <div class="prog-top"><span class="lv lv-${p.lv}">${L(LEVEL_NAME[p.lv])}</span>${/Credit Transfer|3\+0|4\+0/.test(p.name) ? `<span class="tag-ct">${t("unis.ct")}</span>` : ""}
      <button class="heart ${saved ? "on" : ""}" data-id="${p.id}" aria-label="save" aria-pressed="${saved}">${icon("heart")}</button></div>
    <h4>${esc(p.name)}</h4>
    ${opts.hideUni ? "" : `<p class="prog-uni"><span class="pu-logo"><img src="${logoSrc(u.id)}" alt="" loading="lazy"></span><b>${esc(u.name)}</b></p>`}
    <div class="prog-fee"><b>${feeText(p)}</b><span class="vary">${t("c.vary")}</span></div>
    <div class="prog-meta"><span>${icon("clock")} ${yrs(p.y)}</span><span>${t("pc.first")}: ≈ RM ${money(c.first)}</span></div>
    ${opts.fits ? `<div class="fit">${icon("check")} ${t("e.fits")}</div>` : ""}
    <span class="link-ask">${icon("calc")} ${t("pc.see")} ${icon("arrow")}</span>
  </article>`;
}

/* ---------- Eligibility হিসাব (Eligibility পেজ ও বুকিং পপআপ দুটোতেই) ---------- */
const HIGH = /MBBS|Medicine|Doctor of Medicine|Dental|Dentistry|DDS|Pharmacy/i;
function evaluate(inp) {
  const g5 = inp.scale === 5 ? inp.gpa : inp.gpa * 1.25, g4 = inp.scale === 4 ? inp.gpa : inp.gpa * 0.8;
  const tst = ENGLISH_TESTS[inp.eng], engOk = !!tst.medium || (tst.min != null && inp.score >= tst.min);
  const levels = [], notes = [];
  const add = (lv, why, tag = "ok") => levels.push({ lv, why, tag });
  switch (inp.edu) {
    case "ssc":
      add("F", g5 >= 3 ? "r.ssc1" : "r.ssc1m", g5 >= 3 ? "ok" : "maybe");
      if (g5 >= 2.5) add("D", "r.ssc2");
      add("C", "r.ssc3"); notes.push("r.sscN"); break;
    case "hsc":
      add("B", g5 >= 2.5 ? "r.hsc1" : "r.hsc1m", g5 >= 2.5 ? "ok" : "maybe");
      add("F", "r.hsc2"); add("D", "r.hsc3");
      if (inp.field === "medical") notes.push(inp.group === "science" && g5 >= 4 ? "r.med1" : "r.med2");
      break;
    case "diploma": add("B", g4 >= 2 ? "r.dip" : "r.dipm", g4 >= 2 ? "ok" : "maybe"); break;
    case "bachelor":
      if (g4 >= 2.5) add("M", "r.ba1"); else if (g4 >= 2) add("M", "r.ba2", "maybe"); else add("M", "r.ba3", "maybe");
      notes.push("r.baN"); break;
    case "master":
      add("P", g4 >= 3 ? "r.ma1" : "r.ma2", g4 >= 3 ? "ok" : "maybe"); add("M", "r.ma3"); break;
  }
  add("E", "r.eng", "extra");
  const hasB = levels.some((l) => l.lv === "B");
  if (hasB) notes.push(engOk ? ["r.engOk", { t: L(tst.label) }] : inp.edu === "hsc" ? "r.engNoHsc" : "r.engNo");
  notes.push("r.visa");

  const lvSet = levels.filter((l) => l.tag !== "extra").map((l) => l.lv), budget = inp.budget >= 1000 ? inp.budget : (inp.budget * 100000) / CONFIG.myrToBdt;
  let progs = ALLPROGS.filter((p) => lvSet.includes(p.lv) && (inp.field === "any" || p.field === inp.field));
  if (inp.edu === "hsc" && !(inp.group === "science" && g5 >= 4)) progs = progs.filter((p) => !(p.lv === "B" && HIGH.test(p.name)));
  if (inp.group !== "science" && ["ssc", "hsc"].includes(inp.edu)) progs = progs.filter((p) => !(["medical", "engineering"].includes(p.field) && p.lv === "B") && !/Foundation in Science|A-Level/.test(p.name));
  progs = progs.map((p) => ({ ...p, fits: p.perYear <= budget })).sort((a, b) => (b.fits - a.fits) || a.perYear - b.perYear);
  // বিভিন্ন ইউনিভার্সিটি থেকে মিশিয়ে দেখানো
  const pick = [], seen = {};
  for (let round = 0; pick.length < 9 && round < 6; round++) progs.forEach((p) => { if (pick.length < 9 && (seen[p.uni] || 0) === round && !pick.includes(p)) { pick.push(p); seen[p.uni] = round + 1; } });
  let score = 45 + Math.min(25, (g5 / 5) * 25) + (engOk ? 15 : 6) + (progs.some((p) => p.fits) ? 15 : 5);
  if (levels.every((l) => l.tag !== "ok")) score -= 15;
  score = Math.max(35, Math.min(98, Math.round(score)));
  return { levels, notes, progs: pick, all: progs, total: progs.length, score };
}

/* লাইভ EMGS আনা — দিনে একবার নতুন করে আনে, আনার পর পেজ আবার আঁকে */
function refreshLiveEmgs() {
  if (!CONFIG.sheetUrl) return;
  let cached = null; try { cached = JSON.parse(localStorage.getItem(EMGS_LIVE_KEY) || "null"); } catch {}
  if (cached && Date.now() - cached.at < 6 * 3600e3) return;
  fetch(CONFIG.sheetUrl + "?action=emgs").then((r) => r.json()).then((d) => {
    if (!d || d.ok === false) return;
    try { localStorage.setItem(EMGS_LIVE_KEY, JSON.stringify({ at: Date.now(), d: d.emgs })); } catch {}
    if (applyLiveEmgs(d.emgs)) document.dispatchEvent(new Event("bfs:lang"));
  }).catch(() => {});
}
const liveNote = (e) => e?.live ? ` · ${isBn() ? "লাইভ আপডেট" : "live"}${typeof e.live === "string" ? " " + e.live : ""}` : "";

/* ফি-সূত্রের পাশে ইউনিভার্সিটির অফিশিয়াল সাইটের ছোট্ট লিংক — সাধারণ ভিজিটরের চোখে পড়ে না */
const srcRef = (id) => UNI_SITE[id] ? `<a class="ref" href="${UNI_SITE[id]}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">°</a>` : "";

const emgsRef = (e) => e?.url ? `<a class="ref" href="${e.url}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">°</a>` : "";

/* ---------- প্রোগ্রামের খরচের পপআপ ---------- */
function openProgram(id) {
  const p = PROG[id]; if (!p) return;
  const u = UNI[p.uni], c = costOf(p), e = emgsOf(p.uni);
  let m = $("#pcModal");
  if (!m) { m = document.createElement("div"); m.id = "pcModal"; m.className = "modal pc-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); document.body.appendChild(m);
    m.addEventListener("click", (ev) => { if (ev.target === m || ev.target.closest("[data-pc-close]")) closeProgram(); });
    document.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && !m.hidden) closeProgram(); });
    bindSave(m); }
  const saved = (getUser()?.saved || []).includes(p.id);
  const row = (k, rm, note = "") => `<div class="pc-row"><span>${k}${note ? ` <em>${note}</em>` : ""}</span><b>RM ${money(rm)}</b></div>`;
  m.innerHTML = `<div class="modal-box pc-box">
    <div class="m-head"><div class="m-logo"><img src="${logoSrc(u.id)}" alt=""></div>
      <div><p style="margin:0 0 2px"><span class="lv lv-${p.lv}">${L(LEVEL_NAME[p.lv])}</span></p><h2>${esc(p.name)}</h2><p>${esc(u.name)} · ${icon("map")} ${esc(u.city)}</p></div>
      <button class="m-x" data-pc-close aria-label="${t("c.close")}">${icon("x")}</button></div>
    <div class="m-body">
      <div class="pc-facts"><div><small>${t("pc.dur")}</small><b>${yrs(p.y)}</b></div><div><small>${t("pc.tuition")}</small><b>${feeText(p)}</b></div><div><small>${esc(L(FIELDS[p.field]))}</small><b>${t(u.type === "public" ? "m.public" : "m.private")}</b></div></div>
      <div class="pc-table">
        ${row(t("pc.perYear"), c.firstTuition)}
        ${e?.inFee ? `<div class="pc-row"><span>${t("pc.emgs")} <em>${t("pc.inFee")}</em></span><b>RM ${money(c.emgsShown)}</b></div>` : row(t("pc.emgs"), c.emgs, e ? "" : t("pc.approx"))}
        ${row(t("pc.living"), c.living, t("pc.approx"))}
        ${c.renewN ? row(t("pc.renew", { n: num(c.renewN), e: money(c.renewEach) }), c.renew, t("pc.later")) : ""}
        <div class="pc-row pc-total"><span>${t("pc.first")}</span><b>RM ${money(c.first)}</b></div>
        <div class="pc-row pc-total2"><span>${t("pc.full")}</span><b>RM ${money(c.full)}</b></div>
      </div>
      <div class="vary-note">${icon("spark")}<span>${t("pc.note")}${srcRef(u.id)}${e ? " · EMGS: " + esc(L(e.src)) + liveNote(e) + emgsRef(e) : ""}</span></div>
      <div class="m-cta">
        <a class="btn btn-primary" href="visit.html?prog=${p.id}">${icon("calendar")} ${t("pc.book")}</a>
        <button class="btn btn-line heart-btn heart ${saved ? "on" : ""}" data-id="${p.id}" aria-pressed="${saved}">${icon("heart")} ${isBn() ? "সেভ" : "Save"}</button>
        <a class="btn btn-line" href="universities.html#${u.id}">${icon("building")} ${t("pc.uni")}</a>
        <a class="btn btn-line" target="_blank" rel="noopener" href="${waLink(t("c.askMsg", { p: p.name, u: u.name }))}">${icon("chat")} ${t("m.wa")}</a>
      </div>
    </div></div>`;
  m.hidden = false; document.body.classList.add("locked");
  $("[data-pc-close]", m).focus();
}
function closeProgram() { const m = $("#pcModal"); if (m) m.hidden = true; if (!$(".modal:not([hidden]):not(#pcModal)")) document.body.classList.remove("locked"); }
document.addEventListener("click", (e) => {
  if (e.target.closest(".heart,a,button:not([data-prog])")) return;
  const el = e.target.closest("[data-prog]"); if (el) openProgram(el.dataset.prog);
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches?.("[data-prog]")) openProgram(e.target.dataset.prog); });

/* ---------- সার্চ (ইউনিভার্সিটি + প্রোগ্রাম) ---------- */
function openSearch() {
  let s = $("#searchOv");
  if (!s) {
    s = document.createElement("div"); s.id = "searchOv"; s.className = "modal search-ov"; s.setAttribute("role", "dialog"); s.setAttribute("aria-modal", "true");
    s.innerHTML = `<div class="modal-box search-box"><div class="search-top">${icon("search")}<input id="sq" type="search" autocomplete="off" aria-label="search"><button class="m-x" data-s-close aria-label="close">${icon("x")}</button></div><div id="sres" class="sres"></div></div>`;
    document.body.appendChild(s);
    s.addEventListener("click", (e) => { if (e.target === s || e.target.closest("[data-s-close]")) closeSearch(); if (e.target.closest("[data-prog]")) closeSearch(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !s.hidden) closeSearch(); });
    $("#sq").addEventListener("input", drawSearch);
  }
  $("#sq").placeholder = t("s.ph");
  s.hidden = false; document.body.classList.add("locked"); drawSearch(); setTimeout(() => $("#sq").focus(), 30);
}
function closeSearch() { const s = $("#searchOv"); if (s) s.hidden = true; if (!$(".modal:not([hidden])")) document.body.classList.remove("locked"); }
function drawSearch() {
  const q = $("#sq").value.toLowerCase().trim(), box = $("#sres");
  if (!q) { box.innerHTML = `<p class="muted s-hint">${t("s.hint")}</p>`; return; }
  const words = q.split(/\s+/);
  const hit = (txt) => words.every((w) => txt.toLowerCase().includes(w));
  const unis = UNIVERSITIES.filter((u) => hit(u.name + " " + u.city + " " + u.id)).slice(0, 6);
  const progs = ALLPROGS.filter((p) => hit(p.name + " " + UNI[p.uni].name + " " + L(FIELDS[p.field]))).slice(0, 12);
  box.innerHTML = (unis.length ? `<h4>${t("s.unis")}</h4>` + unis.map((u) => `<a class="s-uni" href="universities.html#${u.id}"><img src="${logoSrc(u.id)}" alt=""><span><b>${esc(u.name)}</b><small>${esc(u.city)}</small></span>${icon("arrow")}</a>`).join("") : "") +
    (progs.length ? `<h4>${t("s.progs")}</h4>` + progs.map((p) => `<div class="s-prog" data-prog="${p.id}" role="button" tabindex="0"><span><b>${esc(p.name)}</b><small>${esc(UNI[p.uni].name)} · ${L(LEVEL_NAME[p.lv])} · ${yrs(p.y)}</small></span><em>${feeText(p)}</em></div>`).join("") : "") ||
    `<p class="muted s-hint">${t("s.none")}</p>`;
}

function bindSave(root) {
  root.addEventListener("click", (e) => {
    const h = e.target.closest(".heart"); if (!h) return;
    const u = getUser(); if (!u) return needUser(() => h.click());
    const s = new Set(u.saved || []), id = h.dataset.id;
    s.has(id) ? s.delete(id) : s.add(id);
    updateUser({ saved: [...s] });
    $$(`.heart[data-id="${id}"]`).forEach((x) => { x.classList.toggle("on", s.has(id)); x.setAttribute("aria-pressed", s.has(id)); });
    toast(s.has(id) ? t("c.saved") : t("c.unsaved"));
  });
}

/* ---------- header / footer ---------- */
const NAV = [["index.html", "nav.home"], ["universities.html", "nav.unis"], ["eligibility.html", "nav.elig"], ["cost.html", "nav.cost"], ["about.html", "nav.about"]];
function buildChrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const h = $("#site-header");
  if (h) h.innerHTML = `
    <div class="wrap nav-in">
      <a href="index.html" class="logo" aria-label="Bright Future by Sam"><img src="images/bfs-logo.png" alt="BFS" width="58" height="37"><span><b>Bright Future</b><small>by Sam</small></span></a>
      <nav class="links" id="links">${NAV.map(([href, k]) => `<a href="${href}" class="${href === here ? "on" : ""}" data-i18n="${k}"></a>`).join("")}
        <a href="dashboard.html" class="nav-dash ${here === "dashboard.html" ? "on" : ""}" data-i18n-title="nav.dash" aria-label="Dashboard">${icon("user")}<span class="dash-txt" data-i18n="nav.dash"></span></a></nav>
      <button class="search-btn" type="button" id="searchBtn" aria-label="search">${icon("search")}<span data-i18n="s.btn"></span></button>
      <button class="lang-btn" type="button" aria-label="Language"></button>
      <a href="visit.html" class="btn btn-primary nav-cta">${icon("calendar")}<span data-i18n="nav.book"></span></a>
      <button class="burger" id="burger" aria-label="menu" aria-expanded="false">${icon("menu")}</button>
    </div>`;
  const f = $("#site-footer");
  if (f) f.innerHTML = `
    <div class="wrap foot-in">
      <div class="foot-brand"><img src="images/bfs-logo-white.png" alt="BFS" width="70" height="44"><p data-i18n="foot.tag"></p></div>
      <div><h4 data-i18n="foot.explore"></h4>${NAV.map(([href, k]) => `<a href="${href}" data-i18n="${k}"></a>`).join("")}<a href="visit.html" data-i18n="nav.book"></a><a href="dashboard.html" data-i18n="nav.dash"></a></div>
      <div><h4 data-i18n="foot.contact"></h4>${mapCard()}${CONFIG.phoneDisplay.map((p) => `<a href="tel:${p.replace(/[^+\d]/g, "")}">${icon("phone")} ${p}</a>`).join("")}
        <a href="${waLink("")}" target="_blank" rel="noopener">${icon("chat")} <span data-i18n="foot.chat"></span>: ${CONFIG.chatDisplay}</a></div>
    </div>
    <p class="foot-note">© ${new Date().getFullYear()} Bright Future by Sam · <span data-i18n="foot.note"></span> · <a href="staff.html" class="staff-link" data-i18n="foot.staff"></a></p>`;
  const fillAddr = () => $$(".addr").forEach((a) => (a.textContent = L(CONFIG.address)));
  fillAddr(); document.addEventListener("bfs:lang", fillAddr);
  $$(".lang-btn").forEach((b) => b.addEventListener("click", () => setLang(isBn() ? "en" : "bn")));
  $("#searchBtn")?.addEventListener("click", openSearch);
  document.addEventListener("keydown", (e) => { if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); } });
  const bg = $("#burger");
  if (bg) bg.onclick = () => { const o = $("#links").classList.toggle("open"); bg.setAttribute("aria-expanded", o); };
  const hdr = $("#site-header");
  const onScroll = () => hdr && hdr.classList.toggle("scrolled", scrollY > 10);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
}

/* অফিসের ঠিকানার পাশে ছোট Google Map — চাপলে Google Maps খুলবে */
const mapUrl = () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONFIG.mapQuery)}`;
function mapCard() {
  return `<a class="map-card" href="${mapUrl()}" target="_blank" rel="noopener" aria-label="Google Maps">
    <span class="map-thumb"><iframe src="https://www.google.com/maps?q=${encodeURIComponent(CONFIG.mapQuery)}&z=16&output=embed" loading="lazy" tabindex="-1" aria-hidden="true" title="map"></iframe><b>${icon("map")}</b></span>
    <span class="map-txt"><span class="addr"></span><em data-i18n="map.open"></em></span></a>`;
}

/* নতুন স্টুডেন্টকে স্টাফ পোর্টালের ডেটাবেসে (Firebase) তোলা — Firebase সেটআপ না থাকলে কিছুই করে না */
function fbLead(u, source) {
  const c = window.FIREBASE_CONFIG || {}, emu = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && sessionStorage.getItem("bfs_emu") === "1";
  const pid = emu ? "demo-bfs" : c.projectId, ph = normPhone(u?.phone);
  if (!pid || !u?.id || !validPhone(ph)) return;
  const cc = COUNTRIES.map((x) => x[0]).sort((a, b) => b.length - a.length).find((x) => ph.startsWith("+" + x)), country = (COUNTRIES.find((x) => x[0] === cc) || [])[2] || "";
  const S = (v) => ({ stringValue: String(v || "") }), now = { timestampValue: new Date().toISOString() };
  const url = `${emu ? "http://127.0.0.1:8080" : "https://firestore.googleapis.com"}/v1/projects/${pid}/databases/(default)/documents/students?documentId=${encodeURIComponent(u.id)}${emu ? "" : "&key=" + encodeURIComponent(c.apiKey)}`;
  try { fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: { id: S(u.id), name: S(u.name), phone: S(ph), country: S(country), edu: S(u.eduLevel), source: S(source), stage: S("lead"), ownerUid: { nullValue: null }, createdAt: now, updatedAt: now } }) }).catch(() => {}); } catch {}
}

/* ---------- CRM-এর সাথে মিল: website-এর Student ID = CRM-এর Student ID (যেমন BFS1001) ----------
   একই ফোন নাম্বারে CRM-এ আগে থেকে রেকর্ড থাকলে সেই ID-টাই আসে, নতুন রেকর্ড হয় না। সংযোগ না পেলে পরের পেজে আবার চেষ্টা হয়। */
function crmSync(source) {      // একসাথে দুবার ডাকলেও একটাই অনুরোধ যায়, তাই ডবল রেকর্ড হয় না
  if (!crmSync.p) crmSync.p = crmSyncNow(source).finally(() => { crmSync.p = null; });
  return crmSync.p;
}
async function crmSyncNow(source) {
  const u = getUser(); if (!u || !window.BFSCRM || u.crm) return u;
  try {
    const r = await Promise.race([BFSCRM.lead({ name: u.name, phone: u.phone, edu: EDU_LABEL[eduKey(u.eduLevel)] || u.eduLevel || "", source: source || "Website" }), new Promise((_, no) => setTimeout(() => no(new Error("timeout")), 7000))]);
    if (r && r.sid) { const patch = { id: r.sid, crm: true }; if (r.pin) patch.pin = r.pin; const nu = updateUser(patch); BFSCRM.remember(nu.id, nu.pin); }
  } catch (e) { console.warn("CRM sync failed — will retry on the next page", e); }
  return getUser();
}
/* ফর্মটা প্রথমেই আসে না: হোম পেজে একটু স্ক্রল করলে বা কিছুতে ক্লিক করলে আসে; অন্য পেজ খুললে সাথে সাথে।
   কোণার ✕ দিয়ে skip করলে: যেকোনো পেজ খোলা আর স্ক্রল করা যায়, কিন্তু Quiz, Eligibility, খরচ হিসাব, বুকিং — কোনো কাজ করতে গেলে ফর্মটা আবার আসে */
const GATE_SKIP = "bfs_gate_skip";
const gateSkipped = () => { try { return sessionStorage.getItem(GATE_SKIP) === "1"; } catch { return false; } };
function gateWatch() {
  const home = /index\.html$|\/$/.test(location.pathname), open = (then) => { if (!getUser()) needUser(then); };
  if (!home && !gateSkipped()) setTimeout(open, 600);
  const onScroll = () => { if (scrollY > 200) { removeEventListener("scroll", onScroll); if (!gateSkipped()) open(); } };
  if (home) addEventListener("scroll", onScroll, { passive: true });
  /* skip করার পর ফর্মের ঘরে (খরচ হিসাব, খোঁজা ইত্যাদি) হাত দিলে */
  document.addEventListener("focusin", (e) => {
    if (getUser() || !gateSkipped() || $("#gate") || e.target.closest("#gate, header, .links, footer")) return;
    if (e.target.matches("input, select, textarea")) { e.target.blur(); open(); }
  }, true);
  document.addEventListener("click", (e) => {
    if (getUser() || e.target.closest("#gate")) return;
    const el = e.target.closest("a, button, [role=button], [data-prog], .ss");
    if (!el || el.matches('.lang-btn, .staff-link, [href^="staff.html"], [href^="dashboard.html"], [href^="apply.html"]')) return;
    if (gateSkipped()) {     // শুধু ঘুরে দেখা চলবে: অন্য পেজের লিংক, মেনু, স্ক্রল
      const href = el.tagName === "A" ? el.getAttribute("href") || "" : "";
      if (el.closest("header, .links, footer, #burger, #searchBtn") || (href && !href.startsWith("#") && !/^javascript:/i.test(href) && !el.hasAttribute("data-prog"))) return;
    }
    e.preventDefault(); e.stopPropagation();
    open(() => { if (el.tagName === "A" && el.getAttribute("href")) location.href = el.href; else el.click(); });   // ফর্ম দিলে যা করতে যাচ্ছিল সেটাই হয়
  }, true);
}

/* ---------- নাম + ফোন: প্রথমেই না, স্টুডেন্ট কোনো কাজ করতে গেলে তখন ---------- */
function needUser(then) { if (getUser()) return then && then(); if (!$("#gate")) buildGate(then); }
function buildGate(then) {
  const g = document.createElement("div");
  g.className = "gate"; g.id = "gate";
  g.innerHTML = `
    <div class="gate-box" role="dialog" aria-modal="true" aria-labelledby="gateT">
      <div class="gate-top"><button class="gate-x" type="button" aria-label="Close">✕</button><img src="images/bfs-logo-white.png" alt="BFS" width="84" height="53"><h2 id="gateT" data-i18n="gate.title"></h2><p data-i18n="gate.text"></p>
        <button class="lang-btn gate-lang" type="button"></button></div>
      <form id="gateForm" novalidate>
        <label class="fld"><span data-i18n="gate.name"></span><input id="gName" required autocomplete="name" data-i18n-ph="gate.namePh"></label>
        <label class="fld"><span data-i18n="gate.phone"></span>${phoneInput("gPhone")}</label>
        <label class="fld"><span data-i18n="gate.edu"></span>
          <select id="gEdu"><option value="" data-i18n="gate.pick"></option>${Object.entries(EDU_LABEL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}<option value="parent" data-i18n="gate.parent"></option></select></label>
        <p class="err" id="gErr" role="alert"></p>
        <button class="btn btn-primary btn-lg wide" type="submit">${icon("arrow")}<span data-i18n="gate.btn"></span></button>
        <p class="mini muted center" data-i18n="gate.privacy"></p>
        ${window.BFSCRM ? `<p class="mini center" style="margin:10px 0 0"><a href="dashboard.html" data-i18n="gate.have"></a></p>` : ""}
      </form>
    </div>`;
  document.body.appendChild(g);
  document.body.classList.add("locked");
  applyLang();
  $(".gate-lang", g).addEventListener("click", () => setLang(isBn() ? "en" : "bn"));
  setTimeout(() => $("#gName").focus(), 300);
  const close = () => { g.classList.add("bye"); document.body.classList.remove("locked"); setTimeout(() => g.remove(), 400); };
  /* ✕ = শুধু ঘুরে দেখা (skip)। কোনো কাজ করতে গেলে gateWatch/needUser ফর্মটা আবার খোলে */
  $(".gate-x", g).addEventListener("click", () => { try { sessionStorage.setItem(GATE_SKIP, "1"); } catch {} close(); toast(t("gate.skipped")); });
  $("#gateForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#gName").value.trim(), phone = readPhone("gPhone"), edu = $("#gEdu").value;
    if (name.length < 2) return ($("#gErr").textContent = t("err.name"));
    if (!validPhone(phone)) return ($("#gErr").textContent = t("err.phone"));
    if (!edu) return ($("#gErr").textContent = t("err.edu"));
    const u = loginUser(name, phone, { eduLevel: edu });
    close();
    crmSync("Website").then((cu) => {      // আগে CRM থেকে ID, তারপর Sheet-এ — যাতে সব জায়গায় একই ID যায়
      sendLead("new_visitor", { name: cu.name, phone: cu.phone, education: edu }); fbLead(cu, "website");
      toast(t("gate.thanks", { n: cu.name.split(" ")[0] }) + (cu.id ? ` · ID: ${cu.id}` : ""));
    });
    document.dispatchEvent(new CustomEvent("bfs:login"));
    if (then) setTimeout(then, 450);   // যে কাজটা করতে যাচ্ছিল, সেটা চালিয়ে যায়
  });
}

/* ---------- ওয়েবসাইটের ভেতরে লাইভ চ্যাট: আগে অ্যাসিস্ট্যান্ট উত্তর দেয়, পরে কাউন্সেলর চালিয়ে যান ---------- */
const CHAT_KEY = "bfs_chat";
const UNI_ALIAS = { segi: ["segi"], inti: ["inti"], um: ["malaya", "universiti malaya", "university of malaya"], city: ["city university", "city uni"], apu: ["apu", "asia pacific"],
  taylors: ["taylor"], lsbf: ["lsbf"], cyberjaya: ["cyberjaya"], nottingham: ["nottingham"], klust: ["klust"], genovasi: ["genovasi"], unitar: ["unitar"], uow: ["uow", "wollongong"],
  bac: ["brickfields", "bac"], unikl: ["unikl"], lincoln: ["lincoln"], unirazak: ["unirazak", "razak"], maiwp: ["maiwp", "ucmi"], kings: ["kings"], alfa: ["alfa"], ucsi: ["ucsi"],
  mahsa: ["mahsa"], icms: ["icms"], nilai: ["nilai"] };
const PTOK_ALL = () => PTOK_ALL.s || (PTOK_ALL.s = new Set(ALLPROGS.flatMap((p) => p.name.toLowerCase().match(/[a-z]{3,}/g) || [])));
const STOP = new Set(("the and for with in of a an to is i me my what how much do does can about want need course program programme degree university fee fees cost " +
  "part time job work kora jabe koto ache ase kivabe kobe hobe ami amar apnar tumi chai jante bolen plz please hostel intake visa ielts office cheap lowest budget lakh lac ringgit taka diye kothay porte pora parbo").split(" "));
/* বাংলায় লেখা বিষয়কে ইংরেজি শব্দে বদলে নেয়, যাতে প্রোগ্রাম খোঁজা যায় */
const BN_WORDS = [[/নার্সিং|নার্স/, "nursing"], [/এমবিএ/, "mba"], [/বিবিএ/, "business administration"], [/কম্পিউটার|সিএসই|সিএস/, "computer"], [/আইটি/, "information technology"],
  [/এমবিবিএস|ডাক্তার|মেডিকেল|মেডিসিন/, "medicine"], [/ডেন্টাল|ডেন্টিস্ট/, "dental"], [/ফার্মেসি/, "pharmacy"], [/ইঞ্জিনিয়ারিং|ইঞ্জিনিয়ার/, "engineering"],
  [/বিজনেস|ব্যবসা/, "business"], [/হোটেল|ট্যুরিজম|হসপিটালিটি/, "hospitality"], [/আইন|ল পড়/, "law"], [/সাইকোলজি|মনোবিজ্ঞান/, "psychology"], [/ডিজাইন/, "design"],
  [/অ্যাকাউন্টিং|একাউন্টিং|হিসাববিজ্ঞান/, "accounting"], [/আর্কিটেকচার|স্থাপত্য/, "architecture"], [/এডুকেশন|শিক্ষা/, "education"], [/সাইবার/, "cyber"], [/ফাইন্যান্স/, "finance"]];
function budgetRM(s) {
  const m = s.match(/(\d[\d,.]*)\s*(k|হাজার|thousand)?\s*(rm|রিংগিত|ringgit)/i) || s.match(/(rm|রিংগিত)\s*(\d[\d,.]*)\s*(k|হাজার)?/i);
  if (m) { const n = parseFloat((m[1].match(/\d/) ? m[1] : m[2]).replace(/,/g, "")), k = /k|হাজার|thousand/i.test(m[0]); return n * (k ? 1000 : 1); }
  const l = s.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|লাখ|লক্ষ)/i);
  if (l) return (parseFloat(l[1]) * 100000) / CONFIG.myrToBdt;
  return 0;
}
/* স্টুডেন্টরা যেভাবে ছোট করে বা বাংলিশে লেখে (pp, dam koto, koto taka…) — সেগুলোকে চেনা শব্দে বদলে নেয় */
const SHORT_WORDS = [
  [/(^|\W)(p\.?p|per\s*price|price|prc|dam|daam|rate)(\W|$)|দাম|কত\s*টাকা|koto\s*t(a|k)ka?|khoro?c?h|khoros|kharach|kosto|fee\s*koto|fi\s*koto|tuition|টিউশন/i, "cost"],
  [/(^|\W)(visa|vissa|visha|vsa)(\W|$)/i, "visa"],
  [/(^|\W)(aielts|ilts|ielt|english\s*test)(\W|$)/i, "ielts"],
  [/scholar|sclr|sclrship|waiver|discount|chhar|char\s*ase/i, "scholar"],
  [/(^|\W)(thakar|thaka|basa|bash?a\s*bhara|room\s*rent|vara|bhara)(\W|$)/i, "hostel"],
  [/(^|\W)(kaj|kam|chakri|chakuri|part\s*time|pt\s*job)(\W|$)/i, "job"],
  [/(^|\W)(vorti|bhorti|admission|session|kobe\s*shuru)(\W|$)/i, "intake"],
  [/(^|\W)(ofis|offc|thikana|location|kothay\s*apnara|kothai)(\W|$)/i, "office"],
  [/(^|\W)(docs?|kagoj|kagoj\s*potro|papers?|certificate)(\W|$)/i, "document"],
  [/bank\s*state|(^|\W)bs(\W|$)|ব্যাংক|ব্যাঙ্ক|solvency/i, "bankstatement"],
];
/* টাইপ করা প্রশ্ন CHAT_QA-র কোন প্রশ্নের সাথে সবচেয়ে বেশি মেলে */
function qaMatch(text) {
  const toks = (x) => x.toLowerCase().replace(/[?,.!—()/।]/g, " ").split(/\s+/).filter((w) => w.length > 2);
  const mine = new Set(toks(text)); let best = null, top = 0;
  CHAT_QA.forEach((q) => { const n = new Set(toks(q.q.bn + " " + q.q.en)); let hit = 0; n.forEach((w) => mine.has(w) && hit++); if (hit > top) { top = hit; best = q; } });
  return top >= 2 ? best : null;
}
function botReply(text) {
  const original = text;
  const bnDigits = text.replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d));
  let extra = ""; BN_WORDS.forEach(([re, w]) => { if (re.test(bnDigits)) extra += " " + w; });
  SHORT_WORDS.forEach(([re, w]) => { if (re.test(bnDigits)) extra += " " + w; });
  text = bnDigits + extra;
  const s = " " + text.toLowerCase() + " ", out = [];
  const has = (re) => re.test(s);
  if (has(/counsel|কাউন্সেল|human|agent|মানুষের সাথে|কথা বলব/)) return { handoff: true };
  const uniHits = Object.entries(UNI_ALIAS).filter(([, al]) => al.some((a) => new RegExp("[^a-z]" + a.replace(/ /g, "\\s+") + "[^a-z]").test(s))).map(([id]) => UNI[id]).filter(Boolean);
  uniHits.slice(0, 2).forEach((u) => {
    const ps = ALLPROGS.filter((p) => p.uni === u.id), e = emgsOf(u.id);
    out.push(ps.length ? t("lc.uni", { u: u.name, c: u.city, n: num(ps.length), a: money(Math.min(...ps.map((p) => p.fee))), b: money(Math.max(...ps.map((p) => p.feeMax || p.fee))), e: money(e ? e.rm : CONFIG.emgsDefault) })
      : t("lc.uniNoFee", { u: u.name, c: u.city, d: L(u.about) }));
    out.push(`<a class="chat-link" href="universities.html#${u.id}">${t("unis.view")} →</a>`);
  });
  const topics = [[/ielts|english|ইংরেজি|ইংলিশ|pte|toefl|duolingo|linguaskill/, "lc.ielts"], [/visa|ভিসা/, "lc.visa"], [/document|ডকুমেন্ট|কাগজ|পেপার|সার্টিফিকেট/, "lc.docs"],
    [/scholar|স্কলার|ছাড়|discount/, "lc.scholar"], [/office|অফিস|address|ঠিকানা|location|where is your/, "lc.office"], [/eligib|যোগ্য|এলিজিবল|সুযোগ পাব|পারব/, "lc.elig"],
    [/thank|ধন্যবাদ|thanks/, "lc.thanks"], [/^\s*(hi|hello|hey|salam|assalam)|সালাম|আসসালামু|হ্যালো|হাই/, "lc.hi"], [/job|work|part.?time|কাজ|চাকরি|জব/, "lc.job"],
    [/hostel|accommodation|room|থাকা|বাসা|রুম|হোস্টেল/, "lc.room"], [/bankstatement|bank statement|ব্যাংক স্টেটমেন্ট/, "lc.bank"], [/intake|session|semester|কখন ভর্তি|ইনটেক|সেশন|কবে/, "lc.intake"], [/gap|গ্যাপ|বিরতি/, "lc.gap"],
    [/spouse|wife|husband|family|বউ|স্ত্রী|স্বামী|পরিবার/, "lc.spouse"], [/credit transfer|ক্রেডিট|transfer|uk|usa|australia|canada/, "lc.ct"],
    [/foundation|diploma|ফাউন্ডেশন|ডিপ্লোমা|ssc/, "lc.fd"], [/age|বয়স/, "lc.age"]];
  topics.forEach(([re, k]) => { if (has(re)) out.push(t(k, { a: L(CONFIG.address) })); });
  if (has(/cost|fee|খরচ|ফি |টাকা|দাম|budget|বাজেট|tuition/) && !uniHits.length && !budgetRM(text) && !has(/cheap|lowest|সবচেয়ে কম|কম খরচ|সস্তা/)) out.push(t("lc.cost"), `<a class="chat-link" href="cost.html">${t("tool.cost")} →</a>`);
  if (has(/eligib|যোগ্য|এলিজিবল/)) out.push(`<a class="chat-link" href="eligibility.html">${t("tool.elig")} →</a>`);
  // বাজেট বা "সবচেয়ে কম খরচ"
  const bud = budgetRM(text);
  if (bud || has(/cheap|lowest|সবচেয়ে কম|কম খরচ|কম টাকা|সস্তা/)) {
    const lv = has(/master|মাস্টার্স|mba|এমবিএ/) ? ["M"] : has(/diploma|ডিপ্লোমা|ssc/) ? ["D", "F"] : ["B", "D", "F"];
    const fieldWords = (text.toLowerCase().match(/[a-z]{3,}/g) || []).filter((w) => !STOP.has(w));
    const list = ALLPROGS.filter((p) => lv.includes(p.lv) && (!bud || costOf(p).firstTuition <= bud) && (!fieldWords.length || fieldWords.some((w) => new RegExp("\\b" + w, "i").test(p.name)) || fieldWords.every((w) => !PTOK_ALL().has(w))))
      .sort((a, b) => costOf(a).first - costOf(b).first);
    const seen = new Set(), pick = list.filter((p) => !seen.has(p.uni) && seen.add(p.uni)).slice(0, 4);
    out.push((bud ? t("lc.budget", { b: money(bud) }) : t("lc.cheap")) + (pick.length ? pick.map((p) => `<span class="chat-prog" data-prog="${p.id}" role="button" tabindex="0"><b>${esc(p.name)}</b><small>${esc(UNI[p.uni].name)} · ${t("pc.first")} ≈ RM ${money(costOf(p).first)}</small></span>`).join("") : `<br>${t("lc.noBudget")}`));
    return { msgs: out };
  }
  // প্রোগ্রাম খোঁজা
  const PTOK = PTOK_ALL();
  const words = text.toLowerCase().match(/[a-z]{3,}/g)?.filter((w) => !STOP.has(w) && !Object.values(UNI_ALIAS).flat().includes(w) && (PTOK.has(w) || ["mba", "bba", "it"].includes(w))) || [];
  const tokHit = (p, w) => new RegExp("\\b" + w + "\\b", "i").test(p.name);
  if (words.length && (!out.length || uniHits.length)) {
    const scored = ALLPROGS.map((p) => ({ p, n: words.filter((w) => tokHit(p, w)).length }))
      .filter((x) => x.n && (!uniHits.length || uniHits.some((u) => u.id === x.p.uni))).sort((a, b) => b.n - a.n || a.p.fee - b.p.fee).slice(0, 4);
    if (scored.length) out.push(t("lc.progs") + scored.map(({ p }) => `<span class="chat-prog" data-prog="${p.id}" role="button" tabindex="0"><b>${esc(p.name)}</b><small>${esc(UNI[p.uni].name)} · ${feeText(p)} · ${yrs(p.y)}</small></span>`).join(""));
  }
  if (!out.length) { const q = qaMatch(original); if (q) out.push(esc(L(q.a))); }
  return { msgs: out.length ? out : [t("lc.fallback")] };
}
const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
function buildChat() {
  const w = document.createElement("div");
  w.className = "lc";
  w.innerHTML = `
    <div class="lc-panel" id="lcPanel" hidden role="dialog" aria-label="Live chat">
      <div class="lc-head"><span class="lc-av"><img src="images/bfs-logo-white.png" alt=""></span>
        <div><b id="lcWho"></b><small><i class="dot"></i><span id="lcStatus" data-i18n="lc.online"></span></small></div>
        <a class="lc-wa" id="lcWa" target="_blank" rel="noopener" title="WhatsApp">${WA_SVG.replace('width="28" height="28"', 'width="18" height="18"')}<span data-i18n="lc.waBtn"></span></a>
        <button id="lcX" aria-label="close">${icon("x")}</button></div>
      <div class="lc-body" id="lcBody" aria-live="polite"></div>
      <div class="lc-chips" id="lcChips"></div>
      <form class="lc-foot" id="lcForm"><input id="lcIn" data-i18n-ph="lc.ph" aria-label="message" autocomplete="off"><button aria-label="send">${icon("send")}</button></form>
    </div>
    <button class="lc-btn" id="lcBtn" aria-label="Live chat">${icon("chat")}<span class="lc-btn-t" data-i18n="lc.title"></span></button>`;
  document.body.appendChild(w);
  const st = () => store.get(CHAT_KEY, { msgs: [], handed: false, count: 0 });
  const save = (x) => store.set(CHAT_KEY, x);
  const body = $("#lcBody");
  const render = () => {
    const x = st(), u = getUser();
    $("#lcWho").textContent = x.handed ? t("lc.counsellor") : t("lc.bot");
    const hello = `<div class="msg bot">${esc(t("lc.hello", { n: u?.name ? (isBn() ? " " : ", ") + u.name.split(" ")[0] : "" }))}</div>`;
    const qa = `<div class="msg bot lc-qa"><b>${t("lc.qaT")}</b>${CHAT_QA.map((q, i) => `<button type="button" data-qa="${i}">${esc(L(q.q))}</button>`).join("")}</div>`;
    body.innerHTML = hello + (x.handed ? "" : qa) + x.msgs.map((m) => `<div class="msg ${m.who}"><span class="mt">${m.who === "me" ? esc(m.html) : m.html}</span>${m.at ? `<time>${num(m.at)}${m.who === "me" ? " ✓✓" : ""}</time>` : ""}</div>`).join("") + (x.handed ? handoffHtml() : "");
    body.scrollTop = body.scrollHeight;
    $("#lcChips").innerHTML = (x.handed ? [] : STR["lc.chips"][isBn() ? 0 : 1]).map((c) => `<button type="button">${esc(c)}</button>`).join("") +
      (x.handed ? "" : `<button type="button" class="qa">${t("lc.qaChip")}</button><button type="button" class="human">${icon("user")} ${t("lc.human")}</button>`);
    $("#lcWa").href = waLink(transcript());
  };
  const transcript = () => { const u = getUser(); return st().msgs.map((m) => (m.who === "me" ? "👤 " : "🤖 ") + m.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join("\n") + (u ? `\n\n— ${u.name} (${u.phone})` : ""); };
  const handoffHtml = () => `<div class="msg sys">${icon("user")} ${t("lc.wait")}${CONFIG.tawkId ? "" : `<br><a class="btn btn-primary sm lc-go" target="_blank" rel="noopener" href="${waLink(transcript())}">${t("lc.continue")}</a>`}</div>`;
  const handoff = () => {
    const x = st(); if (x.handed) return; x.handed = true; save(x);
    const u = getUser(); sendLead("live_chat", { name: u?.name, phone: u?.phone, transcript: transcript() });
    if (CONFIG.tawkId) loadTawk(); render();
  };
  // মানুষের মতো উত্তর: আগে "টাইপ করছে…" আর তিন ডট, তারপর লেখাটা অক্ষর অক্ষর করে আসে
  const status = (typing) => ($("#lcStatus").textContent = typing ? t("lc.typing") : t("lc.online"));
  const typeOut = (el, done) => {
    const mt = el && $(".mt", el);
    if (!mt || CALM || /</.test(mt.innerHTML)) { el?.classList.add("pop"); return done(); }
    const full = mt.textContent, step = Math.max(1, Math.ceil(full.length / 60)); let i = 0;
    mt.textContent = "";
    const tick = () => { i = Math.min(full.length, i + step); mt.textContent = full.slice(0, i); body.scrollTop = body.scrollHeight; i < full.length ? setTimeout(tick, 18) : done(); };
    tick();
  };
  const botSay = (list, after) => {
    if (!list.length) { status(false); return after && after(); }
    const [h, ...rest] = list, plain = h.replace(/<[^>]+>/g, "");
    status(true);
    const dots = document.createElement("div"); dots.className = "msg bot typing"; dots.innerHTML = "<i></i><i></i><i></i>"; body.appendChild(dots); body.scrollTop = body.scrollHeight;
    setTimeout(() => {
      const y = st(); y.msgs.push({ who: "bot", html: h, at: hhmm() }); save(y); render();
      const bots = $$(".msg.bot:not(.lc-qa)", body);
      typeOut(bots[bots.length - 1], () => botSay(rest, after));
    }, CALM ? 200 : 700 + Math.min(1300, plain.length * 10));
  };
  const ask = (txt) => {
    if (!getUser()) return needUser(() => ask(txt));
    const x = st(); x.msgs.push({ who: "me", html: txt, at: hhmm() }); x.count = (x.count || 0) + 1; save(x); render();
    const r = botReply(txt);
    if (r.handoff) return setTimeout(handoff, 500);
    botSay(r.msgs, () => { if (st().count >= 4) setTimeout(handoff, 900); });   // কিছুক্ষণ পর কাউন্সেলর চ্যাট চালিয়ে যাবেন
  };
  const panel = $("#lcPanel");
  const toggle = (open) => { panel.hidden = !open; $("#lcBtn").classList.toggle("open", open); if (open) { render(); setTimeout(() => $("#lcIn").focus(), 50); } };
  $("#lcBtn").onclick = () => toggle(panel.hidden);
  $("#lcX").onclick = () => toggle(false);
  // প্রশ্ন-উত্তর: তৈরি উত্তর সাথে সাথে দেখায়, কাউন্সেলরের কাছে পাঠানোর গণনায় ধরা হয় না
  const answerQA = (i) => { const q = CHAT_QA[i]; if (!q) return; const x = st(); x.msgs.push({ who: "me", html: L(q.q), at: hhmm() }); save(x); render(); botSay([esc(L(q.a))]); };
  $("#lcChips").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; if (b.classList.contains("qa")) { body.scrollTop = 0; return; } ask(b.textContent.trim()); };
  body.addEventListener("click", (e) => { const b = e.target.closest("[data-qa]"); if (b) answerQA(+b.dataset.qa); });
  $("#lcForm").onsubmit = (e) => { e.preventDefault(); const v = $("#lcIn").value.trim(); if (v) { ask(v); $("#lcIn").value = ""; } };
  body.addEventListener("click", (e) => { if (e.target.closest(".lc-go")) { const u = getUser(); sendLead("live_chat_continue", { name: u?.name, phone: u?.phone }); } });
  document.addEventListener("bfs:lang", () => { if (!panel.hidden) render(); });
  if (st().handed && CONFIG.tawkId) loadTawk();
}
function loadTawk() {
  if (window.Tawk_API || !CONFIG.tawkId) return;
  const u = getUser();
  window.Tawk_API = { visitor: u ? { name: u.name, email: "" } : undefined, onLoad: () => { try { Tawk_API.setAttributes({ name: u?.name || "", phone: u?.phone || "" }, () => {}); Tawk_API.maximize(); } catch {} } };
  window.Tawk_LoadStart = new Date();
  const s = document.createElement("script"); s.async = true; s.src = `https://embed.tawk.to/${CONFIG.tawkId}`; s.charset = "UTF-8"; s.setAttribute("crossorigin", "*");
  document.head.appendChild(s);
}

/* ---------- মাউস অ্যানিমেশন: এডুকেশন-থিমের ছোট আইকন ট্রেইল + কার্ড টিল্ট ---------- */
const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
const CALM = matchMedia("(prefers-reduced-motion: reduce)").matches;
function cursorTrail() {
  if (!FINE || CALM) return;
  const c = document.createElement("canvas"); c.className = "trail"; c.setAttribute("aria-hidden", "true");
  document.body.appendChild(c);
  const x = c.getContext("2d"); let W, H, dpr = Math.min(devicePixelRatio || 1, 2);
  const size = () => { W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr; c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px"; };
  size(); addEventListener("resize", size);
  // ছোট এডুকেশন শেপ: ক্যাপ, বই, তারা, পেন্সিল
  const shapes = ["cap", "book", "star", "dot"], cols = ["#7a1428", "#c9973f", "#a61c34", "#d8b26a"];
  const parts = []; let last = 0, lx = 0, ly = 0, raf = 0;
  const glow = document.createElement("div"); glow.className = "cursor-glow"; document.body.appendChild(glow);
  addEventListener("mousemove", (e) => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; glow.classList.add("on");
    const now = performance.now(), d = Math.hypot(e.clientX - lx, e.clientY - ly);
    if (now - last < 45 || d < 18) return;
    last = now; lx = e.clientX; ly = e.clientY;
    parts.push({ x: e.clientX * dpr, y: e.clientY * dpr, vx: (Math.random() - 0.5) * 0.6 * dpr, vy: (-0.4 - Math.random() * 0.6) * dpr, life: 1, s: (7 + Math.random() * 5) * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.06, k: shapes[(Math.random() * shapes.length) | 0], c: cols[(Math.random() * cols.length) | 0] });
    if (parts.length > 40) parts.shift();
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
  document.addEventListener("mouseleave", () => glow.classList.remove("on"));
  function draw(p) {
    x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = p.life * 0.75; x.fillStyle = p.c; x.strokeStyle = p.c; x.lineWidth = 1.4 * dpr;
    const s = p.s;
    if (p.k === "cap") { x.beginPath(); x.moveTo(-s, 0); x.lineTo(0, -s * 0.5); x.lineTo(s, 0); x.lineTo(0, s * 0.5); x.closePath(); x.fill(); x.fillRect(-s * 0.45, s * 0.2, s * 0.9, s * 0.35); }
    else if (p.k === "book") { x.strokeRect(-s * 0.8, -s * 0.55, s * 1.6, s * 1.1); x.beginPath(); x.moveTo(0, -s * 0.55); x.lineTo(0, s * 0.55); x.stroke(); }
    else if (p.k === "star") { x.beginPath(); for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5, rr = i % 2 ? s * 0.4 : s * 0.9; x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } x.closePath(); x.fill(); }
    else { x.beginPath(); x.arc(0, 0, s * 0.3, 0, 7); x.fill(); }
    x.restore();
  }
  function tick() {
    x.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= 0.022; if (p.life <= 0) parts.splice(i, 1); else draw(p); }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) x.clearRect(0, 0, W, H);
  }
}
function tiltCards() {
  if (!FINE || CALM) return;
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest(".tilt");
    $$(".tilt.tilting").forEach((c) => { if (c !== card) { c.classList.remove("tilting"); c.style.transform = ""; } });
    if (!card) return;
    const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    card.classList.add("tilting");
    card.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-4px)`;
    card.style.setProperty("--mx", `${(px + 0.5) * 100}%`); card.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  }, { passive: true });
}
function reveal() {
  const els = $$(".reveal");
  if (CALM || !("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

function confetti() {
  if (CALM) return;
  const c = document.createElement("canvas"); c.className = "confetti"; document.body.appendChild(c);
  const x = c.getContext("2d"); c.width = innerWidth; c.height = innerHeight;
  const cols = ["#7a1428", "#c9973f", "#a61c34", "#f1d9a6", "#3b5b8f"];
  const ps = Array.from({ length: 110 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5, r: 4 + Math.random() * 5, vy: 2 + Math.random() * 3, vx: -1.5 + Math.random() * 3, c: cols[(Math.random() * cols.length) | 0], a: Math.random() * 6 }));
  let f = 0;
  (function tick() {
    x.clearRect(0, 0, c.width, c.height);
    ps.forEach((p) => { p.y += p.vy; p.x += p.vx; p.a += 0.1; x.fillStyle = p.c; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6); x.restore(); });
    if (++f < 150) requestAnimationFrame(tick); else c.remove();
  })();
}

/* ---------- chips ---------- */
function chipGroup(el, onPick) {
  el.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    $$("button", el).forEach((x) => { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
    b.classList.add("on"); b.setAttribute("aria-pressed", "true"); el.dataset.val = b.dataset.v; onPick && onPick(b.dataset.v);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  buildChrome(); buildChat(); applyLang(); refreshLiveEmgs();
  cursorTrail(); tiltCards(); reveal();
  if (getUser()) crmSync();                                         // আগের ভিজিটরদেরও CRM-এর ID দেওয়া
  else if (document.body.dataset.gate !== "off") gateWatch();
});

/* ---------- লম্বা তালিকায় খোঁজার ঘর (ইউনিভার্সিটি, সাবজেক্ট…) ----------
   ৮টা বা বেশি অপশনের যেকোনো <select>-এ নিজে থেকে বসে। আসল <select>-টা ভেতরে থেকে যায়,
   তাই আগের কোড (.value, change/input event) আগের মতোই কাজ করে। */
(() => {
  const MIN = 8, norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  // বাংলায় লেখা লেভেল ইংরেজিতেও খোঁজা যায় (ডিপ্লোমা ↔ diploma)
  const BN_EN = [["ফাউন্ডেশন", "foundation"], ["ডিপ্লোমা", "diploma"], ["ব্যাচেলর", "bachelor degree"], ["মাস্টার্স", "masters"], ["মাস্টার", "master"], ["পিএইচডি", "phd doctorate"], ["সার্টিফিকেট", "certificate"]];
  const hay = (o) => { let t = norm(o.textContent); BN_EN.forEach(([b, e]) => { if (t.includes(b)) t += " " + e; }); return t; };
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value"), idx = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");
  function enhance(sel) {
    if (sel.dataset.ss || sel.multiple || sel.options.length < MIN) return;
    sel.dataset.ss = "1";
    const box = document.createElement("div"); box.className = "ss";
    box.innerHTML = `<button type="button" class="ss-btn" aria-haspopup="listbox"><span></span>${icon("search")}</button>
      <div class="ss-pop" hidden><input type="search" class="ss-q" autocomplete="off" aria-label="search"><ul class="ss-list" role="listbox"></ul></div>`;
    sel.parentNode.insertBefore(box, sel); box.appendChild(sel); sel.classList.add("ss-native"); sel.tabIndex = -1;
    const btn = box.querySelector(".ss-btn"), lab = btn.querySelector("span"), pop = box.querySelector(".ss-pop"), q = box.querySelector(".ss-q"), ul = box.querySelector(".ss-list");
    let cur = -1, shown = [];
    const label = () => { const o = sel.options[sel.selectedIndex]; lab.textContent = o ? o.textContent : ""; btn.disabled = sel.disabled; };
    const draw = () => {
      const words = norm(q.value).split(" ").filter(Boolean);
      shown = [...sel.options].filter((o) => !o.disabled && words.every((w) => hay(o).includes(w)));
      ul.innerHTML = shown.map((o, i) => `<li role="option" data-i="${i}" class="${o.selected ? "on" : ""}">${esc(o.textContent)}</li>`).join("") || `<li class="ss-none">${isBn() ? "কিছু পাওয়া যায়নি" : "No match"}</li>`;
      cur = Math.max(0, shown.findIndex((o) => o.selected));
      mark();
    };
    const mark = () => { [...ul.children].forEach((li, i) => li.classList.toggle("cur", i === cur)); const li = ul.children[cur]; if (li && li.scrollIntoView) li.scrollIntoView({ block: "nearest" }); };
    const open = () => { if (sel.disabled) return; pop.hidden = false; box.classList.add("open"); q.value = ""; q.placeholder = isBn() ? "লিখে খুঁজুন…" : "Type to search…"; draw(); setTimeout(() => q.focus(), 0); };
    const close = () => { pop.hidden = true; box.classList.remove("open"); };
    const pick = (o) => { if (!o) return; desc.set.call(sel, o.value); label(); close(); btn.focus(); sel.dispatchEvent(new Event("input", { bubbles: true })); sel.dispatchEvent(new Event("change", { bubbles: true })); };
    btn.onclick = () => (pop.hidden ? open() : close());
    q.oninput = draw;
    q.onkeydown = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); cur = Math.min(shown.length - 1, cur + 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cur = Math.max(0, cur - 1); mark(); }
      else if (e.key === "Enter") { e.preventDefault(); pick(shown[cur]); }
      else if (e.key === "Escape") { e.preventDefault(); close(); btn.focus(); }
    };
    ul.onclick = (e) => { const li = e.target.closest("[data-i]"); if (li) pick(shown[+li.dataset.i]); };
    document.addEventListener("mousedown", (e) => { if (!box.contains(e.target)) close(); });
    // কোড থেকে value বদলালেও লেখাটা সাথে সাথে বদলায়
    Object.defineProperty(sel, "value", { configurable: true, get() { return desc.get.call(this); }, set(v) { desc.set.call(this, v); label(); } });
    Object.defineProperty(sel, "selectedIndex", { configurable: true, get() { return idx.get.call(this); }, set(v) { idx.set.call(this, v); label(); } });
    new MutationObserver(() => { label(); if (!pop.hidden) draw(); }).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled"] });
    sel.addEventListener("change", label);
    label();
  }
  const scan = () => document.querySelectorAll("select").forEach(enhance);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener("DOMContentLoaded", () => setTimeout(scan, 0));
})();
