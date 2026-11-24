/* ===== Students & Leads: তালিকা, প্রোফাইল, টাইমলাইন, লিড ইমপোর্ট ===== */
(() => {
const CRM = window.CRM, { S, K, lab, tone } = CRM;
const { esc, $, today, addDays, daysTo, fmtD, fmtDT, ic, pill, av, toast, go, rerender, modal, confirmBox, opts, formModal, table, on, exportXlsx } = CRM.ui;
CRM.parts = CRM.parts || {};

const stPill = (c) => pill(lab(K.STATUS, c), tone(K.STATUS, c));
const priPill = (p) => (p ? pill(lab(K.PRIORITY, p), { hot: "red", warm: "amber", cold: "blue" }[p]) : "");
const rank = (s) => K.STATUS.findIndex((a) => a[0] === s);
const active = (s) => !["lost", "departed"].includes(s.status);
const counsellors = () => S.users().filter((u) => u.active && ["counsellor", "senior", "operation", "manager"].includes(u.role)).map((u) => [u.id, `${u.name} (${S.ROLES[u.role]})`]);
const fuCell = (s) => { if (!s.next_followup || !active(s)) return '<span class="muted">—</span>'; const d = daysTo(s.next_followup); return `<span class="${d < 0 ? "late" : ""}">${d === 0 ? "Today" : d < 0 ? `${-d}d overdue` : fmtD(s.next_followup)}</span>`; };
CRM.stPill = stPill; CRM.rank = rank;

/* University: দেশ বাছলে সেই দেশের তালিকা আসে (Universities পেজের তালিকা); না থাকলে "Other" দিয়ে লেখা যায় */
const ctrs = () => K.COUNTRIES.filter((c) => c !== "Other");
const uniF = (ck, cur = {}) => { const cs = ctrs(); return [
  ...cs.map((c, i) => ({ k: "uni_" + i, label: "University", type: "select", options: [...S.unisOf(c), ["__other", "Other — not in the list (write it)"]], showIf: (v) => v[ck] === c })),
  { k: "uni_txt", label: "University name", showIf: (v) => !!v[ck] && (!cs.includes(v[ck]) || v["uni_" + cs.indexOf(v[ck])] === "__other"), hint: "It will be added to the Universities list" }]; };
const uniVals = (country, uni) => { const i = ctrs().indexOf(country); if (!uni) return {}; if (i >= 0 && S.unisOf(country).includes(uni)) return { ["uni_" + i]: uni }; return i >= 0 ? { ["uni_" + i]: "__other", uni_txt: uni } : { uni_txt: uni }; };
async function readUni(d, ck, out) {
  const cs = ctrs(), i = cs.indexOf(d[ck]); let u = i >= 0 ? d["uni_" + i] : null;
  const typed = (d.uni_txt || "").trim(); if (u === "__other" || i < 0) u = typed || null;
  cs.forEach((_, j) => delete d["uni_" + j]); delete d.uni_txt; d[out] = u;
  if (u && d[ck] && d[ck] !== "Other" && !S.findUni(u) && S.can.catalog()) {     // নতুন নাম → তালিকায় যোগ
    const c = S.catalog(); c.unis.push({ name: u, country: d[ck] }); try { await S.saveCatalog(c, "university added: " + u); toast(`“${u}” added to the Universities list`, "ok"); } catch (e) { console.warn(e); }
  }
}
CRM.uniF = uniF; CRM.uniVals = uniVals; CRM.readUni = readUni;

/* স্ট্যাটাস বদল — কে, কখন, কী থেকে কী: সব টাইমলাইনে থাকে */
async function setStatus(s, to, reason) {
  if (s.status === to) return;
  const from = s.status;
  await S.set("students", s.id, { status: to, lost_reason: to === "lost" ? reason || null : null });
  await S.add("notes", { student_id: s.id, type: "status", text: `${lab(K.STATUS, from)} → ${lab(K.STATUS, to)}${reason ? " — " + reason : ""}` });
  S.log("status", "student", s.id, `${s.sid}: ${from} → ${to}`);
}
/* Application/Visa আপডেট হলে স্টুডেন্টের স্ট্যাটাস নিজে থেকে এগিয়ে যায় (পিছায় না) */
CRM.bump = async (sid, to) => { const s = S.get("students", sid); if (s && s.status !== "lost" && (rank(to) > rank(s.status) || (to === "visa_approved" && s.status === "visa_rejected"))) await setStatus(s, to); };

/* ---------- list ---------- */
const F = { q: "", status: "", counsellor: "", country: "", priority: "", source: "", scope: sessionStorage.getItem("bfs-scope") || "" };
const TABS = {
  all: ["All", () => true], leads: ["Leads", (s) => K.LEAD.includes(s.status)],
  followup: ["Follow-up due", (s) => s.next_followup && s.next_followup <= today() && active(s)],
  processing: ["Processing", (s) => K.PROCESSING.includes(s.status)], abroad: ["Abroad / Alumni", (s) => s.status === "departed"],
  lost: ["Lost", (s) => s.status === "lost"], unassigned: ["Unassigned", (s) => !s.counsellor_id && active(s)],
};
CRM.views.students = (root, [tab = "all"]) => {
  const every = S.rows("students"), mine = every.filter(S.can.mine), scope = F.scope || (mine.length ? "mine" : "all"), editAll = S.perm("students_all");
  const all = scope === "mine" ? mine : every, countries = [...new Set(all.map((s) => s.pref_country).filter(Boolean))].sort();
  const tabs = Object.keys(TABS).filter((k) => k !== "unassigned" || S.can.assign());
  root.innerHTML = `
    <div class="ph"><div><span class="kicker">Students</span><h1>Students & Leads</h1><p>${scope === "mine" ? `${mine.length} students assigned to you` : `${every.length} students${editAll ? "" : " — you can only change your own"}`}</p></div>
      <div class="ph-act">${S.can.exportData() ? `<button class="btn btn-line" data-act="export">${ic("down")} Excel</button>` : ""}
      ${S.can.addStudent() ? `<button class="btn btn-line" data-act="import">${ic("up")} Import leads</button><button class="btn btn-primary" data-act="new">${ic("plus")} New lead / student</button>` : ""}</div></div>
    ${CRM.ui.guide("students", ["শুরুতে <b>আমার students</b> দেখায় — যারা আপনাকে assign করা (একজন student একাধিক জনকে assign করা যায়)।", `<b>সব students</b> চাপলে অফিসের সবাইকে দেখতে পাবেন${editAll ? "" : ", কিন্তু শুধু দেখা যাবে; বদলাতে পারবেন শুধু নিজের assign করা student"}।`, "নতুন lead: <b>New lead / student</b>। Facebook/Excel থেকে একসাথে: <b>Import leads</b>।", "নাম, ফোন, Student ID বা পাসপোর্ট দিয়ে খুঁজুন; উপরের ট্যাব আর ফিল্টার দিয়ে ছোট করুন।", "কোনো সারিতে ক্লিক করলে student-এর প্রোফাইল খোলে।"])}
    <div class="scope"><button type="button" data-act="scope" data-v="mine" class="${scope === "mine" ? "on" : ""}">আমার students (${mine.length})</button><button type="button" data-act="scope" data-v="all" class="${scope === "all" ? "on" : ""}">সব students (${every.length})${editAll ? "" : " · শুধু দেখা"}</button></div>
    <div class="tabs">${tabs.map((k) => `<a href="#/students/${k}" class="${k === tab ? "on" : ""}">${TABS[k][0]} <em>${all.filter(TABS[k][1]).length}</em></a>`).join("")}</div>
    <div class="filters"><div class="searchbox">${ic("search")}<input id="q" placeholder="Name, phone, ID, passport…" value="${esc(F.q)}"></div>
      <select data-ch="f" data-k="status"><option value="">All status</option>${opts(K.STATUS.map((a) => [a[0], a[1]]), F.status)}</select>
      <select data-ch="f" data-k="counsellor"><option value="">All counsellors</option>${opts(counsellors(), F.counsellor)}</select>
      <select data-ch="f" data-k="country"><option value="">All countries</option>${opts(countries, F.country)}</select>
      <select data-ch="f" data-k="priority"><option value="">Any priority</option>${opts(K.PRIORITY, F.priority)}</select>
      <select data-ch="f" data-k="source"><option value="">Any source</option>${opts(K.SOURCES, F.source)}</select></div>
    <div id="list"></div>`;
  const filtered = () => {
    const q = F.q.toLowerCase().trim();
    return all.filter(TABS[tab] ? TABS[tab][1] : () => true).filter((s) => (!F.status || s.status === F.status) && (!F.counsellor || s.counsellor_id === F.counsellor) && (!F.country || s.pref_country === F.country) && (!F.priority || s.priority === F.priority) && (!F.source || s.source === F.source)
      && (!q || [s.name, s.phone, s.whatsapp, s.sid, s.passport_no, s.email].some((v) => String(v || "").toLowerCase().includes(q))))
      .sort((a, b) => (tab === "followup" ? a.next_followup.localeCompare(b.next_followup) : String(b.created_at).localeCompare(String(a.created_at))));
  };
  const draw = () => {
    $("#list", root).innerHTML = table([
      { label: "ID", get: (s) => `<span class="mono">${esc(s.sid)}</span>` },
      { label: "Student", get: (s) => `<div class="cell-u">${av(s.name, "", s.photo)}<div><b>${esc(s.name)}</b><small>${esc(s.phone || "")}</small></div></div>` },
      { label: "Country / University", get: (s) => `${esc(s.pref_country || "—")}<small>${esc(s.pref_university || "")}</small>` },
      { label: "Status", get: (s) => stPill(s.status) }, { label: "Priority", get: (s) => priPill(s.priority) },
      { label: "Counsellor", get: (s) => (s.counsellor_id ? esc(S.uname(s.counsellor_id)) : pill("Unassigned", "red")) + ((s.team_ids || []).length ? `<small>+ ${(s.team_ids || []).map((u) => esc(S.uname(u))).join(", ")}</small>` : "") + (scope === "all" && !editAll && !S.can.mine(s) ? ` ${pill("view only", "")}` : "") },
      { label: "Next follow-up", get: fuCell }, { label: "Source", get: (s) => esc(s.source || "—") },
    ], filtered(), { empty: "No students match. Try another tab or clear the filters." });
  };
  draw();
  $("#q", root).oninput = (e) => { F.q = e.target.value; draw(); };
  on(root, {
    "ch:f": (el) => { F[el.dataset.k] = el.value; draw(); },
    row: (el) => go("#/student/" + el.dataset.id),
    new: () => newStudent(), import: importLeads,
    scope: (el) => { F.scope = el.dataset.v; sessionStorage.setItem("bfs-scope", F.scope); rerender(); },
    export: () => exportXlsx("students-" + today(), filtered().map(flat)),
  });
};
const flat = (s) => ({ "Student ID": s.sid, Name: s.name, Phone: s.phone, WhatsApp: s.whatsapp, Email: s.email, Status: lab(K.STATUS, s.status), Priority: s.priority, Source: s.source, Country: s.pref_country, University: s.pref_university, Level: s.pref_level, Subject: s.pref_subject, Intake: s.pref_intake, Budget: s.budget, Counsellor: s.counsellor_id ? S.uname(s.counsellor_id) : "", "Next follow-up": s.next_followup, Passport: s.passport_no, "Passport expiry": s.passport_expiry, Registered: String(s.created_at || "").slice(0, 10) });
CRM.flatStudent = flat;

/* পছন্দের ঘরগুলো: তালিকা থেকে বাছাই (আগের লেখা থাকলে সেটাও থাকে) */
const withCur = (list, cur) => (cur && !list.some((x) => (Array.isArray(x) ? x[0] : x) === cur) ? [...list, cur] : list);
const intakes = () => { const out = [], d = new Date(); for (let y = d.getFullYear(); out.length < 8; y++) ["Jan", "May", "Sep"].forEach((m, i) => { if (out.length < 8 && (y > d.getFullYear() || i * 4 >= d.getMonth())) out.push(`${m} ${y}`); }); return out; };
const PREF = (s = {}) => [
  { k: "pref_country", label: "Country", type: "select", options: K.COUNTRIES },
  { k: "pref_level", label: "Study level", type: "select", options: K.LEVELS },
  { k: "pref_subject", label: "Subject", type: "select", options: withCur(K.SUBJECTS, s.pref_subject) },
  { k: "subject_other", label: "Write the subject", showIf: (v) => v.pref_subject === "Other", reqIf: () => true },
  { k: "pref_intake", label: "Intake", type: "select", options: withCur(intakes(), s.pref_intake) },
  { k: "budget", label: "Budget (first year, total)", type: "select", options: withCur(K.BUDGETS.map((b) => b[0]), s.budget), hint: "Tuition + living + visa for the first year" },
];
/* সেভ করার আগে: Other subject বসানো, আর দেশ-বাজেট / লেভেল-ফলাফল মিলিয়ে দেখা */
async function checkPref(d, s = {}) {
  if (d.pref_subject === "Other") d.pref_subject = d.subject_other;
  delete d.subject_other;
  const bach = "bachelor" in d ? d.bachelor : s.bachelor, hsc = "hsc" in d ? d.hsc : s.hsc;
  if (["Masters", "PhD"].includes(d.pref_level) && "bachelor" in d && !bach) throw new Error(`For ${d.pref_level}, fill in the Bachelor result first`);
  if (d.pref_level === "PhD" && "masters" in d && !d.masters) throw new Error("For PhD, fill in the Masters result first");
  if (d.pref_level === "Bachelor" && "hsc" in d && !hsc) throw new Error("For Bachelor, fill in the HSC result first");
  const cap = (K.BUDGETS.find((b) => b[0] === d.budget) || [])[1], min = K.MIN_BUDGET[d.pref_country];
  if (cap && min && cap <= min && !(await confirmBox(`${d.pref_country} usually needs at least ${min} lakh in the first year, but the budget is “${d.budget}”. Save anyway? (Consider suggesting another country.)`, "Save anyway"))) return false;
  return true;
}
const QUICK = () => [
  { k: "name", label: "Full name", required: true }, { k: "phone", label: "Phone", type: "tel", required: true },
  { k: "whatsapp", label: "WhatsApp (if different)", type: "tel" }, { k: "email", label: "Email", type: "email" },
  { k: "source", label: "Source", type: "select", options: K.SOURCES, required: true }, { k: "priority", label: "Priority", type: "select", options: K.PRIORITY, def: "warm" },
  ...PREF().filter((f) => f.k !== "pref_intake").map((f) => ({ ...f, hint: undefined })), ...uniF("pref_country"),
  { k: "counsellor_id", label: "Assigned counsellor", type: "select", options: counsellors(), def: S.is("counsellor", "senior") ? S.me.id : "" }, { k: "next_followup", label: "Next follow-up date", type: "date", def: addDays(1) },
  { k: "note", label: "First note (what did the student say?)", type: "textarea" },
];
const FULL = (s = {}) => [
  { type: "section", label: "Personal" },
  { k: "name", label: "Full name", required: true }, { k: "phone", label: "Phone", type: "tel", required: true }, { k: "whatsapp", label: "WhatsApp", type: "tel" }, { k: "email", label: "Email", type: "email" },
  { k: "dob", label: "Date of birth", type: "date" }, { k: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] }, { k: "nationality", label: "Nationality", def: "Bangladeshi" }, { k: "referred_by", label: "Referred by (Student ID or name)" },
  { k: "present_address", label: "Present address", full: true }, { k: "permanent_address", label: "Permanent address", full: true },
  { type: "section", label: "Passport" }, { k: "passport_no", label: "Passport number" }, { k: "passport_expiry", label: "Passport expiry", type: "date", showIf: (v) => !!v.passport_no },
  { type: "section", label: "Education" }, { k: "ssc", label: "SSC result" }, { k: "hsc", label: "HSC result" }, { k: "bachelor", label: "Bachelor result" }, { k: "masters", label: "Masters result", showIf: (v) => !!v.bachelor },
  { k: "study_gap", label: "Study gap" }, { k: "test_type", label: "English test", type: "select", options: ["IELTS", "PTE", "Duolingo", "MOI", "None"] },
  { k: "test_score", label: "Test score", type: "number", showIf: (v) => ["IELTS", "PTE", "Duolingo"].includes(v.test_type), labelIf: (v) => CRM.scoreHint(CRM.scheme(v.test_type)), attrIf: (v) => { const c = CRM.scheme(v.test_type); return { min: c.min, max: c.max, step: c.step }; } },
  { type: "section", label: "Preference" }, ...PREF(s), ...uniF("pref_country", s),
  { type: "section", label: "CRM" }, { k: "source", label: "Source", type: "select", options: K.SOURCES }, { k: "priority", label: "Priority", type: "select", options: K.PRIORITY },
  { k: "counsellor_id", label: "Main counsellor", type: "select", options: counsellors() }, { k: "next_followup", label: "Next follow-up", type: "date" },
  { k: "team_ids", label: "Also assigned to (can work on this student too)", type: "multi", options: S.users().filter((u) => u.active && u.role !== "admin").map((u) => [u.id, `${u.name} (${S.ROLES[u.role]})`]) },
];
function newStudent() {
  formModal({ title: "New lead / student", fields: QUICK(), saveLabel: "Add", onSave: async (d) => {
    const dup = await S.dupStudent(d.phone);
    if (dup && !(await confirmBox(`This phone number is already in the CRM: ${dup}. Add a second record anyway?`, "Add anyway"))) return false;
    if (!(await checkPref(d))) return false;
    await readUni(d, "pref_country", "pref_university");
    const { note, ...rest } = d;
    const s = await S.add("students", { ...rest, status: "new", nationality: "Bangladeshi" });
    if (note) await S.add("notes", { student_id: s.id, type: "internal", text: note });
    S.log("create", "student", s.id, `${s.sid} ${s.name}`); toast("Added " + s.sid, "ok"); location.hash = "#/student/" + s.id;
  } });
}
/* Facebook Lead Ads / যেকোনো Excel-CSV থেকে একসাথে লিড তোলা */
function importLeads() {
  const m = modal("Import leads from Excel / CSV", `<p class="muted">Download the leads file from Meta Lead Ads (or any sheet with <b>name</b> and <b>phone</b> columns) and choose it here. Numbers that already exist are skipped.</p>
    <div class="fgrid"><label class="fld full"><span>File (.xlsx or .csv)</span><input type="file" id="lf" accept=".csv,.xlsx,.xls"></label>
    <label class="fld"><span>Source</span><select id="ls">${opts(K.SOURCES, "Facebook")}</select></label><label class="fld"><span>Assign to</span><select id="lc"><option value="">Unassigned</option>${opts(counsellors())}</select></label></div>
    <p id="lp" class="mini muted"></p><p class="err"></p><div class="modal-f"><button class="btn btn-primary" id="lgo" disabled>Import</button></div>`);
  let leads = [];
  const find = (o, re) => { const k = Object.keys(o).find((x) => re.test(x)); return k ? String(o[k] ?? "").trim() : ""; };
  $("#lf", m.body).onchange = async (e) => {
    try {
      if (!window.XLSX) throw new Error("Excel reader could not load — check the internet connection");
      const wb = XLSX.read(await e.target.files[0].arrayBuffer()), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      leads = rows.map((r) => ({ name: find(r, /full.?name|^name|student/i), phone: find(r, /phone|mobile|contact|number/i).replace(/^p:/i, ""), email: find(r, /mail/i), pref_country: find(r, /country/i) })).filter((l) => l.name && l.phone);
      $("#lp", m.body).textContent = `${rows.length} rows in file · ${leads.length} have a name and phone number.`; $("#lgo", m.body).disabled = !leads.length;
    } catch (ex) { $(".err", m.body).textContent = ex.message; }
  };
  $("#lgo", m.body).onclick = async (e) => {
    e.target.disabled = true; let ok = 0, skip = 0;
    for (const l of leads) {
      if (await S.dupStudent(l.phone)) { skip++; continue; }
      await S.add("students", { ...l, pref_country: l.pref_country || null, email: l.email || null, source: $("#ls", m.body).value, counsellor_id: $("#lc", m.body).value || null, status: "new", priority: "warm", next_followup: today(), nationality: "Bangladeshi" }); ok++;
      $("#lp", m.body).textContent = `Importing… ${ok + skip}/${leads.length}`;
    }
    S.log("import", "student", null, `${ok} leads imported, ${skip} duplicates skipped`); m.close(); toast(`${ok} leads added, ${skip} duplicates skipped`, "ok"); rerender();
  };
}

/* ---------- student profile ---------- */
const dl = (pairs) => `<dl class="dl">${pairs.filter((p) => p[1] != null && p[1] !== "").map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("") || '<dd class="muted">Not filled in yet</dd>'}</dl>`;
const e = esc;
CRM.views.student = (root, [id, tab = "overview"]) => {
  const s = S.get("students", id);
  if (!s) { root.innerHTML = `<div class="empty">This student was not found, or you don't have access. <a href="#/students">Back to list</a></div>`; return; }
  const edit = S.can.editStudent(s), wa = String(s.whatsapp || s.phone || "").replace(/\D/g, "").replace(/^0/, "880");
  const tabs = [["overview", "Overview & Timeline"]];
  if (edit || S.can.admission()) tabs.push(["admission", `Applications & Visa <em>${S.rows("applications").filter((a) => a.student_id === id).length}</em>`]);
  if (S.can.docs(s)) tabs.push(["docs", `Documents <em>${CRM.docTypes(s).filter((t) => S.rows("documents").some((d) => d.student_id === id && d.type === t && d.status !== "pending")).length}/${CRM.docTypes(s).length}</em>`]);
  if (edit || S.can.finance()) tabs.push(["payments", "Payments"]);
  if (!tabs.some((t) => t[0] === tab)) tab = "overview";
  root.innerHTML = `
    <p><a href="#/students">${ic("back")} All students</a></p>
    <div class="shead" id="shead">${edit ? `<label class="photo" title="Change profile picture">${av(s.name, "lg", s.photo)}<input type="file" accept="image/*" hidden data-ch="photo"></label>` : av(s.name, "lg", s.photo)}
      <div><h1>${e(s.name)}</h1><div class="meta"><span class="mono">${e(s.sid)}</span>${edit ? "" : stPill(s.status)}${priPill(s.priority)}<span class="muted mini">Counsellor: <b>${e(s.counsellor_id ? S.uname(s.counsellor_id) : "Unassigned")}</b>${(s.team_ids || []).length ? ` + ${(s.team_ids || []).map((u) => e(S.uname(u))).join(", ")}` : ""}</span>${s.status === "lost" && s.lost_reason ? `<span class="muted mini">Reason: ${e(s.lost_reason)}</span>` : ""}</div></div>
      <div class="act">${s.phone ? `<a class="btn btn-line sm" href="tel:${e(s.phone)}">${ic("phone")} Call</a><a class="btn btn-line sm" target="_blank" rel="noopener" href="https://wa.me/${e(wa)}">WhatsApp</a>` : ""}
        ${edit ? `<select data-ch="status" aria-label="Status">${opts(K.STATUS.map((a) => [a[0], a[1]]), s.status)}</select><button class="btn btn-line sm" data-act="edit">${ic("edit")} Edit</button>` : ""}
        ${S.can.deleteStudent() ? `<button class="btn btn-bad sm" data-act="del">${ic("trash")}</button>` : ""}</div></div>
    ${edit ? "" : `<div class="viewonly">👁 <b>শুধু দেখার জন্য।</b> এই student আপনাকে assign করা নেই, তাই কিছু বদলাতে বা নোট লিখতে পারবেন না। কাজ করতে হলে Manager-কে বলুন আপনাকেও assign করতে (Edit → “Also assigned to”)।</div>`}
    <div class="tabs">${tabs.map(([k, l]) => `<a href="#/student/${id}/${k}" class="${k === tab ? "on" : ""}">${l}</a>`).join("")}</div>
    <div id="tabBody"></div>`;
  on($("#shead", root), {
    "ch:photo": async (inp) => { try { await S.set("students", s.id, { photo: await CRM.ui.shrinkImage(inp.files[0]) }); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
    "ch:status": async (el) => {
      const to = el.value;
      if (to === "lost") return formModal({ title: "Mark as lost", fields: [{ k: "reason", label: "Why was this student lost?", type: "textarea", required: true }], onSave: (d) => setStatus(s, to, d.reason) }), (el.value = s.status);
      await setStatus(s, to); toast("Status updated", "ok"); rerender();
    },
    edit: () => formModal({ title: "Edit " + s.sid, wide: true, fields: FULL(s), values: { ...s, ...uniVals(s.pref_country, s.pref_university), test_score: s.test_score == null || isNaN(+s.test_score) ? "" : +s.test_score }, onSave: async (d) => {
      if (d.test_score != null) { const c = CRM.scheme(d.test_type); if (!CRM.scoreOk(c, d.test_score)) throw new Error(`Test score must be a ${CRM.scoreHint(c)}`); d.test_score = String(d.test_score); }
      if (d.passport_expiry && d.passport_expiry < today()) throw new Error("This passport has already expired — check the date");
      if (d.dob && d.dob > today()) throw new Error("Date of birth cannot be in the future");
      if (!(await checkPref(d, s))) return false;
      await readUni(d, "pref_country", "pref_university");
      d.team_ids = (d.team_ids || []).filter((u) => u !== d.counsellor_id);
      if (!S.can.assign() && d.counsellor_id !== s.counsellor_id && !(await confirmBox("You are transferring this student to another counsellor. You may lose access. Continue?"))) return false; if (d.counsellor_id !== s.counsellor_id) S.log("transfer", "student", s.id, `${s.sid} → ${S.uname(d.counsellor_id)}`); await S.set("students", s.id, d); S.log("update", "student", s.id, s.sid); } }),
    del: async () => {
      if (S.rows("invoices").some((x) => x.student_id === id) || S.rows("enrollments").some((x) => x.student_id === id)) return toast("This student has invoices or a course enrollment, so the record must be kept. Mark as Lost instead.", "bad");
      if (!(await confirmBox(`Permanently delete ${s.name} (${s.sid}) with their notes, applications, visa file and documents? This cannot be undone.`, "Delete"))) return;
      try { for (const t of ["notes", "applications", "visas", "documents"]) for (const r of S.rows(t).filter((x) => x.student_id === id)) await S.del(t, r.id); await S.del("students", id); S.log("delete", "student", id, `${s.sid} ${s.name}`); location.hash = "#/students"; }
      catch (ex) { toast(ex.message, "bad"); }
    },
  });
  const body = $("#tabBody", root);
  if (tab === "admission") return CRM.parts.admission(body, s, edit);
  if (tab === "docs") return CRM.parts.docs(body, s);
  if (tab === "payments") return CRM.parts.payments(body, s);

  const notes = S.rows("notes").filter((n) => n.student_id === id).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const enr = S.rows("enrollments").filter((x) => x.student_id === id), refs = S.rows("students").filter((x) => x.referred_by && x.referred_by.trim() === s.sid).length;
  const age = daysTo(s.passport_expiry);
  body.innerHTML = `<div class="split"><div class="stack">
      <div class="card"><h3>Contact & personal</h3>${dl([["Phone", e(s.phone)], ["WhatsApp", e(s.whatsapp)], ["Email", e(s.email)], ["Date of birth", s.dob ? fmtD(s.dob) : ""], ["Gender", e(s.gender)], ["Nationality", e(s.nationality)], ["Present address", e(s.present_address)], ["Permanent address", e(s.permanent_address)],
        ["Passport", S.can.docs(s) ? e(s.passport_no) : s.passport_no ? "•••• (restricted)" : ""], ["Passport expiry", s.passport_expiry ? `${fmtD(s.passport_expiry)} ${age < 180 ? pill(age < 0 ? "Expired" : `${age} days left`, "red") : ""}` : ""],
        ["Source", e(s.source)], ["Referred by", e(s.referred_by)], ["Registered", fmtD(s.created_at)], ["Entered by", e(S.uname(s.created_by))]])}</div>
      <div class="card"><h3>Education & preference</h3>${dl([["SSC", e(s.ssc)], ["HSC", e(s.hsc)], ["Bachelor", e(s.bachelor)], ["Masters", e(s.masters)], ["Study gap", e(s.study_gap)], ["English test", s.test_type ? e(`${s.test_type} ${s.test_score || ""}`) : ""],
        ["Country", e(s.pref_country)], ["University", e(s.pref_university)], ["Study level", e(s.pref_level)], ["Subject", e(s.pref_subject)], ["Intake", e(s.pref_intake)], ["Budget", e(s.budget)]])}</div>
      ${enr.length ? `<div class="card"><h3>IELTS / English course</h3>${enr.map((x) => { const b = S.get("batches", x.batch_id), mk = S.rows("mocks").filter((m) => m.enrollment_id === x.id).sort((a, b2) => String(b2.date).localeCompare(String(a.date)))[0]; return `<p><a href="#/batch/${x.batch_id}"><b>${e(b ? b.name : "Batch")}</b></a> ${pill(x.status, x.status === "active" ? "green" : "")}${mk ? `<br><span class="muted">Latest ${e(mk.kind)}: overall <b>${mk.overall}</b> (${CRM.scheme(b && b.course_type).parts.map((p, i) => `${p} ${mk[["listening", "reading", "writing", "speaking"][i]]}`).join(" · ")})</span>` : ""}</p>`; }).join("")}</div>` : ""}
      ${edit ? `<div class="card"><h3>Student portal ${s.portal_pin ? pill("ON", "green") : pill("OFF", "")}</h3><p class="muted mini">The student can see their own progress live (status, applications, visa dates, missing documents, dues) with their Student ID and a 6-digit PIN. They cannot see files, notes or anyone else.</p>
        ${s.portal_pin ? `<p>PIN: <b class="mono">${e(s.portal_pin)}</b></p><button class="btn btn-primary sm" data-act="pSlip">${ic("print")} Print access slip</button> <button class="btn btn-line sm" data-act="pNew">New PIN</button> <button class="btn btn-bad sm" data-act="pOff">Turn off</button>` : `<button class="btn btn-primary sm" data-act="pNew">Give portal access</button>`}</div>` : ""}
      <div class="card"><h3>Departure & alumni ${edit ? `<button class="btn btn-line sm" data-act="depart">${ic("edit")} Update</button>` : ""}</h3>${dl([["Departure date", s.departure_date ? fmtD(s.departure_date) : ""], ["Flight", e(s.flight)], ["Arrival confirmed", s.departure_date ? (s.arrival_confirmed ? pill("Yes", "green") : pill("Not yet", "amber")) : ""], ["Accommodation", e(s.accommodation)], ["Emergency contact", e(s.emergency_contact)], ["Students referred", refs ? `<b>${refs}</b>` : ""]])}</div>
    </div>
    <div class="card"><h3>Timeline <span class="muted mini">${notes.length} entries</span></h3>
      ${edit ? `<form class="noteform" id="noteForm"><select id="nt">${opts(K.NOTE_TYPES, "call")}</select><div class="muted mini" style="align-self:center">Calls, WhatsApp, counselling advice, complaints — everything goes here.</div>
        <textarea id="nx" rows="3" placeholder="What was discussed? Country / university / budget advice, next step…" required></textarea>
        <div class="row"><label class="mini muted">Next follow-up <input type="date" id="nf" value="${e(s.next_followup || "")}"></label><button class="btn btn-primary sm" style="margin-left:auto">${ic("plus")} Add to timeline</button></div></form>` : ""}
      <ul class="tl">${notes.map((n) => `<li class="${e(n.type)}"><b>${e(n.type === "status" ? "Status changed" : lab(K.NOTE_TYPES, n.type))}</b> <span class="muted mini">· ${e(S.uname(n.created_by))} · ${fmtDT(n.created_at)}</span><p>${e(n.text)}</p></li>`).join("") || '<li class="muted">No history yet.</li>'}</ul></div></div>`;
  const nf = $("#noteForm", body);
  if (nf) nf.onsubmit = async (ev) => {
    ev.preventDefault();
    try {
      const type = $("#nt", body).value, fu = $("#nf", body).value;
      await S.add("notes", { student_id: id, type, text: $("#nx", body).value.trim() });
      if (fu !== (s.next_followup || "")) await S.set("students", id, { next_followup: fu || null });
      if (s.status === "new" && ["call", "whatsapp", "meeting", "email"].includes(type)) await setStatus(s, "contacted");
      if (rank(s.status) < 2 && type === "counselling") await setStatus(s, "counselled");
      rerender();
    } catch (ex) { toast(ex.message, "bad"); }
  };
  const pUrl = new URL("student.html", location.href).href;
  on(body, {
    pNew: async () => { if (s.portal_pin && !(await confirmBox("Make a new PIN? The old PIN will stop working."))) return; await S.set("students", id, { portal_pin: S.newPin() }); S.log("portal-on", "student", id, s.sid); rerender(); },
    pOff: async () => { if (await confirmBox("Turn off portal access for this student?")) { await S.set("students", id, { portal_pin: null }); S.log("portal-off", "student", id, s.sid); rerender(); } },
    pSlip: () => CRM.ui.printDoc("Student portal access", `<h1>আপনার ফাইলের অগ্রগতি অনলাইনে দেখুন</h1><p>${e(s.name)}</p><dl class="kv"><dt>ওয়েবসাইট</dt><dd>${e(pUrl)}</dd><dt>Student ID</dt><dd class="big">${e(s.sid)}</dd><dt>PIN</dt><dd class="big">${e(s.portal_pin)}</dd><dt>Counsellor</dt><dd>${e(s.counsellor_id ? S.uname(s.counsellor_id) : "")}</dd></dl>
      <div class="note">এই PIN কাউকে দেবেন না। PIN ভুলে গেলে বা বদলাতে চাইলে আপনার counsellor-কে বলুন।</div><p>ওয়েবসাইটে গিয়ে Student ID আর PIN দিলে আবেদন, ভিসা, কাগজপত্র আর পেমেন্টের বর্তমান অবস্থা দেখতে পাবেন।</p>`),
    depart: () => formModal({ title: "Departure & alumni", values: s, fields: [{ k: "departure_date", label: "Departure date", type: "date" }, { k: "flight", label: "Flight details" }, { k: "accommodation", label: "Accommodation", full: true }, { k: "emergency_contact", label: "Emergency contact", full: true }, { k: "arrival_confirmed", label: "Arrival confirmed", type: "checkbox" }],
    onSave: async (d) => {
      if (d.departure_date && !["visa_approved", "departed"].includes(s.status) && !(await confirmBox("This student's visa is not marked as approved yet. Save the departure anyway?"))) return false;
      if (d.arrival_confirmed && !d.departure_date) throw new Error("Give the departure date first");
      await S.set("students", id, d); if (d.departure_date && d.departure_date <= today()) await CRM.bump(id, "departed"); } }) });
};
})();
