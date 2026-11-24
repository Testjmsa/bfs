/* ===== Website ↔ CRM সংযোগ (BFS website-এর পেজগুলো এই ফাইল ব্যবহার করে) =====
   website-এ কেউ নাম-নাম্বার দিলে সে CRM-এ lead হয়ে যায় এবং CRM-এর Student ID-টাই website-এ তার ID হয়।
   একই ফোন নাম্বার আবার দিলে নতুন রেকর্ড হয় না — আগের ID-টাই ফেরত আসে।
   LIVE: Supabase-এর website_lead ফাংশন।  DEMO: একই ব্রাউজারের localStorage। */
(() => {
const C = window.CRM_CONFIG || {}, LIVE = !!(C.supabaseUrl && C.supabaseKey), LS = C.storeKey || "bfscrm5:";
const digits = (p) => String(p || "").replace(/\D/g, "").slice(-10);
const read = (t) => { try { return JSON.parse(localStorage.getItem(LS + t) || "[]"); } catch { return []; } };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(16) + Math.random().toString(16).slice(2));
const pin6 = () => { const r = new Uint32Array(1); crypto.getRandomValues(r); return String(r[0] % 1000000).padStart(6, "0"); };

/* DEMO: website-এর নতুন lead পালা করে counsellor-কে দেওয়া — "Gets new website leads" অনুমতির পদের মধ্যে যে সবচেয়ে বেশি সময় lead পায়নি, সে পাবে
   (৫০ জন lead, ১০ জন counsellor → সবাই ৫ জন করে; lead কম হলে পরের দিন আগে যারা পায়নি তারা আগে পাবে) */
function nextCounsellor() {
  let pool = ["counsellor", "senior"];
  try { const p = JSON.parse(localStorage.getItem(LS + "perms") || "null"); if (p && Array.isArray(p.lead_pool)) pool = p.lead_pool; } catch {}
  const prof = read("profiles"), cand = prof.filter((u) => u.active && u.role !== "admin" && (pool.includes(u.role) || (u.extra_perms || []).includes("lead_pool")));
  if (!cand.length) return null;
  const oldest = cand.reduce((m, u) => ((u.last_auto_lead || "") < m ? u.last_auto_lead || "" : m), "\uffff");
  const ties = cand.filter((u) => (u.last_auto_lead || "") === oldest), pick = ties[Math.floor(Math.random() * ties.length)];
  // সময় সবসময় আগের সবার চেয়ে বেশি রাখা হয় — একই মুহূর্তে অনেক lead এলেও পালা ঠিক থাকে
  const last = Math.max(0, ...prof.map((u) => Date.parse(u.last_auto_lead || "") || 0));
  pick.last_auto_lead = new Date(Math.max(Date.now(), last + 1)).toISOString();
  localStorage.setItem(LS + "profiles", JSON.stringify(prof));
  return pick;
}
async function lead({ name, phone, edu, source }) {
  if (LIVE) {
    const r = await fetch(`${C.supabaseUrl}/rest/v1/rpc/website_lead`, { method: "POST", headers: { "Content-Type": "application/json", apikey: C.supabaseKey, Authorization: "Bearer " + C.supabaseKey },
      body: JSON.stringify({ p_name: name, p_phone: phone, p_edu: edu || "", p_source: source || "Website" }) });
    if (!r.ok) throw new Error("CRM " + r.status);
    return r.json();                                   // { sid, pin | null, existing }
  }
  const list = read("students"), d = digits(phone), old = list.find((s) => [s.phone, s.whatsapp].some((p) => digits(p) === d));
  if (old) return { sid: old.sid, pin: null, existing: true };
  const now = new Date(), ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const s = { id: uuid(), created_at: now.toISOString(), created_by: null, sid: "BFS" + (Math.max(1000, ...list.map((x) => parseInt(String(x.sid || "").replace(/\D/g, ""), 10) || 0)) + 1),
    name, phone, source: source || "Website", status: "new", priority: "warm", next_followup: ymd, nationality: "Bangladeshi", pref_country: "Malaysia", counsellor_id: null, portal_pin: pin6() };
  const c = nextCounsellor(); if (c) s.counsellor_id = c.id;
  localStorage.setItem(LS + "students", JSON.stringify([...list, s]));
  localStorage.setItem(LS + "notes", JSON.stringify([...read("notes"), ...(c ? [{ id: uuid(), created_at: now.toISOString(), created_by: null, student_id: s.id, type: "internal", text: `Auto-assigned to ${c.name} (website leads are shared in turn).` }] : []), { id: uuid(), created_at: now.toISOString(), created_by: null, student_id: s.id, type: "internal", text: `Came from the website (${source || "Website"}). Latest education: ${edu || "not given"}.` }]));
  return { sid: s.sid, pin: s.portal_pin, existing: false };
}
/* Sign in: Student ID অথবা মোবাইল নাম্বার + PIN → { sid, name, phone } অথবা null (না মিললে)। "locked" = অনেকবার ভুল */
async function login(idOrPhone, pin) {
  const typed = String(idOrPhone || "").trim(); pin = String(pin || "").trim();
  if (LIVE) {
    const r = await fetch(`${C.supabaseUrl}/rest/v1/rpc/student_portal`, { method: "POST", headers: { "Content-Type": "application/json", apikey: C.supabaseKey, Authorization: "Bearer " + C.supabaseKey }, body: JSON.stringify({ p_sid: typed, p_pin: pin }) });
    if (!r.ok) { const t = await r.text(); throw new Error(/locked/i.test(t) ? "locked" : "CRM " + r.status); }
    const d = await r.json(); return d ? { sid: d.sid, name: d.name, phone: d.phone } : null;
  }
  const norm = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), ph = /^[+0-9 ()-]{8,}$/.test(typed) ? digits(typed) : "";
  const s = read("students").find((x) => norm(x.sid) === norm(typed) || (ph && digits(x.phone) === ph));
  return s && s.portal_pin && s.portal_pin === pin ? { sid: s.sid, name: s.name, phone: s.phone } : null;
}
/* EMGS অগ্রগতি (Dashboard-এ দেখানোর জন্য): ফি জমা + পাসপোর্ট থাকলে আর অফিস লুকিয়ে না রাখলে { percent, status }; না হলে null। কোনো সমস্যা হলে null — website ভাঙে না */
async function emgs(sid, pin) {
  try {
    if (!sid || !pin) return null;
    if (LIVE) {
      const r = await fetch(`${C.supabaseUrl}/rest/v1/rpc/student_portal`, { method: "POST", headers: { "Content-Type": "application/json", apikey: C.supabaseKey, Authorization: "Bearer " + C.supabaseKey }, body: JSON.stringify({ p_sid: sid, p_pin: pin }) });
      const d = r.ok ? await r.json() : null, e = d && d.emgs;
      return e && e.paid && e.passport ? { show: e.show !== false, percent: e.found === false ? null : e.percent, status: e.note } : null;
    }
    const s = read("students").find((x) => x.sid === sid && x.portal_pin === String(pin)); if (!s || !s.passport_no) return null;
    const inv = read("invoices").filter((i) => i.student_id === s.id && /emgs|visa processing/i.test(i.category || "")), pay = read("payments");
    const paid = inv.some((i) => { const net = (i.total || 0) - (i.discount || 0); return net > 0 && pay.filter((p) => p.invoice_id === i.id).reduce((t, p) => t + (p.refund ? -p.amount : p.amount), 0) >= net; })
      || read("visas").some((v) => v.student_id === s.id && v.country === "Malaysia" && v.fee_paid);
    return paid ? { show: s.emgs_show !== false, percent: s.emgs_found === false ? null : s.emgs_percent ?? null, status: s.emgs_status || null } : null;
  } catch (e) { return null; }
}
/* Student portal-এ নিজে থেকে ঢোকার জন্য ID + PIN এই ডিভাইসে রাখা */
const remember = (sid, pin) => { try { if (sid && pin) localStorage.setItem("bfs-portal", JSON.stringify([sid, pin])); } catch {} };
const portalUrl = () => (C.crmUrl ? C.crmUrl.replace(/\/+$/, "") + "/student.html" : new URL("CRM Site/student.html", document.baseURI).href);
const forget = () => { try { localStorage.removeItem("bfs-portal"); sessionStorage.removeItem("bfs-portal"); } catch {} };
window.BFSCRM = { lead, login, forget, remember, portalUrl, emgs, LIVE };
})();
