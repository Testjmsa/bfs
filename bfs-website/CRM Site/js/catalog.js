/* ===== University / Programme / EMGS ফি-র তালিকা — CRM আর website দুই জায়গায় একই =====
   - মূল তালিকা website-এর js/data.js-এ থাকে।
   - CRM-এ যা যোগ বা বদলানো হয় (নতুন university, programme, EMGS ফি) সেটা এর ওপর বসে।
   - CRM বন্ধ থাকলে বা সংযোগ না পেলে website আগের জমা কপি, না থাকলে data.js-এর তালিকা নিয়ে স্বাভাবিকভাবে চলে।
   এই ফাইল js/data.js-এর পরে আর common.js / store.js-এর আগে লোড হয়। */
(() => {
const C = window.CRM_CONFIG || {}, LIVE = !!(C.supabaseUrl && C.supabaseKey);
const CACHE = "bfs_catalog_cache", DEMO = (C.storeKey || "bfscrm5:") + "catalog";
const ready = typeof UNIVERSITIES !== "undefined" && typeof EMGS !== "undefined";
const LV = ["E", "C", "F", "D", "B", "M", "P"];
let base = null;
const slug = (s) => "c-" + String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const okProg = (p) => Array.isArray(p) && LV.includes(p[0]) && typeof p[1] === "string" && String(p[2] || "").trim() && +p[3] > 0 && +p[4] > 0;
const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } };

/* all = true (CRM): সব দেশের university; website-এ শুধু Malaysia (website-এর হিসাব RM আর EMGS-ভিত্তিক) */
function apply(cat, all) {
  if (!ready) return;
  try {
    if (!base) base = { n: UNIVERSITIES.length, progs: UNIVERSITIES.map((u) => (u.programs ? u.programs.slice() : null)), fields: UNIVERSITIES.map((u) => u.fields), emgs: JSON.parse(JSON.stringify(EMGS)) };
    UNIVERSITIES.length = base.n;
    UNIVERSITIES.forEach((u, i) => { if (base.progs[i]) u.programs = base.progs[i].slice(); else delete u.programs; u.fields = base.fields[i]; if (!u.country) u.country = "Malaysia"; });
    Object.keys(EMGS).forEach((k) => delete EMGS[k]); Object.assign(EMGS, JSON.parse(JSON.stringify(base.emgs)));
    if (typeof applyLiveEmgs === "function") try { applyLiveEmgs((read(EMGS_LIVE_KEY) || {}).d); } catch (e) {}
    cat = cat && typeof cat === "object" ? cat : {};
    (cat.unis || []).forEach((u) => {
      if (!u || !String(u.name || "").trim()) return;
      const country = u.country || "Malaysia", id = u.id || slug(u.name);
      if ((!all && country !== "Malaysia") || UNIVERSITIES.some((x) => x.id === id)) return;
      UNIVERSITIES.push({ id, name: String(u.name).trim(), city: u.city || country, country, type: u.type === "public" ? "public" : "private", custom: true, url: u.url || "",
        about: { bn: u.about || "", en: u.about || "" }, highlights: [], programs: [], feeNote: { bn: "BFS অফিসের দেওয়া ফি — অফিসে এসে নিশ্চিত করুন", en: "Fees from the BFS office — please confirm with us" } });
      if (+u.emgs_rm > 0 && !(cat.fees && cat.fees[id])) EMGS[id] = { rm: +u.emgs_rm, crm: true, url: u.url || "", src: { bn: "BFS অফিসের দেওয়া ফি", en: "Fee from the BFS office" } };
    });
    Object.entries(cat.progs || {}).forEach(([id, list]) => {
      const u = UNIVERSITIES.find((x) => x.id === id); if (!u || !Array.isArray(list)) return;
      u.programs = (u.programs || []).concat(list.filter(okProg).map((p) => [p[0], p[1], String(p[2]).trim(), +p[3], +p[4], +p[5] > +p[4] ? +p[5] : undefined].filter((x, i) => i < 5 || x !== undefined)));
    });
    UNIVERSITIES.forEach((u) => { if (u.programs && u.programs.length && (!u.fields || u.custom || (cat.progs || {})[u.id])) u.fields = [...new Set(u.programs.map((p) => p[1]))].filter((f) => f !== "english"); if (!u.fields) u.fields = []; });
    /* CRM-এ লেখা EMGS ফি সবার উপরে — লাইভ স্ক্রিপ্টও এটা বদলায় না */
    Object.entries(cat.fees || {}).forEach(([id, rm]) => { rm = +rm; if (!(rm >= 100 && rm <= 20000)) return; EMGS[id] = { ...(EMGS[id] || {}), rm, crm: true, live: null, inFee: false, src: { bn: "BFS অফিসের হালনাগাদ ফি", en: "Updated by the BFS office" } }; });
  } catch (e) { console.warn("catalog", e); }
}

/* website: আগে জমা কপি সাথে সাথে বসায়, তারপর পেছনে CRM থেকে নতুনটা এনে রাখে (পরের পেজে দেখায়) */
function boot() {
  if (!ready || /\/CRM(%20| )Site\//i.test(location.pathname)) return;   // CRM-এর পেজে store.js নিজে বসায়
  if (!LIVE) return apply(read(DEMO));        // DEMO: CRM-এর ডেটা এই ব্রাউজারেই
  apply((read(CACHE) || {}).cat);
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null; if (ctl) setTimeout(() => ctl.abort(), 6000);
  fetch(`${C.supabaseUrl}/rest/v1/rpc/public_catalog`, { method: "POST", headers: { "Content-Type": "application/json", apikey: C.supabaseKey, Authorization: "Bearer " + C.supabaseKey }, body: "{}", signal: ctl ? ctl.signal : undefined })
    .then((r) => (r.ok ? r.json() : null)).then((cat) => { if (cat && typeof cat === "object") try { localStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), cat })); } catch (e) {} })
    .catch(() => {});                          // CRM না পেলে কিছুই ভাঙে না
}
window.BFSCAT = { apply, slug, okProg };
boot();
})();
