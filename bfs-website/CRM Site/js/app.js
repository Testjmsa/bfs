/* ===== App shell: login, sidebar, router ===== */
(() => {
const CRM = window.CRM, { S, K } = CRM;
const { esc, $, ic, av, toast } = CRM.ui;
const app = document.getElementById("app"), C = window.CRM_CONFIG || {};

const NAV = [
  ["dashboard", "Dashboard", "home", () => true],
  ["students", "Students & Leads", "users", () => S.can.students()],
  ["unis", "Universities & EMGS", "globe", () => S.can.students() || S.can.admission()],
  ["emgs", "EMGS progress", "chart", () => S.can.admission() || S.can.emgsCtl()],
  ["applications", "Applications", "file", () => S.can.admission()],
  ["visa", "Visa", "plane", () => S.can.admission()],
  ["documents", "Documents", "folder", () => S.can.admission()],
  ["ielts", "IELTS Centre", "book", () => S.can.ielts()],
  ["tasks", "Tasks", "check", () => true],
  ["finance", "Finance", "coin", () => S.can.finance()],
  ["reports", "Reports", "chart", () => S.can.reports()],
  ["reminders", "Reminders", "bell", () => true],
  ["settings", "Team & Settings", "gear", () => true],
  ["help", "My Guide (বাংলা)", "book", () => true],
];
const PARENT = { student: "students", batch: "ielts" };

function loginView(msg = "") {
  document.body.classList.remove("nav-open");
  app.innerHTML = `<div class="login"><div class="card"><img src="assets/bfs-logo.png" alt=""><span class="kicker">Staff only</span><h1>${esc(C.orgName || "BFS")} CRM</h1>
    <p class="muted">Log in with the ID and password given to you by the office.</p><form id="lf"><label class="fld"><span>Login ID</span><input id="le" required autocomplete="username" autocapitalize="none" placeholder="your ID or email"></label><label class="fld"><span>Password</span><input type="password" id="lp" required autocomplete="current-password"></label><label class="fld" id="lcw" hidden><span>6-digit code from your authenticator app</span><input id="lc" inputmode="numeric" maxlength="6" autocomplete="one-time-code"></label><p class="err">${esc(msg)}</p><button class="btn btn-primary">Log in</button><p class="muted mini" style="text-align:center;margin:0">Forgot your password? Ask the Admin to reset it.</p></form>
    ${S.LIVE ? "" : '<p class="muted mini" style="margin-top:12px">Demo mode — sample data saved only in this browser.</p>'}
  </div></div>`;
  const f = $("#lf", app);
  if (f) f.onsubmit = async (e) => { e.preventDefault(); const b = f.querySelector("button"); b.disabled = true; try { if (!$("#lcw", app).hidden) await S.mfaLogin($("#lc", app).value.trim()); else await S.login($("#le", app).value.trim(), $("#lp", app).value); if (!location.hash || location.hash === "#/") location.hash = "#/dashboard"; start(); } catch (ex) { if (ex.mfa) { $("#lcw", app).hidden = false; $("#lc", app).focus(); } $(".err", app).textContent = ex.message; b.disabled = false; } };
}

function shell() {
  const me = S.me;
  app.innerHTML = `<div class="shell"><aside class="side"><div class="brand"><img src="assets/bfs-logo-white.png" alt=""><div><b>${esc(C.orgName || "BFS")}</b><small>CRM</small></div></div>
      <nav id="nav"></nav><div class="foot">${S.LIVE ? "Live · secured by role" : "Demo mode"}<br>v1.0</div></aside>
    <div class="main">${S.LIVE ? "" : '<div class="demo-bar">DEMO MODE — sample data saved only in this browser. See SETUP-GUIDE.txt to connect the real database.</div>'}
      <header class="top"><button class="burger" id="burger" aria-label="Menu">${ic("menu")}</button>
        ${S.can.students() || S.can.finance() ? `<div class="gsearch">${ic("search")}<input id="gs" placeholder="Search student by name, phone, ID…" autocomplete="off"><div class="gres" id="gres" hidden></div></div>` : ""}
        <div class="top-r">${S.LIVE ? `<button class="btn btn-line sm" id="sync" title="Load the latest data">↻ Refresh</button>` : ""}<a class="bell" href="#/reminders" aria-label="Reminders">${ic("bell")}<i id="bellN" hidden></i></a>
          <a class="who" href="#/settings/account">${av(me.name, "", me.photo)}<span><b>${esc(me.name)}</b><small>${esc(S.ROLES[me.role] || me.role)}</small></span></a><button class="btn btn-line sm" id="out" title="Log out">${ic("out")}</button></div></header>
      <main class="page" id="page"></main></div></div>`;
  $("#burger").onclick = () => document.body.classList.toggle("nav-open");
  $("#out").onclick = async () => { S.log("logout", "user", me.id, ""); await S.logout(); loginView(); };
  const sync = $("#sync"); if (sync) sync.onclick = async () => { sync.disabled = true; try { await S.reload(); render(); toast("Up to date", "ok"); } catch (ex) { toast(ex.message, "bad"); } sync.disabled = false; };
  const gs = $("#gs"), gres = $("#gres");
  if (gs) {
    gs.oninput = () => { const q = gs.value.toLowerCase().trim(); if (q.length < 2) return (gres.hidden = true);
      const hit = S.rows("students").filter((s) => [s.name, s.phone, s.whatsapp, s.sid, s.passport_no].some((v) => String(v || "").toLowerCase().includes(q))).slice(0, 8);
      gres.innerHTML = hit.map((s) => `<a href="#/student/${s.id}">${av(s.name, "sm")}<span><b>${esc(s.name)}</b> <span class="muted mini">${esc(s.sid)} · ${esc(s.phone || "")}</span></span><span style="margin-left:auto">${CRM.stPill(s.status)}</span></a>`).join("") || '<a class="muted">No student found</a>'; gres.hidden = false; };
    gres.onclick = () => { gres.hidden = true; gs.value = ""; };
    document.addEventListener("click", (e) => { if (!e.target.closest(".gsearch")) gres.hidden = true; });
  }
}

/* প্রতিটা পেজের উপরে "ব্যবহার নির্দেশিকা" (যে পেজ নিজে বানায় না, তাদের জন্য এখানে) */
const GUIDES = {
  dashboard: ["আজকের কাজ এক নজরে: follow-up, নতুন lead, বাকি টাকা, সামনের ভিসার তারিখ।", "যেকোনো সংখ্যা/তালিকায় ক্লিক করলে সেই পেজ খোলে।", "উপরের সার্চ বক্সে নাম, ফোন বা Student ID লিখে যেকোনো student খুঁজুন।"],
  student: ["নামের পাশের <b>Status</b> বদলালে student-এর যাত্রাপথ বদলায়; Application/Visa আপডেট করলে নিজে থেকেও এগোয়।", "কথা হলে <b>Timeline</b>-এ লিখুন (Call, WhatsApp, Counselling…) আর পরের follow-up তারিখ দিন।", "<b>Edit</b>-এ “Also assigned to” দিয়ে একাধিক কর্মীকে এই student-এ কাজ করতে দিন।", "<b>Student portal → Give portal access</b> দিলে student নিজের অবস্থা অনলাইনে দেখে; <b>Print access slip</b> দিয়ে ID আর PIN দিন।"],
  ielts: ["প্রতিটা কার্ড একটা batch — ক্লিক করলে student, ক্লাস লিংক ও homework, উপস্থিতি আর টেস্টের ফলাফল পাবেন।", "নতুন batch: <b>New batch</b> (Manager)।"],
  batch: ["<b>Students</b>: এই batch-এর student আর টাকা। <b>Class link &amp; homework</b>: Zoom লিংক আর homework/নোটিশ।", "<b>Attendance</b>: তারিখ বেছে P / L / A দিয়ে Save। <b>Mock tests</b>: ফলাফল দিন — student portal-এ সাথে সাথে দেখা যায়।"],
  tasks: ["<b>New task</b> দিয়ে এক বা একাধিক জনকে কাজ দিন, deadline আর priority সহ।", "কার্ডে ক্লিক করে অবস্থা বদলান (To Do → In Progress → Review → Completed) আর মন্তব্য লিখুন।"],
  finance: ["প্রথমে <b>Invoice</b> (কিসের টাকা, কত), তারপর টাকা পেলে সেই invoice-এ <b>Payment</b> — রসিদ প্রিন্ট হয়।", "মালয়েশিয়ার student-এর EMGS ফি নিলে Fee type-এ <b>EMGS Fee</b> দিন; পুরো টাকা জমা হলে student portal-এ EMGS কার্ড চালু হয়।", "bKash/Nagad/Bank হলে Transaction ID লাগবে।"],
  reports: ["রিপোর্ট বেছে তারিখ/দেশ/counsellor দিয়ে ছোট করুন; Excel বা PDF নামাতে পারবেন (অনুমতি থাকলে)।"],
  reminders: ["আজ যা করতে হবে: follow-up, ভিসার তারিখ, পাসপোর্টের মেয়াদ, বাকি টাকা, যাচাইয়ের অপেক্ষায় কাগজ।", "লাইনে ক্লিক করলে সংশ্লিষ্ট student খোলে।"],
  settings: ["<b>Team</b>: কর্মী যোগ করা, Login ID আর পাসওয়ার্ড (Admin)। <b>Role permissions</b>: কোন পদ কী পারবে (Admin, পাসওয়ার্ড দিয়ে)।", "<b>My account</b>: নিজের ছবি, পাসওয়ার্ড বদল আর 2-step login।"],
};
function addGuide(page, route, args) {
  if (!GUIDES[route] || page.querySelector("details.guide") || (route === "batch" && args[1] === "class")) return;
  const box = document.createElement("div"); box.innerHTML = CRM.ui.guide(route, GUIDES[route]);
  const ph = page.querySelector(".ph"); if (ph) ph.after(box.firstElementChild); else page.prepend(box.firstElementChild);
}
let autoEmgs = false;
function render() {
  if (!S.me) return loginView();
  if (!$("#page")) shell();
  document.body.classList.remove("nav-open");
  let [route = "dashboard", ...args] = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  if (!route) route = "dashboard";
  const navKey = PARENT[route] || route, item = NAV.find((n) => n[0] === navKey);
  if (!CRM.views[route] || !item || !item[3]()) { route = "dashboard"; args = []; }
  const rems = CRM.reminders(), n = rems.length, bell = $("#bellN");
  bell.hidden = !n; bell.textContent = n > 99 ? "99+" : n;
  $("#nav").innerHTML = NAV.filter((x) => x[3]()).map(([k, l, i]) => `<a class="nav ${k === (PARENT[route] || route) ? "on" : ""}" href="#/${k}">${ic(i)} ${l}${k === "reminders" && n ? `<span class="cnt">${n}</span>` : ""}</a>`).join("");
  const old = $("#page"), page = old.cloneNode(false);   // নতুন element → আগের পেজের click handler থাকে না
  old.replaceWith(page);
  try { CRM.views[route](page, args); addGuide(page, route, args); }
  catch (ex) { console.error(ex); page.innerHTML = `<div class="empty">Something went wrong on this page: ${esc(ex.message)}</div>`; }
  if (!autoEmgs && CRM.autoEmgs) { autoEmgs = true; setTimeout(CRM.autoEmgs, 4000); }
}
let lastKey = "";
function start() {
  if (!S.me) return loginView();
  $("#page") && $("#page").closest(".shell").remove(); app.innerHTML = "";
  render();
  if (S.me.must_change && !document.querySelector("#mustPw")) {
    const m = CRM.ui.modal("Set your own password", `<form id="mustPw"><p class="muted">You logged in with the password given by the office. Choose your own password now — nobody else should know it.</p>
      <div class="fgrid"><label class="fld full"><span>New password (at least 8 characters)</span><input type="password" id="np1" required minlength="8" autocomplete="new-password"></label><label class="fld full"><span>Type it again</span><input type="password" id="np2" required minlength="8" autocomplete="new-password"></label></div>
      <p class="err"></p><div class="modal-f"><button class="btn btn-primary">Save password</button></div></form>`, { locked: true });
    m.body.querySelector("form").onsubmit = async (e) => { e.preventDefault(); const a = $("#np1", m.body).value, b = $("#np2", m.body).value, err = $(".err", m.body);
      if (a !== b) return (err.textContent = "The two passwords are not the same");
      try { await S.changePassword(a); S.log("password-change", "user", S.me.id, "first login"); m.close(); toast("Password saved", "ok"); } catch (ex) { err.textContent = ex.message; } };
  }
  if ("Notification" in window && Notification.permission === "granted") {
    const n = CRM.reminders().filter((r) => r.tone === "red").length, key = S.me.id + CRM.ui.today();
    if (n && sessionStorage.getItem("bfscrm:notified") !== key) { new Notification("BFS CRM", { body: `${n} urgent reminders need your attention today.`, icon: "assets/bfs-logo.png" }); sessionStorage.setItem("bfscrm:notified", key); }
  }
}
window.addEventListener("hashchange", () => { if (location.hash !== lastKey) window.scrollTo(0, 0); lastKey = location.hash; render(); });
window.addEventListener("crm:render", render);
/* LIVE: প্রতি ২ মিনিটে নতুন ডেটা নিজে থেকে আসে (কেউ ফর্ম লিখতে থাকলে বা ট্যাব লুকানো থাকলে নয়) */
if (S.LIVE) setInterval(async () => {
  const typing = document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (!S.me || document.hidden || document.querySelector(".modal-bg") || typing) return;
  try { await S.reload(); render(); } catch (ex) { console.warn("sync failed", ex); }
}, 120000);

app.innerHTML = '<div class="login"><div class="card"><p class="muted">Loading…</p></div></div>';
S.init().then(start).catch((ex) => { console.error(ex); loginView(ex.message); });
})();
