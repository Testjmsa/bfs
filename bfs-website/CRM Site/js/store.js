/* ===== Data layer: DEMO (এই ব্রাউজারে) অথবা LIVE (Supabase) — বাকি কোড দুই ক্ষেত্রেই একই ===== */
(() => {
const CRM = window.CRM, { ymd, today, addDays } = CRM.ui;
const CFG = window.CRM_CONFIG || {};
const LIVE = !!(CFG.supabaseUrl && CFG.supabaseKey);
const TABLES = ["profiles", "students", "notes", "applications", "visas", "documents", "invoices", "payments", "expenses", "batches", "enrollments", "attendance", "mocks", "batch_posts", "tasks", "activity"];
const cache = {}; TABLES.forEach((t) => (cache[t] = []));
let me = null, sb = null;

/* ---------- constants ---------- */
const ROLES = { admin: "CEO / Admin", manager: "Manager", operation: "Operation Manager", senior: "Senior Counsellor", counsellor: "Student Counsellor", moderator: "Moderator", teacher: "IELTS Teacher", accounts: "Accounts", staff: "Staff (Editor / Meta)", developer: "Developer (Website / CRM)" };
const BASE_ROLES = Object.keys(ROLES);   // এর বাইরে যেগুলো, সেগুলো Admin-এর বানানো নতুন পদ (settings → roles)
const TOP = ["admin", "manager", "operation", "senior"];
const STATUS = [["new", "New Lead", ""], ["contacted", "Contacted", "blue"], ["counselled", "Counselling Done", "blue"], ["docs_pending", "Documents Pending", "amber"], ["applied", "Application Submitted", "amber"], ["offer", "Offer Received", "purple"], ["visa", "Visa Processing", "purple"], ["visa_approved", "Visa Approved", "green"], ["visa_rejected", "Visa Rejected", "red"], ["departed", "Departed / Abroad", "green"], ["lost", "Lost / Not Interested", "muted"]];
const BASE_COUNTRIES = ["Malaysia", "UK", "Australia", "Canada", "USA"];
/* অফিস যেসব ইউনিভার্সিটি/দেশ নিয়ে কাজ করে: Malaysia-র তালিকা website-এর js/data.js থেকে আসে, বাকিগুলো CRM-এ "+ Add" দিয়ে যোগ হয় (settings → catalog) */
let CAT = { countries: [], unis: [], fees: {}, progs: {} };
const K = {
  STATUS, TOP,
  LEAD: ["new", "contacted", "counselled"], PROCESSING: ["docs_pending", "applied", "offer", "visa", "visa_approved", "visa_rejected"],
  SOURCES: ["Facebook", "Website", "WhatsApp", "Referral", "Walk-in", "Phone Call", "Other"],
  PRIORITY: [["hot", "Hot"], ["warm", "Warm"], ["cold", "Cold"]],
  get COUNTRIES() { return [...BASE_COUNTRIES, ...CAT.countries.filter((c) => !BASE_COUNTRIES.includes(c)), "Other"]; },
  LEVELS: ["Foundation", "Diploma", "Bachelor", "Masters", "PhD"],
  SUBJECTS: ["Computer Science & IT", "Business & Management", "Accounting & Finance", "Engineering", "Medicine & Health Sciences", "Nursing", "Pharmacy", "Law", "Hospitality & Tourism", "Design & Media", "Education", "English Language", "Other"],
  /* Budget = প্রথম বছরের মোট খরচ (টাকা, লাখে)। [লেখা, সর্বোচ্চ লাখ] */
  BUDGETS: [["Below 3 lakh", 3], ["3–5 lakh", 5], ["5–8 lakh", 8], ["8–12 lakh", 12], ["12–20 lakh", 20], ["20–30 lakh", 30], ["Above 30 lakh", 999]],
  /* দেশ অনুযায়ী প্রথম বছরে মোটামুটি কমপক্ষে কত লাখ লাগে — অফিসের অভিজ্ঞতা অনুযায়ী এই সংখ্যাগুলো বদলে নিন */
  MIN_BUDGET: { Malaysia: 4, UK: 18, Australia: 22, Canada: 20, USA: 25 },
  NOTE_TYPES: [["call", "Phone Call"], ["whatsapp", "WhatsApp"], ["email", "Email"], ["meeting", "Meeting"], ["counselling", "Counselling"], ["internal", "Internal Note"], ["complaint", "Complaint"], ["feedback", "Feedback"]],
  APP_STATUS: [["draft", "Preparing", ""], ["submitted", "Submitted", "amber"], ["conditional", "Conditional Offer", "purple"], ["unconditional", "Unconditional Offer", "green"], ["deposit", "Deposit Paid", "green"], ["cas", "CAS / COE / VAL Issued", "green"], ["rejected", "Rejected", "red"], ["withdrawn", "Withdrawn", "muted"]],
  VISA_STATUS: [["preparing", "File Preparation", ""], ["submitted", "Submitted", "amber"], ["biometrics", "Biometrics Done", "blue"], ["awaiting", "Awaiting Decision", "purple"], ["approved", "Approved", "green"], ["rejected", "Rejected", "red"], ["reapplying", "Re-applying", "amber"]],
  DOC_TYPES: ["Passport", "SSC Certificate", "HSC Certificate", "Academic Transcript", "Bank Statement", "MOI / English Test Certificate"],
  DOC_EXTRA: ["Bachelor Certificate", "Masters Certificate", "CV", "SOP", "Recommendation Letter", "Financial Documents", "Sponsor Documents", "Offer Letter", "Visa Documents", "Birth Certificate", "National ID", "Police Clearance", "Medical Report", "Photo"],
  DOC_STATUS: { pending: ["Pending", ""], uploaded: ["Uploaded", "amber"], verified: ["Verified", "green"], rejected: ["Rejected", "red"] },
  INCOME: ["Registration Fee", "Counselling Fee", "Application Service Fee", "IELTS Course Fee", "Visa Processing Fee", "EMGS Fee", "Other Income"],
  EXPENSE: ["Office Rent", "Employee Salary", "Marketing", "Facebook Ads", "Internet & Utility", "Office Supplies", "Other"],
  METHODS: ["Cash", "bKash", "Nagad", "Bank Transfer", "Card"],
  TASK_STATUS: [["todo", "To Do"], ["doing", "In Progress"], ["review", "In Review"], ["done", "Completed"]],
  TASK_PRI: [["high", "High", "red"], ["medium", "Medium", "amber"], ["low", "Low", ""]],
  COURSES: ["IELTS Academic", "IELTS General", "Spoken English", "PTE", "Duolingo"],
  DEPTS: ["Management", "Counselling", "Operations", "IELTS Centre", "Marketing", "Accounts"],
};
/* কোন পরীক্ষার স্কোর কেমন — IELTS band 0–9, PTE 10–90, Duolingo 10–160; Spoken English-এ ১০০-তে নাম্বার */
const SCHEMES = {
  ielts: { name: "IELTS", parts: ["Listening", "Reading", "Writing", "Speaking"], min: 0, max: 9, step: 0.5, unit: "band", overall: (a) => Math.round(a * 2) / 2 },
  pte: { name: "PTE", parts: ["Listening", "Reading", "Writing", "Speaking"], min: 10, max: 90, step: 1, unit: "score", overall: (a) => Math.round(a) },
  duolingo: { name: "Duolingo", parts: ["Literacy", "Comprehension", "Conversation", "Production"], min: 10, max: 160, step: 5, unit: "score", overall: (a) => Math.round(a / 5) * 5 },
  spoken: { name: "Spoken English", parts: ["Fluency", "Vocabulary", "Grammar", "Pronunciation"], min: 0, max: 100, step: 1, unit: "marks", overall: (a) => Math.round(a) },
};
const scheme = (t) => SCHEMES[/pte/i.test(t) ? "pte" : /duolingo/i.test(t) ? "duolingo" : /spoken/i.test(t) ? "spoken" : "ielts"];
const scoreOk = (sc, n) => typeof n === "number" && !isNaN(n) && n >= sc.min && n <= sc.max && Math.abs(n / sc.step - Math.round(n / sc.step)) < 1e-9;
const scoreHint = (sc) => `${sc.name} ${sc.unit} ${sc.min}–${sc.max}${sc.step !== 1 ? `, steps of ${sc.step}` : ""}`;
/* দেশ অনুযায়ী ভর্তি-পরবর্তী কাগজের নাম আর visa-র ধাপ */
const COUNTRY = {
  Malaysia: { ref: "EMGS / VAL", bio: false, interview: false }, UK: { ref: "CAS", bio: true, interview: true }, Australia: { ref: "COE", bio: true, interview: false },
  Canada: { ref: "LOA / PAL", bio: true, interview: false }, USA: { ref: "I-20 / SEVIS", bio: true, interview: true },
};
const country = (c) => COUNTRY[c] || { ref: "CAS / COE / I-20", bio: true, interview: true };
/* এই student-এর জন্য কোন কোন কাগজ লাগবে */
function docTypes(s) {
  const t = s.test_type, eng = t === "MOI" ? "MOI Letter" : ["IELTS", "PTE", "Duolingo"].includes(t) ? t + " Certificate" : "MOI / English Test Certificate";
  return ["Passport", "SSC Certificate", "HSC Certificate", "Academic Transcript", "Bank Statement", eng];   // বাকি সব "+ Add document" দিয়ে
}
const lab = (list, v) => { const x = list.find((a) => a[0] === v); return x ? x[1] : v || "—"; };
const tone = (list, v) => { const x = list.find((a) => a[0] === v); return x ? x[2] || "" : ""; };

/* ---------- permissions ----------
   কোন পদ কী পারবে তা PERMS টেবিলে থাকে; Admin সেটা Team & Settings → Role permissions থেকে বদলাতে পারেন।
   LIVE mode-এ একই টেবিল database-এর RLS-ও ব্যবহার করে (schema.sql → has_perm), তাই ব্রাউজার থেকে ফাঁকি দেওয়া যায় না। */
const PERM_LIST = [
  ["students_all", "See and edit ALL students & leads", "Without this, a person only sees students assigned to or entered by them"],
  ["students_own", "Work with own / assigned students & leads", "Add leads, follow up, write timeline notes"],
  ["students_view", "View ALL students (read only)", "Can open any student to look, but can only change their own / assigned students"],
  ["admission", "Applications & Visa", "Create and update university applications and visa files"],
  ["docs", "Student documents (passport, bank statement…)", "Upload and open files of students they can work with"],
  ["docs_verify", "Verify / reject documents", ""],
  ["ielts_manage", "Manage IELTS batches, attendance & results", "Teachers always manage their own batch"],
  ["finance", "Finance: invoices, payments, expenses", "Also sees income, profit and all dues"],
  ["tasks_all", "See everyone's tasks", "Without this, only tasks given to or by them"],
  ["reports", "Reports", ""],
  ["export", "Export to Excel / PDF", "Taking data out of the CRM"],
  ["logs", "Activity log", "Who did what, and when"],
  ["lead_pool", "Gets new website leads automatically", "Website leads and online office bookings are shared out in turn, so everyone in these roles gets students"],
  ["team", "Team: add / edit staff, reset passwords", "Cannot touch the Admin account and cannot change role permissions"],
  ["catalog", "Edit universities, countries & EMGS fees", ""],
  ["emgs_ctl", "Show / hide EMGS progress to students", ""],
  ["delete", "Delete students permanently", ""],
];
const DEF_PERMS = {
  students_all: ["manager", "operation", "senior"], students_own: ["manager", "operation", "senior", "counsellor", "moderator"], students_view: ["manager", "operation", "senior", "counsellor", "moderator"], admission: ["manager", "operation", "senior", "counsellor"],
  docs: ["manager", "operation", "senior", "counsellor"], docs_verify: ["manager", "operation", "senior"], ielts_manage: ["manager"], finance: ["manager", "accounts"],
  tasks_all: ["manager", "operation", "senior"], reports: ["manager", "operation", "senior", "accounts", "developer"], export: ["manager"], logs: ["manager", "developer"],
  lead_pool: ["counsellor", "senior"], team: [], catalog: ["manager", "operation", "senior", "developer"], emgs_ctl: ["manager", "operation", "senior"], delete: [],
};
let PERMS = JSON.parse(JSON.stringify(DEF_PERMS));
const is = (...r) => !!me && r.includes(me.role);
const perm = (k) => !!me && (me.role === "admin" || (PERMS[k] || []).includes(me.role) || (me.extra_perms || []).includes(k));   // extra_perms = Admin-এর দেওয়া এই একজনের বিশেষ অনুমতি   // Admin সব সময় সব পারে — নিজেকে আটকে ফেলা যায় না
const raw = (t, id) => cache[t].find((r) => r.id === id);
const onTeam = (s) => !!s && (s.counsellor_id === me.id || (s.team_ids || []).includes(me.id));     // একাধিক জনকে assign করা যায়
const ownStu = (s) => !!s && (onTeam(s) || s.created_by === me.id);
const seeStu = (sid) => stuAccess(sid) || perm("students_view");        // শুধু দেখা (বদলানো নয়)
const stuAccess = (sid) => perm("students_all") || (perm("students_own") && ownStu(raw("students", sid)));
const docAccess = (sid) => { const s = raw("students", sid); return perm("docs") && (perm("students_all") || onTeam(s)); };
const teachesBatch = (bid) => { const b = raw("batches", bid); return !!b && b.teacher_id === me.id; };
const teachesStudent = (sid) => cache.enrollments.some((e) => e.student_id === sid && teachesBatch(e.batch_id));
function visible(t, r) {
  if (!me) return false;
  switch (t) {
    case "students": return perm("students_all") || perm("students_view") || perm("finance") || (perm("students_own") && ownStu(r)) || (me.role === "teacher" && teachesStudent(r.id));
    case "notes": return seeStu(r.student_id);
    case "applications": case "visas": return perm("admission") && seeStu(r.student_id);
    case "documents": return docAccess(r.student_id);
    case "invoices": case "payments": return perm("finance") || stuAccess(r.student_id);
    case "expenses": return perm("finance");
    case "enrollments": return perm("ielts_manage") || perm("finance") || teachesBatch(r.batch_id) || stuAccess(r.student_id);
    case "attendance": case "mocks": case "batch_posts": return perm("ielts_manage") || teachesBatch(r.batch_id);
    case "tasks": return perm("tasks_all") || r.created_by === me.id || (r.assignees || []).includes(me.id);
    case "activity": return perm("logs");
    default: return true;
  }
}
const can = {
  students: () => perm("students_all") || perm("students_own"),
  addStudent: () => perm("students_all") || perm("students_own"),
  editStudent: (s) => perm("students_all") || (perm("students_own") && ownStu(s)),
  assign: () => perm("students_all"),
  mine: (s) => ownStu(s),
  catalog: () => perm("catalog"),
  emgsCtl: () => perm("emgs_ctl"),
  deleteStudent: () => perm("delete"),
  admission: () => perm("admission"),
  docs: (s) => docAccess(s.id),
  verifyDocs: () => perm("docs_verify"),
  exportData: () => perm("export"),
  finance: () => perm("finance"),
  ielts: () => perm("ielts_manage") || perm("finance") || is("teacher"),
  ieltsAdmin: () => perm("ielts_manage"),
  marks: (b) => perm("ielts_manage") || b.teacher_id === me.id,
  allTasks: () => perm("tasks_all"),
  reports: () => perm("reports"),
  users: () => perm("team"),
  roles: () => is("admin"),
  logs: () => perm("logs"),
};
const cleanPerms = (p) => Object.fromEntries(PERM_LIST.map(([k]) => [k, (Array.isArray(p && p[k]) ? p[k] : DEF_PERMS[k]).filter((r) => r !== "admin" && ROLES[r])]));
/* সংবেদনশীল কাজের আগে Admin-এর পাসওয়ার্ড আবার মিলিয়ে নেওয়া */
async function verifyPassword(pw) {
  if (!LIVE) { if (me.pw !== hashPw(pw || "")) throw new Error("Wrong password"); return; }
  const tmp = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, storageKey: "bfscrm-verify-" + Date.now() } });
  const { error } = await tmp.auth.signInWithPassword({ email: me.email, password: pw }); if (error) throw new Error("Wrong password");
}
async function savePerms(next, password) {
  if (!is("admin")) throw new Error("Only the Admin can change permissions");
  await verifyPassword(password);
  const value = cleanPerms(next), before = PERMS;
  if (LIVE) { const { error } = await sb.from("settings").upsert({ key: "perms", value }); fail(error); } else localStorage.setItem(LS + "perms", JSON.stringify(value));
  PERMS = value;
  const diff = PERM_LIST.map(([k]) => { const add = value[k].filter((r) => !before[k].includes(r)), rem = before[k].filter((r) => !value[k].includes(r)); return add.length || rem.length ? `${k}: ${add.map((r) => "+" + r).concat(rem.map((r) => "-" + r)).join(" ")}` : ""; }).filter(Boolean).join("; ");
  log("permission-change", "settings", null, diff || "no change");
}
/* catalog = { countries: [...], unis: [{ id, name, country, city, url }], fees: { uniId: RM }, progs: { uniId: [[লেভেল, ফিল্ড, নাম, বছর, ফি]] } }
   মূল (website-এর) তালিকার ওপর বসে — js/catalog.js; website-ও একই তালিকা দেখায় */
const emptyCat = () => ({ countries: [], unis: [], fees: {}, progs: {} });
const useCat = () => { if (window.BFSCAT) window.BFSCAT.apply(CAT, true); };
async function loadCatalog() {
  try {
    if (LIVE) { const { data, error } = await sb.rpc("public_catalog"); if (!error) CAT = { ...emptyCat(), ...(data || {}) }; }
    else CAT = { ...emptyCat(), ...JSON.parse(localStorage.getItem(LS + "catalog") || "{}") };
  } catch (e) { console.warn("catalog", e); }
  useCat();
}
async function saveCatalog(next, what) {
  if (!can.catalog()) throw new Error("Only Admin / Manager / Operation / Senior can change the list");
  const value = { countries: [...new Set(next.countries || [])], unis: next.unis || [], fees: next.fees || {}, progs: next.progs || {} };
  if (LIVE) { const { error } = await sb.from("settings").upsert({ key: "catalog", value }); fail(error); } else localStorage.setItem(LS + "catalog", JSON.stringify(value));
  CAT = value; useCat(); log("catalog", "settings", null, what || "");
}
/* ---------- universities & EMGS ---------- */
const allUnis = () => (typeof UNIVERSITIES !== "undefined" ? UNIVERSITIES : []).map((u) => ({ id: u.id, name: u.name, country: u.country || "Malaysia", city: u.city, type: u.type, url: u.url || "", programs: (u.programs || []).length, custom: !!u.custom }))
  .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));
const unisOf = (c) => allUnis().filter((u) => !c || u.country === c).map((u) => u.name);
const low = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
function findUni(name) {
  const n = low(name); if (!n) return null;
  const all = allUnis();
  return all.find((u) => low(u.name) === n) || all.find((u) => u.id && low(u.id) === n) || all.find((u) => n.length > 2 && (low(u.name).includes(n) || n.includes(low(u.name)))) || null;
}
const uniPrograms = (id) => ((typeof UNIVERSITIES !== "undefined" ? UNIVERSITIES : []).find((u) => u.id === id) || {}).programs || [];
/* EMGS / ভিসা ফি (RM): CRM-এ লেখা ফি > প্রতিদিনের লাইভ ফি > website-এর লেখা ফি > আনুমানিক */
function emgsOf(name) {
  const u = findUni(name); if (!u) return null;
  if (u.country !== "Malaysia") return { uni: u.name, rm: null };
  const e = typeof EMGS !== "undefined" && EMGS[u.id], def = typeof CONFIG !== "undefined" ? CONFIG.emgsDefault : null;
  if (e) return { uni: u.name, id: u.id, rm: e.rm, inFee: !!e.inFee, live: e.live || null, crm: !!e.crm, url: e.url || null, src: e.src ? e.src.en : "" };
  return def ? { uni: u.name, id: u.id, rm: def, approx: true, src: "Estimate — this university's fee is not set yet" } : { uni: u.name, id: u.id, rm: null };
}
/* website-এর মতোই: Google Sheet-এর লাইভ EMGS ফি দিনে কয়েকবার আনে (CRM-এ লেখা ফি থাকলে সেটাই থাকে) */
function refreshEmgs() {
  try {
    if (typeof applyLiveEmgs !== "function" || typeof CONFIG === "undefined" || !CONFIG.sheetUrl) return;
    let c = null; try { c = JSON.parse(localStorage.getItem(EMGS_LIVE_KEY) || "null"); } catch (e) {}
    if (c && Date.now() - c.at < 6 * 3600e3) return;
    fetch(CONFIG.sheetUrl + "?action=emgs").then((r) => r.json()).then((d) => {
      if (!d || !d.emgs) return;
      try { localStorage.setItem(EMGS_LIVE_KEY, JSON.stringify({ at: Date.now(), d: d.emgs })); } catch (e) {}
      if (applyLiveEmgs(d.emgs)) { useCat(); window.dispatchEvent(new Event("crm:render")); }
    }).catch(() => {});
  } catch (e) {}
}
/* EMGS অগ্রগতি (%): Google Script EMGS-এর "Track My Application" পেজে পাসপোর্ট + Bangladesh দিয়ে খুঁজে আনে */
const emgsPaid = (s) => {
  const inv = cache.invoices.filter((i) => i.student_id === s.id && /emgs|visa processing/i.test(i.category || ""));
  const net = (i) => (i.total || 0) - (i.discount || 0), paid = (i) => cache.payments.filter((p) => p.invoice_id === i.id).reduce((t, p) => t + (p.refund ? -p.amount : p.amount), 0);
  return inv.some((i) => net(i) > 0 && paid(i) >= net(i)) || cache.visas.some((v) => v.student_id === s.id && v.country === "Malaysia" && v.fee_paid);
};
const isMalay = (s) => s.pref_country === "Malaysia" || cache.applications.some((a) => a.student_id === s.id && a.country === "Malaysia") || cache.visas.some((v) => v.student_id === s.id && v.country === "Malaysia");
async function emgsCheck(list) {
  if (typeof CONFIG === "undefined" || !CONFIG.sheetUrl) throw new Error("Google Script link is not set (js/data.js → sheetUrl)");
  list = list.filter((s) => s.passport_no).slice(0, 25);
  if (!list.length) return { done: 0, found: 0 };
  let d;
  try {
    const r = await fetch(CONFIG.sheetUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "emgs_track", list: list.map((s) => ({ id: s.id, passport: s.passport_no, nat: "BD" })) }) });
    d = JSON.parse(await r.text());
  } catch (e) { throw new Error("EMGS auto-check is not set up yet — update the Google Script (SETUP-GUIDE, step 8)"); }
  if (!d || !d.results) throw new Error("EMGS auto-check is not set up yet — update the Google Script (SETUP-GUIDE, step 8)");
  let found = 0; const now = new Date().toISOString();
  for (const s of list) {
    const x = d.results[s.id]; if (!x || !x.ok) continue;
    const patch = { emgs_checked: now, emgs_found: !!x.found };
    if (x.found) { found++; if (x.percent != null) patch.emgs_percent = x.percent; if (x.status) patch.emgs_status = x.status; }
    if (x.found && x.percent != null && x.percent !== s.emgs_percent) await add("notes", { student_id: s.id, type: "internal", text: `EMGS progress ${s.emgs_percent ?? 0}% → ${x.percent}%${x.status ? " — " + x.status : ""} (auto from EMGS)` }).catch(() => {});
    await set("students", s.id, patch).catch((e) => console.warn(e));
  }
  if (me) localStorage.setItem(LS + "emgs-last", String(Date.now()));
  return { done: list.length, found };
}
const MAXMB = +CFG.maxUploadMB || 180;
/* Admin-এর বানানো নতুন পদ (যেমন "Visa Officer") — settings-এর "roles" ঘরে { key: নাম } */
let CUSTOM = {};
const applyRoles = (c) => { Object.keys(ROLES).forEach((k) => { if (!BASE_ROLES.includes(k)) delete ROLES[k]; }); CUSTOM = {};
  Object.entries(c || {}).forEach(([k, v]) => { if (/^[a-z][a-z0-9_]{1,30}$/.test(k) && !BASE_ROLES.includes(k) && v) { ROLES[k] = String(v).slice(0, 40); CUSTOM[k] = ROLES[k]; } }); };
/* বিভাগ (department): মূল তালিকা + Admin-এর যোগ করা (settings-এর "depts") */
const BASE_DEPTS = [...K.DEPTS];
const applyDepts = (list) => { K.DEPTS.length = 0; K.DEPTS.push(...BASE_DEPTS, ...(Array.isArray(list) ? list : []).filter((d) => d && !BASE_DEPTS.includes(d))); };
async function loadPerms() {
  await loadCatalog(); refreshEmgs();
  if (LIVE) { const { data } = await sb.from("settings").select("key,value").in("key", ["perms", "roles", "depts"]); const v = (k) => ((data || []).find((r) => r.key === k) || {}).value; applyRoles(v("roles")); applyDepts(v("depts")); PERMS = cleanPerms(v("perms")); }
  else { const r = localStorage.getItem(LS + "roles"); applyRoles(r ? JSON.parse(r) : null); const d = localStorage.getItem(LS + "depts"); applyDepts(d ? JSON.parse(d) : null); const v = localStorage.getItem(LS + "perms"); PERMS = cleanPerms(v ? JSON.parse(v) : null); }
}
async function saveDepts(list) {
  if (!is("admin")) throw new Error("Only the Admin can add or remove departments");
  const custom = [...new Set(list.map((d) => String(d).trim().slice(0, 40)).filter((d) => d && !BASE_DEPTS.includes(d)))];
  const gone = K.DEPTS.filter((d) => !BASE_DEPTS.includes(d) && !custom.includes(d)), used = gone.filter((d) => cache.profiles.some((p) => p.department === d && p.active));
  if (used.length) throw new Error(`Some staff are still in ${used.join(", ")}. Move them to another department first.`);
  if (LIVE) { const { error } = await sb.from("settings").upsert({ key: "depts", value: custom }); fail(error); } else localStorage.setItem(LS + "depts", JSON.stringify(custom));
  applyDepts(custom); log("department-change", "settings", null, custom.join(", ") || "none");
}
async function saveRoles(next, password) {
  if (!is("admin")) throw new Error("Only the Admin can add or remove roles");
  await verifyPassword(password);
  const gone = Object.keys(CUSTOM).filter((k) => !next[k]), used = gone.filter((k) => cache.profiles.some((p) => p.role === k));
  if (used.length) throw new Error(`Some staff still have this role (${used.map((k) => CUSTOM[k]).join(", ")}). Give them another role first.`);
  if (LIVE) { const { error } = await sb.from("settings").upsert({ key: "roles", value: next }); fail(error); } else localStorage.setItem(LS + "roles", JSON.stringify(next));
  const before = { ...CUSTOM }; applyRoles(next);
  const nextPerms = cleanPerms(PERMS);    // মুছে ফেলা পদ অনুমতির তালিকা থেকেও বাদ
  if (LIVE) { const { error } = await sb.from("settings").upsert({ key: "perms", value: nextPerms }); fail(error); } else localStorage.setItem(LS + "perms", JSON.stringify(nextPerms));
  PERMS = nextPerms;
  log("role-change", "settings", null, Object.keys(next).filter((k) => !before[k]).map((k) => "+" + next[k]).concat(Object.keys(before).filter((k) => !next[k]).map((k) => "-" + before[k])).join(", ") || "renamed");
}

/* ---------- storage helpers ---------- */
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); }));
const LS = CFG.storeKey || "bfscrm5:";
/* DEMO mode-এর পাসওয়ার্ড শুধু এই ব্রাউজারে থাকে (সাধারণ hash) — আসল নিরাপত্তা LIVE mode-এ Supabase দেয় */
const DEMO_PW = CFG.defaultPassword || "12345678";
const hashPw = (s) => { let a = 0xdeadbeef ^ 7, b = 0x41c6ce57 ^ 7; for (const ch of "bfs|" + s) { const c = ch.codePointAt(0); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); } a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909); b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909); return (b >>> 0).toString(36) + (a >>> 0).toString(36); };
const save = (t) => { try { localStorage.setItem(LS + t, JSON.stringify(cache[t])); } catch (e) { console.warn("Could not save", t, e); } };
const clean = (o) => { const r = {}; for (const k in o) if (o[k] !== undefined) r[k] = o[k] === "" ? null : o[k]; return r; };
const nextNo = (t, key, prefix, pad) => prefix + String(Math.max(0, ...cache[t].map((r) => parseInt(String(r[key] || "").split("-").pop(), 10) || 0)) + 1).padStart(pad, "0");
const NUMBERED = { students: true, invoices: true, payments: true };   // server-generated numbers in LIVE mode
const fail = (error) => { if (error) throw new Error(/row-level security|permission/i.test(error.message) ? "You don't have permission for this" : error.message); };

async function add(t, obj) {
  const row = clean(obj);
  if (LIVE) {
    if (NUMBERED[t]) { const { data, error } = await sb.from(t).insert(row).select().single(); fail(error); cache[t].push(data); return data; }
    const full = { id: uuid(), ...row }; const { error } = await sb.from(t).insert(full); fail(error);
    const r = { ...full, created_at: new Date().toISOString(), created_by: me.id }; cache[t].push(r); return r;
  }
  const r = { id: uuid(), created_at: new Date().toISOString(), created_by: me ? me.id : null, ...row };
  if (t === "students" && !r.sid) r.sid = "BFS" + (Math.max(1000, ...cache.students.map((x) => parseInt(String(x.sid || "").replace(/\D/g, ""), 10) || 0)) + 1);   // BFS1001, BFS1002 …
  if (t === "invoices" && !r.no) r.no = nextNo("invoices", "no", "INV-", 5);
  if (t === "payments" && !r.receipt_no) r.receipt_no = nextNo("payments", "receipt_no", "RC-", 5);
  cache[t].push(r); save(t); return r;
}
async function set(t, id, patch) {
  const p = clean(patch);
  if (LIVE) { const { error } = await sb.from(t).update(p).eq("id", id); fail(error); }
  const r = raw(t, id); if (r) Object.assign(r, p);
  if (!LIVE) save(t);
  return r;
}
async function del(t, id) {
  if (LIVE) { const { error } = await sb.from(t).delete().eq("id", id); fail(error); }
  cache[t] = cache[t].filter((r) => r.id !== id);
  if (!LIVE) save(t);
}
function log(action, entity, entity_id, detail) {
  if (!me) return;
  add("activity", { action, entity, entity_id: entity_id || null, detail: String(detail || "").slice(0, 300) }).catch((e) => console.warn("log failed", e));
}

/* ---------- files (documents) ---------- */
function idb() {
  return new Promise((res, rej) => { const q = indexedDB.open("bfscrm-files", 1); q.onupgradeneeded = () => q.result.createObjectStore("f"); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
async function putFile(path, file) {
  if (LIVE) { const { error } = await sb.storage.from("documents").upload(path, file, { contentType: file.type }); fail(error); return; }
  const db = await idb();
  await new Promise((res, rej) => { const tx = db.transaction("f", "readwrite"); tx.objectStore("f").put(file, path); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
async function fileUrl(path) {
  if (LIVE) { const { data, error } = await sb.storage.from("documents").createSignedUrl(path, 300); fail(error); return data.signedUrl; }
  const db = await idb();
  const blob = await new Promise((res, rej) => { const q = db.transaction("f").objectStore("f").get(path); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
  if (!blob) throw new Error("File not found in this browser (demo files stay on the computer that uploaded them)");
  return URL.createObjectURL(blob);
}

/* ---------- auth ---------- */
/* Login ID: ইমেইল না থাকলেও চলে — "rakib" লিখলে ভেতরে rakib@<loginDomain> হয়ে যায় (কাউকে ইমেইল পাঠানো হয় না) */
const DOMAIN = CFG.loginDomain || "staff.bfscrm.app";
const toEmail = (v) => { v = String(v || "").trim().toLowerCase(); return v.includes("@") ? v : v.replace(/[^a-z0-9._-]/g, "") + "@" + DOMAIN; };
const loginId = (u) => { const e = String((u && u.email) || ""); return e.endsWith("@" + DOMAIN) ? e.slice(0, -DOMAIN.length - 1) : e; };
function genPassword() { if (CFG.defaultPassword) return CFG.defaultPassword; const A = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789", r = new Uint32Array(10); crypto.getRandomValues(r); return [...r].map((x) => A[x % A.length]).join(""); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error("Could not load " + src)); document.head.appendChild(s); }); }
async function fetchAll(t) {
  const out = [], max = t === "activity" ? 1000 : 1e9;
  for (let from = 0; out.length < max; from += 1000) {
    const { data, error } = await sb.from(t).select("*").order("created_at", { ascending: t !== "activity" }).range(from, from + 999);
    if (error) { console.warn(t, error.message); break; }
    out.push(...data); if (data.length < 1000) break;
  }
  return out;
}
async function loadAll(uid) {
  cache.profiles = await fetchAll("profiles");
  me = cache.profiles.find((p) => p.id === uid) || null;
  await loadPerms();
  if (!me || !me.active) { const pending = me; me = null; await sb.auth.signOut(); throw new Error(pending ? "Your account is waiting for approval by the Admin." : "No profile found for this account."); }
  const rest = TABLES.filter((t) => t !== "profiles");
  (await Promise.all(rest.map(fetchAll))).forEach((rows, i) => (cache[rest[i]] = rows));
}
async function init() {
  if (LIVE) {
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    await loadCatalog();
    const { data } = await sb.auth.getSession();
    if (data.session) { if (await needsCode()) await sb.auth.signOut({ scope: "local" }); else await loadAll(data.session.user.id); }
    return;
  }
  TABLES.forEach((t) => { const v = localStorage.getItem(LS + t); if (v) cache[t] = JSON.parse(v); });
  if (!cache.profiles.length) { seed(); TABLES.forEach(save); }      // website থেকে আগে lead এসে থাকলে সেগুলো থেকে যায়
  /* website বা অন্য ট্যাব থেকে ডেটা বদলালে এই ট্যাবেও সাথে সাথে আসে */
  window.addEventListener("storage", (e) => { const t = e.key && e.key.startsWith(LS) ? e.key.slice(LS.length) : ""; if (TABLES.includes(t) && e.newValue) { cache[t] = JSON.parse(e.newValue); window.dispatchEvent(new Event("crm:render")); } });
  await loadPerms();
  me = cache.profiles.find((p) => p.id === sessionStorage.getItem(LS + "me") && p.active) || null;
}
async function login(a, password) {
  if (LIVE) {
    const { data, error } = await sb.auth.signInWithPassword({ email: toEmail(a), password }); if (error) throw new Error(/invalid/i.test(error.message) ? "Wrong login ID or password" : error.message);
    if (await needsCode()) { const e = new Error("Enter the 6-digit code from your authenticator app"); e.mfa = true; throw e; }
    await loadAll(data.user.id);
  }
  else {
    const u = cache.profiles.find((p) => p.email === toEmail(a));
    if (!u || u.pw !== hashPw(password || "")) throw new Error("Wrong login ID or password");
    if (!u.active) throw new Error("This account is disabled. Ask the Admin.");
    me = u; sessionStorage.setItem(LS + "me", me.id);
  }
  log("login", "user", me.id, navigator.userAgent.slice(0, 120));
}
async function logout(everywhere) {
  if (LIVE) await sb.auth.signOut({ scope: everywhere ? "global" : "local" }); else sessionStorage.removeItem(LS + "me");
  me = null; TABLES.forEach((t) => { if (LIVE) cache[t] = []; });
}
async function reload() { if (LIVE && me) await loadAll(me.id); }
/* ---------- 2-step login (authenticator app) ---------- */
async function needsCode() { try { const { data } = await sb.auth.mfa.getAuthenticatorAssuranceLevel(); return !!data && data.nextLevel === "aal2" && data.currentLevel !== "aal2"; } catch (e) { console.warn(e); return false; } }
async function mfaFactor() { const { data, error } = await sb.auth.mfa.listFactors(); fail(error); return (data.totp || []).find((f) => f.status === "verified") || null; }
async function mfaLogin(code) { const f = await mfaFactor(); if (!f) throw new Error("No authenticator is set up"); const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: f.id, code }); if (error) throw new Error("Wrong or expired code"); const { data } = await sb.auth.getUser(); await loadAll(data.user.id); log("login", "user", me.id, "2-step · " + navigator.userAgent.slice(0, 100)); }
async function mfaEnroll() { const old = await sb.auth.mfa.listFactors(); for (const f of (old.data && old.data.all) || []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id }); const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: "BFS CRM " + Date.now() }); fail(error); return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }; }
async function mfaConfirm(factorId, code) { const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code }); if (error) throw new Error("Wrong or expired code"); log("2fa-on", "user", me.id, ""); }
async function mfaOff() { const f = await mfaFactor(); if (f) { const { error } = await sb.auth.mfa.unenroll({ factorId: f.id }); fail(error); log("2fa-off", "user", me.id, ""); } }

async function createUser({ login: lid, email, password, ...prof }) {
  email = toEmail(email || lid);
  if (!LIVE) { if (cache.profiles.some((p) => p.email === email)) throw new Error("This login ID already exists"); return add("profiles", { email, active: true, pw: hashPw(password), must_change: true, ...prof }); }
  const tmp = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false, storageKey: "bfscrm-tmp-" + Date.now() } });
  let data, error;
  for (let i = 0; i < 4; i++) {      // Supabase অল্প সময়ে অনেক অ্যাকাউন্ট খুলতে দেয় না — আটকালে একটু অপেক্ষা করে আবার চেষ্টা
    ({ data, error } = await tmp.auth.signUp({ email, password, options: { data: { name: prof.name } } }));
    if (!error || !/rate|too many|429/i.test(error.message + (error.status || ""))) break;
    await sleep(65000);
  }
  if (error) throw new Error(/already/i.test(error.message) ? "This login ID already exists" : error.message);
  if (!data.user) throw new Error("Could not create the login");
  const p = clean({ ...prof, active: true, must_change: true });
  const { error: e2 } = await sb.from("profiles").update(p).eq("id", data.user.id); fail(e2);
  const row = { id: data.user.id, email, created_at: new Date().toISOString(), ...p }; cache.profiles.push(row); return row;
}
async function setMyPhoto(photo) { if (LIVE) { const { error } = await sb.rpc("set_my_photo", { p: photo }); fail(error); } me.photo = photo; if (!LIVE) save("profiles"); }
async function resetPassword(uid, pw) { if (!LIVE) return set("profiles", uid, { pw: hashPw(pw), must_change: true }); const { error } = await sb.rpc("admin_reset_password", { uid, pw }); fail(error); }
async function changePassword(pw) { if (pw === DEMO_PW) throw new Error("Choose your own password, not the office default");
  if (!LIVE) return set("profiles", me.id, { pw: hashPw(pw), must_change: false });
  const { error } = await sb.auth.updateUser({ password: pw }); fail(error);
  const r = await sb.rpc("password_changed"); fail(r.error); me.must_change = false; }
async function dupStudent(phone) {
  const d = String(phone || "").replace(/\D/g, "").slice(-10); if (d.length < 7) return null;
  const local = cache.students.find((s) => [s.phone, s.whatsapp].some((p) => String(p || "").replace(/\D/g, "").slice(-10) === d));
  if (local) return `${local.sid} — ${local.name}`;
  if (LIVE) { const { data } = await sb.rpc("dup_student", { p: d }); if (data) return data; }
  return null;
}
/* ---------- Student portal: student নিজের ID + PIN দিয়ে শুধু নিজের অগ্রগতি দেখে (কোনো ফাইল বা অন্যের তথ্য নয়) ---------- */
async function portal(sid, pin) {
  const norm = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, "");   // "bfs 1001", "BFS-1001" — সবই চলে
  const typed = String(sid || ""), ph = /^[+0-9 ()-]{8,}$/.test(typed.trim()) ? typed.replace(/\D/g, "").slice(-10) : "";   // Student ID অথবা মোবাইল নাম্বার
  sid = norm(sid); pin = String(pin || "").trim();
  if (LIVE) { const { data, error } = await sb.rpc("student_portal", { p_sid: ph ? typed.trim() : sid, p_pin: pin }); if (error) throw new Error(/locked/i.test(error.message) ? "locked" : error.message); return data; }
  const s = cache.students.find((x) => norm(x.sid) === sid || (ph && String(x.phone || "").replace(/\D/g, "").slice(-10) === ph));
  if (!s || !s.portal_pin || s.portal_pin !== pin) return null;
  const of = (t) => cache[t].filter((r) => r.student_id === s.id), c = cache.profiles.find((u) => u.id === s.counsellor_id), v = of("visas").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
  const net = (i) => (i.total || 0) - (i.discount || 0), paidOf = (i) => cache.payments.filter((p) => p.invoice_id === i.id).reduce((t, p) => t + (p.refund ? -p.amount : p.amount), 0);
  const apps = of("applications"), myApp = apps.filter((a) => a.country === "Malaysia").sort((a, b) => (["cas", "deposit", "unconditional", "conditional"].indexOf(a.status) + 9) % 13 - (["cas", "deposit", "unconditional", "conditional"].indexOf(b.status) + 9) % 13)[0];
  const malay = s.pref_country === "Malaysia" || !!myApp || (v && v.country === "Malaysia");
  const emgsPaid = of("invoices").some((i) => /emgs|visa processing/i.test(i.category || "") && net(i) > 0 && paidOf(i) >= net(i)) || !!(v && v.country === "Malaysia" && v.fee_paid);
  const uniName = (myApp && myApp.university) || s.pref_university || null, cu = CAT.unis.find((u) => u.name === uniName);
  return { name: s.name, sid: s.sid, phone: s.phone, status: s.status,
    emgs: malay ? { paid: emgsPaid, uni: uniName, custom_rm: cu ? cu.emgs_rm || null : null, passport: s.passport_no || null, nationality: "Bangladesh", show: s.emgs_show !== false, ...(s.emgs_show === false ? { found: null, checked: null, percent: null, note: null } : { found: s.emgs_found ?? null, checked: s.emgs_checked || null, percent: s.emgs_percent ?? null, note: s.emgs_status || null }), submitted_on: v && v.country === "Malaysia" ? v.submitted_on : null } : null, country: s.pref_country, test_type: s.test_type, bachelor: !!s.bachelor, masters: !!s.masters, departure_date: s.departure_date, flight: s.flight,
    counsellor: c ? { name: c.name, phone: c.phone } : null,
    apps: of("applications").map((a) => ({ university: a.university, course: a.course, intake: a.intake, status: a.status, country: a.country })),
    visa: v ? { status: v.status, country: v.country, submitted_on: v.submitted_on, appointment_date: v.appointment_date, biometrics_date: v.biometrics_date, interview_date: v.interview_date, decision_date: v.decision_date } : null,
    docs: of("documents").map((d) => ({ type: d.type, status: d.status })),
    pay: { total: of("invoices").reduce((t, i) => t + (i.total || 0) - (i.discount || 0), 0), paid: of("payments").reduce((t, x) => t + (x.refund ? -x.amount : x.amount), 0) },
    classes: of("enrollments").filter((e) => e.status === "active").map((e) => {
      const b = cache.batches.find((x) => x.id === e.batch_id) || {}, att = cache.attendance.filter((a) => a.batch_id === b.id && (a.marks || {})[e.id]), t = cache.profiles.find((u) => u.id === b.teacher_id);
      return { batch: b.name, course: b.course_type, status: b.status, schedule: b.schedule, time: b.class_time, room: b.room, start: b.start_date, end: b.end_date, link: b.meeting_link || null, teacher: t ? t.name : null,
        classes: att.length, present: att.filter((a) => a.marks[e.id] !== "A").length, absent: att.filter((a) => a.marks[e.id] === "A").map((a) => a.date).sort().reverse().slice(0, 5),
        results: cache.mocks.filter((m) => m.enrollment_id === e.id).sort((x, y) => String(y.date).localeCompare(String(x.date))).map((m) => ({ date: m.date, kind: m.kind, l: m.listening, r: m.reading, w: m.writing, s: m.speaking, overall: m.overall })),
        posts: cache.batch_posts.filter((x) => x.batch_id === b.id && (!(x.student_ids || []).length || x.student_ids.includes(s.id))).sort((x, y) => String(y.created_at).localeCompare(String(x.created_at))).slice(0, 30).map((x) => ({ kind: x.kind, title: x.title, body: x.body, link: x.link, due: x.due_date, at: x.created_at })) };
    }) };
}
/* Student portal থেকে ফাইল তোলা: ID + PIN মিলিয়ে, শুধু PDF/JPG/PNG, সর্বোচ্চ MAXMB (config: maxUploadMB)। ফাইল student আর দেখতে/নামাতে পারে না — শুধু staff */
async function setClassLink(bid, link) {
  if (LIVE) { const { error } = await sb.rpc("set_class_link", { p_batch: bid, p_link: link || null }); fail(error); }
  const b = raw("batches", bid); if (b) b.meeting_link = link || null; if (!LIVE) save("batches");
}
async function portalUpload(sidOrPhone, pin, type, file) {
  if (!file) throw new Error("ফাইল বেছে নিন");
  if (file.size > MAXMB * 1048576) throw new Error(`ফাইল ${MAXMB} MB-এর বেশি বড়`);
  if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) throw new Error("শুধু PDF, JPG বা PNG ফাইল দেওয়া যাবে");
  const clean = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
  if (LIVE) {
    const { data: path, error } = await sb.rpc("portal_upload_start", { p_sid: sidOrPhone, p_pin: pin, p_type: type, p_name: clean });
    if (error || !path) throw new Error(error && /locked/i.test(error.message) ? "locked" : "PIN মিলছে না — আবার login করুন");
    const up = await sb.storage.from("documents").upload(path, file, { contentType: file.type });
    if (up.error) throw new Error("ফাইল তোলা যায়নি: " + up.error.message);
    const { error: e2 } = await sb.rpc("portal_upload_done", { p_sid: sidOrPhone, p_pin: pin, p_path: path, p_name: file.name.slice(-120), p_size: file.size }); if (e2) throw new Error(e2.message);
    return;
  }
  const norm = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), ph = /^[+0-9 ()-]{8,}$/.test(String(sidOrPhone).trim()) ? String(sidOrPhone).replace(/\D/g, "").slice(-10) : "";
  const s = cache.students.find((x) => norm(x.sid) === norm(sidOrPhone) || (ph && String(x.phone || "").replace(/\D/g, "").slice(-10) === ph));
  if (!s || !s.portal_pin || s.portal_pin !== String(pin)) throw new Error("PIN মিলছে না — আবার login করুন");
  let doc = cache.documents.find((d) => d.student_id === s.id && d.type === type);
  if (doc && doc.status === "verified") throw new Error("এই কাগজটা আগেই যাচাই হয়ে গেছে");
  if (!doc) { doc = { id: uuid(), created_at: new Date().toISOString(), created_by: null, student_id: s.id, type, status: "pending", versions: [] }; cache.documents.push(doc); }
  const path = `${s.id}/${doc.id}/student-${Date.now()}-${clean}`;
  await putFile(path, file);
  Object.assign(doc, { status: "uploaded", verified_by: null, verified_at: null, versions: [...(doc.versions || []), { path, name: file.name, size: file.size, by: "student", at: new Date().toISOString() }] });
  cache.notes.push({ id: uuid(), created_at: new Date().toISOString(), created_by: null, student_id: s.id, type: "internal", text: `Student uploaded “${type}” from the portal (${file.name}). Please check and verify.` });
  save("documents"); save("notes");
}
/* Student portal থেকে নিজের পাসপোর্ট নাম্বার দেওয়া (EMGS দেখার জন্য) — আগে থেকে থাকলে বদলানো যায় না, তখন counsellor বদলান */
async function portalPassport(sidOrPhone, pin, no) {
  no = String(no || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!/^[A-Z]{1,2}[0-9]{6,8}$/.test(no)) throw new Error("পাসপোর্ট নাম্বার ঠিক নেই (যেমন A01234567)");
  if (LIVE) { const { error } = await sb.rpc("portal_set_passport", { p_sid: sidOrPhone, p_pin: pin, p_no: no }); if (error) throw new Error(/already/i.test(error.message) ? "পাসপোর্ট নাম্বার আগেই দেওয়া আছে" : "PIN মিলছে না — আবার login করুন"); return; }
  const norm = (v) => String(v || "").toUpperCase().replace(/[^A-Z0-9]/g, ""), ph = /^[+0-9 ()-]{8,}$/.test(String(sidOrPhone).trim()) ? String(sidOrPhone).replace(/\D/g, "").slice(-10) : "";
  const s = cache.students.find((x) => norm(x.sid) === norm(sidOrPhone) || (ph && String(x.phone || "").replace(/\D/g, "").slice(-10) === ph));
  if (!s || !s.portal_pin || s.portal_pin !== String(pin)) throw new Error("PIN মিলছে না — আবার login করুন");
  if (s.passport_no) throw new Error("পাসপোর্ট নাম্বার আগেই দেওয়া আছে");
  s.passport_no = no;
  cache.notes.push({ id: uuid(), created_at: new Date().toISOString(), created_by: null, student_id: s.id, type: "internal", text: `Student added passport number ${no} from the portal.` });
  save("students"); save("notes");
}
const newPin = () => { const r = new Uint32Array(1); crypto.getRandomValues(r); return String(r[0] % 1000000).padStart(6, "0"); };

function resetDemo(empty) {
  TABLES.forEach((t) => (cache[t] = []));
  if (empty) cache.profiles = [{ id: "u-admin", name: "Admin", email: toEmail("admin"), pw: hashPw(DEMO_PW), role: "admin", department: "Management", designation: "CEO", active: true, joined: today(), created_at: new Date().toISOString() }];
  else seed();
  TABLES.forEach(save);
}

/* ---------- demo data (কাল্পনিক নাম — শুধু দেখার জন্য) ---------- */
function seed() {
  let x = 11; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647, pick = (a) => a[Math.floor(rnd() * a.length)], n = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const iso = (off) => { const d = new Date(); d.setDate(d.getDate() + off); d.setHours(n(10, 18), n(0, 59)); return d.toISOString(); };
  const mk = (t, o, by = "u-admin", off = 0) => { const r = { id: uuid(), created_at: iso(off), created_by: by, ...o }; cache[t].push(r); return r; };
  [["u-admin", "Samir Rahman", "admin", "Management", "CEO"], ["u-mgr", "Nusrat Jahan", "manager", "Management", "Manager"], ["u-op", "Tanvir Ahmed", "operation", "Operations", "Operation Manager"], ["u-sen", "Farhana Akter", "senior", "Counselling", "Senior Counsellor"], ["u-c1", "Rakib Hasan", "counsellor", "Counselling", "Student Counsellor"], ["u-c2", "Mim Sultana", "counsellor", "Counselling", "Student Counsellor"], ["u-mod", "Sabbir Hossain", "moderator", "Marketing", "Moderator"], ["u-t1", "Ayesha Siddiqua", "teacher", "IELTS Centre", "IELTS Teacher"], ["u-acc", "Jahid Islam", "accounts", "Accounts", "Accounts Officer"], ["u-ed", "Rifat Chowdhury", "staff", "Marketing", "Video Editor"]]
    .forEach(([id, name, role, department, designation], i) => cache.profiles.push({ id, name, role, department, designation, email: toEmail({ "u-admin": "admin", "u-mgr": "manager", "u-op": "operation", "u-sen": "senior", "u-c1": "rakib", "u-c2": "mim", "u-mod": "moderator", "u-t1": "teacher", "u-acc": "accounts", "u-ed": "editor" }[id]), pw: hashPw(DEMO_PW), phone: "0171000000" + i, joined: addDays(-n(60, 900)), active: true, created_at: iso(-400) }));
  const F = ["Arif", "Sadia", "Mehedi", "Tania", "Shakil", "Jannat", "Imran", "Sumaiya", "Nayeem", "Riya", "Fahim", "Lamia", "Sohel", "Mitu", "Rashed", "Nabila", "Tuhin", "Priya", "Asif", "Sharmin"], L = ["Hossain", "Akter", "Islam", "Khan", "Rahman", "Begum", "Sarkar", "Ahmed", "Mia", "Das"];
  const ST = ["new", "new", "new", "contacted", "contacted", "counselled", "counselled", "docs_pending", "docs_pending", "applied", "applied", "offer", "offer", "visa", "visa", "visa_approved", "visa_rejected", "departed", "departed", "lost"];
  const UNI = { Malaysia: ["APU", "Taylor's University", "UCSI University", "SEGi University"], UK: ["University of Hertfordshire", "Coventry University"], Australia: ["Deakin University"], Canada: ["Seneca College"] };
  const rank = (s) => STATUS.findIndex((a) => a[0] === s);
  const s0 = cache.students.length;      // website থেকে আগে আসা lead-গুলো নমুনা ডেটায় জড়ায় না
  const sidBase = Math.max(1000, ...cache.students.map((x) => parseInt(String(x.sid || "").replace(/\D/g, ""), 10) || 0)) + 1;
  for (let i = 0; i < 44; i++) {
    const status = ST[i % ST.length], age = -n(2, 150), country = pick(["Malaysia", "Malaysia", "Malaysia", "UK", "Australia", "Canada"]), c = pick(["u-c1", "u-c1", "u-c2", "u-sen"]), src = pick(["Facebook", "Facebook", "Facebook", "Website", "Referral", "Walk-in", "WhatsApp"]);
    const name = F[i % F.length] + " " + L[(i * 7) % L.length], active = !["lost", "departed"].includes(status);
    const s = mk("students", { sid: "BFS" + (sidBase + i), name, phone: "017" + String(10000000 + i * 104729).slice(0, 8), whatsapp: null, email: name.toLowerCase().replace(" ", ".") + "@example.com",
      gender: i % 2 ? "Female" : "Male", dob: `${n(1998, 2006)}-0${n(1, 9)}-1${n(0, 9)}`, nationality: "Bangladeshi", present_address: pick(["Uttara, Dhaka", "Mirpur, Dhaka", "Gazipur", "Cumilla", "Sylhet"]),
      passport_no: rank(status) >= 3 ? "A0" + n(1000000, 9999999) : null, passport_expiry: rank(status) >= 3 ? addDays(i % 9 === 0 ? n(40, 150) : n(400, 2500)) : null,
      ssc: "GPA " + pick(["4.50", "5.00", "4.17", "3.89"]), hsc: "GPA " + pick(["4.25", "5.00", "3.75", "4.67"]), study_gap: pick(["None", "1 year", "2 years"]), test_type: i % 3 ? null : "IELTS", test_score: i % 3 ? null : pick(["6.0", "6.5", "5.5", "7.0"]),
      pref_country: country, pref_university: pick(UNI[country]), pref_subject: pick(["Computer Science & IT", "Business & Management", "Nursing", "Engineering", "Hospitality & Tourism"]), pref_level: pick(["Bachelor", "Bachelor", "Diploma", "Foundation"]), pref_intake: pick(["Jan 2027", "May 2027", "Sep 2027"]), budget: country === "Malaysia" ? pick(["3–5 lakh", "5–8 lakh", "8–12 lakh"]) : pick(["20–30 lakh", "Above 30 lakh"]),
      counsellor_id: status === "new" && i % 4 === 0 ? null : c, team_ids: i % 5 === 1 && c !== "u-c2" ? ["u-c2"] : [], source: src, priority: pick(["hot", "warm", "warm", "cold"]), status, next_followup: active ? addDays(n(-3, 6)) : null, lost_reason: status === "lost" ? "Budget problem" : null,
      departure_date: status === "departed" ? addDays(-n(5, 60)) : null, flight: status === "departed" ? "MH 197 DAC → KUL" : null, arrival_confirmed: status === "departed" }, src === "Facebook" ? "u-mod" : c, age);
    mk("notes", { student_id: s.id, type: "call", text: "First call — interested in " + s.pref_subject + " in " + country + "." }, c, age + 1);
    if (rank(status) >= 2) mk("notes", { student_id: s.id, type: "counselling", text: `Counselling done. Recommended ${s.pref_university}, ${s.pref_intake} intake. Budget ${s.budget}.` }, c, age + 4);
    if (rank(status) >= 4 && status !== "lost") {
      const as = { applied: "submitted", offer: "conditional", visa: "deposit", visa_approved: "cas", visa_rejected: "unconditional", departed: "cas" }[status];
      mk("applications", { student_id: s.id, country, university: s.pref_university, course: s.pref_subject, intake: s.pref_intake, deadline: addDays(n(5, 60)), submitted_on: addDays(age + 12), app_ref: "APP" + n(10000, 99999), app_fee: 5000, status: as, offer_date: rank(status) >= 5 ? addDays(age + 30) : null, tuition_fee: n(3, 9) * 100000, deposit_amount: rank(status) >= 6 ? 150000 : null }, "u-op", age + 12);
      ["Passport", "SSC Certificate", "HSC Certificate", "Academic Transcript"].forEach((type, j) => mk("documents", { student_id: s.id, type, status: j < 2 ? "verified" : "uploaded", expiry: type === "Passport" ? s.passport_expiry : null, versions: [{ path: "demo/none", name: type.toLowerCase().replace(/ /g, "-") + ".pdf", size: 240000, by: c, at: iso(age + 8) }], verified_by: j < 2 ? "u-op" : null }, c, age + 8));
    }
    if (rank(status) >= 6 && status !== "lost") mk("visas", { student_id: s.id, country, owner_id: "u-op", start_date: addDays(age + 40), submitted_on: addDays(age + 50), biometrics_date: status === "visa" ? addDays(n(1, 9)) : addDays(age + 55), fee_paid: true, medical_status: "Done", status: { visa: "submitted", visa_approved: "approved", visa_rejected: "rejected", departed: "approved" }[status], decision_date: status === "visa" ? null : addDays(age + 75), refusal_reason: status === "visa_rejected" ? "Insufficient financial documents" : null }, "u-op", age + 40);
    if (country === "Malaysia" && rank(status) >= 6 && status !== "lost") Object.assign(s, status === "visa" ? (i % 2 ? { emgs_percent: 70, emgs_status: "Approval letter issued", emgs_found: true } : { emgs_found: false }) : { emgs_percent: 100, emgs_status: "eVAL issued", emgs_found: true }, { emgs_checked: iso(-1), emgs_show: true });
    if (rank(status) >= 3 && status !== "lost") {
      const total = pick([15000, 25000, 40000]), inv = mk("invoices", { no: "INV-" + String(cache.invoices.length + 1).padStart(5, "0"), student_id: s.id, category: country === "Malaysia" && rank(status) >= 6 ? "EMGS Fee" : pick(["Application Service Fee", "Registration Fee", "Visa Processing Fee"]), total, discount: 0, due_date: addDays(n(-10, 20)) }, "u-acc", age + 6);
      mk("payments", { receipt_no: "RC-" + String(cache.payments.length + 1).padStart(5, "0"), invoice_id: inv.id, student_id: s.id, amount: i % 3 ? total : total / 2, method: pick(K.METHODS), date: addDays(Math.min(-1, age + 7)), refund: false }, "u-acc", age + 7);
    }
  }
  const b1 = mk("batches", { meeting_link: "https://zoom.us/j/0000000000", name: "IELTS Academic — Batch 14", course_type: "IELTS Academic", teacher_id: "u-t1", start_date: addDays(-30), end_date: addDays(30), schedule: "Sat, Mon, Wed", class_time: "4:00 PM – 5:30 PM", room: "Room 2", capacity: 20, status: "running" }, "u-mgr", -35);
  const b2 = mk("batches", { name: "Spoken English — Batch 6", course_type: "Spoken English", teacher_id: "u-t1", start_date: addDays(7), end_date: addDays(67), schedule: "Sun, Tue, Thu", class_time: "6:00 PM – 7:00 PM", room: "Room 1", capacity: 15, status: "upcoming" }, "u-mgr", -5);
  const en = cache.students.slice(s0, s0 + 11).map((s, i) => {
    const e = mk("enrollments", { batch_id: i < 8 ? b1.id : b2.id, student_id: s.id, fee: i < 8 ? 12000 : 6000, discount: i % 4 === 0 ? 1000 : 0, admitted_on: addDays(-32 + i), status: "active" }, "u-acc", -32 + i);
    const inv = mk("invoices", { no: "INV-" + String(cache.invoices.length + 1).padStart(5, "0"), student_id: s.id, category: "IELTS Course Fee", total: e.fee, discount: e.discount }, "u-acc", -32 + i);
    mk("payments", { receipt_no: "RC-" + String(cache.payments.length + 1).padStart(5, "0"), invoice_id: inv.id, student_id: s.id, amount: i % 2 ? e.fee - e.discount : 5000, method: "Cash", date: addDays(-30 + i), refund: false }, "u-acc", -30 + i);
    return e;
  }).filter((e) => e.batch_id === b1.id);
  [["homework", "Writing Task 2 — opinion essay", "Topic: Should university education be free? 250+ words. Bring it printed or send a photo.", "", 2], ["material", "Cambridge IELTS 17 — Listening Test 2", "Practise at home before Saturday's class.", "https://www.example.com/listening", null], ["notice", "Mock test this Saturday", "Full mock test, 10 AM–1 PM. Please arrive 15 minutes early.", "", null]]
    .forEach(([kind, title, body, link, due], i) => mk("batch_posts", { batch_id: b1.id, kind, title, body, link: link || null, due_date: due == null ? null : addDays(due) }, "u-t1", -i));
  [-12, -10, -8, -5, -3, -1].forEach((d) => mk("attendance", { batch_id: b1.id, date: addDays(d), marks: Object.fromEntries(en.map((e) => [e.id, rnd() < 0.78 ? "P" : rnd() < 0.5 ? "L" : "A"])) }, "u-t1", d));
  en.forEach((e) => [-14, -4].forEach((d, j) => { const sc = () => n(10, 14) / 2 + j * 0.5; const l = sc(), r = sc(), w = sc() - 0.5, sp = sc(); mk("mocks", { batch_id: b1.id, enrollment_id: e.id, date: addDays(d), kind: "Mock", listening: l, reading: r, writing: w, speaking: sp, overall: Math.round(((l + r + w + sp) / 4) * 2) / 2 }, "u-t1", d); }));
  [["Follow up 5 hot leads from Facebook", ["u-c1"], "high", 0, "doing"], ["Submit APU application — pending SOP", ["u-c2", "u-op"], "high", 2, "todo"], ["Reel: Study in Malaysia without IELTS", ["u-ed"], "medium", 3, "review"], ["Prepare visa file checklist for January intake", ["u-op"], "medium", -2, "doing"], ["Reply to all unanswered inbox messages", ["u-mod"], "high", 0, "todo"], ["Monthly counsellor performance review", ["u-sen"], "low", 6, "todo"], ["Mock test 3 question paper", ["u-t1"], "medium", 4, "todo"], ["Office banner design for education fair", ["u-ed"], "low", -6, "done"]]
    .forEach(([title, assignees, priority, d, status], i) => mk("tasks", { title, description: "", assignees, priority, deadline: addDays(d), status, progress: { todo: 0, doing: 50, review: 90, done: 100 }[status], comments: [] }, i % 2 ? "u-mgr" : "u-op", -8));
  for (let m = 0; m < 4; m++) [["Office Rent", 45000], ["Employee Salary", 380000], ["Facebook Ads", n(30, 60) * 1000], ["Internet & Utility", 9000]].forEach(([category, amount]) => mk("expenses", { category, amount, date: addDays(-m * 30 - 3), note: "" }, "u-acc", -m * 30 - 3));
}

CRM.K = K; CRM.MAXMB = MAXMB; CRM.lab = lab; CRM.tone = tone; CRM.scheme = scheme; CRM.scoreOk = scoreOk; CRM.scoreHint = scoreHint; CRM.country = country; CRM.docTypes = docTypes;
CRM.S = {
  LIVE, ROLES, BASE_ROLES, customRoles: () => ({ ...CUSTOM }), saveRoles, BASE_DEPTS, saveDepts, is, can, visible, perm, PERM_LIST, DEF_PERMS, savePerms, perms: () => JSON.parse(JSON.stringify(PERMS)), init, login, logout, reload, createUser, changePassword, resetPassword, portal, portalUpload, portalPassport, setClassLink, newPin, setMyPhoto, toEmail, loginId, genPassword, mfaFactor, mfaLogin, mfaEnroll, mfaConfirm, mfaOff, dupStudent, resetDemo, catalog: () => JSON.parse(JSON.stringify(CAT)), saveCatalog, allUnis, unisOf, findUni, emgsOf, uniPrograms, emgsCheck, emgsPaid, isMalay, add, set, del, log, putFile, fileUrl,
  get me() { return me; },
  rows: (t) => cache[t].filter((r) => visible(t, r)),
  get: (t, id) => { const r = raw(t, id); return r && visible(t, r) ? r : null; },
  users: () => cache.profiles,
  uname: (id) => (id === "student" ? "Student (portal)" : (cache.profiles.find((p) => p.id === id) || {}).name || "—"),
  dump: () => JSON.parse(JSON.stringify(cache)),
};
})();
