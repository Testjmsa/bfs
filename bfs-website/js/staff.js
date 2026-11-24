/* ===== স্টাফ পোর্টাল: ম্যানেজার · মডারেটর · কাউন্সেলর ===== */
import { READY, auth, db, secondaryAuth, staffEmail, STAGES, STAGE_NAME, ROLE_NAME, EMGS_URL, nm, fmtTime, receiptNo, errText, showReceipt, av,
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword,
  doc, getDoc, setDoc, updateDoc, addDoc, collection, query, getDocs, onSnapshot, serverTimestamp, writeBatch } from "./fb.js";

const B = (bn, en) => (isBn() ? bn : en);
const box = () => document.getElementById("staffApp");
const S = { me: null, uid: null, students: [], payments: [], staff: [], tab: "home", q: "", fStage: "", fWho: "", unsub: [] };
const canAll = () => ["manager", "moderator"].includes(S.me?.role);
const isMine = (s) => s.counsellorUid === S.uid;
const canEdit = (s) => canAll() || isMine(s);
const stageTxt = (k) => nm(STAGE_NAME[k] || [k, k]);

/* ---------- লগইন / প্রথমবার সেটআপ ---------- */
function notReady() {
  box().innerHTML = `<section class="card p-login"><h1>${B("স্টাফ পোর্টাল", "Staff portal")}</h1>
    <p class="muted">${B("Firebase এখনো সেটআপ হয়নি। js/firebase-config.js ফাইলে Firebase-এর তথ্য বসাতে হবে — সেটআপ গাইড দেখুন।", "Firebase isn't set up yet. Fill in js/firebase-config.js — see the setup guide.")}</p></section>`;
}
async function loginView() {
  let first = false;
  try { first = !(await getDoc(doc(db, "meta", "owner"))).exists(); } catch { first = false; }
  box().innerHTML = `<section class="card p-login">
    <img src="images/bfs-logo.png" alt="BFS" width="70">
    <h1>${first ? B("প্রথমবার সেটআপ — ম্যানেজার অ্যাকাউন্ট", "First-time setup — manager account") : B("স্টাফ লগইন", "Staff login")}</h1>
    <p class="muted">${first ? B("এটা একবারই হবে। এই অ্যাকাউন্ট দিয়ে পরে অন্য স্টাফদের যোগ করবেন।", "This happens once. Use this account to add other staff later.") : B("অফিসের ম্যানেজার, মডারেটর ও কাউন্সেলরদের জন্য", "For office managers, moderators and counsellors")}</p>
    <form id="lgF" novalidate>
      ${first ? `<label class="fld"><span>${B("আপনার নাম", "Your name")}</span><input id="lgN" required></label>` : ""}
      <label class="fld"><span>${B("ইউজারনেম", "Username")}</span><input id="lgU" required autocomplete="username" autocapitalize="none" placeholder="${B("যেমন: sami", "e.g. sami")}"></label>
      <label class="fld"><span>${B("পাসওয়ার্ড", "Password")}</span><input id="lgP" type="password" required autocomplete="${first ? "new-password" : "current-password"}"></label>
      <p class="err" id="lgE" role="alert"></p>
      <button class="btn btn-primary btn-lg wide">${icon("user")} ${first ? B("ম্যানেজার অ্যাকাউন্ট খুলুন", "Create manager account") : B("লগইন", "Log in")}</button>
    </form></section>`;
  document.getElementById("lgF").onsubmit = async (e) => {
    e.preventDefault();
    const u = $("#lgU").value.trim(), p = $("#lgP").value, err = $("#lgE");
    if (!/^[a-z0-9._-]{3,30}$/i.test(u)) return (err.textContent = B("ইউজারনেম ৩-৩০ অক্ষরের, শুধু ইংরেজি অক্ষর/সংখ্যা", "Username: 3–30 letters/numbers"));
    if (p.length < 6) return (err.textContent = B("পাসওয়ার্ড অন্তত ৬ অক্ষরের", "Password must be 6+ characters"));
    err.textContent = B("অপেক্ষা করুন…", "Please wait…");
    try {
      if (first) {
        const name = $("#lgN").value.trim() || u;
        const cred = await createUserWithEmailAndPassword(auth, staffEmail(u), p);
        const b = writeBatch(db);
        b.set(doc(db, "staff", cred.user.uid), { username: u.toLowerCase(), name, role: "manager", active: true, createdAt: serverTimestamp() });
        b.set(doc(db, "meta", "owner"), { uid: cred.user.uid, at: serverTimestamp() });
        await b.commit(); location.reload();
      } else await signInWithEmailAndPassword(auth, staffEmail(u), p);
    } catch (ex) { err.textContent = errText(ex); }
  };
}

/* ---------- মূল পোর্টাল ---------- */
/* অ্যাপের মতো লেআউট: বাঁদিকে মেনু, ডানদিকে কাজ। নতুন ডেটা এলে শুধু দরকারি অংশ বদলায় — পুরো পেজ না */
const TABS = () => [["home", "home", B("ওভারভিউ", "Overview")], ["students", "users", B("স্টুডেন্ট", "Students")], ["payments", "wallet", B("পেমেন্ট", "Payments")]]
  .concat(S.me.role === "manager" ? [["staff", "briefcase", B("স্টাফ", "Staff")]] : []);
function shell() {
  document.body.classList.add("portal-app");
  box().innerHTML = `<div class="app">
    <aside class="side">
      <a class="side-brand" href="index.html"><img src="images/bfs-logo.png" alt=""><span><b>Bright Future</b><small>${B("স্টাফ পোর্টাল", "Staff portal")}</small></span></a>
      <div class="side-me">${av(S.me.name)}<div><b>${esc(S.me.name)}</b><small class="role r-${S.me.role}">${nm(ROLE_NAME[S.me.role])}</small></div></div>
      <nav class="side-nav">${TABS().map(([k, i, n]) => `<button data-tab="${k}">${icon(i)}<span>${n}</span><em class="cnt" data-cnt="${k}"></em></button>`).join("")}</nav>
      <div class="side-foot"><button class="side-lang" type="button">${isBn() ? "English" : "বাংলা"}</button><button id="pwBtn">${B("পাসওয়ার্ড বদলান", "Change password")}</button><button id="outBtn">${B("লগআউট", "Log out")}</button></div>
    </aside>
    <section class="main"><header class="main-top"><div><span class="kicker" id="pKick"></span><h1 id="pTitle"></h1></div><div id="pAct"></div></header><div id="pBody"></div></section></div>`;
  $$(".side-nav button").forEach((b) => (b.onclick = () => go(b.dataset.tab)));
  $("#outBtn").onclick = () => signOut(auth); $("#pwBtn").onclick = changePw;
  $(".side-lang").onclick = () => setLang(isBn() ? "en" : "bn");
  go(S.tab);
}
function go(tab) {
  S.tab = tab;
  $$(".side-nav button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  const T = { home: [B("আজকের অবস্থা", "Today at a glance"), B("ওভারভিউ", "Overview")], students: [B("সব স্টুডেন্ট", "All students"), B("স্টুডেন্ট", "Students")],
    payments: [B("টাকা যাচাই ও রসিদ", "Verify & receipts"), B("পেমেন্ট", "Payments")], staff: [B("অফিসের টিম", "Office team"), B("স্টাফ", "Staff")] }[tab];
  $("#pKick").textContent = T[0]; $("#pTitle").textContent = T[1]; $("#pAct").innerHTML = "";
  const body = $("#pBody"); body.classList.remove("in"); void body.offsetWidth; body.classList.add("in");
  paint(true); window.scrollTo({ top: 0 });
}
function paint(full) {
  if (!$("#pBody")) return;
  const c = { students: S.students.length, payments: S.payments.filter((p) => p.status === "pending").length };
  $$(".cnt").forEach((e) => { const n = c[e.dataset.cnt]; e.textContent = n ? num(n) : ""; e.classList.toggle("hot", e.dataset.cnt === "payments" && n > 0); });
  if (S.tab === "home") drawHome(); else if (S.tab === "students") drawStudents(full); else if (S.tab === "payments") drawPayments(); else if (S.tab === "staff" && full) drawStaff();
}
function changePw() {
  const p = prompt(B("নতুন পাসওয়ার্ড (অন্তত ৬ অক্ষর)", "New password (6+ characters)")); if (!p) return;
  updatePassword(auth.currentUser, p).then(() => toast(B("পাসওয়ার্ড বদলানো হয়েছে", "Password changed"))).catch((e) => toast(errText(e)));
}
function drawHome() {
  const st = S.students, mine = st.filter(isMine), pend = S.payments.filter((p) => p.status === "pending");
  const today = new Date().toDateString(), newToday = st.filter((s) => s.createdAt?.toDate?.().toDateString() === today).length;
  const by = STAGES.map((k) => [k, st.filter((s) => (s.stage || "lead") === k).length]), max = Math.max(1, ...by.map((x) => x[1]));
  $("#pBody").innerHTML = `<div class="p-stats">
      ${[[B("মোট স্টুডেন্ট", "All students"), st.length, "users"], [B("আমার স্টুডেন্ট", "My students"), mine.length, "user"], [B("আজ নতুন", "New today"), newToday, "spark"],
        [B("কাউন্সেলর নেই", "Unassigned"), st.filter((s) => !s.counsellorUid).length, "target"], [B("যাচাই বাকি পেমেন্ট", "Payments to verify"), pend.length, "wallet"]]
        .map(([l, v, i]) => `<div class="p-stat">${icon(i)}<b>${num(v)}</b><span>${l}</span></div>`).join("")}</div>
    <div class="p-grid2">
      <section class="card"><h3>${B("কোন ধাপে কতজন", "Students by stage")}</h3>${by.map(([k, n]) => `<div class="p-bar"><span>${stageTxt(k)}</span><i><em style="width:${(n / max) * 100}%"></em></i><b>${num(n)}</b></div>`).join("")}</section>
      <section class="card"><h3>${B("সাম্প্রতিক স্টুডেন্ট", "Recent students")}</h3>${rows(st.slice().sort(byNew).slice(0, 8), true)}</section>
    </div>`;
  bindRows();
}
const byNew = (a, b) => (b.updatedAt?.seconds || b.createdAt?.seconds || 0) - (a.updatedAt?.seconds || a.createdAt?.seconds || 0);
function rows(list, compact) {
  if (!list.length) return `<p class="muted">${B("কেউ নেই", "None yet")}</p>`;
  return `<div class="p-table"><div class="p-tr p-th"><span>ID</span><span>${B("নাম", "Name")}</span>${compact ? "" : `<span>${B("ফোন", "Phone")}</span>`}<span>${B("ধাপ", "Stage")}</span><span>${B("কাউন্সেলর", "Counsellor")}</span></div>` +
    list.map((s) => `<button class="p-tr ${isMine(s) ? "mine" : ""}" data-sid="${esc(s.id)}"><span class="mono">${esc(s.id)}</span><span class="who">${av(s.name || "?", "sm")}<span><b>${esc(s.name || "")}</b>${s.application?.status === "submitted" ? ` <em class="tag-new">${B("আবেদন", "Applied")}</em>` : ""}</span></span>${compact ? "" : `<span>${esc(s.phone || "")}</span>`}<span><i class="stg s-${s.stage || "lead"}">${stageTxt(s.stage || "lead")}</i></span><span>${esc(s.counsellorName || "—")}</span></button>`).join("") + `</div>`;
}
function bindRows() { $$(".p-tr[data-sid]").forEach((r) => (r.onclick = () => openStudent(r.dataset.sid))); }
function drawStudents(full) {
  if (full || !$("#fq")) {
    $("#pBody").innerHTML = `<div class="p-filter">
        <div class="searchbox">${icon("search")}<input class="input" id="fq" placeholder="${B("নাম, ফোন বা আইডি দিয়ে খুঁজুন", "Search name, phone or ID")}" value="${esc(S.q)}"></div>
        <select id="fs"><option value="">${B("সব ধাপ", "All stages")}</option>${STAGES.map((k) => `<option value="${k}" ${S.fStage === k ? "selected" : ""}>${stageTxt(k)}</option>`).join("")}</select>
        <select id="fw"><option value="">${B("সব কাউন্সেলর", "All counsellors")}</option><option value="mine" ${S.fWho === "mine" ? "selected" : ""}>${B("শুধু আমার", "Only mine")}</option><option value="none" ${S.fWho === "none" ? "selected" : ""}>${B("কাউন্সেলর নেই", "Unassigned")}</option>
          ${S.staff.map((x) => `<option value="${x.uid}" ${S.fWho === x.uid ? "selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div>
      <p class="muted mini" id="sCount"></p><div id="sList"></div>`;
    if (canAll()) { $("#pAct").innerHTML = `<button class="btn btn-line sm" id="csvBtn">${icon("doc")} CSV ${B("ডাউনলোড", "download")}</button>`; $("#csvBtn").onclick = () => csv(filtered()); }
    $("#fq").oninput = (e) => { S.q = e.target.value; listStudents(); };
    $("#fs").onchange = (e) => { S.fStage = e.target.value; listStudents(); };
    $("#fw").onchange = (e) => { S.fWho = e.target.value; listStudents(); };
  }
  listStudents();
}
function filtered() {
  const q = S.q.toLowerCase();
  return S.students.filter((s) => (!q || [s.id, s.name, s.phone].join(" ").toLowerCase().includes(q))
    && (!S.fStage || (s.stage || "lead") === S.fStage)
    && (!S.fWho || (S.fWho === "mine" ? isMine(s) : S.fWho === "none" ? !s.counsellorUid : s.counsellorUid === S.fWho))).sort(byNew);
}
function listStudents() {
  const list = filtered();
  $("#sCount").textContent = `${num(list.length)} ${B("জন", "students")} · ${B("আপনার স্টুডেন্টগুলো হালকা সোনালি রঙে", "your students are highlighted")}`;
  $("#sList").innerHTML = rows(list); bindRows();
}
function csv(list) {
  const cols = ["id", "name", "phone", "country", "edu", "stage", "counsellorName", "source"];
  const txt = [cols.join(",")].concat(list.map((s) => cols.map((c) => `"${String(s[c] ?? "").replace(/"/g, '""')}"`).join(","))).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + txt], { type: "text/csv" })); a.download = "bfs-students.csv"; a.click();
}

/* ---------- একজন স্টুডেন্টের পুরো প্রোফাইল ---------- */
let detailUnsub = [];
async function openStudent(sid) {
  detailUnsub.forEach((u) => u()); detailUnsub = [];
  const m = $("#sModal"); m.hidden = false; document.body.classList.add("locked"); requestAnimationFrame(() => m.classList.add("open"));
  const D = { hist: [], emgs: null };
  // নতুন ডেটা এলে আবার আঁকার সময় যা টাইপ করা ছিল আর কোথায় স্ক্রল ছিল, সেটা রেখে দেয়
  const draw = () => {
    const keep = {}, foc = document.activeElement?.id, scr = $("#sBox").scrollTop;
    $$("#sBox input, #sBox textarea, #sBox select").forEach((e) => e.id && e.dataset.dirty && (keep[e.id] = e.type === "checkbox" ? e.checked : e.value));
    paintDrawer();
    Object.entries(keep).forEach(([id, v]) => { const e = document.getElementById(id); if (e) { e.type === "checkbox" ? (e.checked = v) : (e.value = v); e.dataset.dirty = 1; } });
    if (foc && document.getElementById(foc)) document.getElementById(foc).focus();
    $("#sBox").scrollTop = scr;
  };
  const paintDrawer = () => {
    const s = S.students.find((x) => x.id === sid); if (!s) return;
    const ed = canEdit(s), a = s.application || {}, pays = S.payments.filter((p) => p.sid === sid).sort((x, y) => (y.createdAt?.seconds || 0) - (x.createdAt?.seconds || 0));
    const coun = [...new Set(D.hist.filter((h) => h.type === "counselling").map((h) => h.byName))];
    const flow = STAGES.filter((k) => k !== "closed"), cur = flow.indexOf(s.stage || "lead");
    $("#sBox").innerHTML = `<div class="dr-head">${av(s.name || "?", "lg")}<div class="dr-who"><h2>${esc(s.name || "")}</h2><p><span class="mono">${esc(s.id)}</span> · ${icon("phone")} ${esc(s.phone || "")}${s.country ? ` · ${esc(s.country)}` : ""}${s.edu ? ` · ${esc(EDU_LABEL[s.edu] || s.edu)}` : ""}</p>
          <p class="dr-tags"><i class="stg s-${s.stage || "lead"}">${stageTxt(s.stage || "lead")}</i>${isMine(s) ? `<i class="stg mine-tag">${B("আমার স্টুডেন্ট", "My student")}</i>` : ""}${a.status === "submitted" ? `<i class="tag-new">${B("অনলাইন আবেদন", "Applied online")}</i>` : ""}</p></div>
        <a class="btn btn-line sm" target="_blank" rel="noopener" href="https://wa.me/${String(s.phone || "").replace(/\D/g, "")}">${icon("chat")} WhatsApp</a>
        <button class="m-x" data-close aria-label="close">${icon("x")}</button></div>
      <ol class="stepper">${flow.map((k, i) => `<li class="${i < cur ? "done" : i === cur ? "now" : ""}" ${ed ? `data-step="${k}" role="button" tabindex="0"` : ""}><i>${i < cur ? "✓" : num(i + 1)}</i><span>${stageTxt(k)}</span></li>`).join("")}</ol>
      <div class="m-body st-grid">
        <section class="card">
          <h4>${B("ধাপ ও কাউন্সেলর", "Stage & counsellor")}</h4>
          ${ed ? "" : `<p class="lock-note">🔒 ${B("এটা আপনার স্টুডেন্ট না — শুধু দেখতে পারবেন", "Not your student — view only")}</p>`}
          <label class="fld"><span>${B("ধাপ", "Stage")}</span><select id="dStage" ${ed ? "" : "disabled"}>${STAGES.map((k) => `<option value="${k}" ${(s.stage || "lead") === k ? "selected" : ""}>${stageTxt(k)}</option>`).join("")}</select></label>
          <label class="fld"><span>${B("কাউন্সেলর", "Counsellor")}</span>
            ${canAll() ? `<select id="dCoun"><option value="">—</option>${S.staff.filter((x) => x.active).map((x) => `<option value="${x.uid}" ${s.counsellorUid === x.uid ? "selected" : ""}>${esc(x.name)} (${nm(ROLE_NAME[x.role])})</option>`).join("")}</select>`
              : `<b>${esc(s.counsellorName || "—")}</b>${!s.counsellorUid ? ` <button class="btn btn-gold sm" id="takeBtn">${B("আমার স্টুডেন্ট হিসেবে নিন", "Take this student")}</button>` : ""}`}</label>
          <p class="mini muted">${B("যাদের কাছে কাউন্সেলিং নিয়েছে", "Counselled by")}: <b>${coun.length ? coun.map(esc).join(", ") : "—"}</b></p>
          <label class="fld"><span>${B("ভেতরের নোট (শুধু স্টাফ দেখে)", "Internal note (staff only)")}</span><textarea id="dNote" rows="3" ${ed ? "" : "disabled"}>${esc(s.notes || "")}</textarea></label>
          ${ed ? `<button class="btn btn-primary sm" id="saveBtn">${icon("check")} ${B("সেভ করুন", "Save")}</button>` : ""}
          ${canAll() ? `<p class="mini muted acct-line">${s.ownerUid ? B("অনলাইন অ্যাকাউন্ট আছে", "Has an online account") : B("অনলাইন অ্যাকাউন্ট নেই", "No online account")}
            ${s.ownerUid ? ` · <button class="btn-link" id="resetBtn">${B("পাসওয়ার্ড রিসেট", "Reset password")}</button>` : ""}</p>` : ""}
        </section>
        <section class="card">
          <h4>${B("অনলাইন আবেদন", "Online application")} ${a.status === "submitted" ? `<em class="tag-new">${B("জমা হয়েছে", "Submitted")} · ${fmtTime(a.submittedAt)}</em>` : ""}</h4>
          ${a.status ? `<dl class="app-dl">${[["fullName", B("পাসপোর্ট অনুযায়ী নাম", "Name as in passport")], ["dob", B("জন্ম তারিখ", "Date of birth")], ["passport", B("পাসপোর্ট", "Passport")], ["nationality", B("দেশ", "Nationality")],
            ["lastEdu", B("সর্বশেষ পড়াশোনা", "Last education")], ["gpa", "GPA"], ["level", B("যে লেভেলে পড়বে", "Level wanted")], ["university", B("ইউনিভার্সিটি", "University")], ["program", B("প্রোগ্রাম", "Programme")],
            ["intake", B("ইনটেক", "Intake")], ["english", B("ইংরেজি টেস্ট", "English test")], ["address", B("ঠিকানা", "Address")], ["guardian", B("অভিভাবক", "Guardian")], ["email", "Email"]]
            .filter(([k]) => a[k]).map(([k, l]) => `<dt>${l}</dt><dd>${esc(a[k])}</dd>`).join("")}</dl>` : `<p class="muted">${B("এখনো অনলাইনে আবেদন করেনি", "No online application yet")}</p>`}
        </section>
        <section class="card">
          <h4>EMGS ${B("ভিসা অগ্রগতি", "visa progress")}</h4>
          <p class="mini muted">${B("পাসপোর্ট", "Passport")}: <b class="mono">${esc(D.emgs?.passport || a.passport || "—")}</b> · ${B("দেশ", "Nationality")}: <b>${esc(D.emgs?.nationality || a.nationality || "Bangladesh")}</b>
            ${(D.emgs?.passport || a.passport) ? ` <button class="btn-link" id="cpPass">${B("কপি", "Copy")}</button>` : ""} · <a href="${EMGS_URL}" target="_blank" rel="noopener">${B("EMGS-এ চেক করুন ↗", "Check on EMGS ↗")}</a></p>
          <div class="emgs-bar"><i style="width:${D.emgs?.percent || 0}%"></i><b>${num(D.emgs?.percent || 0)}%</b></div>
          ${ed ? `<div class="emgs-ed"><label class="fld"><span>${B("অগ্রগতি %", "Progress %")}</span><input id="ePct" type="number" min="0" max="100" value="${D.emgs?.percent || 0}"></label>
            <label class="fld"><span>${B("অবস্থা (স্টুডেন্ট দেখবে)", "Status (student sees)")}</span><input id="eTxt" value="${esc(D.emgs?.statusText || "")}" placeholder="${B("যেমন: Approval Letter Issued", "e.g. Approval Letter Issued")}"></label>
            <label class="sw"><input type="checkbox" id="eVis" ${D.emgs?.visible ? "checked" : ""}> ${B("স্টুডেন্টকে দেখান", "Show to student")}</label>
            <button class="btn btn-primary sm" id="eSave">${icon("check")} ${B("EMGS আপডেট", "Update EMGS")}</button></div>` : `<p class="mini muted">${D.emgs?.visible ? B("স্টুডেন্ট দেখতে পাচ্ছে", "Visible to student") : B("স্টুডেন্টের কাছে লুকানো", "Hidden from student")} · ${D.emgs?.statusText ? esc(D.emgs.statusText) : ""}</p>`}
          ${D.emgs?.updatedAt ? `<p class="mini muted">${B("শেষ আপডেট", "Updated")}: ${fmtTime(D.emgs.updatedAt)} — ${esc(D.emgs.updatedBy || "")}</p>` : ""}
        </section>
        <section class="card">
          <h4>${B("পেমেন্ট", "Payments")}</h4>
          ${pays.length ? pays.map((p) => payRow(p, ed)).join("") : `<p class="muted">${B("কোনো পেমেন্ট নেই", "No payments")}</p>`}
        </section>
        <section class="card st-wide">
          <h4>${B("কাউন্সেলিং ও কাজের ইতিহাস", "Counselling & activity history")}</h4>
          <form id="hForm" class="h-form"><select id="hType"><option value="counselling">${B("কাউন্সেলিং দিলাম", "Gave counselling")}</option><option value="call">${B("ফোন করেছি", "Called")}</option><option value="note">${B("নোট", "Note")}</option></select>
            <input id="hTxt" placeholder="${B("কী কথা হলো? যেমন: SEGi-তে BBA নিয়ে কথা, বাজেট ৮ লাখ", "What happened? e.g. discussed BBA at SEGi")}"><button class="btn btn-primary sm">${B("যোগ করুন", "Add")}</button></form>
          <ol class="tl">${D.hist.length ? D.hist.map((h) => `<li class="tl-${h.type}"><b>${esc(h.byName)}</b> <small>${nm(ROLE_NAME[h.role] || ["", ""])} · ${fmtTime(h.at)}</small><p>${esc(h.text)}</p></li>`).join("") : `<li class="muted">${B("এখনো কিছু নেই", "Nothing yet")}</li>`}</ol>
        </section>
      </div>`;
    $("[data-close]", m).onclick = closeM;
    $$("#sBox input, #sBox textarea, #sBox select").forEach((e) => e.addEventListener("input", () => (e.dataset.dirty = 1)));
    $$(".stepper [data-step]").forEach((li) => (li.onclick = () => { const sel = $("#dStage"); sel.value = li.dataset.step; sel.dataset.dirty = 1;
      $$(".stepper li").forEach((x) => x.classList.toggle("pick", x === li)); $("#saveBtn")?.classList.add("pulse"); toast(B("ধাপ বাছা হলো — 'সেভ করুন' চাপুন", "Stage picked — press Save")); }));
    const log = (type, text) => addDoc(collection(db, "students", sid, "history"), { type, text, byUid: S.uid, byName: S.me.name, role: S.me.role, at: serverTimestamp() });
    if ($("#saveBtn")) $("#saveBtn").onclick = async () => {
      const patch = { stage: $("#dStage").value, notes: $("#dNote").value, updatedAt: serverTimestamp() };
      if ($("#dCoun")) { const x = S.staff.find((y) => y.uid === $("#dCoun").value); patch.counsellorUid = x?.uid || null; patch.counsellorName = x?.name || null; }
      try {
        await updateDoc(doc(db, "students", sid), patch);
        if (patch.stage !== (s.stage || "lead")) await log("stage", `${B("ধাপ বদল", "Stage")}: ${stageTxt(s.stage || "lead")} → ${stageTxt(patch.stage)}`);
        if ("counsellorUid" in patch && patch.counsellorUid !== (s.counsellorUid || null)) await log("assign", `${B("কাউন্সেলর", "Counsellor")}: ${patch.counsellorName || "—"}`);
        $$("#sBox [data-dirty]").forEach((e) => delete e.dataset.dirty); toast(B("সেভ হয়েছে", "Saved"));
      } catch (e) { toast(errText(e)); }
    };
    // পাসওয়ার্ড ভুলে গেলে: পুরনো অ্যাকাউন্ট আলাদা করা হয়, স্টুডেন্ট একই নাম্বারে নতুন পাসওয়ার্ড দিয়ে আবার অ্যাকাউন্ট খুললে সব তথ্য ফিরে পায়
    if ($("#resetBtn")) $("#resetBtn").onclick = async () => {
      if (!confirm(B(`${s.name}-এর পাসওয়ার্ড রিসেট করবেন? এরপর স্টুডেন্টকে বলুন apply.html-এ "নতুন অ্যাকাউন্ট" থেকে একই নাম্বার (${s.phone}) আর নতুন পাসওয়ার্ড দিতে — আগের সব তথ্য থেকে যাবে।`,
        `Reset ${s.name}'s password? Then ask the student to open "New account" on apply.html with the same number (${s.phone}) and a new password — all data stays.`))) return;
      const ver = (s.authVer || 0) + 1, b = writeBatch(db);
      b.update(doc(db, "students", sid), { ownerUid: null, authVer: ver, updatedAt: serverTimestamp() });
      b.set(doc(db, "logins", String(s.phone).replace(/\D/g, "")), { ver, sid, at: serverTimestamp(), by: S.me.name });
      try { await b.commit(); await log("note", B("পাসওয়ার্ড রিসেট করা হলো — স্টুডেন্ট নতুন পাসওয়ার্ডে আবার অ্যাকাউন্ট খুলবে", "Password reset — student will re-open the account")); toast(B("রিসেট হয়েছে", "Reset done")); }
      catch (e) { toast(errText(e)); }
    };
    if ($("#takeBtn")) $("#takeBtn").onclick = async () => {
      try { await updateDoc(doc(db, "students", sid), { counsellorUid: S.uid, counsellorName: S.me.name, updatedAt: serverTimestamp() }); await log("assign", B("নিজের স্টুডেন্ট হিসেবে নিলেন", "Took this student")); } catch (e) { toast(errText(e)); }
    };
    if ($("#cpPass")) $("#cpPass").onclick = () => navigator.clipboard?.writeText(D.emgs?.passport || a.passport).then(() => toast(B("পাসপোর্ট নাম্বার কপি হয়েছে — EMGS-এ পেস্ট করুন", "Passport number copied")));
    if ($("#eSave")) $("#eSave").onclick = async () => {
      const pct = Math.max(0, Math.min(100, +$("#ePct").value || 0));
      try {
        await setDoc(doc(db, "emgs", sid), { sid, ownerUid: s.ownerUid || null, passport: a.passport || D.emgs?.passport || "", nationality: a.nationality || "Bangladesh",
          percent: pct, statusText: $("#eTxt").value.trim(), visible: $("#eVis").checked, updatedAt: serverTimestamp(), updatedBy: S.me.name }, { merge: true });
        await log("emgs", `EMGS ${num(pct)}%${$("#eTxt").value ? " — " + $("#eTxt").value : ""} · ${$("#eVis").checked ? B("স্টুডেন্ট দেখছে", "visible") : B("লুকানো", "hidden")}`);
        ["ePct", "eTxt", "eVis"].forEach((i) => document.getElementById(i) && delete document.getElementById(i).dataset.dirty); toast(B("EMGS আপডেট হয়েছে", "EMGS updated"));
      } catch (e) { toast(errText(e)); }
    };
    $("#hForm").onsubmit = async (e) => { e.preventDefault(); const h = $("#hTxt"), tx = h.value.trim(); if (!tx) return; h.value = ""; delete h.dataset.dirty; try { await log($("#hType").value, tx); } catch (er) { h.value = tx; toast(errText(er)); } };
    bindPay($("#sBox"));
  };
  detailUnsub.push(onSnapshot(collection(db, "students", sid, "history"), (snap) => { D.hist = snap.docs.map((d) => d.data()).sort((a, b) => (b.at?.seconds || 9e12) - (a.at?.seconds || 9e12)); draw(); }));
  detailUnsub.push(onSnapshot(doc(db, "emgs", sid), (d) => { D.emgs = d.exists() ? d.data() : null; draw(); }, () => draw()));
  S.redraw = draw; draw();
}
function closeM() { detailUnsub.forEach((u) => u()); detailUnsub = []; S.redraw = null; const m = $("#sModal"); m.classList.remove("open"); setTimeout(() => { if (!m.classList.contains("open")) m.hidden = true; }, 280); document.body.classList.remove("locked"); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#sModal").hidden) closeM(); });
$("#sModal").addEventListener("click", (e) => { if (e.target.id === "sModal") closeM(); });

/* ---------- পেমেন্ট যাচাই ও রসিদ ---------- */
function payRow(p, ed) {
  const stTx = { pending: B("যাচাই বাকি", "Pending"), verified: B("যাচাই হয়েছে", "Verified"), rejected: B("বাতিল", "Rejected") }[p.status];
  return `<div class="pay pay-${p.status}"><div><b>${esc(p.currency)} ${Number(p.amount).toLocaleString("en-IN")}</b> · ${esc(p.purpose)}<small>${esc(p.method)} · TrxID <span class="mono">${esc(p.trxId)}</span>${p.sender ? ` · ${esc(p.sender)}` : ""} · ${fmtTime(p.createdAt)}</small>
      ${p.studentName && S.tab === "payments" ? `<small>${esc(p.studentName)} · <span class="mono">${esc(p.sid)}</span></small>` : ""}</div>
    <div class="pay-act"><i class="pst">${stTx}</i>${p.status === "pending" && ed ? `<button class="btn btn-primary sm" data-ok="${p._id}">${icon("check")} ${B("টাকা পেয়েছি", "Verify")}</button><button class="btn btn-line sm" data-no="${p._id}">${B("বাতিল", "Reject")}</button>` : ""}
      ${p.status === "verified" ? `<button class="btn btn-line sm" data-rc="${p._id}">${icon("doc")} ${B("রসিদ", "Receipt")}</button>` : ""}</div></div>`;
}
function bindPay(root) {
  $$("[data-ok]", root).forEach((b) => (b.onclick = () => setPay(b.dataset.ok, "verified")));
  $$("[data-no]", root).forEach((b) => (b.onclick = () => setPay(b.dataset.no, "rejected")));
  $$("[data-rc]", root).forEach((b) => (b.onclick = () => showReceipt(S.payments.find((p) => p._id === b.dataset.rc))));
}
async function setPay(id, status) {
  const p = S.payments.find((x) => x._id === id); if (!p) return;
  if (status === "verified" && !confirm(B(`${p.currency} ${p.amount} (TrxID ${p.trxId}) সত্যিই অ্যাকাউন্টে এসেছে? যাচাই করলে স্টুডেন্ট রসিদ পাবে।`, `Has ${p.currency} ${p.amount} (TrxID ${p.trxId}) really arrived? The student will get a receipt.`))) return;
  try {
    const patch = status === "verified" ? { status, receiptNo: receiptNo(), verifiedBy: S.me.name, verifiedAt: serverTimestamp() } : { status, verifiedBy: S.me.name, verifiedAt: serverTimestamp() };
    await updateDoc(doc(db, "payments", id), patch);
    await addDoc(collection(db, "students", p.sid, "history"), { type: "payment", text: `${p.purpose} ${p.currency} ${p.amount} (TrxID ${p.trxId}) — ${status === "verified" ? B("যাচাই হয়েছে", "verified") : B("বাতিল", "rejected")}`, byUid: S.uid, byName: S.me.name, role: S.me.role, at: serverTimestamp() });
    toast(status === "verified" ? B("যাচাই হয়েছে — রসিদ তৈরি", "Verified — receipt created") : B("বাতিল করা হয়েছে", "Rejected"));
  } catch (e) { toast(errText(e)); }
}
function drawPayments() {
  const list = S.payments.slice().sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  $("#pBody").innerHTML = `<section class="card"><h3>${B("সব পেমেন্ট", "All payments")}</h3><p class="mini muted">${B("যাচাই বাকিগুলো উপরে। নিজের স্টুডেন্টের পেমেন্ট যাচাই করতে পারবেন (মডারেটর/ম্যানেজার সবগুলো)।", "Pending first. You can verify your own students' payments (moderators/managers: all).")}</p>
    ${list.length ? list.map((p) => payRow(p, canAll() || S.students.find((s) => s.id === p.sid)?.counsellorUid === S.uid)).join("") : `<p class="muted">${B("কোনো পেমেন্ট নেই", "No payments yet")}</p>`}</section>`;
  bindPay($("#pBody"));
}

/* ---------- স্টাফ যোগ/বাদ (শুধু ম্যানেজার) ---------- */
function drawStaff() {
  $("#pBody").innerHTML = `<div class="p-grid2"><section class="card"><h3>${B("নতুন স্টাফ যোগ করুন", "Add staff")}</h3>
      <form id="stF" novalidate><label class="fld"><span>${B("নাম", "Name")}</span><input id="sfN" required></label>
        <label class="fld"><span>${B("ইউজারনেম (লগইনের জন্য)", "Username (for login)")}</span><input id="sfU" required autocapitalize="none" placeholder="${B("যেমন: adlina", "e.g. adlina")}"></label>
        <label class="fld"><span>${B("পাসওয়ার্ড", "Password")}</span><input id="sfP" required type="text" placeholder="${B("অন্তত ৬ অক্ষর", "6+ characters")}"></label>
        <label class="fld"><span>${B("পদ", "Role")}</span><select id="sfR"><option value="counsellor">${nm(ROLE_NAME.counsellor)}</option><option value="moderator">${nm(ROLE_NAME.moderator)}</option><option value="manager">${nm(ROLE_NAME.manager)}</option></select></label>
        <p class="err" id="sfE"></p><button class="btn btn-primary">${icon("user")} ${B("স্টাফ যোগ করুন", "Add staff")}</button></form>
      <p class="mini muted">${B("স্টাফকে ইউজারনেম আর পাসওয়ার্ড জানিয়ে দিন — তিনি staff.html থেকে লগইন করবেন, পরে নিজের পাসওয়ার্ড বদলাতে পারবেন।", "Share the username and password with them — they log in at staff.html and can change the password later.")}</p></section>
    <section class="card"><h3>${B("সব স্টাফ", "All staff")}</h3>${S.staff.map((x) => `<div class="staff-row ${x.active ? "" : "off"}"><div><b>${esc(x.name)}</b><small class="mono">${esc(x.username)}</small></div>
        <select data-role="${x.uid}" ${x.uid === S.uid ? "disabled" : ""}>${Object.keys(ROLE_NAME).map((r) => `<option value="${r}" ${x.role === r ? "selected" : ""}>${nm(ROLE_NAME[r])}</option>`).join("")}</select>
        ${x.uid === S.uid ? `<em class="mini muted">${B("আপনি", "You")}</em>` : `<button class="btn btn-line sm" data-act="${x.uid}">${x.active ? B("বন্ধ করুন", "Disable") : B("চালু করুন", "Enable")}</button>`}</div>`).join("")}</section></div>`;
  $("#stF").onsubmit = async (e) => {
    e.preventDefault(); const n = $("#sfN").value.trim(), u = $("#sfU").value.trim().toLowerCase(), p = $("#sfP").value, r = $("#sfR").value, err = $("#sfE");
    if (n.length < 2 || !/^[a-z0-9._-]{3,30}$/.test(u)) return (err.textContent = B("নাম আর ইউজারনেম ঠিকভাবে দিন (ইংরেজি অক্ষর/সংখ্যা)", "Enter a name and a valid username"));
    if (p.length < 6) return (err.textContent = B("পাসওয়ার্ড অন্তত ৬ অক্ষর", "Password must be 6+ characters"));
    err.textContent = B("অপেক্ষা করুন…", "Please wait…");
    try {
      const a2 = secondaryAuth(), cred = await createUserWithEmailAndPassword(a2, staffEmail(u), p);
      await setDoc(doc(db, "staff", cred.user.uid), { username: u, name: n, role: r, active: true, createdAt: serverTimestamp(), createdBy: S.me.name });
      await a2.signOut(); err.textContent = ""; toast(B(`${n} যোগ হয়েছেন`, `${n} added`)); await loadStaff(); drawStaff();
    } catch (ex) { err.textContent = errText(ex); }
  };
  $$("[data-role]").forEach((s) => (s.onchange = async () => { try { await updateDoc(doc(db, "staff", s.dataset.role), { role: s.value }); await loadStaff(); toast(B("পদ বদলানো হয়েছে", "Role updated")); } catch (e) { toast(errText(e)); } }));
  $$("[data-act]").forEach((b) => (b.onclick = async () => { const x = S.staff.find((y) => y.uid === b.dataset.act); try { await updateDoc(doc(db, "staff", x.uid), { active: !x.active }); await loadStaff(); drawStaff(); } catch (e) { toast(errText(e)); } }));
}
async function loadStaff() { S.staff = (await getDocs(collection(db, "staff"))).docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)); }

/* ---------- শুরু ---------- */
if (!READY) notReady();
else onAuthStateChanged(auth, async (user) => {
  S.unsub.forEach((u) => u()); S.unsub = [];
  if (!user) return loginView();
  try {
    const d = await getDoc(doc(db, "staff", user.uid));
    if (!d.exists() || !d.data().active) { await signOut(auth); return loginView().then(() => ($("#lgE").textContent = B("এই অ্যাকাউন্ট স্টাফ পোর্টালে ঢুকতে পারবে না", "This account can't use the staff portal"))); }
    S.me = d.data(); S.uid = user.uid;
    updateDoc(doc(db, "staff", user.uid), { lastLogin: serverTimestamp() }).catch(() => {});
    await loadStaff();
    let first = true;
    const refresh = () => { if (first) return; if (S.redraw) S.redraw(); paint(false); };
    S.unsub.push(onSnapshot(collection(db, "students"), (snap) => { S.students = snap.docs.map((x) => x.data()); refresh(); }, (e) => toast(errText(e))));
    S.unsub.push(onSnapshot(collection(db, "payments"), (snap) => { S.payments = snap.docs.map((x) => ({ _id: x.id, ...x.data() })); refresh(); }, (e) => toast(errText(e))));
    first = false; shell();
  } catch (e) { box().innerHTML = `<p class="err">${errText(e)}</p>`; }
});
document.addEventListener("bfs:lang", () => { if (S.me) { if (S.redraw) S.redraw(); shell(); } });
