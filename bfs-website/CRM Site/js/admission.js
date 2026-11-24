/* ===== Applications, Visa, Documents (version history সহ) ===== */
(() => {
const CRM = window.CRM, { S, K, lab, tone } = CRM;
const { esc, $, today, daysTo, fmtD, fmtDT, money, ic, pill, av, toast, go, rerender, modal, confirmBox, opts, formModal, table, on, exportXlsx } = CRM.ui;
const P = CRM.parts;
const sName = (id) => { const s = S.get("students", id); return s ? s : { name: "—", sid: "" }; };
const stuCell = (id) => { const s = sName(id); return `<div class="cell-u">${av(s.name)}<div><b>${esc(s.name)}</b><small class="mono">${esc(s.sid)}</small></div></div>`; };
const aPill = (c) => pill(lab(K.APP_STATUS, c), tone(K.APP_STATUS, c)), vPill = (c) => pill(lab(K.VISA_STATUS, c), tone(K.VISA_STATUS, c));
const dueCell = (d) => { if (!d) return "—"; const n = daysTo(d); return `<span class="${n < 0 ? "late" : ""}">${fmtD(d)}</span>${n >= 0 && n <= 14 ? ` ${pill(n + "d", "amber")}` : ""}`; };

/* ---------- forms ---------- */
const APP_F = (pick) => [
  ...(pick ? [{ k: "student_id", label: "Student", type: "student", required: true, full: true }] : []),
  { k: "country", label: "Country", type: "select", options: K.COUNTRIES, required: true }, ...CRM.uniF("country"),
  { k: "course", label: "Course" }, { k: "intake", label: "Intake", ph: "Sep 2027" },
  { k: "status", label: "Application status", type: "select", options: K.APP_STATUS.map((a) => [a[0], a[1]]), blank: false, def: "draft" }, { k: "deadline", label: "Application deadline", type: "date" },
  { k: "submitted_on", label: "Submitted on", type: "date", showIf: (v) => v.status !== "draft", reqIf: (v) => v.status === "submitted" }, { k: "app_ref", label: "Application ID", showIf: (v) => v.status !== "draft" },
  { k: "app_fee", label: "Application fee", type: "number" }, { k: "offer_date", label: "Offer letter date", type: "date", showIf: (v) => OFFER.includes(v.status), reqIf: (v) => OFFER.includes(v.status) },
  { k: "scholarship", label: "Scholarship", showIf: (v) => OFFER.includes(v.status) }, { k: "tuition_fee", label: "Tuition fee (total)", type: "number" },
  { k: "deposit_amount", label: "Deposit paid", type: "number", showIf: (v) => ["deposit", "cas"].includes(v.status), reqIf: (v) => v.status === "deposit" }, { k: "deposit_date", label: "Deposit date", type: "date", showIf: (v) => ["deposit", "cas"].includes(v.status) },
  { k: "cas_ref", label: "Reference", showIf: (v) => v.status === "cas", reqIf: () => true, labelIf: (v) => CRM.country(v.country).ref + " number" },
  { k: "remarks", label: "Remarks", type: "textarea" },
];
const OFFER = ["conditional", "unconditional", "deposit", "cas"];
const APP_BUMP = { submitted: "applied", conditional: "offer", unconditional: "offer", deposit: "offer", cas: "offer" };
function appForm(row, student_id) {
  const s = sName(row ? row.student_id : student_id);
  formModal({ title: row ? "Application — " + row.university : "New university application", wide: true, fields: APP_F(!row && !student_id), values: (() => { const v = row || { country: s.pref_country, university: s.pref_university, course: s.pref_subject, intake: s.pref_intake }; return { ...v, ...CRM.uniVals(v.country, v.university) }; })(),
    onSave: async (d) => {
      await CRM.readUni(d, "country", "university"); if (!d.university) throw new Error("Choose or write the university");
      const sid = row ? row.student_id : student_id || d.student_id;
      if (d.submitted_on && d.deadline && d.submitted_on > d.deadline && !(await confirmBox("The submission date is after the deadline. Save anyway?"))) return false;
      if (d.offer_date && d.submitted_on && d.offer_date < d.submitted_on) throw new Error("Offer date cannot be before the submission date");
      if (d.deposit_amount && d.tuition_fee && d.deposit_amount > d.tuition_fee) throw new Error("Deposit cannot be more than the tuition fee");
      if (row) await S.set("applications", row.id, d); else await S.add("applications", { ...d, student_id: sid });
      if (!row || row.status !== d.status) S.log(row ? "update" : "create", "application", row ? row.id : null, `${sName(sid).sid} ${d.university}: ${lab(K.APP_STATUS, d.status)}`);
      if (APP_BUMP[d.status]) await CRM.bump(sid, APP_BUMP[d.status]);
    } });
}
const users = () => S.users().filter((u) => u.active && K.TOP.concat("counsellor").includes(u.role)).map((u) => [u.id, u.name]);
const VISA_F = (pick) => [
  ...(pick ? [{ k: "student_id", label: "Student", type: "student", required: true, full: true }] : []),
  { k: "country", label: "Country", type: "select", options: K.COUNTRIES, required: true }, { k: "owner_id", label: "Responsible employee", type: "select", options: users(), def: S.me.id },
  { k: "status", label: "Visa status", type: "select", options: K.VISA_STATUS.map((a) => [a[0], a[1]]), blank: false, def: "preparing" }, { k: "start_date", label: "File start date", type: "date", def: today() },
  { k: "submitted_on", label: "Submission date", type: "date", showIf: (v) => v.status !== "preparing", reqIf: (v) => v.status !== "preparing", labelIf: (v) => (v.country === "Malaysia" ? "EMGS submission date" : "Submission date") },
  { k: "appointment_date", label: "Visa appointment", type: "date", showIf: (v) => CRM.country(v.country).bio },
  { k: "biometrics_date", label: "Biometrics date", type: "date", showIf: (v) => CRM.country(v.country).bio, reqIf: (v) => v.status === "biometrics" },
  { k: "interview_date", label: "Interview date", type: "date", showIf: (v) => CRM.country(v.country).interview },
  { k: "medical_status", label: "Medical test", type: "select", options: ["Not required", "Pending", "Booked", "Done"] },
  { k: "decision_date", label: "Decision date", type: "date", showIf: (v) => ["approved", "rejected", "reapplying"].includes(v.status), reqIf: (v) => ["approved", "rejected"].includes(v.status) },
  { k: "fee_paid", label: "Visa fee paid", type: "checkbox", labelIf: (v) => (v.country === "Malaysia" ? "EMGS fee paid — the student's portal then shows EMGS progress" : "Visa fee paid") },
  { k: "refusal_reason", label: "Refusal reason", type: "textarea", showIf: (v) => ["rejected", "reapplying"].includes(v.status), reqIf: (v) => v.status === "rejected" }, { k: "remarks", label: "Remarks", type: "textarea" },
];
function visaForm(row, student_id) {
  const s = sName(row ? row.student_id : student_id);
  formModal({ title: row ? "Visa file — " + s.name : "Start visa file", wide: true, fields: VISA_F(!row && !student_id), values: row || { country: s.pref_country },
    onSave: async (d) => {
      if (d.status === "rejected" && !d.refusal_reason) throw new Error("Please write the refusal reason");
      if (d.decision_date && d.submitted_on && d.decision_date < d.submitted_on) throw new Error("Decision date cannot be before the submission date");
      if (d.status === "approved" && !d.fee_paid && !(await confirmBox("Visa is approved but the visa fee is not marked as paid. Save anyway?"))) return false;
      if (!row && !S.rows("applications").some((a) => a.student_id === (student_id || d.student_id) && OFFER.includes(a.status)) && !(await confirmBox("This student has no application with an offer yet. Start the visa file anyway?"))) return false;
      const sid = row ? row.student_id : student_id || d.student_id;
      if (row) await S.set("visas", row.id, d); else await S.add("visas", { ...d, student_id: sid });
      if (!row || row.status !== d.status) S.log(row ? "update" : "create", "visa", row ? row.id : null, `${sName(sid).sid}: ${lab(K.VISA_STATUS, d.status)}`);
      await CRM.bump(sid, d.status === "approved" ? "visa_approved" : d.status === "rejected" ? "visa_rejected" : "visa");
    } });
}
CRM.forms.application = appForm; CRM.forms.visa = visaForm;

/* ---------- inside the student profile ---------- */
P.admission = (el, s, edit) => {
  const apps = S.rows("applications").filter((a) => a.student_id === s.id), vis = S.rows("visas").filter((v) => v.student_id === s.id);
  el.innerHTML = `${CRM.ui.guide("adm", ["<b>Add</b> দিয়ে আবেদন যোগ করুন: দেশ বাছলে সেই দেশের university-র তালিকা আসে; না থাকলে “Other” বেছে নাম লিখুন (তালিকায় যোগ হয়ে যাবে)।", "Status বদলালে student-এর যাত্রাপথ নিজে এগোয়: Submitted → আবেদন জমা, Offer → Offer পাওয়া গেছে।", "ভিসার জন্য <b>Start file</b>। মালয়েশিয়া হলে <b>EMGS fee paid</b> টিক দিন; EMGS-এর % নিজে থেকে আসে, দেখুন বাম মেনুর <b>EMGS</b> পেজে।", "কোনো আবেদন/ভিসা-তে ক্লিক করলে বদলানো যায় (শুধু নিজের assign করা student-এর)।"])}<div class="grid2"><div class="card"><h3>University applications ${edit ? `<button class="btn btn-primary sm" data-act="newApp">${ic("plus")} Add</button>` : ""}</h3>
      ${apps.map((a) => `<div class="rowcard" data-act="app" data-id="${a.id}"><div><b>${esc(a.university)}</b><small>${esc([a.course, a.intake, a.country].filter(Boolean).join(" · "))}</small><small>${a.app_ref ? "ID " + esc(a.app_ref) + " · " : ""}Deadline ${fmtD(a.deadline)}${a.tuition_fee ? " · Tuition " + money(a.tuition_fee) : ""}${a.deposit_amount ? " · Deposit " + money(a.deposit_amount) : ""}</small></div>${aPill(a.status)}</div>`).join("") || '<div class="empty">No application yet.</div>'}</div>
    <div class="card"><h3>Visa processing ${edit ? `<button class="btn btn-primary sm" data-act="newVisa">${ic("plus")} Start file</button>` : ""}</h3>
      ${vis.map((v) => `<div class="rowcard" data-act="visa" data-id="${v.id}"><div><b>${esc(v.country || "Visa")} visa</b><small>Submitted ${fmtD(v.submitted_on)} · Biometrics ${fmtD(v.biometrics_date)} · Decision ${fmtD(v.decision_date)}</small><small>${v.country === "Malaysia" && s.emgs_percent != null ? `EMGS <b>${s.emgs_percent}%</b>${s.emgs_status ? " — " + esc(s.emgs_status) : ""} · ` : ""}Responsible: ${esc(S.uname(v.owner_id))}${v.refusal_reason ? " · Refusal: " + esc(v.refusal_reason) : ""}</small></div>${vPill(v.status)}</div>`).join("") || '<div class="empty">Visa file not started.</div>'}</div></div>`;
  on(el, { newApp: () => appForm(null, s.id), newVisa: () => visaForm(null, s.id), app: (t) => edit && appForm(S.get("applications", t.dataset.id)), visa: (t) => edit && visaForm(S.get("visas", t.dataset.id)) });
};

/* ---------- Documents ---------- */
const dPill = (st) => pill(K.DOC_STATUS[st][0], K.DOC_STATUS[st][1]);
const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.round((n || 0) / 1024) + " KB");
async function openFile(doc, v) {
  try { const url = await S.fileUrl(v.path); S.log("download", "document", doc.id, `${sName(doc.student_id).sid} ${doc.type} — ${v.name}`); window.open(url, "_blank", "noopener"); }
  catch (ex) { toast(ex.message, "bad"); }
}
P.docs = (el, s) => {
  const mine = S.rows("documents").filter((d) => d.student_id === s.id);
  const need = CRM.docTypes(s), types = [...need, ...mine.map((d) => d.type).filter((t) => !need.includes(t))];
  const rows = types.map((type) => mine.find((d) => d.type === type) || { id: "", type, status: "pending", versions: [] });
  const done = rows.filter((r) => r.status !== "pending").length;
  el.innerHTML = `${CRM.ui.guide("docs", ["জরুরি ৬টা কাগজ তালিকায় থাকে; বাকি কিছু লাগলে নিচে <b>+ Add another document</b>।", "<b>Upload</b> দিয়ে ফাইল দিন; নতুন কপি এলে <b>New version</b> — পুরোনোটা History-তে থাকে।", "Student নিজেও portal থেকে ফাইল দিতে পারে; তখন “Student (portal)” লেখা আসে — খুলে দেখে <b>Verify</b> বা <b>Reject</b> দিন।"])}<div class="card"><h3>Documents <span class="muted mini">${done} of ${rows.length} received · PDF / JPG / PNG, max ${CRM.MAXMB} MB</span></h3>
    <div class="prog" style="margin-bottom:14px"><i style="width:${(done / rows.length) * 100}%"></i></div>
    ${table([
      { label: "Document", get: (r) => `<b>${esc(r.type)}</b>${r.remarks ? `<small>${esc(r.remarks)}</small>` : ""}` },
      { label: "Status", get: (r) => dPill(r.status) },
      { label: "Latest file", get: (r) => { const v = (r.versions || []).at(-1); return v ? `${esc(v.name)}<small>v${r.versions.length} · ${kb(v.size)} · ${esc(S.uname(v.by))} · ${fmtDT(v.at)}</small>` : '<span class="muted">—</span>'; } },
      { label: "Expiry", get: (r) => (r.expiry ? dueCell(r.expiry) : "—") },
      { label: "Checked by", get: (r) => (r.verified_by ? `${esc(S.uname(r.verified_by))}<small>${fmtDT(r.verified_at)}</small>` : "—") },
      { label: "", cls: "right nowrap", get: (r) => `<label class="btn btn-line sm">${ic("up")} ${r.versions.length ? "New version" : "Upload"}<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" data-ch="up" data-type="${esc(r.type)}"></label>
        ${r.versions.length ? `<button class="btn btn-line sm" data-act="view" data-id="${r.id}">${ic("eye")}</button><button class="btn btn-line sm" data-act="more" data-id="${r.id}">History</button>` : r.id && !need.includes(r.type) ? `<button class="btn btn-line sm" data-act="rmDoc" data-id="${r.id}" title="Remove from checklist">${ic("x")}</button>` : ""}` },
    ], rows, { stat: true })}
    <div style="margin-top:12px"><button class="btn btn-line" data-act="other">${ic("plus")} Add another document</button> <span class="muted mini">CV, SOP, Offer Letter, Bachelor Certificate… anything else this student needs</span></div></div>`;
  on(el, {
    "ch:up": async (inp) => {
      const f = inp.files[0]; if (!f) return;
      if (f.size > CRM.MAXMB * 1048576) return toast(`File is larger than ${CRM.MAXMB} MB`, "bad");
      if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) return toast("Only PDF, JPG or PNG", "bad");
      try {
        let doc = mine.find((d) => d.type === inp.dataset.type);
        if (!doc) doc = await S.add("documents", { student_id: s.id, type: inp.dataset.type, status: "pending", versions: [] });
        const path = `${s.id}/${doc.id}/${Date.now()}-${f.name.replace(/[^\w.-]+/g, "_")}`;
        toast("Uploading…"); await S.putFile(path, f);
        await S.set("documents", doc.id, { status: "uploaded", verified_by: null, verified_at: null, versions: [...(doc.versions || []), { path, name: f.name, size: f.size, by: S.me.id, at: new Date().toISOString() }] });
        S.log("upload", "document", doc.id, `${s.sid} ${doc.type} v${doc.versions.length}`); toast("Uploaded", "ok"); rerender();
      } catch (ex) { toast(ex.message, "bad"); }
    },
    rmDoc: async (t) => { try { await S.del("documents", t.dataset.id); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
    view: (t) => { const d = S.get("documents", t.dataset.id); openFile(d, d.versions.at(-1)); },
    more: (t) => docModal(S.get("documents", t.dataset.id)),
    other: () => { const have = rows.map((r) => r.type), sug = K.DOC_EXTRA.filter((t) => !have.includes(t));
      const m = formModal({ title: "Add another document", fields: [{ k: "pick", label: "Choose from the list", type: "select", options: [...sug, "Something else…"], required: true, full: true }, { k: "type", label: "Document name", full: true, showIf: (v) => v.pick === "Something else…", reqIf: () => true }], saveLabel: "Add to checklist",
        onSave: async (d) => { const name = d.pick === "Something else…" ? d.type : d.pick; if (have.includes(name)) throw new Error("This document is already in the list"); await S.add("documents", { student_id: s.id, type: name, status: "pending", versions: [] }); } }); return m; },
  });
};
/* পুরোনো সব ভার্সন + যাচাই (Verify / Reject) + মেয়াদ */
function docModal(doc) {
  const m = modal(`${doc.type} — ${sName(doc.student_id).name}`, `
    <h4>Version history</h4>
    ${[...doc.versions].reverse().map((v, i) => `<div class="rowcard" data-v="${doc.versions.length - 1 - i}"><div><b>v${doc.versions.length - i} — ${esc(v.name)}</b><small>${kb(v.size)} · uploaded by ${esc(S.uname(v.by))} · ${fmtDT(v.at)}</small></div>${i === 0 ? pill("Current", "green") : pill("Old", "")}</div>`).join("")}
    <div class="fgrid" style="margin-top:14px"><label class="fld"><span>Expiry date</span><input type="date" id="dx" value="${esc(doc.expiry || "")}"></label><label class="fld"><span>Remarks</span><input id="dr" value="${esc(doc.remarks || "")}"></label></div>
    <p class="muted mini">Status: ${dPill(doc.status)} ${doc.verified_by ? `by ${esc(S.uname(doc.verified_by))}, ${fmtDT(doc.verified_at)}` : ""}</p>
    <div class="modal-f">${S.can.verifyDocs() ? `<button class="btn btn-bad" data-st="rejected">Reject</button><button class="btn btn-gold" data-st="verified">${ic("check")} Verify</button>` : ""}<button class="btn btn-primary" data-st="">Save</button></div>`);
  m.body.onclick = async (e) => {
    const v = e.target.closest("[data-v]"); if (v) return openFile(doc, doc.versions[+v.dataset.v]);
    const b = e.target.closest("[data-st]"); if (!b) return;
    const patch = { expiry: $("#dx", m.body).value || null, remarks: $("#dr", m.body).value || null };
    if (b.dataset.st === "verified" && doc.type === "Passport" && !patch.expiry) return toast("Give the passport expiry date before verifying", "bad");
    if (b.dataset.st === "rejected" && !patch.remarks) return toast("Write in Remarks why it is rejected", "bad");
    if (doc.type === "Passport" && patch.expiry) { const st = S.get("students", doc.student_id); if (st && st.passport_expiry !== patch.expiry) await S.set("students", st.id, { passport_expiry: patch.expiry }).catch(() => {}); }
    if (b.dataset.st) { Object.assign(patch, { status: b.dataset.st, verified_by: S.me.id, verified_at: new Date().toISOString() }); S.log(b.dataset.st, "document", doc.id, `${sName(doc.student_id).sid} ${doc.type}`); }
    try { await S.set("documents", doc.id, patch); m.close(); rerender(); } catch (ex) { toast(ex.message, "bad"); }
  };
}

/* ---------- global pages ---------- */
const AF = { q: "", status: "", country: "" };
CRM.views.applications = (root) => {
  const all = S.rows("applications");
  root.innerHTML = `<div class="ph"><div><span class="kicker">Admission</span><h1>University Applications</h1><p>${all.length} applications · offers ${all.filter((a) => ["conditional", "unconditional", "deposit", "cas"].includes(a.status)).length}</p></div>
    <div class="ph-act">${S.can.exportData() ? `<button class="btn btn-line" data-act="export">${ic("down")} Excel</button>` : ""}<button class="btn btn-primary" data-act="new">${ic("plus")} New application</button></div></div>
    ${CRM.ui.guide("apps", ["সব student-এর আবেদন এক জায়গায়; deadline অনুযায়ী সাজানো।", "সারিতে ক্লিক করলে সেই student-এর Applications & Visa ট্যাব খোলে।", "ফিল্টার দিয়ে status বা দেশ বাছুন।"])}
    <div class="filters"><div class="searchbox">${ic("search")}<input id="q" placeholder="Student, university, application ID…" value="${esc(AF.q)}"></div>
      <select data-ch="f" data-k="status"><option value="">All status</option>${opts(K.APP_STATUS.map((a) => [a[0], a[1]]), AF.status)}</select>
      <select data-ch="f" data-k="country"><option value="">All countries</option>${opts([...new Set(all.map((a) => a.country).filter(Boolean))].sort(), AF.country)}</select></div><div id="list"></div>`;
  const rows = () => { const q = AF.q.toLowerCase(); return all.filter((a) => (!AF.status || a.status === AF.status) && (!AF.country || a.country === AF.country) && (!q || [sName(a.student_id).name, sName(a.student_id).sid, a.university, a.app_ref, a.course].some((v) => String(v || "").toLowerCase().includes(q)))).sort((a, b) => String(a.deadline || "9").localeCompare(String(b.deadline || "9"))); };
  const draw = () => ($("#list", root).innerHTML = table([
    { label: "Student", get: (a) => stuCell(a.student_id) }, { label: "University / Course", get: (a) => `<b>${esc(a.university)}</b><small>${esc(a.course || "")}</small>` },
    { label: "Country", get: (a) => esc(a.country || "—") }, { label: "Intake", get: (a) => esc(a.intake || "—") }, { label: "Deadline", get: (a) => (["draft"].includes(a.status) ? dueCell(a.deadline) : fmtD(a.deadline)) },
    { label: "Status", get: (a) => aPill(a.status) }, { label: "Tuition / Deposit", get: (a) => `${a.tuition_fee ? money(a.tuition_fee) : "—"}<small>${a.deposit_amount ? "Deposit " + money(a.deposit_amount) : ""}</small>` },
  ], rows()));
  draw(); $("#q", root).oninput = (e) => { AF.q = e.target.value; draw(); };
  on(root, { "ch:f": (el) => { AF[el.dataset.k] = el.value; draw(); }, row: (el) => go(`#/student/${S.get("applications", el.dataset.id).student_id}/admission`), new: () => appForm(),
    export: () => exportXlsx("applications-" + today(), rows().map((a) => ({ "Student ID": sName(a.student_id).sid, Student: sName(a.student_id).name, Country: a.country, University: a.university, Course: a.course, Intake: a.intake, Status: lab(K.APP_STATUS, a.status), "Application ID": a.app_ref, Deadline: a.deadline, Submitted: a.submitted_on, "Offer date": a.offer_date, "Tuition fee": a.tuition_fee, Deposit: a.deposit_amount, Scholarship: a.scholarship }))) });
};

CRM.views.visa = (root, [tab = "all"]) => {
  const all = S.rows("visas"), T = { all: ["All", () => true], open: ["In process", (v) => !["approved", "rejected"].includes(v.status)], upcoming: ["Dates in next 14 days", (v) => [v.appointment_date, v.biometrics_date, v.interview_date].some((d) => { const n = daysTo(d); return n != null && n >= 0 && n <= 14; })], approved: ["Approved", (v) => v.status === "approved"], rejected: ["Rejected", (v) => v.status === "rejected"] };
  const rows = all.filter((T[tab] || T.all)[1]).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  const dec = all.filter((v) => ["approved", "rejected"].includes(v.status)).length, ok = all.filter((v) => v.status === "approved").length;
  root.innerHTML = `<div class="ph"><div><span class="kicker">Visa</span><h1>Visa Processing</h1><p>${all.length} files · success rate ${dec ? Math.round((ok / dec) * 100) + "%" : "—"}</p></div><div class="ph-act">${S.can.exportData() ? `<button class="btn btn-line" data-act="export">${ic("down")} Excel</button>` : ""}<button class="btn btn-primary" data-act="new">${ic("plus")} Start visa file</button></div></div>
    ${CRM.ui.guide("visa", ["সামনের ১৪ দিনে কার appointment/biometrics/interview আছে তা “Dates in next 14 days” ট্যাবে।", "মালয়েশিয়ার student-দের EMGS % বাম মেনুর <b>EMGS</b> পেজে — EMGS-এর সাইট থেকে নিজে আসে।"])}
    <div class="tabs">${Object.keys(T).map((k) => `<a href="#/visa/${k}" class="${k === tab ? "on" : ""}">${T[k][0]} <em>${all.filter(T[k][1]).length}</em></a>`).join("")}</div>
    ${table([{ label: "Student", get: (v) => stuCell(v.student_id) }, { label: "Country", get: (v) => esc(v.country || "—") }, { label: "Status", get: (v) => vPill(v.status) }, { label: "Submitted", get: (v) => fmtD(v.submitted_on) },
      { label: "Appointment", get: (v) => dueCell(v.appointment_date) }, { label: "Biometrics", get: (v) => dueCell(v.biometrics_date) }, { label: "Interview", get: (v) => dueCell(v.interview_date) }, { label: "Decision", get: (v) => fmtD(v.decision_date) },
      { label: "Fee", get: (v) => (v.fee_paid ? pill("Paid", "green") : pill("Due", "amber")) }, { label: "Responsible", get: (v) => esc(S.uname(v.owner_id)) }], rows)}`;
  on(root, { row: (el) => go(`#/student/${S.get("visas", el.dataset.id).student_id}/admission`), new: () => visaForm(),
    export: () => exportXlsx("visa-" + today(), rows.map((v) => ({ "Student ID": sName(v.student_id).sid, Student: sName(v.student_id).name, Country: v.country, Status: lab(K.VISA_STATUS, v.status), Submitted: v.submitted_on, Appointment: v.appointment_date, Biometrics: v.biometrics_date, Interview: v.interview_date, Decision: v.decision_date, "Fee paid": v.fee_paid ? "Yes" : "No", "Refusal reason": v.refusal_reason, Responsible: S.uname(v.owner_id) }))) });
};

CRM.views.documents = (root, [tab = "pending"]) => {
  const docs = S.rows("documents"), studs = S.rows("students").filter((s) => S.can.docs(s) && CRM.rank(s.status) >= 2 && s.status !== "lost");
  const info = studs.map((s) => { const d = docs.filter((x) => x.student_id === s.id); return { id: s.id, s, got: d.filter((x) => x.status !== "pending").length, wait: d.filter((x) => x.status === "uploaded").length, rej: d.filter((x) => x.status === "rejected").length,
    need: CRM.docTypes(s).length, missing: CRM.docTypes(s).filter((t) => !d.some((x) => x.type === t && x.status !== "pending")), exp: d.filter((x) => x.expiry && daysTo(x.expiry) <= 90) }; });
  const T = { pending: ["Missing documents", (r) => r.missing.length && r.s.status !== "departed"], verify: ["Waiting for verification", (r) => r.wait], expiring: ["Expiring / expired", (r) => r.exp.length], complete: ["Complete", (r) => !r.missing.length], all: ["All", () => true] };
  root.innerHTML = `<div class="ph"><div><span class="kicker">Documents</span><h1>Student Documents</h1><p>Students from “Counselling Done” onward. Open a student to upload, view or verify files.</p></div></div>
    ${CRM.ui.guide("docpage", ["“Missing documents” ট্যাবে কার কোন কাগজ বাকি দেখুন।", "“Waiting for verification”-এ student বা staff-এর দেওয়া নতুন ফাইল আছে — যাচাই করুন।", "মেয়াদ শেষ হতে চলা পাসপোর্ট “Expiring” ট্যাবে।"])}
    <div class="tabs">${Object.keys(T).map((k) => `<a href="#/documents/${k}" class="${k === tab ? "on" : ""}">${T[k][0]} <em>${info.filter(T[k][1]).length}</em></a>`).join("")}</div>
    ${table([{ label: "Student", get: (r) => stuCell(r.id) }, { label: "Stage", get: (r) => CRM.stPill(r.s.status) },
      { label: "Received", get: (r) => `<div class="prog"><i style="width:${((r.need - r.missing.length) / r.need) * 100}%"></i></div><small>${r.need - r.missing.length} of ${r.need}</small>` },
      { label: "Missing", get: (r) => (r.missing.length ? `<span class="mini">${esc(r.missing.slice(0, 4).join(", "))}${r.missing.length > 4 ? ` +${r.missing.length - 4} more` : ""}</span>` : pill("Complete", "green")) },
      { label: "To verify", get: (r) => (r.wait ? pill(r.wait + " waiting", "amber") : "—") + (r.rej ? " " + pill(r.rej + " rejected", "red") : "") },
      { label: "Expiry alert", get: (r) => r.exp.map((x) => pill(`${x.type}: ${daysTo(x.expiry) < 0 ? "expired" : daysTo(x.expiry) + "d"}`, "red")).join(" ") || "—" }], info.filter((T[tab] || T.all)[1]))}`;
  on(root, { row: (el) => go(`#/student/${el.dataset.id}/docs`) });
};
})();
