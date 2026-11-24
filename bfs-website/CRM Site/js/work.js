/* ===== Tasks + Finance (Invoice, Payment, Due, Expense, Profit/Loss) ===== */
(() => {
const CRM = window.CRM, { S, K, lab, tone } = CRM;
const { esc, $, today, daysTo, fmtD, fmtDT, money, sum, ic, pill, av, toast, go, rerender, modal, confirmBox, opts, formModal, table, on, exportXlsx, exportPdf, printDoc, bars } = CRM.ui;
const stu = (id) => S.get("students", id) || { name: "—", sid: "" };

/* ================= TASKS ================= */
const staff = () => S.users().filter((u) => u.active).map((u) => [u.id, `${u.name} — ${S.ROLES[u.role] || u.role}`]);
const TASK_F = () => [{ k: "title", label: "Task", required: true, full: true }, { k: "description", label: "Description", type: "textarea" }, { k: "assignees", label: "Assign to (one or more)", type: "multi", options: staff() },
  { k: "priority", label: "Priority", type: "select", options: K.TASK_PRI.map((a) => [a[0], a[1]]), blank: false, def: "medium" }, { k: "deadline", label: "Deadline", type: "date", required: true, def: today() }, { k: "student_id", label: "Related student (optional)", type: "student", full: true }];
const taskForm = (row) => formModal({ title: row ? "Edit task" : "New task", fields: TASK_F(), values: row, onSave: async (d) => {
  if (!d.assignees.length) throw new Error("Assign the task to at least one person");
  if (row) await S.set("tasks", row.id, d); else { const t = await S.add("tasks", { ...d, status: "todo", progress: 0, comments: [] }); S.log("create", "task", t.id, t.title); }
} });
const late = (t) => t.status !== "done" && t.deadline && daysTo(t.deadline) < 0;
CRM.taskLate = late;
function taskModal(t) {
  const boss = S.can.allTasks() || t.created_by === S.me.id, s = t.student_id && S.get("students", t.student_id);
  const m = modal(t.title, `
    <p>${pill(lab(K.TASK_PRI, t.priority), tone(K.TASK_PRI, t.priority))} <span class="${late(t) ? "late" : "muted"}">${ic("clock")} Deadline ${fmtD(t.deadline)}</span> · <span class="muted">by ${esc(S.uname(t.created_by))}</span></p>
    ${t.description ? `<p style="white-space:pre-wrap">${esc(t.description)}</p>` : ""}
    <p class="mini muted">Assigned to: ${(t.assignees || []).map((a) => `<b>${esc(S.uname(a))}</b>`).join(", ") || "—"}${s ? ` · Student: <a href="#/student/${s.id}" data-close>${esc(s.name)}</a>` : ""}</p>
    <div class="fgrid"><label class="fld"><span>Status</span><select id="ts">${opts(K.TASK_STATUS.filter((a) => a[0] !== "done" || boss || true), t.status)}</select></label>
      <label class="fld"><span>Progress — <b id="tpv">${t.progress || 0}%</b></span><input type="range" id="tp" min="0" max="100" step="10" value="${t.progress || 0}"></label>
      ${boss ? `<label class="fld full"><span>Manager feedback / review</span><input id="tf" value="${esc(t.feedback || "")}" placeholder="Approved, needs revision…"></label>` : t.feedback ? `<p class="full"><b>Manager feedback:</b> ${esc(t.feedback)}</p>` : ""}</div>
    <h4 style="margin-top:14px">Comments</h4>${(t.comments || []).map((c) => `<div class="cmt"><small><b>${esc(S.uname(c.by))}</b> · ${fmtDT(c.at)}</small><br>${esc(c.text)}</div>`).join("") || '<p class="muted mini">No comments yet.</p>'}
    <textarea id="tc" class="input" rows="2" placeholder="Write an update or comment…"></textarea>
    <div class="modal-f">${boss ? `<button class="btn btn-bad" data-b="del">${ic("trash")}</button><button class="btn btn-line" data-b="edit">${ic("edit")} Edit</button>` : ""}<button class="btn btn-primary" data-b="save">Save</button></div>`);
  $("#tp", m.body).oninput = (e) => ($("#tpv", m.body).textContent = e.target.value + "%");
  $("#ts", m.body).onchange = (e) => { if (e.target.value === "done") { $("#tp", m.body).value = 100; $("#tpv", m.body).textContent = "100%"; } };
  m.body.onclick = async (e) => {
    if (e.target.closest("[data-close]")) return m.close();
    const b = e.target.closest("[data-b]"); if (!b) return;
    try {
      if (b.dataset.b === "edit") { m.close(); return taskForm(t); }
      if (b.dataset.b === "del") { if (await confirmBox("Delete this task?", "Delete")) { await S.del("tasks", t.id); m.close(); rerender(); } return; }
      const status = $("#ts", m.body).value, txt = $("#tc", m.body).value.trim(), patch = { status, progress: +$("#tp", m.body).value };
      if ($("#tf", m.body)) patch.feedback = $("#tf", m.body).value || null;
      if (txt) patch.comments = [...(t.comments || []), { by: S.me.id, at: new Date().toISOString(), text: txt }];
      if (status === "done" && t.status !== "done") { patch.done_at = new Date().toISOString(); patch.progress = 100; S.log("complete", "task", t.id, t.title); }
      await S.set("tasks", t.id, patch); m.close(); rerender();
    } catch (ex) { toast(ex.message, "bad"); }
  };
}
CRM.views.tasks = (root, [tab = "mine"]) => {
  const all = S.rows("tasks"), T = { mine: ["My tasks", (t) => (t.assignees || []).includes(S.me.id)], given: ["Assigned by me", (t) => t.created_by === S.me.id], overdue: ["Overdue", late], all: ["All tasks", () => true] };
  if (!S.can.allTasks()) delete T.all;
  if (!T[tab]) tab = "mine";
  const rows = all.filter(T[tab][1]).sort((a, b) => String(a.deadline || "9").localeCompare(String(b.deadline || "9")));
  root.innerHTML = `<div class="ph"><div><span class="kicker">Tasks</span><h1>Tasks</h1><p>${all.filter((t) => t.status !== "done").length} open · ${all.filter(late).length} overdue</p></div><div class="ph-act"><button class="btn btn-primary" data-act="new">${ic("plus")} New task</button></div></div>
    <div class="tabs">${Object.keys(T).map((k) => `<a href="#/tasks/${k}" class="${k === tab ? "on" : ""}">${T[k][0]} <em>${all.filter(T[k][1]).length}</em></a>`).join("")}</div>
    <div class="board">${K.TASK_STATUS.map(([k, l]) => { const col = rows.filter((t) => t.status === k); return `<div class="lane"><h4>${l} <span class="muted">${col.length}</span></h4>${col.map((t) => `<div class="tcard" data-act="open" data-id="${t.id}"><b>${esc(t.title)}</b>${pill(lab(K.TASK_PRI, t.priority), tone(K.TASK_PRI, t.priority))}
      ${t.progress && k !== "done" ? `<div class="prog" style="margin-top:8px"><i style="width:${t.progress}%"></i></div>` : ""}<div class="row"><span class="${late(t) ? "late" : ""}">${ic("clock")} ${fmtD(t.deadline)}</span><span>${(t.assignees || []).slice(0, 3).map((a) => av(S.uname(a), "sm")).join("")}${(t.comments || []).length ? ` · ${t.comments.length} 💬` : ""}</span></div></div>`).join("") || '<p class="muted mini" style="padding:6px">—</p>'}</div>`; }).join("")}</div>`;
  on(root, { new: () => taskForm(), open: (el) => taskModal(S.get("tasks", el.dataset.id)) });
};

/* ================= FINANCE ================= */
const pays = (inv) => S.rows("payments").filter((p) => p.invoice_id === inv.id);
const paidOf = (inv) => sum(pays(inv), (p) => (p.refund ? -p.amount : p.amount));
const netOf = (inv) => (inv.total || 0) - (inv.discount || 0);
const dueOf = (inv) => netOf(inv) - paidOf(inv);
CRM.fin = { paidOf, netOf, dueOf };
const iPill = (inv) => { const d = dueOf(inv); return d <= 0 ? pill("Paid", "green") : paidOf(inv) > 0 ? pill("Partial", "amber") : pill("Unpaid", "red"); };

const invForm = (student_id) => formModal({ title: "New invoice", fields: [...(student_id ? [] : [{ k: "student_id", label: "Student", type: "student", required: true, full: true }]), { k: "category", label: "Fee type", type: "select", options: K.INCOME, required: true }, { k: "total", label: "Total payable", type: "number", required: true },
  { k: "discount", label: "Discount", type: "number", def: 0 }, { k: "due_date", label: "Due date", type: "date" }, { k: "note", label: "Note", full: true }],
  onSave: async (d) => { if (!(d.total > 0)) throw new Error("Total must be more than 0"); if ((d.discount || 0) > d.total) throw new Error("Discount cannot be more than the total");
    const i = await S.add("invoices", { ...d, student_id: student_id || d.student_id }); S.log("create", "invoice", i.id, `${i.no} ${money(netOf(i))}`); } });
function payForm(inv) {
  formModal({ title: `Payment — ${inv.no} (${stu(inv.student_id).name})`, intro: `<p class="muted">Payable ${money(netOf(inv))} · Paid ${money(paidOf(inv))} · <b>Due ${money(dueOf(inv))}</b></p>`,
    fields: [{ k: "amount", label: "Amount", type: "number", required: true, def: Math.max(0, dueOf(inv)) }, { k: "date", label: "Payment date", type: "date", def: today(), required: true }, { k: "method", label: "Method", type: "select", options: K.METHODS, required: true }, { k: "trx_id", label: "Transaction ID", showIf: (v) => !!v.method && v.method !== "Cash", reqIf: (v) => ["bKash", "Nagad", "Bank Transfer"].includes(v.method) }, { k: "refund", label: "This is a refund (money returned to student)", type: "checkbox", full: true }],
    saveLabel: "Save & print receipt", onSave: async (d) => {
      if (!(d.amount > 0)) throw new Error("Amount must be more than 0");
      if (d.date > today()) throw new Error("Payment date cannot be in the future");
      if (d.refund && d.amount > paidOf(inv)) throw new Error("Refund cannot be more than what was paid (" + money(paidOf(inv)) + ")");
      if (!d.refund && d.amount > dueOf(inv) && !(await confirmBox("This is more than the due amount. Save anyway?"))) return false;
      const p = await S.add("payments", { ...d, invoice_id: inv.id, student_id: inv.student_id }); S.log(d.refund ? "refund" : "payment", "payment", p.id, `${p.receipt_no} ${money(p.amount)} — ${inv.no}`); receipt(p);
    } });
}
function receipt(p) {
  const inv = S.get("invoices", p.invoice_id), s = stu(p.student_id);
  printDoc("Money Receipt " + p.receipt_no, `<h1>${p.refund ? "Refund Voucher" : "Money Receipt"}</h1><dl class="kv"><dt>Receipt no</dt><dd>${esc(p.receipt_no)}</dd><dt>Date</dt><dd>${fmtD(p.date)}</dd><dt>Student</dt><dd>${esc(s.name)} (${esc(s.sid)})</dd><dt>Invoice</dt><dd>${esc(inv.no)} — ${esc(inv.category)}</dd>
    <dt>Method</dt><dd>${esc(p.method || "")} ${p.trx_id ? "· " + esc(p.trx_id) : ""}</dd><dt>Amount</dt><dd class="big">${money(p.amount)}</dd><dt>Total payable</dt><dd>${money(netOf(inv))}</dd><dt>Remaining due</dt><dd>${money(dueOf(inv))}</dd><dt>Received by</dt><dd>${esc(S.uname(p.created_by))}</dd></dl>
    <div class="sign"><span>Student signature</span><span>Authorised signature</span></div>`);
}
function invModal(inv) {
  const fin = S.can.finance(), list = pays(inv);
  const m = modal(`${inv.no} — ${stu(inv.student_id).name}`, `<p>${esc(inv.category)} ${iPill(inv)} <span class="muted">· created ${fmtD(inv.created_at)} by ${esc(S.uname(inv.created_by))}${inv.due_date ? " · due " + fmtD(inv.due_date) : ""}</span></p>${inv.note ? `<p class="muted">${esc(inv.note)}</p>` : ""}
    <div class="stats"><div class="stat"><b>${money(netOf(inv))}</b><span>Payable${inv.discount ? ` (discount ${money(inv.discount)})` : ""}</span></div><div class="stat ok"><b>${money(paidOf(inv))}</b><span>Paid</span></div><div class="stat ${dueOf(inv) > 0 ? "bad" : ""}"><b>${money(dueOf(inv))}</b><span>Due</span></div></div>
    ${list.map((p) => `<div class="rowcard" data-p="${p.id}"><div><b>${p.refund ? "− " : ""}${money(p.amount)}</b> ${p.refund ? pill("Refund", "red") : ""}<small>${esc(p.receipt_no)} · ${fmtD(p.date)} · ${esc(p.method || "")} ${esc(p.trx_id || "")} · ${esc(S.uname(p.created_by))}</small></div><span class="btn btn-line sm">${ic("print")} Receipt</span></div>`).join("") || '<div class="empty">No payment received yet.</div>'}
    <div class="modal-f"><a class="btn btn-line" href="#/student/${inv.student_id}/payments" data-close>Student profile</a>${fin ? `<button class="btn btn-primary" data-pay>${ic("plus")} Add payment</button>` : ""}</div>`);
  m.body.onclick = (e) => { const p = e.target.closest("[data-p]"); if (p) return receipt(S.get("payments", p.dataset.p)); if (e.target.closest("[data-close]")) return m.close(); if (e.target.closest("[data-pay]")) { m.close(); payForm(inv); } };
}
const invCols = (withStu) => [{ label: "Invoice", get: (i) => `<span class="mono">${esc(i.no)}</span><small>${fmtD(i.created_at)}</small>` }, ...(withStu ? [{ label: "Student", get: (i) => `<b>${esc(stu(i.student_id).name)}</b><small class="mono">${esc(stu(i.student_id).sid)}</small>` }] : []),
  { label: "Fee type", get: (i) => esc(i.category) }, { label: "Payable", cls: "right", get: (i) => money(netOf(i)) }, { label: "Paid", cls: "right", get: (i) => money(paidOf(i)) }, { label: "Due", cls: "right", get: (i) => (dueOf(i) > 0 ? `<b class="late">${money(dueOf(i))}</b>` : "—") }, { label: "Status", get: iPill }];

CRM.parts.payments = (el, s) => {
  const inv = S.rows("invoices").filter((i) => i.student_id === s.id), fin = S.can.finance();
  el.innerHTML = `<div class="stats"><div class="stat"><b>${money(sum(inv, netOf))}</b><span>Total payable</span></div><div class="stat ok"><b>${money(sum(inv, paidOf))}</b><span>Paid</span></div><div class="stat ${sum(inv, dueOf) > 0 ? "bad" : ""}"><b>${money(sum(inv, dueOf))}</b><span>Due</span></div></div>
    <div class="card"><h3>Invoices ${fin ? `<button class="btn btn-primary sm" data-act="newInv">${ic("plus")} New invoice</button>` : '<span class="muted mini">Only Accounts can add invoices and payments</span>'}</h3>${table(invCols(false), inv, { act: "inv", empty: "No invoice for this student yet." })}</div>`;
  on(el, { newInv: () => invForm(s.id), inv: (t) => invModal(S.get("invoices", t.dataset.id)) });
};

const monthOf = (d) => String(d || "").slice(0, 7);
CRM.views.finance = (root, [tab = "summary"]) => {
  if (!S.can.finance()) { root.innerHTML = '<div class="empty">Finance is only for Admin, Manager and Accounts.</div>'; return; }
  const inv = S.rows("invoices").sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))), pay = S.rows("payments").sort((a, b) => String(b.date).localeCompare(String(a.date))), exp = S.rows("expenses").sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const dues = inv.filter((i) => dueOf(i) > 0), amt = (p) => (p.refund ? -p.amount : p.amount);
  const T = [["summary", "Summary"], ["invoices", `Invoices <em>${inv.length}</em>`], ["due", `Due collection <em>${dues.length}</em>`], ["payments", `Payments <em>${pay.length}</em>`], ["expenses", `Expenses <em>${exp.length}</em>`]];
  root.innerHTML = `<div class="ph"><div><span class="kicker">Finance</span><h1>Finance & Accounts</h1><p>Outstanding ${money(sum(dues, dueOf))} from ${dues.length} invoices</p></div>
    <div class="ph-act"><button class="btn btn-line" data-act="newExp">${ic("plus")} Expense</button><button class="btn btn-primary" data-act="newInv">${ic("plus")} New invoice</button></div></div>
    <div class="tabs">${T.map(([k, l]) => `<a href="#/finance/${k}" class="${k === tab ? "on" : ""}">${l}</a>`).join("")}</div><div id="fb"></div>`;
  const fb = $("#fb", root), expForm = (row) => formModal({ title: row ? "Edit expense" : "New expense", fields: [{ k: "category", label: "Category", type: "select", options: K.EXPENSE, required: true }, { k: "amount", label: "Amount", type: "number", required: true }, { k: "date", label: "Date", type: "date", def: today(), required: true }, { k: "note", label: "Note", full: true }], values: row,
    onSave: async (d) => { if (row) await S.set("expenses", row.id, d); else { const e = await S.add("expenses", d); S.log("create", "expense", e.id, `${d.category} ${money(d.amount)}`); } } });
  let xrows = [];
  if (tab === "summary") {
    const draw = (m) => {
      const mp = pay.filter((p) => monthOf(p.date) === m), me = exp.filter((e) => monthOf(e.date) === m), income = sum(mp, amt), cost = sum(me, (e) => e.amount);
      const byCat = {}; mp.forEach((p) => { const c = (S.get("invoices", p.invoice_id) || {}).category || "Other Income"; byCat[c] = (byCat[c] || 0) + amt(p); });
      const eCat = {}; me.forEach((e) => (eCat[e.category] = (eCat[e.category] || 0) + e.amount));
      const months = [...Array(6)].map((_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 5 + i); return CRM.ui.ymd(d).slice(0, 7); });
      const ser = months.map((x) => [x, sum(pay.filter((p) => monthOf(p.date) === x), amt), sum(exp.filter((e) => monthOf(e.date) === x), (e) => e.amount)]), mx = Math.max(1, ...ser.flatMap((r) => [r[1], r[2]]));
      xrows = [...Object.entries(byCat).map(([k, v]) => ({ Month: m, Type: "Income", Category: k, Amount: v })), ...Object.entries(eCat).map(([k, v]) => ({ Month: m, Type: "Expense", Category: k, Amount: v })), { Month: m, Type: "Net profit", Category: "", Amount: income - cost }];
      fb.innerHTML = `<div class="filters"><input type="month" id="fm" value="${m}"><button class="btn btn-line" data-act="x">${ic("down")} Excel</button><button class="btn btn-line" data-act="pdf">${ic("print")} PDF</button></div>
        <div class="stats"><div class="stat ok"><b>${money(income)}</b><span>Income (${m})</span></div><div class="stat"><b>${money(cost)}</b><span>Expenses</span></div><div class="stat ${income - cost < 0 ? "bad" : "ok"}"><b>${money(income - cost)}</b><span>Net profit / loss</span></div><div class="stat bad"><b>${money(sum(dues, dueOf))}</b><span>Outstanding (all time)</span></div><div class="stat"><b>${money(sum(mp.filter((p) => p.date === today()), amt))}</b><span>Collected today</span></div></div>
        <div class="grid3"><div class="card"><h3>Income by fee type</h3>${bars(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, money(v)]))}</div><div class="card"><h3>Expenses by category</h3>${bars(Object.entries(eCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v, money(v)]))}</div>
        <div class="card"><h3>Last 6 months <span class="legend"><span><i></i>Income</span><span><i class="e"></i>Expense</span></span></h3><div class="cols">${ser.map(([x, a, b]) => `<div title="${x}: income ${money(a)}, expense ${money(b)}"><span><i style="height:${(a / mx) * 100}%"></i><i class="e" style="height:${(b / mx) * 100}%"></i></span>${x.slice(5)}/${x.slice(2, 4)}</div>`).join("")}</div></div></div>`;
      $("#fm", fb).onchange = (e) => draw(e.target.value || today().slice(0, 7));
    };
    draw(today().slice(0, 7));
  } else if (tab === "invoices" || tab === "due") {
    const list = tab === "due" ? dues.sort((a, b) => dueOf(b) - dueOf(a)) : inv;
    xrows = list.map((i) => ({ Invoice: i.no, Date: String(i.created_at).slice(0, 10), "Student ID": stu(i.student_id).sid, Student: stu(i.student_id).name, Phone: stu(i.student_id).phone, "Fee type": i.category, Total: i.total, Discount: i.discount || 0, Paid: paidOf(i), Due: dueOf(i), "Due date": i.due_date }));
    fb.innerHTML = `<div class="filters"><button class="btn btn-line" data-act="x">${ic("down")} Excel</button><button class="btn btn-line" data-act="pdf">${ic("print")} PDF</button></div>${table(invCols(true), list, { act: "inv" })}`;
  } else if (tab === "payments") {
    xrows = pay.map((p) => ({ Receipt: p.receipt_no, Date: p.date, "Student ID": stu(p.student_id).sid, Student: stu(p.student_id).name, Invoice: (S.get("invoices", p.invoice_id) || {}).no, Amount: amt(p), Method: p.method, "Transaction ID": p.trx_id, "Received by": S.uname(p.created_by) }));
    fb.innerHTML = `<div class="filters"><button class="btn btn-line" data-act="x">${ic("down")} Excel</button><button class="btn btn-line" data-act="pdf">${ic("print")} PDF</button></div>${table([{ label: "Receipt", get: (p) => `<span class="mono">${esc(p.receipt_no)}</span>` }, { label: "Date", get: (p) => fmtD(p.date) }, { label: "Student", get: (p) => `<b>${esc(stu(p.student_id).name)}</b>` },
      { label: "For", get: (p) => esc((S.get("invoices", p.invoice_id) || {}).category || "") }, { label: "Method", get: (p) => `${esc(p.method || "")}<small>${esc(p.trx_id || "")}</small>` }, { label: "Amount", cls: "right", get: (p) => (p.refund ? `<span class="late">− ${money(p.amount)}</span>` : `<b>${money(p.amount)}</b>`) }, { label: "By", get: (p) => esc(S.uname(p.created_by)) }], pay, { act: "pay" })}`;
  } else {
    xrows = exp.map((e) => ({ Date: e.date, Category: e.category, Amount: e.amount, Note: e.note, "Entered by": S.uname(e.created_by) }));
    fb.innerHTML = `<div class="filters"><button class="btn btn-line" data-act="x">${ic("down")} Excel</button><button class="btn btn-line" data-act="pdf">${ic("print")} PDF</button></div>${table([{ label: "Date", get: (e) => fmtD(e.date) }, { label: "Category", get: (e) => `<b>${esc(e.category)}</b>` }, { label: "Note", get: (e) => esc(e.note || "") }, { label: "Amount", cls: "right", get: (e) => money(e.amount) }, { label: "By", get: (e) => esc(S.uname(e.created_by)) }], exp, { act: "exp" })}`;
  }
  on(root, { newInv: () => invForm(), newExp: () => expForm(), inv: (el) => invModal(S.get("invoices", el.dataset.id)), pay: (el) => receipt(S.get("payments", el.dataset.id)), exp: (el) => expForm(S.get("expenses", el.dataset.id)),
    x: () => exportXlsx(`finance-${tab}-${today()}`, xrows), pdf: () => exportPdf("Finance — " + tab, xrows) });
};
})();
