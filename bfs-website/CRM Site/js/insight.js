/* ===== Dashboard, Reminders, Reports (Excel + PDF), Team & Settings ===== */
(() => {
const CRM = window.CRM, { S, K, lab } = CRM;
const { esc, $, today, addDays, daysTo, fmtD, fmtDT, money, sum, countBy, ic, pill, av, toast, go, rerender, confirmBox, opts, formModal, table, on, exportXlsx, exportPdf, bars } = CRM.ui;
const stu = (id) => S.get("students", id) || { name: "—", sid: "" };
const active = (s) => !["lost", "departed"].includes(s.status);
const inRange = (d, a, b) => { const x = String(d || "").slice(0, 10); return (!a || x >= a) && (!b || x <= b); };

/* ---------- reminders: ডেটা থেকে নিজে নিজে তৈরি হয়, আলাদা করে লিখতে হয় না ---------- */
CRM.reminders = () => {
  const out = [], t = today(), push = (group, tone, text, link, when) => out.push({ group, tone, text, link, when });
  const mine = (s) => S.can.assign() || s.counsellor_id === S.me.id || s.created_by === S.me.id;
  if (S.can.students()) {
    for (const s of S.rows("students")) {
      if (!mine(s)) continue;
      if (active(s) && s.next_followup && s.next_followup <= t) push("Follow-up", s.next_followup < t ? "red" : "", `Follow up with ${s.name} (${lab(K.STATUS, s.status)})`, `#/student/${s.id}`, s.next_followup);
      if (active(s) && !s.counsellor_id && S.can.assign()) push("New lead", "blue", `New lead not assigned: ${s.name}`, `#/student/${s.id}`, String(s.created_at).slice(0, 10));
      const pe = daysTo(s.passport_expiry); if (active(s) && pe != null && pe <= 180) push("Passport", "red", `${s.name}'s passport ${pe < 0 ? "has expired" : `expires in ${pe} days`}`, `#/student/${s.id}`, s.passport_expiry);
    }
    for (const a of S.rows("applications")) { const d = daysTo(a.deadline); if (a.status === "draft" && d != null && d <= 14) push("Application", d < 0 ? "red" : "", `${stu(a.student_id).name}: ${a.university} deadline ${d < 0 ? "passed" : `in ${d} days`}`, `#/student/${a.student_id}/admission`, a.deadline); }
    for (const v of S.rows("visas")) [["appointment_date", "Visa appointment"], ["biometrics_date", "Biometrics"], ["interview_date", "Visa interview"]].forEach(([k, l]) => { const d = daysTo(v[k]); if (d != null && d >= 0 && d <= 7 && !["approved", "rejected"].includes(v.status)) push("Visa", "blue", `${l} for ${stu(v.student_id).name} ${d === 0 ? "today" : `in ${d} days`}`, `#/student/${v.student_id}/admission`, v[k]); });
    for (const d of S.rows("documents")) { const n = daysTo(d.expiry); if (d.type !== "Passport" && n != null && n <= 60) push("Document", "red", `${stu(d.student_id).name}: ${d.type} ${n < 0 ? "expired" : `expires in ${n} days`}`, `#/student/${d.student_id}/docs`, d.expiry);
      if (d.status === "uploaded" && S.can.verifyDocs()) push("Document", "", `${stu(d.student_id).name}: ${d.type} is waiting for verification`, `#/student/${d.student_id}/docs`, String((d.versions.at(-1) || {}).at || "").slice(0, 10)); }
    for (const s of S.rows("students")) if (mine(s) && S.can.docs(s) && ["docs_pending", "applied"].includes(s.status)) { const miss = CRM.docTypes(s).filter((t) => !S.rows("documents").some((d) => d.student_id === s.id && d.type === t && d.status !== "pending")).length; if (miss) push("Document", "", `${s.name} is missing ${miss} documents`, `#/student/${s.id}/docs`, t); }
  }
  for (const i of S.rows("invoices")) { const due = CRM.fin.dueOf(i); if (due > 0 && (S.can.finance() || S.can.students()) && (!i.due_date || i.due_date <= addDays(3))) push("Payment", i.due_date && i.due_date < t ? "red" : "", `${stu(i.student_id).name} has ${money(due)} due (${i.category})`, `#/student/${i.student_id}/payments`, i.due_date || String(i.created_at).slice(0, 10)); }
  for (const k of S.rows("tasks")) { const d = daysTo(k.deadline); if (k.status !== "done" && (k.assignees || []).includes(S.me.id) && d != null && d <= 1) push("Task", d < 0 ? "red" : "", `Task ${d < 0 ? "overdue" : d === 0 ? "due today" : "due tomorrow"}: ${k.title}`, "#/tasks/mine", k.deadline); }
  for (const b of S.rows("batches").filter((x) => x.status === "running" && S.can.marks(x))) { const last = S.rows("attendance").filter((a) => a.batch_id === b.id).sort((a, c) => String(c.date).localeCompare(String(a.date)))[0]; if (!last) continue;
    S.rows("enrollments").filter((e) => e.batch_id === b.id && e.status === "active" && last.marks[e.id] === "A").forEach((e) => push("IELTS", "", `${stu(e.student_id).name} was absent on ${fmtD(last.date)} (${b.name})`, `#/batch/${b.id}/attendance`, last.date)); }
  return out.sort((a, b) => String(a.when).localeCompare(String(b.when)));
};
const remHTML = (list) => list.map((r) => `<a class="rem ${r.tone}" href="${r.link}"><span class="dot"></span><span>${pill(r.group, r.tone === "red" ? "red" : "gold")} ${esc(r.text)}</span><small>${fmtD(r.when)}</small></a>`).join("") || '<div class="empty">Nothing pending. 🎉</div>';
CRM.views.reminders = (root, [g = "all"]) => {
  const all = CRM.reminders(), groups = ["all", ...new Set(all.map((r) => r.group))];
  root.innerHTML = `<div class="ph"><div><span class="kicker">Notifications</span><h1>Reminders</h1><p>Follow-ups, deadlines, expiring passports, dues and absences — updated automatically from your data.</p></div>
    <div class="ph-act">${"Notification" in window && Notification.permission === "default" ? `<button class="btn btn-line" data-act="notif">${ic("bell")} Turn on browser alerts</button>` : ""}</div></div>
    <div class="tabs">${groups.map((k) => `<a href="#/reminders/${encodeURIComponent(k)}" class="${k === g ? "on" : ""}">${k === "all" ? "All" : esc(k)} <em>${k === "all" ? all.length : all.filter((r) => r.group === k).length}</em></a>`).join("")}</div>${remHTML(all.filter((r) => g === "all" || r.group === g))}`;
  on(root, { notif: async () => { await Notification.requestPermission(); rerender(); } });
};

/* ---------- dashboard ---------- */
const DF = { range: "90", country: "", date: "" };
/* সময়: আজ / গতকাল / নির্দিষ্ট একদিন / ৭-৩০-৯০ দিন / ১২ মাস / সব */
const dfSpan = () => {
  const r = DF.range;
  if (r === "today") return [today(), today()];
  if (r === "yday") return [addDays(-1), addDays(-1)];
  if (r === "day") { DF.date ||= today(); return [DF.date, DF.date]; }
  return r === "all" ? ["", ""] : [addDays(-(+r)), ""];
};
CRM.views.dashboard = (root) => {
  const me = S.me, top = S.can.assign(), [from, to] = dfSpan(), oneDay = !!from && from === to;
  const studs = S.rows("students").filter((s) => (!DF.country || s.pref_country === DF.country)), inR = studs.filter((s) => inRange(s.created_at, from, to));
  const c = (f) => studs.filter(f).length, rems = CRM.reminders(), tasks = S.rows("tasks").filter((t) => (t.assignees || []).includes(me.id) && t.status !== "done");
  const fu = studs.filter((s) => active(s) && s.next_followup && s.next_followup <= today() && (S.can.assign() ? true : s.counsellor_id === me.id || s.created_by === me.id)).sort((a, b) => a.next_followup.localeCompare(b.next_followup));
  const stat = (n, l, icon, cls = "") => `<div class="stat ${cls}">${ic(icon)}<b>${n}</b><span>${l}</span></div>`;
  let html = `<div class="ph"><div><span class="kicker">${esc(S.ROLES[me.role])}</span><h1>Hello, ${esc(me.name.split(" ")[0])} 👋</h1><p>${top ? "Whole-office overview" : "Your work today"} · ${fmtD(today())}</p></div>
    ${S.can.students() ? `<div class="filters" style="margin:0"><select data-ch="df" data-k="range">${opts([["today", "Today"], ["yday", "Yesterday"], ["day", "Pick a day…"], ["7", "Last 7 days"], ["30", "Last 30 days"], ["90", "Last 90 days"], ["365", "Last 12 months"], ["all", "All time"]], DF.range)}</select>${DF.range === "day" ? `<input type="date" class="input" data-ch="df" data-k="date" value="${DF.date || today()}" max="${today()}" style="width:auto">` : ""}<select data-ch="df" data-k="country"><option value="">All countries</option>${opts([...new Set(S.rows("students").map((s) => s.pref_country).filter(Boolean))].sort(), DF.country)}</select></div>` : ""}</div>`;
  html += myLeadsCard() + (oneDay && S.can.students() ? dayCard(from, studs) : "");
  if (S.can.students()) {
    const conv = inR.length ? Math.round((inR.filter((s) => CRM.rank(s.status) >= 4 && s.status !== "lost").length / inR.length) * 100) : 0;
    html += `<div class="stats">${stat(studs.length, top ? "Total students" : "My students", "users")}${stat(inR.length, oneDay ? "New leads (this day)" : "New leads (period)", "plus")}${stat(c((s) => K.PROCESSING.includes(s.status)), "Processing", "file")}${stat(c((s) => s.status === "offer"), "Offer received", "check")}
      ${stat(c((s) => s.status === "visa_approved"), "Visa approved", "plane", "ok")}${stat(c((s) => s.status === "visa_rejected"), "Visa rejected", "x", "bad")}${stat(c((s) => s.status === "departed"), "Already abroad", "plane", "ok")}${stat(c((s) => s.status === "lost"), "Lost", "x")}${stat(conv + "%", "Lead → application", "chart")}</div>`;
  }
  if (S.can.finance()) {
    const m = today().slice(0, 7), amt = (p) => (p.refund ? -p.amount : p.amount), inc = sum(S.rows("payments").filter((p) => String(p.date).startsWith(m)), amt), ex = sum(S.rows("expenses").filter((e) => String(e.date).startsWith(m)), (e) => e.amount);
    html += `<div class="stats">${stat(money(inc), "Revenue this month", "coin", "ok")}${stat(money(ex), "Expenses this month", "coin")}${stat(money(inc - ex), "Net profit", "chart", inc - ex < 0 ? "bad" : "ok")}${stat(money(sum(S.rows("invoices"), CRM.fin.dueOf)), "Outstanding payments", "clock", "bad")}${stat(money(sum(S.rows("expenses").filter((e) => String(e.date).startsWith(m) && /Ads|Marketing/.test(e.category)), (e) => e.amount)), "Marketing spend", "chart")}</div>`;
  }
  html += `<div class="grid2">`;
  if (S.can.students()) html += `<div class="card"><h3>Follow-ups due <a class="mini" href="#/students/followup">See all ${fu.length}</a></h3>${fu.slice(0, 7).map((s) => `<a class="rem ${s.next_followup < today() ? "red" : ""}" href="#/student/${s.id}"><span class="dot"></span><span><b>${esc(s.name)}</b> <span class="muted">${esc(s.phone || "")} · ${lab(K.STATUS, s.status)}</span></span><small>${s.next_followup < today() ? -daysTo(s.next_followup) + "d overdue" : "Today"}</small></a>`).join("") || '<div class="empty">No follow-up due. 🎉</div>'}</div>`;
  html += `<div class="card"><h3>My open tasks <a class="mini" href="#/tasks/mine">See all ${tasks.length}</a></h3>${tasks.slice(0, 7).map((t) => `<a class="rem ${CRM.taskLate(t) ? "red" : ""}" href="#/tasks/mine"><span class="dot"></span><span><b>${esc(t.title)}</b></span><small>${fmtD(t.deadline)}</small></a>`).join("") || '<div class="empty">No open task.</div>'}</div>`;
  if (S.can.students()) {
    const mx = K.STATUS.map(([k, l]) => [l, c((s) => s.status === k)]), src = Object.entries(countBy(inR, (s) => s.source)).sort((a, b) => b[1] - a[1]);
    html += `<div class="card"><h3>Student pipeline</h3>${bars(mx)}</div><div class="card"><h3>Lead sources (period)</h3>${bars(src)}<h3 style="margin-top:16px">By country</h3>${bars(Object.entries(countBy(studs, (s) => s.pref_country)).sort((a, b) => b[1] - a[1]))}</div>`;
  }
  if (S.can.ielts() && S.rows("batches").length) html += `<div class="card"><h3>IELTS centre <a class="mini" href="#/ielts">Open</a></h3>${S.rows("batches").filter((b) => b.status !== "completed" && (!S.is("teacher") || b.teacher_id === me.id)).map((b) => `<a class="rem" href="#/batch/${b.id}"><span class="dot"></span><span><b>${esc(b.name)}</b> <span class="muted">${esc(b.schedule || "")} · ${esc(b.class_time || "")}</span></span><small>${S.rows("enrollments").filter((e) => e.batch_id === b.id && e.status === "active").length} students</small></a>`).join("") || '<p class="muted">No running batch.</p>'}</div>`;
  html += `<div class="card"><h3>Reminders <a class="mini" href="#/reminders">See all ${rems.length}</a></h3>${remHTML(rems.filter((r) => r.group !== "Follow-up" && r.group !== "Task").slice(0, 6))}</div></div>`;
  if (top) html += `<div class="card" style="margin-top:16px"><h3>Counsellor performance (period)</h3>${table(perfCols.map(([l, k]) => ({ label: l, cls: k === "Counsellor" ? "" : "right", get: (r) => (k === "Counsellor" ? `<div class="cell-u">${av(r[k])}<b>${esc(r[k])}</b></div>` : esc(r[k])) })), perfRows(from, to, DF.country), { stat: true })}</div>`;
  root.innerHTML = html;
  on(root, { "ch:df": (el) => { DF[el.dataset.k] = el.value; rerender(); } });
};
/* counsellor-এর নিজের নতুন lead (website থেকে পালা করে আসা সহ) — সরাসরি ফোন/WhatsApp করা যায় */
function myLeadsCard() {
  const mine = S.rows("students").filter((s) => s.status === "new" && (s.counsellor_id === S.me.id || (s.team_ids || []).includes(S.me.id))).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  if (!mine.length && (S.is("admin") || !S.perm("lead_pool"))) return "";   // Admin-কে লিড দেওয়া হয় না
  const td = mine.filter((s) => String(s.created_at).slice(0, 10) === today()).length, wa = (p) => String(p || "").replace(/\D/g, "").replace(/^0/, "880");
  return `<div class="card myleads"><h3>${ic("users")} My new leads <span class="pill ${td ? "green" : ""}">${td} today</span> <a class="mini" href="#/students">All my students</a></h3>
    ${mine.length ? `<p class="muted mini" style="margin:-4px 0 8px">New students from the website are shared out in turn — these are yours. Call them, then change the status from the profile.</p>
      ${mine.slice(0, 8).map((s) => `<div class="lead-row"><a href="#/student/${s.id}" class="lead-who">${av(s.name, "sm")}<span><b>${esc(s.name)}</b><small>${esc(s.sid || "")} · ${esc(s.source || "")} · ${fmtDT(s.created_at)}</small></span></a>
        <span class="lead-act">${s.phone ? `<a class="btn btn-line sm" href="tel:${esc(s.phone)}">${ic("phone")} Call</a><a class="btn btn-line sm" target="_blank" rel="noopener" href="https://wa.me/${wa(s.phone)}">WhatsApp</a>` : ""}<a class="btn btn-primary sm" href="#/student/${s.id}">Open</a></span></div>`).join("")}
      ${mine.length > 8 ? `<p class="mini"><a href="#/students">+ ${mine.length - 8} more</a></p>` : ""}`
      : '<div class="empty">No new lead right now. New website leads will appear here as soon as one is given to you.</div>'}</div>`;
}
/* একদিনের সারসংক্ষেপ: সেদিন কী কী হলো */
function dayCard(day, studs) {
  const on = (v) => String(v || "").slice(0, 10) === day, leads = studs.filter((s) => on(s.created_at)), notes = S.rows("notes").filter((n) => on(n.created_at) && n.created_by);
  const pays = S.can.finance() ? S.rows("payments").filter((p) => on(p.date)) : [], apps = S.rows("applications").filter((a) => on(a.created_at)), done = S.rows("tasks").filter((t) => on(t.done_at));
  const calls = notes.filter((n) => n.type !== "status"), moves = notes.filter((n) => n.type === "status");
  const byStaff = Object.entries(countBy(calls, (n) => S.uname(n.created_by))).sort((a, b) => b[1] - a[1]);
  const given = Object.entries(countBy(leads.filter((s) => s.counsellor_id), (s) => S.uname(s.counsellor_id))).sort((a, b) => b[1] - a[1]);
  const mini = (n, l) => `<div><b>${n}</b><span>${l}</span></div>`;
  return `<div class="card daycard"><h3>${ic("clock")} Day overview — ${fmtD(day)}</h3>
    <div class="day-tiles">${mini(leads.length, "New leads")}${mini(calls.length, "Calls / notes")}${mini(moves.length, "Status changes")}${mini(apps.length, "Applications")}${mini(done.length, "Tasks done")}${S.can.finance() ? mini(money(sum(pays, (p) => (p.refund ? -p.amount : p.amount))), "Money received") : ""}</div>
    <div class="grid2" style="margin-top:12px"><div><h4>Leads by source</h4>${bars(Object.entries(countBy(leads, (s) => s.source || "—")).sort((a, b) => b[1] - a[1]))}<h4 style="margin-top:12px">Leads given to</h4>${bars(given)}</div>
      <div><h4>Work done by staff (calls, notes)</h4>${bars(byStaff)}<h4 style="margin-top:12px">Latest on this day</h4>${notes.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 6).map((n) => `<p class="mini" style="margin:4px 0"><b>${esc(S.uname(n.created_by))}</b> · ${esc(lab(K.NOTE_TYPES, n.type) || n.type)}: ${esc(String(n.text || "").slice(0, 80))}</p>`).join("") || '<p class="muted mini">Nothing logged.</p>'}</div></div></div>`;
}
const perfCols = [["Counsellor", "Counsellor"], ["Leads", "Leads"], ["Contacted", "Contacted"], ["Applied", "Applied"], ["Visa approved", "Visa approved"], ["Abroad", "Abroad"], ["Lost", "Lost"], ["Conversion", "Conversion %"], ["Overdue follow-ups", "Overdue follow-ups"]];
function perfRows(from, to, country) {
  const studs = S.rows("students").filter((s) => inRange(s.created_at, from, to) && (!country || s.pref_country === country));
  return S.users().filter((u) => ["counsellor", "senior"].includes(u.role)).map((u) => { const m = studs.filter((s) => s.counsellor_id === u.id), n = (f) => m.filter(f).length, ap = n((s) => CRM.rank(s.status) >= 4 && s.status !== "lost");
    return { id: u.id, Counsellor: u.name, Leads: m.length, Contacted: n((s) => s.status !== "new"), Applied: ap, "Visa approved": n((s) => ["visa_approved", "departed"].includes(s.status)), Abroad: n((s) => s.status === "departed"), Lost: n((s) => s.status === "lost"), "Conversion %": m.length ? Math.round((ap / m.length) * 100) + "%" : "—", "Overdue follow-ups": n((s) => active(s) && s.next_followup && s.next_followup < today()) }; });
}

/* ---------- reports ---------- */
const RF = { from: "", to: "", country: "", counsellor: "" };
const REPORTS = {
  students: ["Student list", () => S.rows("students").filter((s) => inRange(s.created_at, RF.from, RF.to) && (!RF.country || s.pref_country === RF.country) && (!RF.counsellor || s.counsellor_id === RF.counsellor)).map(CRM.flatStudent)],
  conversion: ["Lead conversion by counsellor", () => perfRows(RF.from, RF.to, RF.country).map(({ id, ...r }) => r)],
  unconverted: ["Unconverted leads", () => S.rows("students").filter((s) => K.LEAD.includes(s.status) && inRange(s.created_at, RF.from, RF.to) && (!RF.counsellor || s.counsellor_id === RF.counsellor)).map((s) => ({ "Student ID": s.sid, Name: s.name, Phone: s.phone, Status: lab(K.STATUS, s.status), Priority: s.priority, Source: s.source, Counsellor: S.uname(s.counsellor_id), "Days since entry": -daysTo(String(s.created_at).slice(0, 10)), "Next follow-up": s.next_followup }))],
  source: ["Lead source report", () => { const st = S.rows("students").filter((s) => inRange(s.created_at, RF.from, RF.to)); return Object.entries(countBy(st, (s) => s.source)).map(([k, n]) => { const m = st.filter((s) => (s.source || "—") === k), ap = m.filter((s) => CRM.rank(s.status) >= 4 && s.status !== "lost").length; return { Source: k, Leads: n, Applied: ap, "Visa approved": m.filter((s) => ["visa_approved", "departed"].includes(s.status)).length, Lost: m.filter((s) => s.status === "lost").length, "Conversion %": Math.round((ap / n) * 100) + "%" }; }); }],
  country: ["Country-wise students", () => { const st = S.rows("students").filter((s) => inRange(s.created_at, RF.from, RF.to)); return Object.keys(countBy(st, (s) => s.pref_country)).map((k) => { const m = st.filter((s) => (s.pref_country || "—") === k); return { Country: k, Students: m.length, ...Object.fromEntries(K.STATUS.map(([c, l]) => [l, m.filter((s) => s.status === c).length])) }; }); }],
  university: ["University-wise admission", () => { const ap = S.rows("applications").filter((a) => inRange(a.created_at, RF.from, RF.to) && (!RF.country || a.country === RF.country)); return Object.keys(countBy(ap, (a) => a.university)).map((u) => { const m = ap.filter((a) => a.university === u); return { University: u, Country: m[0].country, Applications: m.length, Offers: m.filter((a) => ["conditional", "unconditional", "deposit", "cas"].includes(a.status)).length, "Deposit paid": m.filter((a) => ["deposit", "cas"].includes(a.status)).length, Rejected: m.filter((a) => a.status === "rejected").length, "Tuition total": sum(m, (a) => a.tuition_fee) }; }).sort((a, b) => b.Applications - a.Applications); }],
  visa: ["Visa processing report", () => S.rows("visas").filter((v) => inRange(v.created_at, RF.from, RF.to) && (!RF.country || v.country === RF.country)).map((v) => ({ "Student ID": stu(v.student_id).sid, Student: stu(v.student_id).name, Country: v.country, Status: lab(K.VISA_STATUS, v.status), Submitted: v.submitted_on, Biometrics: v.biometrics_date, Decision: v.decision_date, "Refusal reason": v.refusal_reason, Responsible: S.uname(v.owner_id) }))],
  employee: ["Employee performance", () => S.users().filter((u) => u.active).map((u) => { const t = S.rows("tasks").filter((k) => (k.assignees || []).includes(u.id) && inRange(k.created_at, RF.from, RF.to)); return { Employee: u.name, Role: S.ROLES[u.role], Department: u.department, "Tasks assigned": t.length, Completed: t.filter((k) => k.status === "done").length, "In progress": t.filter((k) => ["doing", "review"].includes(k.status)).length, Overdue: t.filter(CRM.taskLate).length, "Completion %": t.length ? Math.round((t.filter((k) => k.status === "done").length / t.length) * 100) + "%" : "—", "Notes / calls logged": S.rows("notes").filter((n) => n.created_by === u.id && n.type !== "status" && inRange(n.created_at, RF.from, RF.to)).length, "Leads entered": S.rows("students").filter((s) => s.created_by === u.id && inRange(s.created_at, RF.from, RF.to)).length }; })],
  ielts: ["IELTS batch report", () => S.rows("batches").map((b) => { const e = S.rows("enrollments").filter((x) => x.batch_id === b.id), a = S.rows("attendance").filter((x) => x.batch_id === b.id), mk = S.rows("mocks").filter((x) => x.batch_id === b.id), all = a.flatMap((x) => Object.values(x.marks || {}));
    return { Batch: b.name, Course: b.course_type, Teacher: S.uname(b.teacher_id), Status: b.status, Students: e.length, Dropped: e.filter((x) => x.status === "dropped").length, Classes: a.length, "Attendance %": all.length ? Math.round((all.filter((x) => x !== "A").length / all.length) * 100) + "%" : "—", "Avg band": mk.length ? (sum(mk, (m) => m.overall) / mk.length).toFixed(1) : "—", "Fee billed": sum(e, (x) => (x.fee || 0) - (x.discount || 0)) }; })],
  dues: ["Outstanding payments", () => S.rows("invoices").filter((i) => CRM.fin.dueOf(i) > 0).map((i) => ({ Invoice: i.no, "Student ID": stu(i.student_id).sid, Student: stu(i.student_id).name, Phone: stu(i.student_id).phone, "Fee type": i.category, Payable: CRM.fin.netOf(i), Paid: CRM.fin.paidOf(i), Due: CRM.fin.dueOf(i), "Due date": i.due_date })), true],
  monthly: ["Monthly business report", () => { const fin = S.can.finance(), ms = [...new Set([...S.rows("students").map((s) => String(s.created_at).slice(0, 7)), ...S.rows("payments").map((p) => String(p.date).slice(0, 7))])].filter((m) => inRange(m + "-15", RF.from && RF.from.slice(0, 8) + "01", RF.to)).sort().reverse();
    const stat = (m, re) => S.rows("notes").filter((n) => n.type === "status" && String(n.created_at).startsWith(m) && re.test(n.text)).length;
    return ms.map((m) => { const inc = sum(S.rows("payments").filter((p) => String(p.date).startsWith(m)), (p) => (p.refund ? -p.amount : p.amount)), ex = sum(S.rows("expenses").filter((e) => String(e.date).startsWith(m)), (e) => e.amount);
      return { Month: m, "New leads": S.rows("students").filter((s) => String(s.created_at).startsWith(m)).length, Applications: S.rows("applications").filter((a) => String(a.created_at).startsWith(m)).length, "Offers (status changes)": stat(m, /→ Offer Received/), "Visa approved": stat(m, /→ Visa Approved/), Departed: S.rows("students").filter((s) => String(s.departure_date || "").startsWith(m)).length, Lost: stat(m, /→ Lost/), ...(fin ? { Income: inc, Expense: ex, "Net profit": inc - ex } : {}) }; }); }],
};
CRM.views.reports = (root, [key = "students"]) => {
  if (!REPORTS[key] || (REPORTS[key][2] && !S.can.finance())) key = "students";
  const rows = REPORTS[key][1](), title = REPORTS[key][0], cols = rows.length ? Object.keys(rows[0]) : [];
  const sub = [RF.from && "from " + fmtD(RF.from), RF.to && "to " + fmtD(RF.to), RF.country, RF.counsellor && S.uname(RF.counsellor)].filter(Boolean).join(" · ");
  root.innerHTML = `<div class="ph"><div><span class="kicker">Reports</span><h1>${esc(title)}</h1><p>${rows.length} rows${sub ? " · " + esc(sub) : ""}</p></div>
    <div class="ph-act">${S.can.exportData() ? `<button class="btn btn-line" data-act="x">${ic("down")} Excel</button><button class="btn btn-primary" data-act="pdf">${ic("print")} PDF</button>` : '<span class="muted mini">Export is only for Admin & Manager</span>'}</div></div>
    <div class="filters"><select data-ch="rep">${opts(Object.entries(REPORTS).filter(([, r]) => !r[2] || S.can.finance()).map(([k, r]) => [k, r[0]]), key)}</select>
      <label class="mini muted">From <input type="date" data-ch="rf" data-k="from" value="${RF.from}"></label><label class="mini muted">To <input type="date" data-ch="rf" data-k="to" value="${RF.to}"></label>
      <select data-ch="rf" data-k="country"><option value="">All countries</option>${opts(K.COUNTRIES, RF.country)}</select>
      <select data-ch="rf" data-k="counsellor"><option value="">All counsellors</option>${opts(S.users().filter((u) => ["counsellor", "senior"].includes(u.role)).map((u) => [u.id, u.name]), RF.counsellor)}</select></div>
    ${table(cols.map((c) => ({ label: c, get: (r) => esc(r[c] ?? "") })), rows.map((r, i) => ({ ...r, id: i })), { stat: true, empty: "No data for these filters." })}`;
  on(root, { "ch:rep": (el) => go("#/reports/" + el.value), "ch:rf": (el) => { RF[el.dataset.k] = el.value; rerender(); }, x: () => exportXlsx(`${key}-report-${today()}`, rows, title), pdf: () => exportPdf(title, rows, sub) });
};

/* ---------- team & settings ---------- */
const USER_F = (row) => [{ k: "name", label: "Full name", required: true }, ...(row ? [] : [{ k: "login", label: "Login ID (or email)", required: true, ph: "rakib", hint: "Small letters, no spaces" }, { k: "password", label: "Temporary password (min 8)", required: true, def: S.genPassword() }]),
  { k: "role", label: "Role (decides what they can see)", type: "select", options: Object.entries(S.ROLES).filter(([k]) => k !== "admin" || S.is("admin")), required: true }, { k: "department", label: "Department", type: "select", options: K.DEPTS }, { k: "designation", label: "Designation" }, { k: "phone", label: "Phone", type: "tel" }, { k: "joined", label: "Joining date", type: "date" },
  ...(S.is("admin") ? [{ k: "extra_perms", label: "Special access — only for this person (on top of the role)", type: "multi", options: S.PERM_LIST.map(([k, l]) => [k, l]), hint: "Others in the same department or role do NOT get these. Only the Admin can change this." }] : []),
  ...(row ? [{ k: "active", label: "Access enabled (untick when the employee resigns)", type: "checkbox", full: true }, { k: "newpw", label: "Set a new password (only if they forgot it)", full: true, ph: "Leave empty to keep the current password" }] : [])];
CRM.views.settings = (root, [tab = "team"]) => {
  const T = [["team", "Team"], ["roles", "Role permissions"]]; if (S.can.logs()) T.push(["log", "Activity log"]); if (S.is("admin")) T.push(["backup", "Backup & data"]); T.push(["account", "My account"]);
  if (!T.some((t) => t[0] === tab)) tab = "team";
  const users = [...S.users()].sort((a, b) => Object.keys(S.ROLES).indexOf(a.role) - Object.keys(S.ROLES).indexOf(b.role));
  let body = "";
  const deptCard = () => S.is("admin") ? `<div class="card" style="margin-top:16px"><h3>Departments</h3><p class="muted">Add a department, put people in it (Edit employee → Department), then give one person <b>Special access</b> from their Edit form — only that person gets it.</p>
      <div class="role-chips">${K.DEPTS.map((d) => `<span class="role-chip ${S.BASE_DEPTS.includes(d) ? "" : "custom"}">${esc(d)} <small>${users.filter((u) => u.department === d && u.active).length}</small>${S.BASE_DEPTS.includes(d) ? "" : `<button data-act="deptDel" data-d="${esc(d)}" title="Remove">×</button>`}</span>`).join("")}</div>
      <div class="filters" style="margin-top:12px"><input class="input" id="newDept" placeholder="New department — e.g. Visa Desk" maxlength="40" style="max-width:320px"><button class="btn btn-primary" data-act="deptAdd">${ic("plus")} Add department</button></div></div>` : "";
  if (tab === "team") body = `${S.can.users() ? `<div class="filters"><button class="btn btn-primary" data-act="addUser">${ic("plus")} Add employee</button><button class="btn btn-line" data-act="bulk">${ic("up")} Add many from Excel</button><button class="btn btn-line" data-act="tpl">${ic("down")} Excel template</button></div>` : ""}${table([{ label: "Employee", get: (u) => `<div class="cell-u">${av(u.name, "", u.photo)}<div><b>${esc(u.name)}</b><small>ID: ${esc(S.loginId(u))}</small></div></div>` }, { label: "Role", get: (u) => pill(S.ROLES[u.role] || u.role, u.role === "admin" ? "maroon" : u.role === "pending" ? "red" : "gold") + ((u.extra_perms || []).length ? `<small class="special">★ Special: ${esc(u.extra_perms.map((k) => (S.PERM_LIST.find((p) => p[0] === k) || [0, k])[1].split(/[,:(]/)[0]).join(", "))}</small>` : "") },
    { label: "Department", get: (u) => `${esc(u.department || "—")}<small>${esc(u.designation || "")}</small>` }, { label: "Phone", get: (u) => esc(u.phone || "—") }, { label: "Joined", get: (u) => fmtD(u.joined) }, { label: "Access", get: (u) => (u.active ? pill("Active", "green") : pill("Disabled", "red")) }], users, { act: "user", stat: !S.can.users() })}${deptCard()}`;
  if (tab === "roles") {
    const P = S.perms(), roles = Object.keys(S.ROLES), ed = S.can.roles(), CR = S.customRoles(), short = (l) => (l.startsWith("Student") ? "Counsellor" : l.split(" (")[0].replace("Operation Manager", "Operation").replace("Senior Counsellor", "Senior").replace("IELTS Teacher", "Teacher"));
    body = `<div class="card"><p class="muted">${ed ? "Tick what each role may do, then Save. You will be asked for your password, and every change is written to the Activity log. The Admin always has everything, so you cannot lock yourself out." : "Only the Admin can change these."} In live mode the database enforces the same table, so it cannot be bypassed from a browser.</p>
      <div class="tbl-wrap"><table class="tbl static perm"><thead><tr><th>Permission</th>${roles.map((r) => `<th class="center">${esc(short(S.ROLES[r]))}</th>`).join("")}</tr></thead><tbody>
      ${S.PERM_LIST.map(([k, l, h]) => `<tr><td><b>${esc(l)}</b>${h ? `<small>${esc(h)}</small>` : ""}</td>${roles.map((r) => `<td class="center"><input type="checkbox" data-p="${k}" data-r="${r}" ${r === "admin" || P[k].includes(r) ? "checked" : ""} ${r === "admin" || !ed ? "disabled" : ""}></td>`).join("")}</tr>`).join("")}
      ${[["Change role permissions, add or remove roles", 1], ["Dashboard, own tasks, reminders, own guide", 0]].map(([l, adminOnly]) => `<tr><td><b>${l}</b><small>Fixed — cannot be changed</small></td>${roles.map((r) => `<td class="center">${!adminOnly || r === "admin" ? "🔒" : '<span class="muted">—</span>'}</td>`).join("")}</tr>`).join("")}
      </tbody></table></div>${ed ? `<div class="modal-f"><button class="btn btn-line" data-act="permReset">Back to default</button><button class="btn btn-primary" data-act="permSave">Save permissions</button></div>` : ""}</div>
      ${ed ? `<div class="card" style="margin-top:16px"><h3>Roles / categories</h3><p class="muted">Add a new role (for example “Visa Officer” or “Marketing”), then tick its permissions in the table above and save. A new role starts with no permissions.</p>
        <div class="role-chips">${Object.entries(S.ROLES).map(([k, l]) => `<span class="role-chip ${CR[k] ? "custom" : ""}">${esc(l)} <small>${S.users().filter((u) => u.role === k && u.active).length}</small>${CR[k] ? `<button data-act="roleDel" data-k="${k}" title="Remove this role">×</button>` : ""}</span>`).join("")}</div>
        <div class="filters" style="margin-top:12px"><input class="input" id="newRole" placeholder="New role name — e.g. Visa Officer" maxlength="40" style="max-width:320px"><button class="btn btn-primary" data-act="roleAdd">${ic("plus")} Add role</button></div></div>` : ""}`;
  }
  if (tab === "log") { const logs = S.rows("activity").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    body = `<div class="filters"><div class="searchbox">${ic("search")}<input id="lq" placeholder="Filter: download, export, login, delete, a name…"></div><button class="btn btn-line" data-act="xlog">${ic("down")} Excel</button></div><div id="ll"></div>`;
    setTimeout(() => { const draw = (q = "") => ($("#ll", root).innerHTML = table([{ label: "When", cls: "nowrap", get: (l) => fmtDT(l.created_at) }, { label: "Who", get: (l) => esc(S.uname(l.created_by)) }, { label: "Action", get: (l) => pill(l.action, ["delete", "export", "download"].includes(l.action) ? "red" : "") }, { label: "On", get: (l) => esc(l.entity || "") }, { label: "Detail", get: (l) => esc(l.detail || "") }],
        logs.filter((l) => !q || [l.action, l.entity, l.detail, S.uname(l.created_by)].join(" ").toLowerCase().includes(q.toLowerCase())), { stat: true, max: 300 })); draw(); $("#lq", root).oninput = (e) => draw(e.target.value); }); }
  if (tab === "backup") body = `<div class="grid2"><div class="card"><h3>Full backup</h3><p class="muted">Downloads every record you can see as one file. Keep it somewhere safe — it contains personal data.</p><button class="btn btn-primary" data-act="json">${ic("down")} Download backup (.json)</button> <button class="btn btn-line" data-act="xall">${ic("down")} All students (.xlsx)</button>
      <p class="mini muted" style="margin-top:12px">${S.LIVE ? "Live mode: Supabase also keeps automatic daily database backups on the Pro plan. Uploaded files are stored in the private “documents” bucket." : "Demo mode: data lives only in this browser. Clearing browser data deletes it."}</p></div>
    ${S.LIVE ? "" : `<div class="card"><h3>Demo data</h3><p class="muted">You are looking at made-up sample data.</p><button class="btn btn-line" data-act="reseed">Reload sample data</button> <button class="btn btn-bad" data-act="wipe">Start empty</button></div>`}</div>`;
  if (tab === "account") body = `<div class="card" style="max-width:520px"><div class="cell-u" style="margin-bottom:12px"><label class="photo" title="Change my picture">${av(S.me.name, "lg", S.me.photo)}<input type="file" accept="image/*" hidden data-ch="myPhoto"></label><div><h3 style="margin:0">${esc(S.me.name)}</h3><span class="muted">Login ID: <b>${esc(S.loginId(S.me))}</b> · ${esc(S.ROLES[S.me.role])}</span></div></div>
    <button class="btn btn-line" data-act="pw">Change password</button> ${S.LIVE ? `<button class="btn btn-line" data-act="outAll">${ic("out")} Log out from all devices</button>
      <h4 style="margin-top:18px">2-step login</h4><p class="muted mini">After your password, the CRM also asks for a 6-digit code from Google Authenticator / Microsoft Authenticator on your phone. Recommended for Admin, Manager and Accounts.</p><div id="mfaBox"><button class="btn btn-line" data-act="mfa">Check / set up 2-step login</button></div>` : '<p class="muted">Passwords, “log out from all devices” and login history work in live mode.</p>'}</div>`;
  root.innerHTML = `<div class="ph"><div><span class="kicker">Settings</span><h1>Team & Settings</h1><p>${users.filter((u) => u.active).length} active employees</p></div></div><div class="tabs">${T.map(([k, l]) => `<a href="#/settings/${k}" class="${k === tab ? "on" : ""}">${l}</a>`).join("")}</div>${body}`;
  const roleAsk = (next, what) => formModal({ title: "Confirm with your password", intro: `<p class="muted">${what} Type your own login password to confirm.</p>`, fields: [{ k: "pw", label: "Your password", type: "password", required: true, full: true }], saveLabel: "Confirm & save",
    onSave: async (d) => { await S.saveRoles(next, d.pw); toast("Roles saved", "ok"); setTimeout(rerender, 50); } });
  const userForm = (row) => (row && row.role === "admin" && !S.is("admin")) ? toast("Only the Admin can change the Admin account", "bad") : formModal({ title: row ? "Edit " + row.name : "Add employee", fields: USER_F(row), values: row, onSave: async (d) => {
    if (row) { if (row.id === S.me.id && (d.role !== "admin" || !d.active)) throw new Error("You cannot remove your own admin access"); const { newpw, ...rest } = d; d = rest;
      if (newpw) { if (newpw.length < 8) throw new Error("Password must be at least 8 characters"); await S.resetPassword(row.id, newpw); S.log("password-reset", "user", row.id, row.name); setTimeout(() => credsModal([{ name: row.name, role: d.role, id: S.loginId(row), password: newpw }]), 50); }
      const sp = "extra_perms" in d && JSON.stringify([...(d.extra_perms || [])].sort()) !== JSON.stringify([...(row.extra_perms || [])].sort());
      await S.set("profiles", row.id, d); S.log(d.active ? "update" : "disable", "user", row.id, `${row.name} → ${d.role}${d.active ? "" : " (access disabled)"}${sp ? ` · special access: ${(d.extra_perms || []).join(", ") || "none"}` : ""}`); }
    else { if (d.password.length < 8) throw new Error("Password must be at least 8 characters"); const u = await S.createUser(d); S.log("create", "user", u.id, `${d.name} (${d.role})`); setTimeout(() => credsModal([{ name: d.name, role: d.role, id: S.loginId(u), password: d.password }]), 50); }
  } });
  /* নতুন অ্যাকাউন্টের ID + পাসওয়ার্ড — শুধু এই একবারই দেখা যায়, তাই এখনই প্রিন্ট/সেভ করতে হয় */
  const credsModal = (list, failed = []) => {
    const m = CRM.ui.modal(`${list.length} login${list.length === 1 ? "" : "s"} created`, `<p class="muted">Passwords are shown <b>only now</b> — the CRM does not keep them. Print the login sheet, cut the slips and hand one to each person.</p>
      <div class="creds">${table([{ label: "Name", get: (c) => `<b>${esc(c.name)}</b><small>${esc(S.ROLES[c.role] || c.role)}</small>` }, { label: "Login ID", get: (c) => `<span class="mono">${esc(c.id)}</span>` }, { label: "Password", get: (c) => `<span class="mono">${esc(c.password)}</span>` }], list.map((c, i) => ({ ...c, id2: i })), { stat: true })}</div>
      ${failed.length ? `<p class="err">Not created: ${esc(failed.join("; "))}</p>` : ""}
      <div class="modal-f"><button class="btn btn-line" data-x2>${ic("down")} Excel</button><button class="btn btn-primary" data-p2>${ic("print")} Print login sheet (PDF)</button></div>`, { wide: true });
    m.body.querySelector("[data-p2]").onclick = () => CRM.ui.printDoc("Staff login sheet", `<h1>CRM login details</h1><p>${list.length} staff · created ${fmtD(today())}</p>
      <div class="note">Keep this page safe and destroy each slip after first login. Everyone must change the password from <b>Team &amp; Settings → My account</b> on first login.</div>
      <div class="slips">${list.map((c) => `<div class="slip"><b>${esc(c.name)}</b><small>${esc(S.ROLES[c.role] || c.role)}</small><dl><dt>Website</dt><dd style="font-family:inherit;font-weight:600;font-size:9pt">${esc(location.origin + location.pathname)}</dd><dt>Login ID</dt><dd>${esc(c.id)}</dd><dt>Password</dt><dd>${esc(c.password)}</dd></dl></div>`).join("")}</div>`);
    m.body.querySelector("[data-x2]").onclick = () => exportXlsx("staff-logins-" + today(), list.map((c) => ({ Name: c.name, Role: S.ROLES[c.role] || c.role, "Login ID": c.id, "Temporary password": c.password })));
  };
  const ROLE_MAP = [[/admin|ceo/, "admin"], [/operat/, "operation"], [/senior/, "senior"], [/counsel/, "counsellor"], [/moderat/, "moderator"], [/teach|ielts/, "teacher"], [/account/, "accounts"], [/manag/, "manager"]];
  const bulk = () => {
    const m = CRM.ui.modal("Add many employees from Excel", `<p class="muted">Fill in the template (one row per person: <b>Name, Role, Department, Designation, Phone</b>; Login ID is optional) and choose it here. The CRM makes a Login ID and a random password for each person.</p>
      <label class="fld"><span>Excel / CSV file</span><input type="file" id="bf" accept=".xlsx,.xls,.csv"></label><p id="bp" class="mini muted"></p><p class="err"></p>
      ${S.LIVE ? '<p class="mini muted">The database allows only a few new logins per minute, so 45 people can take 5–10 minutes. Keep this window open.</p>' : ""}<div class="modal-f"><button class="btn btn-primary" id="bgo" disabled>Create logins</button></div>`);
    let people = [];
    const col = (o, re) => { const k = Object.keys(o).find((x) => re.test(x)); return k ? String(o[k] ?? "").trim() : ""; };
    $("#bf", m.body).onchange = async (e) => {
      try {
        const wb = XLSX.read(await e.target.files[0].arrayBuffer()), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }), used = new Set(S.users().map((u) => S.loginId(u)));
        people = rows.map((r) => { const name = col(r, /name/i); if (!name) return null; const rt = col(r, /role/i).toLowerCase(), role = (ROLE_MAP.find(([re]) => re.test(rt)) || [0, Object.keys(S.ROLES).includes(rt) ? rt : "staff"])[1];
          let base = (col(r, /login|user|^id$/i) || name.split(/\s+/)[0]).toLowerCase().replace(/[^a-z0-9._-]/g, "") || "staff", id = base, n = 1; while (used.has(id)) id = base + ++n; used.add(id);
          return { name, role, login: id, department: col(r, /depart/i) || null, designation: col(r, /designation|position|title/i) || null, phone: col(r, /phone|mobile/i) || null }; }).filter(Boolean);
        $("#bp", m.body).innerHTML = people.length ? `${people.length} people found: ` + Object.entries(countBy(people, (p) => S.ROLES[p.role])).map(([k, n]) => `${n} ${esc(k)}`).join(", ") : "No rows with a name were found."; $("#bgo", m.body).disabled = !people.length;
      } catch (ex) { $(".err", m.body).textContent = ex.message; }
    };
    $("#bgo", m.body).onclick = async (e) => {
      e.target.disabled = true; const done = [], failed = [];
      for (const p of people) {
        const password = S.genPassword(); $("#bp", m.body).textContent = `Creating ${done.length + failed.length + 1} of ${people.length}: ${p.name}…`;
        try { const u = await S.createUser({ ...p, password, joined: today() }); done.push({ name: p.name, role: p.role, id: S.loginId(u), password }); } catch (ex) { failed.push(`${p.name} (${ex.message})`); }
      }
      S.log("create", "user", null, `${done.length} employees added in bulk`); m.close(); rerender(); if (done.length) credsModal(done, failed); else toast("No login was created: " + failed[0], "bad");
    };
  };
  const mfa = async () => {
    const box = $("#mfaBox", root);
    try {
      if (await S.mfaFactor()) { box.innerHTML = `${pill("2-step login is ON", "green")} <button class="btn btn-bad sm" id="moff">Turn off</button>`; $("#moff", box).onclick = async () => { if (await confirmBox("Turn off 2-step login for your account?")) { await S.mfaOff(); toast("2-step login turned off"); mfa(); } }; return; }
      const f = await S.mfaEnroll();
      box.innerHTML = `<p class="mini">1. Open Google Authenticator on your phone → <b>+</b> → Scan QR code.</p><img class="qr" src="${f.qr}" alt="QR code"><p class="mini muted" style="text-align:center">Or type this key: <span class="mono">${esc(f.secret)}</span></p><p class="mini">2. Type the 6-digit code the app shows:</p><div class="filters"><input class="input" id="mc" inputmode="numeric" maxlength="6" style="max-width:140px"><button class="btn btn-primary" id="mok">Turn on</button></div>`;
      $("#mok", box).onclick = async () => { try { await S.mfaConfirm(f.id, $("#mc", box).value.trim()); toast("2-step login is on", "ok"); mfa(); } catch (ex) { toast(ex.message, "bad"); } };
    } catch (ex) { toast(ex.message, "bad"); }
  };
  const permAsk = (next, what) => formModal({ title: "Confirm with your password", intro: `<p class="muted">${what} Type your own login password to confirm.</p>`, fields: [{ k: "pw", label: "Your password", type: "password", required: true, full: true }], saveLabel: "Confirm & save",
    onSave: async (d) => { await S.savePerms(next, d.pw); toast("Permissions saved", "ok"); } });
  on(root, { bulk, mfa,
    permSave: () => { const next = {}; S.PERM_LIST.forEach(([key]) => (next[key] = [...root.querySelectorAll(`input[data-p="${key}"]:checked`)].map((i) => i.dataset.r).filter((r) => r !== "admin"))); permAsk(next, "You are changing what each role can see and do."); },
    permReset: () => permAsk(S.DEF_PERMS, "This puts every permission back to the original setting."),
    roleAdd: () => { const name = ($("#newRole", root).value || "").trim(); if (name.length < 2) return toast("Type the new role's name", "bad");
      let key = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24); if (!/^[a-z]/.test(key)) key = "role_" + key; while (S.ROLES[key]) key += "_2";
      if (Object.values(S.ROLES).some((l) => l.toLowerCase() === name.toLowerCase())) return toast("This role already exists", "bad");
      roleAsk({ ...S.customRoles(), [key]: name }, `You are adding the role “${esc(name)}”.`); },
    deptAdd: async () => { const d = ($("#newDept", root).value || "").trim(); if (d.length < 2) return toast("Type the department name", "bad"); if (K.DEPTS.some((x) => x.toLowerCase() === d.toLowerCase())) return toast("This department already exists", "bad");
      try { await S.saveDepts([...K.DEPTS.filter((x) => !S.BASE_DEPTS.includes(x)), d]); toast("Department added", "ok"); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
    deptDel: async (el) => { if (!(await confirmBox(`Remove the department “${el.dataset.d}”?`))) return; try { await S.saveDepts(K.DEPTS.filter((x) => !S.BASE_DEPTS.includes(x) && x !== el.dataset.d)); toast("Removed", "ok"); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
    roleDel: (el) => { const c = S.customRoles(), name = c[el.dataset.k]; delete c[el.dataset.k]; roleAsk(c, `You are removing the role “${esc(name)}”.`); }, tpl: () => exportXlsx("employee-template", [{ Name: "Rakib Hasan", Role: "Counsellor", Department: "Counselling", Designation: "Student Counsellor", Phone: "017XXXXXXXX", "Login ID": "" }, { Name: "", Role: "Roles: CEO, Manager, Operation, Senior Counsellor, Counsellor, Moderator, IELTS Teacher, Accounts, Staff", Department: "", Designation: "", Phone: "", "Login ID": "" }], "Employees"),
    "ch:myPhoto": async (inp) => { try { await S.setMyPhoto(await CRM.ui.shrinkImage(inp.files[0])); location.reload(); } catch (ex) { toast(ex.message, "bad"); } },
    addUser: () => userForm(), user: (el) => userForm(S.users().find((u) => u.id === el.dataset.id)),
    xlog: () => exportXlsx("activity-log-" + today(), S.rows("activity").map((l) => ({ When: l.created_at, Who: S.uname(l.created_by), Action: l.action, On: l.entity, Detail: l.detail }))),
    json: () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(S.dump(), null, 1)], { type: "application/json" })); a.download = `bfs-crm-backup-${today()}.json`; a.click(); S.log("export", "backup", null, "Full JSON backup"); },
    xall: () => exportXlsx("all-students-" + today(), S.rows("students").map(CRM.flatStudent)),
    reseed: async () => { if (await confirmBox("Replace everything in this browser with fresh sample data?")) { S.resetDemo(false); location.reload(); } },
    wipe: async () => { if (await confirmBox("Delete all sample data and start with an empty CRM in this browser?", "Start empty")) { S.resetDemo(true); sessionStorage.clear(); location.reload(); } },
    pw: () => formModal({ title: "Change password", fields: [{ k: "pw", label: "New password (min 8)", type: "password", required: true, full: true }], onSave: async (d) => { if (d.pw.length < 8) throw new Error("At least 8 characters"); await S.changePassword(d.pw); toast("Password changed", "ok"); } }),
    outAll: async () => { if (await confirmBox("Log out from every device, including this one?")) { await S.logout(true); location.reload(); } } });
};
})();
