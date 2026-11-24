/* ===== IELTS / English Language Centre: Batch, ভর্তি, Attendance, Mock Test ===== */
(() => {
const CRM = window.CRM, { S, K } = CRM;
const { esc, $, today, fmtD, money, sum, ic, pill, av, toast, go, rerender, opts, formModal, table, on, exportXlsx, confirmBox } = CRM.ui;
const teachers = () => S.users().filter((u) => u.active && u.role === "teacher").map((u) => [u.id, u.name]);
const bTone = { upcoming: "blue", running: "green", completed: "muted" };
const stu = (id) => S.get("students", id) || { name: "—", sid: "", phone: "" };

const BATCH_F = () => [{ k: "meeting_link", label: "Online class link (Zoom / Meet)", type: "url", full: true, ph: "https://zoom.us/j/…" },{ k: "name", label: "Batch name", required: true, full: true, ph: "IELTS Academic — Batch 15" }, { k: "course_type", label: "Course type", type: "select", options: K.COURSES, required: true }, { k: "teacher_id", label: "Teacher", type: "select", options: teachers() },
  { k: "start_date", label: "Start date", type: "date" }, { k: "end_date", label: "End date", type: "date" }, { k: "schedule", label: "Class days", ph: "Sat, Mon, Wed" }, { k: "class_time", label: "Class time", ph: "4:00 PM – 5:30 PM" },
  { k: "room", label: "Room" }, { k: "capacity", label: "Capacity", type: "number", def: 20 }, { k: "status", label: "Status", type: "select", options: ["upcoming", "running", "completed"], blank: false, def: "upcoming" }];
const batchForm = (row) => formModal({ title: row ? "Edit batch" : "New batch", fields: BATCH_F(), values: row, onSave: async (d) => { if (row) await S.set("batches", row.id, d); else { const b = await S.add("batches", d); S.log("create", "batch", b.id, b.name); } } });

CRM.views.ielts = (root) => {
  const mine = S.is("teacher") ? S.rows("batches").filter((b) => b.teacher_id === S.me.id) : S.rows("batches"), en = S.rows("enrollments");
  root.innerHTML = `<div class="ph"><div><span class="kicker">IELTS Centre</span><h1>Batches</h1><p>${mine.filter((b) => b.status === "running").length} running · ${en.filter((e) => e.status === "active").length} active students</p></div>
    <div class="ph-act">${S.can.ieltsAdmin() ? `<button class="btn btn-primary" data-act="new">${ic("plus")} New batch</button>` : ""}</div></div>
    <div class="grid3">${mine.map((b) => { const n = en.filter((e) => e.batch_id === b.id && e.status !== "dropped").length; return `<div class="card bcard" data-act="open" data-id="${b.id}"><h3>${esc(b.name)} ${pill(b.status, bTone[b.status])}</h3>
      <p class="muted">${esc(b.course_type || "")}<br>${ic("clock")} ${esc(b.schedule || "—")} · ${esc(b.class_time || "")}<br>${ic("users")} ${esc(S.uname(b.teacher_id))} · ${esc(b.room || "")}</p>
      <div class="prog"><i style="width:${Math.min(100, (n / (b.capacity || 1)) * 100)}%"></i></div><p class="mini muted" style="margin:6px 0 0">${n} of ${b.capacity || "—"} seats · ${fmtD(b.start_date)} → ${fmtD(b.end_date)}</p></div>`; }).join("") || '<div class="empty" style="grid-column:1/-1">No batch yet.</div>'}</div>`;
  on(root, { new: () => batchForm(), open: (el) => go("#/batch/" + el.dataset.id) });
};

CRM.views.batch = (root, [id, tab = "students"]) => {
  const b = S.get("batches", id);
  if (!b) { root.innerHTML = `<div class="empty">Batch not found. <a href="#/ielts">Back</a></div>`; return; }
  const en = S.rows("enrollments").filter((e) => e.batch_id === id), act = en.filter((e) => e.status === "active"), att = S.rows("attendance").filter((a) => a.batch_id === id).sort((a, c) => String(a.date).localeCompare(String(c.date)));
  const mocks = S.rows("mocks").filter((m) => m.batch_id === id), mark = S.can.marks(b), fin = S.can.finance(), SC = CRM.scheme(b.course_type);
  const pct = (eid, list = att) => { const m = list.map((a) => (a.marks || {})[eid]).filter(Boolean); return m.length ? Math.round((m.filter((x) => x !== "A").length / m.length) * 100) : null; };
  const paid = (e) => { const inv = S.rows("invoices").filter((i) => i.student_id === e.student_id && i.category === "IELTS Course Fee"); return sum(S.rows("payments").filter((p) => inv.some((i) => i.id === p.invoice_id)), (p) => (p.refund ? -p.amount : p.amount)); };
  const posts = S.rows("batch_posts").filter((x) => x.batch_id === id).sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)));
  const T = [["students", `Students <em>${act.length}</em>`]]; if (mark) T.push(["class", `Class link & homework <em>${posts.length}</em>`], ["attendance", `Attendance <em>${att.length}</em>`], ["mocks", `${SC.unit === "marks" ? "Tests" : "Mock tests"} & results <em>${mocks.length}</em>`]);
  if (!T.some((t) => t[0] === tab)) tab = "students";
  root.innerHTML = `<p><a href="#/ielts">${ic("back")} All batches</a></p>
    <div class="ph"><div><span class="kicker">${esc(b.course_type || "Batch")}</span><h1>${esc(b.name)} ${pill(b.status, bTone[b.status])}</h1><p>${esc(b.schedule || "")} · ${esc(b.class_time || "")} · ${esc(b.room || "")} · Teacher: <b>${esc(S.uname(b.teacher_id))}</b></p></div>
      <div class="ph-act">${S.can.ieltsAdmin() ? `<button class="btn btn-line" data-act="editBatch">${ic("edit")} Edit batch</button>` : ""}${S.can.finance() ? `<button class="btn btn-primary" data-act="enroll">${ic("plus")} Enroll student</button>` : ""}</div></div>
    <div class="tabs">${T.map(([k, l]) => `<a href="#/batch/${id}/${k}" class="${k === tab ? "on" : ""}">${l}</a>`).join("")}</div><div id="tb"></div>`;
  const tb = $("#tb", root);

  if (tab === "students") {
    tb.innerHTML = table([{ label: "Student", get: (e) => `<div class="cell-u">${av(stu(e.student_id).name)}<div><b>${esc(stu(e.student_id).name)}</b><small>${esc(stu(e.student_id).sid)} · ${esc(stu(e.student_id).phone || "")}</small></div></div>` },
      { label: "Admitted", get: (e) => fmtD(e.admitted_on) }, { label: "Status", get: (e) => pill(e.status, e.status === "active" ? "green" : e.status === "dropped" ? "red" : "") },
      ...(mark ? [{ label: "Attendance", get: (e) => { const p = pct(e.id); return p == null ? "—" : `<span class="${p < 70 ? "late" : ""}">${p}%</span>`; } },
        { label: "Latest " + SC.unit, get: (e) => { const m = mocks.filter((x) => x.enrollment_id === e.id).sort((a, c) => String(c.date).localeCompare(String(a.date)))[0]; return m ? `<b>${m.overall}</b> <small>${esc(m.kind)} · ${fmtD(m.date)}</small>` : "—"; } }] : []),
      ...(fin ? [{ label: "Fee", cls: "right", get: (e) => money((e.fee || 0) - (e.discount || 0)) }, { label: "Due", cls: "right", get: (e) => { const d = (e.fee || 0) - (e.discount || 0) - paid(e); return d > 0 ? `<span class="late">${money(d)}</span>` : pill("Paid", "green"); } }] : []),
    ], en, { empty: "No student enrolled yet.", act: "stu" });
  }
  if (tab === "attendance") {
    const month = today().slice(0, 7), mAtt = att.filter((a) => a.date.startsWith(month));
    const draw = (date) => {
      const rec = att.find((a) => a.date === date), marks = { ...(rec ? rec.marks : {}) };
      tb.innerHTML = `<div class="grid2"><div class="card"><h3>Daily attendance <input type="date" id="ad" class="input" style="width:auto" value="${date}" max="${today()}"></h3>
        ${act.map((e) => `<div class="rowcard" style="cursor:default"><div class="cell-u">${av(stu(e.student_id).name)}<b>${esc(stu(e.student_id).name)}</b></div><div class="seg" data-e="${e.id}">${[["P", "Present"], ["L", "Late"], ["A", "Absent"]].map(([v, l]) => `<button type="button" data-v="${v}" class="${(marks[e.id] || "P") === v ? "on" : ""}">${l}</button>`).join("")}</div></div>`).join("") || '<div class="empty">No active students.</div>'}
        <div class="modal-f"><span class="muted mini" style="margin-right:auto">${rec ? "Already saved for this date — saving again will update it." : "Not saved yet for this date."}</span><button class="btn btn-primary" id="as">Save attendance</button></div></div>
        <div class="card"><h3>This month (${mAtt.length} classes) <button class="btn btn-line sm" id="ax">${ic("down")} Excel</button></h3>${table([{ label: "Student", get: (e) => esc(stu(e.student_id).name) }, ...["P", "L", "A"].map((k) => ({ label: { P: "Present", L: "Late", A: "Absent" }[k], cls: "right", get: (e) => mAtt.filter((a) => (a.marks || {})[e.id] === k).length })),
          { label: "%", cls: "right", get: (e) => { const p = pct(e.id, mAtt); return p == null ? "—" : `<b class="${p < 70 ? "late" : ""}">${p}%</b>`; } }], act, { stat: true })}</div></div>`;
      $("#ad", tb).onchange = (e) => draw(e.target.value || today());
      tb.querySelectorAll(".seg").forEach((sg) => (sg.onclick = (e) => { const bt = e.target.closest("button"); if (!bt) return; sg.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === bt)); }));
      $("#as", tb).onclick = async () => {
        const out = {}; tb.querySelectorAll(".seg").forEach((sg) => (out[sg.dataset.e] = sg.querySelector(".on").dataset.v));
        try { if (rec) await S.set("attendance", rec.id, { marks: out }); else await S.add("attendance", { batch_id: id, date, marks: out }); toast("Attendance saved", "ok"); rerender(); } catch (ex) { toast(ex.message, "bad"); }
      };
      $("#ax", tb).onclick = () => exportXlsx(`attendance-${b.name}-${month}`, act.map((e) => ({ Student: stu(e.student_id).name, ID: stu(e.student_id).sid, ...Object.fromEntries(mAtt.map((a) => [a.date, (a.marks || {})[e.id] || ""])), "Attendance %": pct(e.id, mAtt) })));
    };
    draw(today());
  }
  if (tab === "mocks") {
    /* batch-এর কোর্স অনুযায়ী স্কোরের ধরন: IELTS band 0–9, PTE 10–90, Duolingo 10–160, Spoken English ১০০-তে */
    const KEYS = ["listening", "reading", "writing", "speaking"], kinds = SC.unit === "marks" ? ["Class test", "Final assessment"] : ["Mock", "Final " + SC.name];
    const MF = () => [{ k: "enrollment_id", label: "Student", type: "select", options: act.map((e) => [e.id, stu(e.student_id).name]), required: true }, { k: "date", label: "Test date", type: "date", def: today(), required: true }, { k: "kind", label: "Type", type: "select", options: kinds, blank: false },
      ...KEYS.map((k, i) => ({ k, label: `${SC.parts[i]} (${SC.min}–${SC.max})`, type: "number", required: true, min: SC.min, max: SC.max, step: SC.step }))];
    const mForm = (row) => formModal({ title: row ? "Edit result" : "Add test result", fields: MF(), values: row, intro: `<p class="muted mini">${esc(CRM.scoreHint(SC))}. Overall is calculated automatically.</p>`, onSave: async (d) => {
      const bad = KEYS.findIndex((k) => !CRM.scoreOk(SC, d[k])); if (bad >= 0) throw new Error(`${SC.parts[bad]} must be a ${CRM.scoreHint(SC)}`);
      d.overall = SC.overall((d.listening + d.reading + d.writing + d.speaking) / 4);
      if (row) await S.set("mocks", row.id, d); else await S.add("mocks", { ...d, batch_id: id });
      if (/^Final/.test(d.kind) && SC.unit !== "marks") { const e = en.find((x) => x.id === d.enrollment_id), s = e && S.get("students", e.student_id); if (s && S.can.editStudent(s)) await S.set("students", s.id, { test_type: SC.name, test_score: String(d.overall) }); }
    } });
    const sName = (m) => { const e = en.find((x) => x.id === m.enrollment_id); return e ? stu(e.student_id).name : "—"; };
    const avg = (k) => (mocks.length ? (sum(mocks, (m) => m[k]) / mocks.length).toFixed(1) : "—");
    tb.innerHTML = `<div class="stats">${[...KEYS.map((k, i) => [SC.parts[i], k]), ["Overall", "overall"]].map(([l, k]) => `<div class="stat"><b>${avg(k)}</b><span>Avg ${l}</span></div>`).join("")}</div>
      <div class="filters"><button class="btn btn-primary" data-act="addMock">${ic("plus")} Add result</button><button class="btn btn-line" data-act="xMock">${ic("down")} Excel</button></div>
      ${table([{ label: "Student", get: (m) => `<b>${esc(sName(m))}</b>` }, { label: "Date", get: (m) => fmtD(m.date) }, { label: "Type", get: (m) => pill(m.kind, /^Final/.test(m.kind) ? "gold" : "") }, ...KEYS.map((k, i) => ({ label: SC.parts[i], cls: "right", get: (m) => m[k] })), { label: "Overall", cls: "right", get: (m) => `<b>${m.overall}</b>` }],
        [...mocks].sort((a, c) => sName(a).localeCompare(sName(c)) || String(a.date).localeCompare(String(c.date))), { act: "mock", empty: "No test result yet." })}`;
    on(tb, { addMock: () => mForm(), mock: (el) => mForm(S.get("mocks", el.dataset.id)), xMock: () => exportXlsx("results-" + b.name, mocks.map((m) => ({ Student: sName(m), Date: m.date, Type: m.kind, [SC.parts[0]]: m.listening, [SC.parts[1]]: m.reading, [SC.parts[2]]: m.writing, [SC.parts[3]]: m.speaking, Overall: m.overall }))) });
  }
  if (tab === "class") {
    const KIND = { homework: ["Homework", "amber"], notice: ["Notice", "blue"], material: ["Study material", "green"] };
    tb.innerHTML = `${CRM.ui.guide("class", ["<b>Online class link</b>-এ Zoom/Meet লিংক বসিয়ে Save দিন — student portal-এ “অনলাইন ক্লাসে যোগ দিন” বোতাম আসবে।", "Homework/নোটিশ দিতে <b>Add</b>। “Who should see this?”-তে বাছুন: পুরো batch, আপনার সব batch-এর সবাই, অথবা নির্দিষ্ট এক বা কয়েকজন student।", "Homework-এ জমার তারিখ দিলে student portal-এর উপরে আলাদা করে মনে করায়।", "পুরোনো পোস্টে ক্লিক করে বদলানো বা মুছা যায়।"])}<div class="grid2"><div class="card"><h3>Online class link</h3><p class="muted mini">Zoom / Google Meet link. Students see it in their portal with a “Join class” button.</p>
        <div class="filters"><input class="input" id="mlink" placeholder="https://zoom.us/j/…" value="${esc(b.meeting_link || "")}" style="flex:1;min-width:220px"><button class="btn btn-primary" data-act="saveLink">Save</button></div>
        ${b.meeting_link ? `<p class="mini" style="margin:0"><a href="${esc(b.meeting_link)}" target="_blank" rel="noopener">Open link ↗</a></p>` : ""}</div>
      <div class="card"><h3>Class time</h3>${["schedule", "class_time", "room"].map((k) => `<p style="margin:0 0 4px"><span class="muted">${{ schedule: "Days", class_time: "Time", room: "Room" }[k]}:</span> <b>${esc(b[k] || "—")}</b></p>`).join("")}<p class="muted mini" style="margin:6px 0 0">Students see these in their portal too.</p></div></div>
      <div class="card" style="margin-top:16px"><h3>Homework, notices & materials <button class="btn btn-primary sm" data-act="addPost">${ic("plus")} Add</button></h3>
        ${posts.map((x) => `<div class="rowcard" data-act="post" data-id="${x.id}"><div><b>${esc(x.title)}</b> ${pill(KIND[x.kind][0], KIND[x.kind][1])}<small>${esc((x.body || "").slice(0, 140))}</small><small>${x.due_date ? "Due " + fmtD(x.due_date) + " · " : ""}${esc(S.uname(x.created_by))} · ${fmtD(x.created_at)}${x.link ? " · has link" : ""} · ${(x.student_ids || []).length ? "For: " + x.student_ids.map((sid) => esc(stu(sid).name)).join(", ") : "For: whole batch"}</small></div></div>`).join("") || '<div class="empty">Nothing posted yet. Homework and notices you add here appear in every student’s portal.</div>'}</div>`;
    const others = S.rows("batches").filter((x) => x.id !== id && x.status !== "completed" && S.can.marks(x));
    const AUD = [["all", "Everyone in this batch"], ...(others.length ? [["allb", `Everyone in all my running batches (${others.length + 1} batches)`]] : []), ["some", "Only selected students (one or more)"]];
    const PF = [{ k: "to", label: "Who should see this?", type: "select", options: AUD, blank: false, def: "all", full: true },
      { k: "student_ids", label: "Choose students", type: "multi", options: act.map((e) => [e.student_id, `${stu(e.student_id).name} (${stu(e.student_id).sid})`]), showIf: (v) => v.to === "some" },
      { k: "kind", label: "Type", type: "select", options: Object.entries(KIND).map(([k, v]) => [k, v[0]]), blank: false, def: "homework" }, { k: "due_date", label: "Due date", type: "date", showIf: (v) => v.kind === "homework" },
      { k: "title", label: "Title", required: true, full: true }, { k: "body", label: "Details", type: "textarea", rows: 4 }, { k: "link", label: "Link (optional)", type: "url", full: true, ph: "https://…" }];
    const postForm = (row) => formModal({ title: row ? "Edit" : "Post to students", fields: row ? PF.map((f) => (f.k === "to" ? { ...f, options: AUD.filter((a) => a[0] !== "allb") } : f)) : PF, values: row ? { ...row, to: (row.student_ids || []).length ? "some" : "all" } : undefined, saveLabel: row ? "Save" : "Post",
      intro: row ? `<p><button type="button" class="btn btn-bad sm" id="delPost">${ic("trash")} Delete</button></p>` : '<p class="muted mini">Students see this in their portal (student.html) right away.</p>',
      onSave: async (d) => {
        if (d.link && !/^https?:\/\//i.test(d.link)) throw new Error("The link must start with https://");
        const to = d.to; delete d.to; d.student_ids = to === "some" ? d.student_ids || [] : [];
        if (to === "some" && !d.student_ids.length) throw new Error("Choose at least one student");
        if (row) return S.set("batch_posts", row.id, d);
        for (const bid of to === "allb" ? [id, ...others.map((x) => x.id)] : [id]) await S.add("batch_posts", { ...d, batch_id: bid });
        S.log("create", "batch_post", id, `${d.title} → ${to === "some" ? d.student_ids.length + " student(s)" : to === "allb" ? "all batches" : "whole batch"}`);
      } });
    on(tb, {
      saveLink: async () => { const v = $("#mlink", tb).value.trim(); if (v && !/^https?:\/\//i.test(v)) return toast("The link must start with https://", "bad"); try { await S.setClassLink(id, v); S.log("update", "batch", id, "class link"); toast("Class link saved", "ok"); rerender(); } catch (ex) { toast(ex.message, "bad"); } },
      addPost: () => postForm(),
      post: (el) => { const row = S.get("batch_posts", el.dataset.id), m = postForm(row); m.body.querySelector("#delPost").onclick = async () => { if (await confirmBox("Delete this post?", "Delete")) { await S.del("batch_posts", row.id); m.close(); rerender(); } }; },
    });
  }
  const head = {
    editBatch: () => batchForm(b),
    enroll: () => formModal({ title: "Enroll student in " + b.name, intro: '<p class="muted mini">The student must exist in Students first (add as a new lead if needed). An invoice for the course fee is created automatically.</p>',
      fields: [{ k: "student_id", label: "Student", type: "student", required: true, full: true }, { k: "fee", label: "Course fee", type: "number", required: true }, { k: "discount", label: "Discount", type: "number", def: 0 }, { k: "admitted_on", label: "Admission date", type: "date", def: today() }],
      onSave: async (d) => {
        if (en.some((e) => e.student_id === d.student_id && e.status === "active")) throw new Error("This student is already in this batch");
        if (act.length >= (b.capacity || 1e9) && !(await confirmBox("This batch is already full. Enroll anyway?"))) return false;
        await S.add("enrollments", { ...d, batch_id: id, status: "active" });
        if (d.fee > 0) await S.add("invoices", { student_id: d.student_id, category: "IELTS Course Fee", total: d.fee, discount: d.discount || 0, note: b.name });
        S.log("enroll", "batch", id, `${stu(d.student_id).sid} → ${b.name}`);
      } }),
    stu: (el) => { const e = S.get("enrollments", el.dataset.id); if (!S.can.ieltsAdmin() && !S.can.finance()) return go("#/student/" + e.student_id);
      formModal({ title: stu(e.student_id).name, fields: [{ k: "status", label: "Enrollment status", type: "select", options: ["active", "completed", "dropped"], blank: false }, { k: "fee", label: "Course fee", type: "number" }, { k: "discount", label: "Discount", type: "number" }], values: e, intro: `<p><a href="#/student/${e.student_id}/payments" onclick="this.closest('.modal-bg').remove()">Open student profile & payments →</a></p>`, onSave: (d) => S.set("enrollments", e.id, d) }); },
  };
  root.onclick = (ev) => { const t = ev.target.closest("[data-act]"); if (t && head[t.dataset.act] && !(tb.onclick && tb.contains(t) && t.dataset.act !== "stu")) head[t.dataset.act](t); };
};
})();
