/* ===== Student Dashboard ===== */
let LG = null;   // "in" = Sign in, "up" = Sign up
function loginView(msg = "") {
  const bn = isBn(), T = (b, e) => (bn ? b : e), crm = !!window.BFSCRM;
  if (!crm) LG = "up"; else if (!LG) LG = Object.keys(store.get(USERS, {})).length ? "in" : "up";   // এই ডিভাইসে আগে কেউ ছিল → Sign in আগে
  $("#dash").innerHTML = `
    <section class="login card">
      <img src="images/bfs-logo.png" alt="BFS">
      <h1 style="font-size:1.7rem">${t("d.loginT")}</h1><p class="muted">${t("d.loginS")}</p>
      ${crm ? `<div class="chips" style="justify-content:center"><button type="button" data-lg="in" class="${LG === "in" ? "on" : ""}">${T("Sign in — আগের অ্যাকাউন্ট", "Sign in")}</button><button type="button" data-lg="up" class="${LG === "up" ? "on" : ""}">${T("Sign up — নতুন", "Sign up — new")}</button></div>` : ""}
      ${LG === "in" ? `<form id="inForm" novalidate>
        <label class="fld"><span>${T("মোবাইল নাম্বার বা Student ID", "Mobile number or Student ID")}</span><input id="inId" required autocomplete="username" inputmode="text" placeholder="017XXXXXXXX / BFS1001"></label>
        <label class="fld"><span>${T("PIN (৬ সংখ্যা)", "PIN (6 digits)")}</span><input id="inPin" required type="password" inputmode="numeric" maxlength="6" autocomplete="current-password"></label>
        <p class="err" id="lgErr" role="alert">${esc(msg)}</p>
        <button class="btn btn-primary btn-lg wide">${icon("user")} Sign in</button>
        <p class="center" style="margin:12px 0 0"><button type="button" class="btn-link" id="forgot">${T("PIN ভুলে গেছেন?", "Forgot your PIN?")}</button></p>
        <div id="forgotBox" hidden class="lock-note" style="margin-top:10px;text-align:left">${T("নিরাপত্তার জন্য নতুন PIN শুধু আমাদের অফিস থেকে দেওয়া হয়। নিচের বোতামে WhatsApp করুন; আপনার নাম্বার মিলিয়ে আমরা নতুন PIN পাঠিয়ে দেব।", "For your safety a new PIN is issued only by our office. Message us on WhatsApp; we will verify your number and send a new PIN.")}
          <p style="margin:10px 0 0"><a class="btn btn-primary sm" id="forgotWa" target="_blank" rel="noopener" href="#">${icon("chat")} WhatsApp</a></p></div>
      </form>` : `<form id="lgForm" novalidate>
        <label class="fld"><span>${t("v.name")}</span><input id="lgName" required autocomplete="name"></label>
        <label class="fld"><span>${t("v.mobile")}</span>${phoneInput("lgPhone")}</label>
        <p class="err" id="lgErr" role="alert">${esc(msg)}</p>
        <button class="btn btn-primary btn-lg wide">${icon("user")} ${crm ? T("অ্যাকাউন্ট খুলুন — ফ্রি", "Create my account — free") : t("d.login")}</button>
      </form>
      <p class="mini muted" style="margin-top:12px">${crm ? T("অ্যাকাউন্ট খুললে একটা Student ID আর PIN পাবেন। পরে যেকোনো ফোন থেকে নাম্বার + PIN দিয়ে ঢুকতে পারবেন।", "You will get a Student ID and a PIN. Later you can sign in from any phone with your number + PIN.") : t("d.loginN")}</p>`}
    </section>`;
  $$("[data-lg]").forEach((b) => (b.onclick = () => { LG = b.dataset.lg; loginView(); }));
  const err = (m) => ($("#lgErr").textContent = m);
  if ($("#inForm")) {
    $("#forgot").onclick = () => { const box = $("#forgotBox"); box.hidden = !box.hidden; $("#forgotWa").href = waLink(T("আমি আমার BFS Student PIN ভুলে গেছি। আমার মোবাইল নাম্বার / Student ID: ", "I forgot my BFS Student PIN. My mobile number / Student ID: ") + $("#inId").value.trim()); };
    $("#inForm").onsubmit = async (e) => {
      e.preventDefault();
      const id = $("#inId").value.trim(), pin = $("#inPin").value.trim(), btn = e.target.querySelector("button.btn-primary");
      if (id.length < 5) return err(T("মোবাইল নাম্বার বা Student ID লিখুন", "Enter your mobile number or Student ID"));
      if (!/^\d{6}$/.test(pin)) return err(T("PIN ৬ সংখ্যার", "The PIN has 6 digits"));
      btn.disabled = true;
      try {
        const r = await BFSCRM.login(id, pin);
        if (!r) { btn.disabled = false; return err(T("নাম্বার/ID বা PIN মিলছে না। আবার দেখে লিখুন।", "Number/ID or PIN does not match.")); }
        loginUser(r.name, r.phone || id, { id: r.sid, pin, crm: true }); BFSCRM.remember(r.sid, pin); LG = null; render();
      } catch (ex) { btn.disabled = false; err(/locked/.test(ex.message) ? T("অনেকবার ভুল PIN দেওয়া হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।", "Too many wrong tries. Please try again in 15 minutes.") : T("সংযোগে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।", "Connection problem. Please try again shortly.")); }
    };
    return;
  }
  $("#lgForm").onsubmit = async (e) => {
    e.preventDefault();
    const n = $("#lgName").value.trim(), p = readPhone("lgPhone");
    if (n.length < 2) return err(t("err.name"));
    if (!validPhone(p)) return err(t("err.phone"));
    const isNew = !(store.get(USERS, {}))[normPhone(p)];
    if (!crm) { loginUser(n, p); if (isNew) sendLead("new_visitor", { name: n, phone: p, source: "dashboard" }); return render(); }
    const btn = e.target.querySelector("button"); btn.disabled = true;
    let r;
    try { r = await BFSCRM.lead({ name: n, phone: p, source: "Website dashboard" }); }       // আগে CRM-এ দেখে নেওয়া: নাম্বারটা নতুন কি না
    catch { btn.disabled = false; return err(T("সংযোগে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।", "Connection problem. Please try again shortly.")); }
    if (r.existing) {                   // এই নাম্বারে আগে থেকেই অ্যাকাউন্ট → PIN ছাড়া ঢোকা যাবে না
      LG = "in"; loginView(T("এই নাম্বারে আগে থেকেই অ্যাকাউন্ট আছে। PIN দিয়ে Sign in করুন (PIN না থাকলে “PIN ভুলে গেছেন?” চাপুন)।", "This number already has an account. Sign in with your PIN (tap “Forgot your PIN?” if you don't have one)."));
      $("#inId").value = p; return;
    }
    const cu = loginUser(n, p, { id: r.sid, pin: r.pin, crm: true }); BFSCRM.remember(r.sid, r.pin);
    if (isNew) { sendLead("new_visitor", { name: cu.name, phone: cu.phone, source: "dashboard" }); fbLead(cu, "dashboard"); }
    LG = null; render();
    if (cu && cu.pin) toast(T(`অ্যাকাউন্ট তৈরি হয়েছে! ID ${cu.id}, PIN ${cu.pin} — লিখে রাখুন`, `Account created! ID ${cu.id}, PIN ${cu.pin} — note it down`));
  };
}
function apptInfo(a) {
  const [hm, ap] = a.time.split(" "); let [h, m] = hm.split(":").map(Number); if (ap === "PM" && h !== 12) h += 12;
  const when = new Date(`${a.date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`), diff = when - new Date();
  const d = new Date(a.date + "T00:00");
  const mode = t({ office: "v.office", phone: "v.phone", video: "v.video" }[a.mode] || "v.office");
  const label = `${mode} — ${DAYS_LONG[LANG][d.getDay()]}, ${num(d.getDate())} ${MONTHS[LANG][d.getMonth()]}, ${isBn() ? num(a.time) : a.time}`;
  if (diff < 0) return { label, left: null };
  const dd = Math.floor(diff / 864e5), hh = Math.floor((diff % 864e5) / 36e5);
  return { label, left: dd > 0 ? t("d.left", { d: num(dd), h: num(hh) }) : t("d.leftH", { h: num(hh) }) };
}
function render() {
  const u = getUser();
  if (!u) return loginView();
  const lvl = eduKey(u.eduLevel) || eduKey(u.elig?.inp?.edu);
  const DOCS = lvl ? DOCS_BY_LEVEL[lvl] : [];
  const docs = u.docs || {}, docDone = DOCS.filter((d) => docs[d.id]).length;
  const DOC_CHECKLIST = DOCS.length ? DOCS : [null];
  const tasks = [
    ["t.profile", true], ["t.elig", !!u.elig, "eligibility.html"], ["t.quiz", !!u.quiz, "eligibility.html#quiz"],
    ["t.save", (u.saved || []).length > 0, "universities.html"], ["t.book", !!u.appt, "visit.html"], ["t.docs", docDone === DOC_CHECKLIST.length],
  ];
  const pct = Math.round((tasks.filter((x) => x[1]).length / tasks.length) * 100);
  const stage = u.appt ? 1 : 0, ap = u.appt ? apptInfo(u.appt) : null;
  const saved = ALLPROGS.filter((p) => (u.saved || []).includes(p.id));
  $("#dash").innerHTML = `
    <section class="d-hero card">
      <div class="d-ring" style="--v:${pct}"><div><b>${num(pct)}%</b><small>${t("d.ready")}</small></div></div>
      <div><span class="kicker">${t("d.hi")}</span><h1>${esc(u.name || "")}</h1>
        <p class="uid">${t("d.uid")}: <b>${esc(u.id || "")}</b></p><p class="muted" style="margin:.2em 0">${icon("phone")} ${esc(u.phone)}${lvl ? ` · ${icon("cap")} ${esc(EDU_LABEL[lvl])}` : u.eduLevel === "parent" ? ` · ${t("gate.parent")}` : ""}</p>
        <p style="margin:0">${pct < 100 ? t("d.go") : t("d.done")}</p></div>
      <button class="btn btn-line sm d-out" id="logout">${t("d.logout")}</button>
    </section>
    ${window.BFSCRM ? `<a class="d-file" href="${BFSCRM.portalUrl()}">
      <span class="d-file-ic">📂</span>
      <span class="d-file-tx"><b>${isBn() ? "আমার ফাইলের অবস্থা দেখুন" : "See my file status"}</b>
        <small>${isBn() ? "আবেদন, ভিসা, EMGS, কাগজপত্র, পেমেন্ট আর IELTS ক্লাস — অফিস যা আপডেট করে, এখানে সাথে সাথে দেখবেন" : "Application, visa, EMGS, documents, payments and IELTS class — live from our office"}</small>
        <span class="d-file-id">ID: <b>${esc(u.id || "…")}</b>${u.pin ? ` · PIN: <b>${esc(u.pin)}</b>` : ""}</span><span class="d-emgs" id="dEmgs" hidden></span></span>
      <span class="d-file-go">${icon("arrow")}</span></a>
    ${u.pin ? `<p class="mini muted" style="margin:-8px 0 18px">${isBn() ? "ID আর PIN লিখে রাখুন — অন্য ফোন থেকে ঢুকতে লাগবে।" : "Note your ID and PIN — you need them on another device."}</p>` : `<p class="mini muted" style="margin:-8px 0 18px">${isBn() ? "PIN জানা না থাকলে আপনার counsellor-এর কাছ থেকে নিন।" : "If you don't have a PIN, ask your counsellor."}</p>`}` : ""}
    <section class="d-next ${u.appt ? "has" : ""}">
      ${u.appt ? `<div><span class="kicker">${t("d.apptK")}</span><h2>${esc(ap.label)}</h2><p>${ap.left ? icon("clock") + " <b>" + ap.left + "</b>" : t("d.past")}</p><p class="mini">${t("v.bring")}</p></div>
        <div class="d-next-act"><a class="btn btn-gold" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CONFIG.mapQuery)}">${icon("map")} ${t("d.dir")}</a><a class="btn btn-ghost" href="visit.html">${t("d.change")}</a></div>`
      : `<div><span class="kicker">${t("d.nextK")}</span><h2>${t("d.nextT")}</h2><p>${t("d.nextS")}</p><p class="mini">${icon("map")} ${esc(L(CONFIG.address))}</p></div>
        <div class="d-next-act"><a class="btn btn-gold btn-lg" href="visit.html">${icon("calendar")} ${t("d.bookNow")}</a></div>`}
    </section>
    <div class="d-grid">
      <section class="card d-box"><h3>${t("d.todo")}</h3>
        <ul class="tasks">${tasks.map(([k, done, href]) => `<li class="${done ? "done" : ""}"><span>${done ? icon("check") : ""}</span>${href && !done ? `<a href="${href}">${t(k)} →</a>` : t(k)}</li>`).join("")}</ul></section>
      <section class="card d-box"><h3>${t("d.eligT")}</h3>
        ${u.elig ? `<div class="d-elig"><div class="gauge sm" style="--v:${u.elig.score}"><div><b>${num(u.elig.score)}%</b></div></div>
          <div><p>${t("d.eligL")}</p><div class="pill-list">${u.elig.levels.map((l) => `<span>${L(LEVEL_NAME[l]) || l}</span>`).join("")}</div>
          <p class="mini muted">${esc(L(FIELDS[u.elig.inp.field]) || t("e.any"))}</p></div></div>
          <a href="eligibility.html" class="btn btn-line sm">↺ ${t("e.again")}</a>`
        : `<p class="muted">${t("d.eligNo")}</p><a href="eligibility.html" class="btn btn-primary sm">${icon("target")} ${t("d.check")}</a>`}
        ${u.quiz ? `<p style="margin:16px 0 0;padding-top:12px;border-top:1px dashed var(--line)">${icon("puzzle")} ${t("d.quizR")}: <b>${esc(L(FIELDS[u.quiz.best]))}</b></p>` : ""}</section>
      <section class="card d-box"><h3>${t("d.docsT")} <small>${num(docDone)}/${num(DOCS.length)}</small></h3>
        <div class="dlevel"><b>${t("d.level")}:</b><div class="chips" id="lvChips" style="margin:0">${Object.entries(EDU_LABEL).map(([k, v]) => `<button type="button" data-v="${k}" class="${lvl === k ? "on" : ""}">${v}</button>`).join("")}</div></div>
        ${DOCS.length ? `<div class="bar"><span style="width:${(docDone / DOCS.length) * 100}%"></span></div>
        <div class="docs">${DOCS.map((d) => `<label><input type="checkbox" data-doc="${d.id}" ${docs[d.id] ? "checked" : ""}> <span>${esc(L(d.t))}<span class="${d.req ? "req" : "opt"}">${t(d.req ? "d.req" : "d.opt")}</span></span></label>`).join("")}</div>
        ${lvl === "ssc" ? `<p class="mini muted">${t("d.docsN")}</p>` : ""}` : `<p class="muted">${t("d.levelPick")}</p>`}</section>
      <section class="card d-box"><h3>${t("d.savedT")} <small>${num(saved.length)}</small></h3>
        ${saved.length ? `<ul class="saved">${saved.map((p) => `<li><div data-prog="${p.id}" role="button" tabindex="0" style="cursor:pointer"><b>${esc(p.name)}</b><span>${esc(UNI[p.uni].name)} · ${feeText(p)} (${t("c.vary")})</span></div><button data-rm="${p.id}" aria-label="remove">${icon("x")}</button></li>`).join("")}</ul>
          <a class="btn btn-gold sm" target="_blank" rel="noopener" href="${waLink(saved.map((p) => "• " + p.name + " — " + UNI[p.uni].name).join("\n") + `\n\n— ${u.name} (${u.phone})`)}">${icon("chat")} ${t("d.savedAsk")}</a>`
        : `<p class="muted">${t("d.savedNo")}</p><a href="universities.html" class="btn btn-primary sm">${t("d.browse")}</a>`}</section>
    </div>
    <section class="card d-box"><h3>${t("d.journey")}</h3>
      <div class="journey">${JOURNEY.map((j, i) => `<div class="j ${i < stage ? "done" : i === stage ? "now" : ""}"><span>${i < stage ? icon("check") : num(i + 1)}</span><b>${esc(L(j.t))}</b><p>${esc(L(j.d))}</p></div>`).join("")}</div>
      <p class="mini muted" style="margin-top:14px">${t("d.local")}</p></section>`;
  /* EMGS % (ফি জমা হলে) — CRM না পেলে কিছু দেখায় না, পেজ ঠিকই চলে */
  if (window.BFSCRM && BFSCRM.emgs && u.id && u.pin) BFSCRM.emgs(u.id, u.pin).then((e) => {
    const el = $("#dEmgs"); if (!el || !e) return;
    el.innerHTML = !e.show ? (isBn() ? "EMGS: প্রসেসিং চলছে" : "EMGS: in progress") : e.percent != null ? `EMGS <b>${num(e.percent)}%</b><i><em style="width:${Math.max(0, Math.min(100, e.percent))}%"></em></i>${e.status ? `<small>${esc(e.status)}</small>` : ""}` : (isBn() ? "EMGS: এখনো শুরু হয়নি" : "EMGS: not started yet");
    el.hidden = false;
  });
  $("#logout").onclick = () => { store.del(CUR); if (window.BFSCRM) BFSCRM.forget(); LG = "in"; render(); };   // লগআউটের পর Sign in / Sign up দুটোই দেখায়
  $$("[data-doc]").forEach((c) => c.addEventListener("change", () => { const d = { ...(getUser().docs || {}) }; d[c.dataset.doc] = c.checked; updateUser({ docs: d }); render(); }));
  $("#lvChips")?.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { updateUser({ eduLevel: b.dataset.v }); render(); } });
  $$("[data-rm]").forEach((b) => b.addEventListener("click", () => { updateUser({ saved: (getUser().saved || []).filter((x) => x !== b.dataset.rm) }); render(); }));
}
document.addEventListener("DOMContentLoaded", render);
document.addEventListener("bfs:lang", render);
