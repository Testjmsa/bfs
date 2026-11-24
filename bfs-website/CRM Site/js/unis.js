/* ===== Universities & EMGS: university / programme / দেশ / EMGS ফি (website-ও এটাই দেখায়) + সব student-এর EMGS অগ্রগতি ===== */
(() => {
const CRM = window.CRM, { S, K } = CRM;
const { esc, $, fmtD, fmtDT, ic, pill, toast, rerender, confirmBox, opts, formModal, modal, table, on, exportXlsx, today } = CRM.ui;
const rm = (n) => (n == null ? "—" : "RM " + Math.round(n).toLocaleString("en-IN"));
const safe = (u) => (/^https?:\/\//i.test(String(u || "")) ? String(u) : "");
const LVL = [["E", "English programme"], ["C", "Certificate"], ["F", "Foundation"], ["D", "Diploma"], ["B", "Bachelor"], ["M", "Masters"], ["P", "PhD"]];
const FLD = () => (typeof FIELDS !== "undefined" ? Object.entries(FIELDS).map(([k, v]) => [k, v.en]) : [["business", "Business"], ["it", "IT"]]);

/* ---------- forms ---------- */
function uniForm(row) {
  const cs = K.COUNTRIES.filter((c) => c !== "Other");
  formModal({ title: row ? "Edit university" : "Add university", values: row || { country: "" },
    intro: row ? "" : '<p class="muted mini">First choose the country (add a new country with “Add country” if it is not in the list). Malaysian universities also appear on the website.</p>',
    fields: [{ k: "country", label: "Country", type: "select", options: cs, required: true }, { k: "name", label: "University name", required: true, full: true }, { k: "city", label: "City / campus" },
      { k: "type", label: "Type", type: "select", options: [["private", "Private"], ["public", "Public"]], def: "private" },
      { k: "emgs_rm", label: "EMGS / visa fee (RM)", type: "number", showIf: (v) => v.country === "Malaysia", hint: "From the university's official website" },
      { k: "url", label: "Official website (fee page)", type: "url", full: true, ph: "https://…" }, { k: "about", label: "Short description (shown on the website)", type: "textarea", showIf: (v) => v.country === "Malaysia" }],
    onSave: async (d) => {
      if (d.url && !safe(d.url)) throw new Error("The link must start with https://");
      const c = S.catalog(), id = row ? row.id : window.BFSCAT.slug(d.name);
      if (!row && S.allUnis().some((u) => u.name.trim().toLowerCase() === d.name.trim().toLowerCase())) throw new Error("This university is already in the list");
      const { emgs_rm, ...u } = d;
      if (row) c.unis = c.unis.map((x) => (x.id === row.id || x.name === row.name ? { ...x, ...u, id } : x)); else c.unis.push({ ...u, id });
      if (+emgs_rm > 0) c.fees[id] = +emgs_rm; else delete c.fees[id];
      await S.saveCatalog(c, (row ? "university edited: " : "university added: ") + d.name);
    } });
}
function feeForm(u) {
  const e = S.emgsOf(u.name) || {};
  formModal({ title: "EMGS / visa fee — " + u.name, values: { rm: e.rm },
    intro: `<p class="muted mini">The fee you save here is shown on the website and in the student portal, and the daily automatic update will not change it. Leave it empty to go back to the website's own figure.</p>`,
    fields: [{ k: "rm", label: "EMGS / visa fee (RM)", type: "number", hint: "e.g. 3600" }],
    onSave: async (d) => {
      if (d.rm != null && !(d.rm >= 100 && d.rm <= 20000)) throw new Error("Fee must be between RM 100 and RM 20,000");
      const c = S.catalog(); if (d.rm) c.fees[u.id] = d.rm; else delete c.fees[u.id];
      await S.saveCatalog(c, `EMGS fee ${u.name}: ${d.rm ? "RM " + d.rm : "reset"}`);
    } });
}
function progModal(u) {
  const draw = () => {
    const c = S.catalog(), mine = c.progs[u.id] || [], all = S.uniPrograms(u.id), baseN = all.length - mine.length;
    m.body.innerHTML = `<p class="muted mini">${u.country === "Malaysia" ? "These programmes appear on the website (university page, cost calculator, eligibility)." : "Programmes of this university (CRM only)."} Programmes from the website file are shown grey; ones added here can be removed.</p>
      ${S.can.catalog() ? `<div class="fgrid">
        <label class="fld"><span>Level</span><select id="pl">${opts(LVL, "B")}</select></label><label class="fld"><span>Subject area</span><select id="pf">${opts(FLD())}</select></label>
        <label class="fld full"><span>Programme name</span><input id="pn" placeholder="e.g. Bachelor of Computer Science (Hons)"></label>
        <label class="fld"><span>Duration (years)</span><input id="py" type="number" step="0.5" min="0.5" value="3"></label><label class="fld"><span>Total course fee (${u.country === "Malaysia" ? "RM" : "local currency"})</span><input id="pfee" type="number" min="1"></label></div>
        <p class="err"></p><div class="modal-f"><button class="btn btn-primary" id="padd">${ic("plus")} Add programme</button></div>` : ""}
      <div style="max-height:320px;overflow:auto;margin-top:10px">${all.map((p, i) => `<div class="rowcard" style="cursor:default;${i < baseN ? "opacity:.6" : ""}"><div><b>${esc(p[2])}</b><small>${esc((LVL.find((l) => l[0] === p[0]) || [])[1] || p[0])} · ${p[3]} yr · ${p[4].toLocaleString("en-IN")}${p[5] ? "–" + p[5].toLocaleString("en-IN") : ""}</small></div>${i >= baseN && S.can.catalog() ? `<button class="btn btn-line sm" data-rm="${i - baseN}">${ic("trash")}</button>` : ""}</div>`).join("") || '<div class="empty">No programmes yet.</div>'}</div>`;
    const add = $("#padd", m.body);
    if (add) add.onclick = async () => {
      const p = [$("#pl", m.body).value, $("#pf", m.body).value, $("#pn", m.body).value.trim(), +$("#py", m.body).value, +$("#pfee", m.body).value];
      if (!window.BFSCAT.okProg(p)) return ($(".err", m.body).textContent = "Fill in the name, duration and fee");
      const c = S.catalog(); c.progs[u.id] = [...(c.progs[u.id] || []), p];
      try { await S.saveCatalog(c, `programme added: ${u.name} — ${p[2]}`); toast("Programme added", "ok"); draw(); rerender(); } catch (ex) { $(".err", m.body).textContent = ex.message; }
    };
    m.body.querySelectorAll("[data-rm]").forEach((b) => (b.onclick = async () => {
      const c = S.catalog(), list = c.progs[u.id] || [], gone = list[+b.dataset.rm];
      if (!(await confirmBox(`Remove “${gone[2]}”?`, "Remove"))) return;
      c.progs[u.id] = list.filter((_, j) => j !== +b.dataset.rm); if (!c.progs[u.id].length) delete c.progs[u.id];
      await S.saveCatalog(c, `programme removed: ${u.name} — ${gone[2]}`); draw(); rerender();
    }));
  };
  const m = modal("Programmes — " + u.name, "", { wide: true });
  draw();
}
function countryForm() {
  formModal({ title: "Add country", fields: [{ k: "name", label: "Country name", required: true, ph: "e.g. New Zealand" }], onSave: async (d) => {
    const n = d.name.trim().replace(/\s+/g, " "); if (K.COUNTRIES.some((c) => c.toLowerCase() === n.toLowerCase())) throw new Error("Already in the list");
    const c = S.catalog(); c.countries.push(n); await S.saveCatalog(c, "country added: " + n);
  } });
}

/* ---------- Universities page ---------- */
const UF = { q: "", country: "" };
CRM.views.unis = (root) => {
  const boss = S.can.catalog(), cat = S.catalog(), all = S.allUnis(), stu = S.rows("students"), apps = S.rows("applications");
  const count = (u) => new Set([...stu.filter((s) => s.pref_university && S.findUni(s.pref_university)?.id === u.id).map((s) => s.id), ...apps.filter((a) => S.findUni(a.university)?.id === u.id).map((a) => a.student_id)]).size;
  const countries = K.COUNTRIES.filter((c) => c !== "Other");
  root.innerHTML = `<div class="ph"><div><span class="kicker">Admission</span><h1>Universities & EMGS fees</h1><p>${all.length} universities in ${countries.length} countries</p></div>
    <div class="ph-act">${boss ? `<button class="btn btn-line" data-act="addC">${ic("plus")} Add country</button><button class="btn btn-primary" data-act="addU">${ic("plus")} Add university</button>` : ""}</div></div>
    ${CRM.ui.guide("unis", ["অফিস যেসব university নিয়ে কাজ করে তার তালিকা। Student বা Application-এর ফর্মে দেশ বাছলে এখান থেকেই university বাছাই হয়।",
      "<b>এখানে যা থাকে website-ও তাই দেখায়:</b> মালয়েশিয়ার university, programme আর EMGS ফি এখানে বদলালে website-এর university পেজ, খরচ ক্যালকুলেটর আর student portal-এ সেটাই দেখায়।",
      boss ? "EMGS ফি বদলাতে ফি-র পাশের ✏️; programme যোগ করতে <b>Programmes</b>; নতুন university-তে আগে দেশ বাছতে হয় (দেশ না থাকলে <b>Add country</b>)।" : "নতুন university, programme বা ফি বদলাতে Manager/Operation/Senior-কে বলুন।",
      "ফি-র পাশে লেখা: <b>office</b> = অফিসের বসানো, <b>live</b> = ইউনিভার্সিটির সাইট থেকে অটো, <b>approx.</b> = এখনো যাচাই হয়নি।"])}
    <div class="filters"><div class="searchbox">${ic("search")}<input id="q" placeholder="Search university or city…" value="${esc(UF.q)}"></div>
      <select data-ch="c"><option value="">All countries</option>${opts(countries, UF.country)}</select></div>
    <div id="ul"></div>
    ${cat.countries.length && boss ? `<div class="card" style="margin-top:16px"><h3>Countries added in the CRM</h3>${cat.countries.map((c) => `<span class="pill" style="margin:0 6px 6px 0">${esc(c)} <button class="btn-link" data-act="rmC" data-c="${esc(c)}" title="Remove">✕</button></span>`).join("")}</div>` : ""}`;
  const rows = () => { const q = UF.q.toLowerCase(); return all.filter((u) => (!UF.country || u.country === UF.country) && (!q || [u.name, u.city].some((v) => String(v || "").toLowerCase().includes(q)))); };
  const draw = () => ($("#ul", root).innerHTML = table([
    { label: "University", get: (u) => `<b>${esc(u.name)}</b><small>${esc(u.city || "")}${u.custom ? " · added in CRM" : ""}</small>` },
    { label: "Country", get: (u) => esc(u.country) },
    { label: "EMGS / visa fee", get: (u) => { if (u.country !== "Malaysia") return '<span class="muted">—</span>'; const e = S.emgsOf(u.name) || {}, link = safe(e.url);
      return `<b>${rm(e.rm)}</b> ${e.crm ? pill("office", "blue") : e.live ? pill("live " + (typeof e.live === "string" ? e.live : ""), "green") : e.approx ? pill("approx.", "amber") : ""}${e.inFee ? ` ${pill("in tuition", "")}` : ""}${boss ? ` <button class="btn-link" data-act="fee" data-id="${esc(u.id)}" title="Edit fee">✏️</button>` : ""}<small>${esc(e.src || "")}${link ? ` · <a href="${esc(link)}" target="_blank" rel="noopener">source ↗</a>` : ""}</small>`; } },
    { label: "Programmes", cls: "nowrap", get: (u) => `<button class="btn btn-line sm" data-act="progs" data-id="${esc(u.id)}">${u.programs || 0} · ${boss ? "Add / view" : "View"}</button>` },
    { label: "Our students", cls: "right", get: (u) => count(u) || "—" },
    { label: "", cls: "right nowrap", get: (u) => (u.custom && boss ? `<button class="btn btn-line sm" data-act="editU" data-id="${esc(u.id)}">${ic("edit")}</button><button class="btn btn-line sm" data-act="rmU" data-id="${esc(u.id)}">${ic("trash")}</button>` : u.custom ? "" : '<span class="muted mini">from website</span>') },
  ], rows(), { empty: "No university matches." }));
  draw(); $("#q", root).oninput = (e) => { UF.q = e.target.value; draw(); };
  const uni = (el) => all.find((u) => u.id === el.dataset.id);
  on(root, {
    "ch:c": (el) => { UF.country = el.value; draw(); },
    addU: () => uniForm(), addC: countryForm, fee: (el) => feeForm(uni(el)), progs: (el) => progModal(uni(el)),
    editU: (el) => { const u = uni(el), c = S.catalog().unis.find((x) => (x.id || window.BFSCAT.slug(x.name)) === u.id) || {}; uniForm({ ...c, id: u.id, emgs_rm: S.catalog().fees[u.id] || c.emgs_rm }); },
    rmU: async (el) => { const u = uni(el); if (!(await confirmBox(`Remove “${u.name}” and its programmes from the list? Students keep their data.`, "Remove"))) return; const c = S.catalog(); c.unis = c.unis.filter((x) => (x.id || window.BFSCAT.slug(x.name)) !== u.id); delete c.fees[u.id]; delete c.progs[u.id]; try { await S.saveCatalog(c, "university removed: " + u.name); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
    rmC: async (el) => { const n = el.dataset.c, c = S.catalog(); if (c.unis.some((u) => u.country === n)) return toast("Remove that country's universities first", "bad"); c.countries = c.countries.filter((x) => x !== n); try { await S.saveCatalog(c, "country removed: " + n); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
  });
};

/* ---------- EMGS page: মালয়েশিয়ার সব student-এর EMGS অগ্রগতি ---------- */
const EF = { tab: "paid", q: "" };
async function runCheck(list, quiet) {
  try { const r = await S.emgsCheck(list); if (!quiet) toast(`Checked ${r.done} on EMGS · ${r.found} found`, "ok"); return true; }
  catch (ex) { if (!quiet) toast(ex.message, "bad"); return false; }
}
CRM.views.emgs = (root) => {
  const ctl = S.can.emgsCtl();
  const list = S.rows("students").filter((s) => S.isMalay(s) && s.status !== "lost").map((s) => ({ s, paid: S.emgsPaid(s), uni: S.findUni(s.pref_university) }));
  const stage = (x) => (!x.paid ? "unpaid" : !x.s.passport_no ? "nopass" : x.s.emgs_found === false || !x.s.emgs_percent ? "notstarted" : x.s.emgs_percent >= 100 ? "done" : "progress");
  const T = { paid: ["EMGS fee paid", (x) => x.paid], notstarted: ["Not started / 0%", (x) => ["notstarted", "nopass"].includes(stage(x))], progress: ["In progress", (x) => stage(x) === "progress"], done: ["100% done", (x) => stage(x) === "done"], unpaid: ["Fee not paid", (x) => !x.paid], hidden: ["Hidden from student", (x) => x.paid && x.s.emgs_show === false] };
  const due = list.filter((x) => x.paid && x.s.passport_no && x.s.emgs_percent !== 100);
  const last = +localStorage.getItem((window.CRM_CONFIG || {}).storeKey + "emgs-last") || 0;
  root.innerHTML = `<div class="ph"><div><span class="kicker">Malaysia</span><h1>EMGS progress</h1><p>${list.filter((x) => x.paid).length} students paid the EMGS fee · last automatic check ${last ? fmtDT(new Date(last).toISOString()) : "never"}</p></div>
    <div class="ph-act">${S.can.exportData() ? `<button class="btn btn-line" data-act="x">${ic("down")} Excel</button>` : ""}<button class="btn btn-primary" data-act="checkAll">↻ Check all on EMGS (${due.length})</button></div></div>
    ${CRM.ui.guide("emgs", ["এখানে মালয়েশিয়ার সব student-এর EMGS অগ্রগতি। EMGS ফি জমা হলে (Finance-এ “EMGS Fee” পুরো পরিশোধ, অথবা Visa ফাইলে “EMGS fee paid”) student এই তালিকায় আসে।",
      "% নিজে থেকে আসে: CRM প্রতি ৬ ঘণ্টায় EMGS-এর “Track My Application” পেজে পাসপোর্ট নাম্বার + Bangladesh দিয়ে খুঁজে আনে। এখনই আনতে <b>Check all on EMGS</b> বা সারির <b>↻</b>।",
      "“Not started / 0%” ট্যাবে কার EMGS এখনো শুরু হয়নি বা % ওঠেনি; পাসপোর্ট নাম্বার না থাকলে লাল লেখা আসে।",
      ctl ? "<b>Student দেখবে?</b> সুইচ বন্ধ করলে সেই student portal আর website-এ EMGS % দেখবে না — তার বদলে “আপনার EMGS প্রসেসিং চলছে, counsellor জানাবেন” দেখবে।" : "কোন student EMGS % দেখবে তা Manager/Operation/Senior ঠিক করেন।",
      "EMGS-এর সাইট থেকে না এলে সারির ✏️ দিয়ে নিজে % আর অবস্থা লেখা যায়।"])}
    <div class="tabs">${Object.keys(T).map((k) => `<a href="#" data-act="tab" data-k="${k}" class="${k === EF.tab ? "on" : ""}">${T[k][0]} <em>${list.filter(T[k][1]).length}</em></a>`).join("")}</div>
    <div class="filters"><div class="searchbox">${ic("search")}<input id="q" placeholder="Name, Student ID, passport…" value="${esc(EF.q)}"></div></div><div id="el"></div>`;
  const rows = () => { const q = EF.q.toLowerCase(); return list.filter(T[EF.tab][1]).filter((x) => !q || [x.s.name, x.s.sid, x.s.passport_no].some((v) => String(v || "").toLowerCase().includes(q))).sort((a, b) => (a.s.emgs_percent || 0) - (b.s.emgs_percent || 0)); };
  const bar = (p) => `<div class="emgs-bar" style="width:120px;margin:0 0 2px"><i style="width:${p || 0}%"></i></div>`;
  const draw = () => ($("#el", root).innerHTML = table([
    { label: "Student", get: (x) => `<a href="#/student/${x.s.id}"><b>${esc(x.s.name)}</b></a><small class="mono">${esc(x.s.sid)} · ${esc(S.uname(x.s.counsellor_id))}</small>` },
    { label: "Passport", get: (x) => (x.s.passport_no ? `<span class="mono">${esc(x.s.passport_no)}</span>` : '<span class="late">No passport no.</span>') },
    { label: "University · fee", get: (x) => { const e = S.emgsOf(x.s.pref_university) || {}; return `${esc(x.uni ? x.uni.name : x.s.pref_university || "—")}<small>${e.rm ? rm(e.rm) : ""} · ${x.paid ? pill("paid", "green") : pill("not paid", "amber")}</small>`; } },
    { label: "EMGS progress", get: (x) => (!x.paid ? '<span class="muted">—</span>' : x.s.emgs_found === false ? `${pill("Not on EMGS yet", "amber")}` : x.s.emgs_percent != null ? `${bar(x.s.emgs_percent)}<b>${x.s.emgs_percent}%</b><small>${esc(x.s.emgs_status || "")}</small>` : pill("Not checked", "")) },
    { label: "Checked", get: (x) => (x.s.emgs_checked ? `<small>${fmtDT(x.s.emgs_checked)}</small>` : "—") },
    { label: "Student sees", get: (x) => (!x.paid ? "—" : ctl ? `<label class="sw-mini"><input type="checkbox" data-ch="show" data-id="${x.s.id}" ${x.s.emgs_show !== false ? "checked" : ""}> ${x.s.emgs_show !== false ? "Shown" : "Hidden"}</label>` : x.s.emgs_show !== false ? pill("Shown", "green") : pill("Hidden", "")) },
    { label: "", cls: "right nowrap", get: (x) => (x.paid && x.s.passport_no ? `<button class="btn btn-line sm" data-act="one" data-id="${x.s.id}" title="Check on EMGS now">↻</button>` : "") + (x.paid && S.can.editStudent(x.s) ? `<button class="btn btn-line sm" data-act="man" data-id="${x.s.id}" title="Write manually">${ic("edit")}</button>` : "") },
  ], rows(), { empty: "No students here." }));
  draw(); $("#q", root).oninput = (e) => { EF.q = e.target.value; draw(); };
  const st = (el) => S.get("students", el.dataset.id);
  on(root, {
    tab: (el, e) => { e.preventDefault(); EF.tab = el.dataset.k; rerender(); },
    checkAll: async (el) => { el.disabled = true; el.textContent = "Checking… (may take a minute)"; await runCheck(due.map((x) => x.s)); rerender(); },
    one: async (el) => { el.disabled = true; await runCheck([st(el)]); rerender(); },
    man: (el) => { const s = st(el); formModal({ title: "EMGS — " + s.name, values: { emgs_percent: s.emgs_percent, emgs_status: s.emgs_status }, fields: [{ k: "emgs_percent", label: "EMGS progress %", type: "number", min: 0, max: 100, step: 1 }, { k: "emgs_status", label: "Status (the student sees this)", ph: "e.g. Approval letter issued" }],
      onSave: async (d) => { if (d.emgs_percent != null && (d.emgs_percent < 0 || d.emgs_percent > 100)) throw new Error("Progress must be 0–100"); await S.set("students", s.id, { ...d, emgs_found: true, emgs_checked: new Date().toISOString() }); S.log("emgs", "student", s.id, `${s.sid}: ${d.emgs_percent}% (manual)`); } }); },
    "ch:show": async (el) => { const s = st(el); try { await S.set("students", s.id, { emgs_show: el.checked }); S.log("emgs-show", "student", s.id, `${s.sid}: ${el.checked ? "shown" : "hidden"}`); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
    x: () => exportXlsx("emgs-" + today(), rows().map((x) => ({ "Student ID": x.s.sid, Name: x.s.name, Passport: x.s.passport_no, University: x.s.pref_university, "Fee paid": x.paid ? "Yes" : "No", "EMGS %": x.s.emgs_percent, Status: x.s.emgs_status, "Last checked": x.s.emgs_checked, "Student sees": x.s.emgs_show !== false ? "Yes" : "No" }))),
  });
};
/* CRM খোলা থাকলে প্রতি ৬ ঘণ্টায় একবার নিজে থেকে EMGS চেক (যার অনুমতি আছে তার ব্রাউজার থেকে) */
CRM.autoEmgs = () => {
  try {
    if (!S.LIVE || !S.me || !(S.can.admission() || S.can.emgsCtl())) return;      // DEMO-র নমুনা পাসপোর্ট নিয়ে EMGS-এ খোঁজে না
    const key = (window.CRM_CONFIG || {}).storeKey + "emgs-last", last = +localStorage.getItem(key) || 0;
    if (Date.now() - last < 6 * 3600e3) return;
    localStorage.setItem(key, String(Date.now()));
    const due = S.rows("students").filter((s) => S.isMalay(s) && s.passport_no && s.emgs_percent !== 100 && S.emgsPaid(s)).sort((a, b) => String(a.emgs_checked || "").localeCompare(String(b.emgs_checked || "")));
    if (due.length) runCheck(due, true).then((ok) => ok && window.dispatchEvent(new Event("crm:render")));
  } catch (e) { console.warn(e); }
};
})();
