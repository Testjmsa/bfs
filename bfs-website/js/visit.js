/* ===== Office visit booking ===== */
const B = { view: new Date(), date: null, time: null, mode: "office", done: null };
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hour24 = (s) => { const [hm, ap] = s.split(" "); let [h, m] = hm.split(":").map(Number); if (ap === "PM" && h !== 12) h += 12; return [h, m]; };
const slotLabel = (s) => {
  if (!isBn()) return s;
  const h = hour24(s)[0];
  return (h < 12 ? "সকাল " : h < 15 ? "দুপুর " : "বিকাল ") + num(s.split(" ")[0]);
};

function drawStatic() {
  $("#perks").innerHTML = [["doc", "v.p1"], ["star", "v.p2"], ["target", "v.p3"], ["family", "v.p4"]]
    .map(([i, k], n) => `<div class="perk tilt reveal d${n % 3}"><span class="pi">${icon(i)}</span><b>${t(k)}</b><span>${t(k + "d")}</span></div>`).join("");
  $("#modeChips").innerHTML = [["office", "building", "v.office", true], ["phone", "phone", "v.phone"], ["video", "chat", "v.video"]]
    .map(([v, i, k, best]) => `<button type="button" data-v="${v}" class="${B.mode === v ? "on" : ""}">${icon(i)} ${t(k)}${best ? `<em>${t("v.best")}</em>` : ""}</button>`).join("");
  $("#bSubmit").innerHTML = icon("check") + `<span>${t("v.confirm")}</span>`;
  $("#oAddr").innerHTML = `<a href="${mapUrl()}" target="_blank" rel="noopener">${icon("map")}<span>${esc(L(CONFIG.address))}</span></a>`;
  $("#oPhones").innerHTML = CONFIG.phoneDisplay.map((p) => `<a href="tel:${p.replace(/[^+\d]/g, "")}">${icon("phone")} ${p}</a>`).join("");
  $("#dirBtn").innerHTML = icon("map") + `<span>${t("v.dir")}</span>`;
  $("#dirBtn").href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CONFIG.mapQuery)}`;
  if (!$("#map").src) $("#map").src = `https://www.google.com/maps?q=${encodeURIComponent(CONFIG.mapQuery)}&output=embed`;
  reveal();
}
/* Eligibility / কুইজের রেজাল্ট থেকে প্রোগ্রাম */
function allMatched() {
  const u = getUser(); if (!u) return [];
  let list = [];
  if (u.elig?.inp) { try { list = evaluate(u.elig.inp).all; } catch { list = (u.elig.progs || []).map((id) => PROG[id]).filter(Boolean); } }
  (u.quiz?.progs || []).forEach((id) => PROG[id] && !list.includes(PROG[id]) && list.push(PROG[id]));
  const want = PROG[new URLSearchParams(location.search).get("prog")];
  if (want) list = [want, ...list.filter((p) => p.id !== want.id)];
  return list;
}
const matchedProgs = () => allMatched().slice(0, 6);
const hasCheck = () => { const u = getUser(); return !!(u?.elig || u?.quiz); };
function drawSummary() {
  const box = $("#vSum"), u = getUser();
  if (!hasCheck()) {
    box.innerHTML = `<div class="vary-note" style="margin-bottom:22px">${icon("target")}<span><b>${t("v.bannerT")}</b> — ${t("v.bannerS")}</span></div>`;
    return;
  }
  const ps = matchedProgs();
  box.innerHTML = `<div class="v-sum card"><span class="kicker">${t("v.sumK")}</span><h3>${t("v.sumT")}</h3><p class="muted">${t("v.sumS")}</p>
    <div class="pill-list" style="margin-bottom:14px">${u.elig ? `<span>${t("v.levels")}: ${u.elig.levels.map((l) => L(LEVEL_NAME[l])).join(", ")}</span><span>${t("e.match")}: ${num(u.elig.score)}%</span>` : ""}${u.quiz ? `<span>${t("v.fromQuiz")}: ${esc(L(FIELDS[u.quiz.best]))}</span>` : ""}</div>
    <div class="prog-grid">${ps.map((p) => progCard(p)).join("")}</div>
    <p style="margin:14px 0 0"><a href="eligibility.html" class="btn btn-line sm">↺ ${t("v.redo")}</a></p></div>`;
  reveal();
}

/* ---------- বুকিং কনফার্মের পপআপ: আগে Eligibility, তারপর একটা ইউনিভার্সিটি বাছাই ---------- */
const BK = { step: "check", uni: null, form: {} };
function bkModal() {
  let m = $("#bkModal");
  if (!m) {
    m = document.createElement("div"); m.id = "bkModal"; m.className = "modal bk-modal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.hidden = true;
    document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-bk-close]")) closeBk(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !m.hidden) closeBk(); });
  }
  return m;
}
function openBk() { if (!getUser()) return needUser(openBk);
  BK.step = hasCheck() && allMatched().length ? "pick" : "check"; BK.uni = null; drawBk(); bkModal().hidden = false; document.body.classList.add("locked"); }
function closeBk() { bkModal().hidden = true; if (!$(".modal:not([hidden])")) document.body.classList.remove("locked"); }
function uniGroups() {
  const g = new Map();
  allMatched().forEach((p) => { if (!g.has(p.uni)) g.set(p.uni, []); g.get(p.uni).push(p); });
  return [...g.entries()].map(([id, ps]) => ({ id, ps: ps.sort((a, b) => costOf(a).first - costOf(b).first) }))
    .sort((a, b) => costOf(a.ps[0]).first - costOf(b.ps[0]).first).slice(0, 10);
}
function drawBk() {
  const m = bkModal(), u = getUser(), ek = eduKey(u?.eduLevel) || "hsc", f = BK.form;
  if (BK.step === "check") {
    const opt = (o, sel) => Object.entries(o).map(([k, v]) => `<option value="${k}" ${sel === k ? "selected" : ""}>${esc(v)}</option>`).join("");
    m.innerHTML = `<div class="modal-box bk-box">
      <div class="bk-hero"><span class="kicker">${t("bk.k1")}</span><h2>${t("bk.t1")}</h2><p>${t("bk.s1")}</p><button class="m-x" data-bk-close aria-label="${t("c.close")}">${icon("x")}</button></div>
      <form class="bk-body" id="bkForm" novalidate>
        <div class="bk-grid">
          <label class="fld"><span>${t("bk.edu")}</span><select id="kEdu">${opt(EDU_LABEL, f.edu || ek)}</select></label>
          <label class="fld"><span>GPA / CGPA</span><div class="row2"><input id="kGpa" type="number" step="0.01" min="0" max="5" inputmode="decimal" value="${f.gpa || ""}" placeholder="${isBn() ? "যেমন" : "e.g."} 4.25"><select id="kScale"><option value="5">/ 5</option><option value="4">/ 4</option></select></div></label>
          <label class="fld"><span>${t("e.group")}</span><select id="kGroup">${opt({ science: t("g.science"), commerce: t("g.commerce"), arts: t("g.arts"), other: t("g.other") }, f.group)}</select></label>
          <label class="fld"><span>${t("bk.eng")}</span><div class="row2"><select id="kEng">${Object.entries(ENGLISH_TESTS).map(([k, x]) => `<option value="${k}" ${f.eng === k ? "selected" : ""}>${esc(L(x.label))}</option>`).join("")}</select><input id="kScore" type="number" step="0.5" inputmode="decimal" placeholder="${t("bk.score")}" value="${f.score || ""}"></div></label>
          <label class="fld"><span>${t("bk.field")}</span><select id="kField">${Object.keys(FIELDS).filter((k) => k !== "english").map((k) => `<option value="${k}" ${f.field === k && fieldOk(f.group || "science", k) ? "selected" : ""} ${fieldOk(f.group || "science", k) ? "" : "disabled"}>${esc(L(FIELDS[k]))}</option>`).join("")}<option value="any" ${f.field === "any" ? "selected" : ""}>${t("e.any")}</option></select></label>
          <label class="fld"><span>${t("bk.budget")}</span><select id="kBudget">${opt({ 15000: t("b.3"), 25000: t("b.5"), 40000: t("b.8"), 60000: t("b.12"), 999999: t("b.99") }, String(f.budget || 25000))}</select></label>
        </div>
        <p class="err" id="kErr" role="alert"></p>
        <button class="btn btn-primary btn-lg wide" type="submit">${icon("target")} ${t("bk.go")}</button>
        <div class="bk-or">${t("bk.or")}</div>
        <a class="btn btn-line wide" href="eligibility.html#quiz">${icon("puzzle")} ${t("bk.quiz")} →</a>
      </form></div>`;
    $("#kScale").value = String(f.scale || (["ssc", "hsc"].includes(f.edu || ek) ? 5 : 4));
    // গ্রুপ অনুযায়ী বিষয়: অমিল বিষয় দেখা যাবে, বেছে নেওয়া যাবে না
    $("#kGroup").onchange = () => { const g = $("#kGroup").value; $$("#kField option").forEach((o) => (o.disabled = !fieldOk(g, o.value))); if ($("#kField").selectedOptions[0]?.disabled) $("#kField").value = "any"; };
    $("#kGroup").onchange();
    $("#kEdu").onchange = () => ($("#kScale").value = ["ssc", "hsc"].includes($("#kEdu").value) ? "5" : "4");
    $("#bkForm").onsubmit = (e) => {
      e.preventDefault();
      const inp = { edu: $("#kEdu").value, gpa: parseFloat($("#kGpa").value), scale: +$("#kScale").value, group: $("#kGroup").value,
        eng: $("#kEng").value, score: parseFloat($("#kScore").value) || 0, field: $("#kField").value, budget: +$("#kBudget").value, when: "booking" };
      BK.form = inp;
      if (!(inp.gpa > 0 && inp.gpa <= inp.scale)) return ($("#kErr").textContent = t("e.errGpa", { m: num(inp.scale) }));
      const r = evaluate(inp);
      if (!r.all.length) return ($("#kErr").textContent = t("bk.none"));
      updateUser({ eduLevel: inp.edu, elig: { inp, score: r.score, levels: r.levels.filter((l) => l.tag !== "extra").map((l) => l.lv), progs: r.progs.map((p) => p.id), date: new Date().toISOString() } });
      sendLead("eligibility_check", { name: getUser()?.name, phone: getUser()?.phone, education: inp.edu, gpa: `${inp.gpa}/${inp.scale}`, field: inp.field, budget_rm_per_year: inp.budget, score: r.score, source: "booking_popup" });
      BK.step = "pick"; drawBk(); drawSummary(); confetti();
    };
    return;
  }
  const groups = uniGroups();
  m.innerHTML = `<div class="modal-box bk-box">
    <div class="bk-hero"><span class="kicker">${t("bk.k2")}</span><h2>${t("bk.t2")}</h2><p>${t("bk.s2")}</p><button class="m-x" data-bk-close aria-label="${t("c.close")}">${icon("x")}</button></div>
    <div class="bk-body">
      <div class="uni-pick" role="radiogroup">${groups.map(({ id, ps }) => { const un = UNI[id], c = costOf(ps[0]); return `
        <button type="button" class="uni-opt ${BK.uni === id ? "on" : ""}" data-u="${id}" role="radio" aria-checked="${BK.uni === id}">
          <img src="${logoSrc(id)}" alt=""><span><b>${esc(un.name)}</b><small>${esc(ps[0].name)}</small><small>${t("bk.progs", { n: num(ps.length) })}</small></span>
          <span class="cost"><small>${t("bk.from")}</small><b>RM ${money(c.first)}</b></span></button>`; }).join("")}</div>
      <p class="err" id="kErr2" role="alert"></p>
      <button class="btn btn-primary btn-lg wide" id="bkConfirm">${icon("check")} ${t("bk.confirm")}</button>
      <p class="center" style="margin:12px 0 0"><button class="q-back" id="bkRedo">↺ ${t("bk.redo")}</button></p>
    </div></div>`;
  $$(".uni-opt", m).forEach((b) => (b.onclick = () => { BK.uni = b.dataset.u; $$(".uni-opt", m).forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); }); }));
  $("#bkRedo").onclick = () => { BK.step = "check"; drawBk(); };
  $("#bkConfirm").onclick = () => { if (!BK.uni) return ($("#kErr2").textContent = t("bk.pickErr")); closeBk(); finishBooking(BK.uni); };
}

/* ---------- বুকিং শেষ — WhatsApp-এ শুধু বাছাই করা ইউনিভার্সিটি ---------- */
function finishBooking(uniId) {
  const name = $("#bName").value.trim(), phone = readPhone("bPhone");
  const lvSel = { ssc: "fd", hsc: "b", diploma: "b", bachelor: "m", master: "p" }[eduKey(getUser()?.eduLevel)];
  if (lvSel && !B.lvTouched) $("#bLevel").value = lvSel;
  const lvTxt = $("#bLevel").selectedOptions[0].textContent, un = UNI[uniId];
  const ps = allMatched().filter((p) => p.uni === uniId).sort((a, b) => costOf(a).first - costOf(b).first).slice(0, 3);
  const appt = { date: B.date, time: B.time, mode: B.mode, level: $("#bLevel").value, levelTxt: lvTxt, note: $("#bNote").value.trim(), uni: uniId, progs: ps.map((p) => p.id), booked: new Date().toISOString() };
  fbLead(loginUser(name, phone), "booking"); updateUser({ appt });
  sendLead("appointment", { name, phone: normPhone(phone), date: appt.date, time: appt.time, mode: appt.mode, level: lvTxt, university: un.name, programs: ps.map((p) => p.name).join(" | "), note: appt.note });
  const msg = `${t("v.msg")}\n\n${t("v.name")}: ${name}\n${t("v.mobile")}: ${phone}\n${pickedTxt()}\n${t("v.level")} ${lvTxt}\n\n${t("bk.uni")}: ${un.name}\n` +
    ps.map((p) => `• ${p.name} (${t("v.first")} ≈ RM ${Math.round(costOf(p).first).toLocaleString("en-US")})`).join("\n") + (appt.note ? `\n\n${appt.note}` : "");
  B.done = { name, msg }; drawDone();
  window.open(waLink(msg), "_blank", "noopener");
  confetti();
}function drawCal() {
  const v = B.view, y = v.getFullYear(), m = v.getMonth();
  $("#calTitle").textContent = `${MONTHS[LANG][m]} ${num(y)}`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const max = new Date(today); max.setDate(max.getDate() + 60);
  const first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
  let h = DAYS[LANG].map((d) => `<span class="dh">${d}</span>`).join("") + "<span></span>".repeat(first);
  for (let d = 1; d <= n; d++) {
    const dt = new Date(y, m, d), off = !CONFIG.officeDays.includes(dt.getDay()) || dt < today || dt > max;
    h += `<button type="button" data-d="${ymd(dt)}" ${off ? "disabled" : ""} class="${B.date === ymd(dt) ? "on" : ""} ${ymd(dt) === ymd(today) ? "today" : ""}">${num(d)}</button>`;
  }
  $("#calGrid").innerHTML = h;
  $("#calPrev").disabled = y === today.getFullYear() && m === today.getMonth();
  $("#calNext").disabled = new Date(y, m + 1, 1) > max;
}
function drawSlots() {
  if (!B.date) { $("#slots").innerHTML = `<p>${icon("calendar")} ${t("v.firstDate")}</p>`; return; }
  const now = new Date(), isToday = B.date === ymd(now);
  $("#slots").innerHTML = `<p>${t("v.chooseTime")}</p>` + CONFIG.officeSlots.map((s) => {
    const past = isToday && hour24(s)[0] <= now.getHours() + 1;
    return `<button type="button" data-t="${s}" ${past ? "disabled" : ""} class="${B.time === s ? "on" : ""}">${slotLabel(s)}</button>`;
  }).join("");
}
function pickedTxt() {
  const mode = t({ office: "v.office", phone: "v.phone", video: "v.video" }[B.mode]);
  if (!B.date) return t("v.none");
  const d = new Date(B.date + "T00:00");
  return `${mode} — ${DAYS_LONG[LANG][d.getDay()]}, ${num(d.getDate())} ${MONTHS[LANG][d.getMonth()]}${B.time ? `, ${slotLabel(B.time)}` : ` (${t("v.pickTime")})`}`;
}
function drawPicked() { const p = $("#picked"); if (!p) return; p.innerHTML = icon(B.time ? "check" : "calendar") + `<span>${pickedTxt()}</span>`; p.classList.toggle("ok", !!B.time); }
function gcalLink(name) {
  const [h, m] = hour24(B.time), pad = (x) => String(x).padStart(2, "0"), d = B.date.replace(/-/g, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("BFS Free Counselling — " + name)}&dates=${d}T${pad(h)}${pad(m)}00/${d}T${pad(h + 1)}${pad(m)}00&ctz=Asia/Dhaka&location=${encodeURIComponent(CONFIG.address.en)}&details=${encodeURIComponent(STR["v.bring"][1] + " · " + CONFIG.phoneDisplay[0])}`;
}
function drawDone() {
  const { name, msg } = B.done;
  $("#bookForm").innerHTML = `<div class="booked"><span class="badge-big">${icon("check")}</span><h3>${t("v.done")}</h3><p class="muted">${esc(pickedTxt())}</p>
    <a class="btn btn-primary btn-lg wide" target="_blank" rel="noopener" href="${waLink(msg)}">${WA_SVG.replace('width="28" height="28"', 'width="20" height="20"')} ${t("v.sendWa")}</a>
    <a class="btn btn-line wide" target="_blank" rel="noopener" href="${gcalLink(name)}">${icon("calendar")} ${t("v.gcal")}</a>
    <a class="btn btn-line wide" href="dashboard.html">${icon("user")} ${t("nav.dash")}</a>
    <p class="mini muted">${t("v.bring")}</p></div>`;
}

document.addEventListener("DOMContentLoaded", () => {
  drawStatic(); drawSummary(); drawCal(); drawSlots(); drawPicked();
  document.addEventListener("bfs:login", drawSummary);
  const q = new URLSearchParams(location.search), uni = UNI[q.get("uni")], pr = PROG[q.get("prog")];
  if (pr) $("#bNote").value = (isBn() ? "পড়তে চাই: " : "Interested in: ") + pr.name + " — " + UNI[pr.uni].name;
  if (uni) $("#bNote").value = (isBn() ? "পড়তে চাই: " : "Interested in: ") + uni.name;
  const lvMap = { ssc: "fd", hsc: "b", diploma: "b", bachelor: "m", master: "p" };
  if ($("#bPhoneBox")) $("#bPhoneBox").outerHTML = phoneInput("bPhone");
  const u = getUser(); const fill = () => { const x = getUser(); if (x) { $("#bName").value ||= x.name || ""; if (!$("#bPhone").value && x.phone) $("#bPhone").closest(".ph-in").outerHTML = phoneInput("bPhone", x.phone); const ek = eduKey(x.eduLevel); if (lvMap[ek]) $("#bLevel").value = lvMap[ek]; } };
  fill(); document.addEventListener("bfs:login", fill);
  $("#bLevel").addEventListener("change", () => (B.lvTouched = true));
  if (u?.elig && !$("#bNote").value) $("#bNote").value = `Eligibility ${u.elig.score}% — ${L(FIELDS[u.elig.inp.field]) || ""}`;
  $("#calPrev").onclick = () => { B.view = new Date(B.view.getFullYear(), B.view.getMonth() - 1, 1); drawCal(); };
  $("#calNext").onclick = () => { B.view = new Date(B.view.getFullYear(), B.view.getMonth() + 1, 1); drawCal(); };
  $("#calGrid").onclick = (e) => { const b = e.target.closest("button[data-d]"); if (!b || b.disabled) return; B.date = b.dataset.d; B.time = null; drawCal(); drawSlots(); drawPicked(); };
  $("#slots").onclick = (e) => { const b = e.target.closest("button[data-t]"); if (!b || b.disabled) return; B.time = b.dataset.t; drawSlots(); drawPicked(); };
  chipGroup($("#modeChips"), (v) => { B.mode = v; drawPicked(); });
  $("#bookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!B.date || !B.time) { toast(t("v.errDate")); $("#calGrid").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const name = $("#bName").value.trim(), phone = readPhone("bPhone");
    if (name.length < 2) return toast(t("err.name"));
    if (!validPhone(phone)) return toast(t("err.phone"));
    fbLead(loginUser(name, phone), "booking");
    openBk();   // আগে Eligibility (না করা থাকলে), তারপর ইউনিভার্সিটি বাছাই
  });
});
document.addEventListener("bfs:lang", () => { if ($("#bkModal") && !$("#bkModal").hidden) drawBk(); drawStatic(); drawSummary(); drawCal(); drawSlots(); B.done ? drawDone() : drawPicked(); });
