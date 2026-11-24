/* ===== Eligibility check + Subject quiz ===== */
const E = { step: 1, last: null };
const eVal = (name) => $(`#eligForm .chips[data-name="${name}"]`).dataset.val;
const QUIZ_LEVELS = { ssc: ["F", "D"], hsc: ["B", "F", "D"], diploma: ["B"], bachelor: ["M"], master: ["P", "M"] };

function drawElig() {
  $("#engChips").innerHTML = Object.entries(ENGLISH_TESTS).map(([k, x]) => `<button type="button" data-v="${k}" class="${eVal("eng") === k ? "on" : ""}">${esc(L(x.label))}</button>`).join("");
  const grp = $("#group").value;
  if (eVal("field") && !fieldOk(grp, eVal("field"))) delete $("#fieldChips").dataset.val;   // গ্রুপ বদলালে অমিল বিষয় বাদ
  $("#fieldChips").innerHTML = Object.keys(FIELDS).filter((k) => k !== "english").map((k) => fieldOk(grp, k)
    ? `<button type="button" data-v="${k}" class="${eVal("field") === k ? "on" : ""}">${esc(L(FIELDS[k]))}</button>`
    : `<button type="button" data-v="${k}" class="locked" disabled title="${esc(t("e.locked"))}">${esc(L(FIELDS[k]))}</button>`).join("") +
    `<button type="button" data-v="any" class="${eVal("field") === "any" ? "on" : ""}">${t("e.any")}</button>`;
  [1, 2, 3, 4].forEach((i) => ($("#sl" + i).textContent = (isBn() ? "ধাপ " : "Step ") + num(i) + " / " + num(4)));
  $("#ePrev").innerHTML = `← ${t("e.prev")}`;
  $("#eNext").innerHTML = E.step === 4 ? `${icon("target")} ${t("e.show")}` : `${t("e.next")} ${icon("arrow")}`;
}
function eGo(d) {
  if (d > 0) { const err = eCheck(E.step); if (err) return toast(err); if (!getUser()) return needUser(() => eGo(d)); if (E.step === 4) return eResult(); }
  E.step += d;
  $$(".estep").forEach((s) => s.classList.toggle("on", +s.dataset.step === E.step));
  $$(".sb").forEach((s, i) => s.classList.toggle("on", i < E.step));
  $("#ePrev").hidden = E.step === 1;
  drawElig();
}
function eCheck(step) {
  if (step === 1) {
    if (!eVal("edu")) return t("e.errEdu");
    const g = parseFloat($("#gpa").value), sc = +$("#gpaScale").value;
    if (!(g > 0 && g <= sc)) return t("e.errGpa", { m: num(sc) });
  }
  if (step === 2) {
    const e = eVal("eng"); if (!e) return t("e.errPick");
    if (ENGLISH_TESTS[e].min != null && !(parseFloat($("#engScore").value) > 0)) return t("e.errScore");
  }
  if (step === 3 && !eVal("field")) return t("e.errPick");
  if (step === 4 && !eVal("budget")) return t("e.errPick");
  return "";
}

function readInp() {
  return { edu: eVal("edu"), gpa: parseFloat($("#gpa").value), scale: +$("#gpaScale").value, group: $("#group").value,
    eng: eVal("eng"), score: parseFloat($("#engScore").value) || 0, field: eVal("field"), budget: +eVal("budget"), when: $("#when").value };
}
function eResult(silent) {
  const inp = E.last || readInp(); E.last = inp;
  const r = evaluate(inp), u = getUser();
  if (!silent) {
    updateUser({ eduLevel: inp.edu, elig: { inp, score: r.score, levels: r.levels.filter((l) => l.tag !== "extra").map((l) => l.lv), progs: r.progs.map((p) => p.id), date: new Date().toISOString() } });
    sendLead("eligibility_check", { name: u?.name, phone: u?.phone, education: inp.edu, gpa: `${inp.gpa}/${inp.scale}`, group: inp.group, english: `${inp.eng} ${inp.score || ""}`, field: inp.field, budget_rm_per_year: inp.budget, when: inp.when, score: r.score });
  }
  const tag = { ok: ["check", "e.ok"], maybe: ["clock", "e.maybe"], extra: ["spark", "e.extra"] };
  const nm = u?.name ? u.name.split(" ")[0] : "";
  $("#eligForm").hidden = true; $("#stepsBar").hidden = true;
  const box = $("#eligResult"); box.hidden = false;
  box.innerHTML = `
    <div class="res-top">
      <div class="gauge" style="--v:${r.score}"><div><b>${num(r.score)}%</b><small>${t("e.match")}</small></div></div>
      <div><h3>${esc(isBn() ? (nm ? nm + ", " : "") + t("e.good", { n: "" }) : t("e.good", { n: nm ? ", " + nm : "" }))}</h3><p class="muted" style="margin:0">${t("e.goodS")}</p></div>
    </div>
    <div class="res-levels">${r.levels.map((l) => `<div class="lvl ${l.tag}"><b>${L(LEVEL_NAME[l.lv])}</b><br><span class="st">${icon(tag[l.tag][0])} ${t(tag[l.tag][1])}</span><p>${t(l.why)}</p></div>`).join("")}</div>
    <ul class="res-notes">${r.notes.map((n) => `<li>${icon("check")}<span>${Array.isArray(n) ? t(n[0], n[1]) : t(n)}</span></li>`).join("")}</ul>
    <h4>${t("e.progs")} (${num(r.total)})</h4>
    <div class="prog-grid">${r.progs.map((p) => progCard(p, { fits: p.fits })).join("") || `<p class="muted">${t("e.noProgs")}</p>`}</div>
    <div class="res-cta"><div><b>${t("e.next1")}</b><p>${t("e.next1s")}</p></div><a href="visit.html?from=elig" class="btn btn-gold btn-lg">${icon("calendar")} ${t("nav.book")}</a></div>
    <p class="center" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn btn-line" id="eAgain">↺ ${t("e.again")}</button><a class="btn btn-line" href="dashboard.html">${icon("user")} ${t("e.dash")}</a></p>
    <p class="mini muted center">${t("e.disc")}</p>`;
  $("#eAgain").onclick = () => { E.last = null; box.hidden = true; $("#eligForm").hidden = false; $("#stepsBar").hidden = false; E.step = 2; eGo(-1); };
  if (!silent) { $("#eligBox").scrollIntoView({ behavior: "smooth", block: "start" }); confetti(); }
}

/* ===== QUIZ ===== */
const Q = { i: -1, picks: [] };
function quizScores() {
  const s = {};
  Q.picks.forEach((k, qi) => { if (k == null) return; const w = QUIZ[qi].a[k][1]; for (const f in w) s[f] = (s[f] || 0) + w[f]; });
  return Object.entries(s).sort((a, b) => b[1] - a[1]);
}
function drawQuiz() {
  const box = $("#quizBox");
  if (Q.i < 0) {
    box.innerHTML = `<div class="q-intro"><div class="q-intro-txt"><span class="kicker">${num(QUIZ.length)} ${isBn() ? "প্রশ্ন · ১ মিনিট" : "questions · 1 minute"}</span>
      <h3 style="font-size:1.5rem">${t("q.T")}</h3><p class="muted">${t("q.S")}</p><button class="btn btn-primary btn-lg" id="qStart">${icon("spark")} ${t("q.start")}</button></div>
      <div class="q-intro-art" aria-hidden="true">${["cap", "book", "star", "globe", "puzzle", "target"].map((n, k) => `<span style="left:${[14, 62, 38, 72, 20, 50][k]}%;top:${[18, 14, 46, 58, 70, 80][k]}%;animation-delay:${k * 0.6}s;opacity:${[1, .7, .9, .6, .8, .5][k]}">${icon(n)}</span>`).join("")}</div></div>`;
    $("#qStart").onclick = () => needUser(() => { Q.i = 0; Q.picks = []; drawQuiz(); });
    return;
  }
  if (Q.i >= QUIZ.length) return quizResult();
  const q = QUIZ[Q.i];
  box.innerHTML = `<div class="q-play">
    <div class="q-top"><span class="q-n">${t("q.of", { a: num(Q.i + 1), b: num(QUIZ.length) })}</span><button class="q-back" id="qBack" ${Q.i === 0 ? "disabled" : ""}>← ${t("q.back")}</button></div>
    <div class="q-prog"><span style="width:${(Q.i / QUIZ.length) * 100}%"></span></div>
    <div class="q-anim"><div class="q-qi">${icon(q.icon)}</div><h3>${esc(L(q.q))}</h3>
    <div class="q-ans">${q.a.map(([txt], k) => `<button type="button" data-k="${k}" class="${Q.picks[Q.i] === k ? "on" : ""}"><kbd>${num(k + 1)}</kbd><span>${esc(L(txt))}</span></button>`).join("")}</div></div>
    <p class="mini muted" style="margin:18px 0 0">${FINE ? t("q.keys") : ""}</p></div>`;
  $("#qBack").onclick = () => { Q.i--; drawQuiz(); };
}
function answer(k) {
  if (Q.i < 0 || Q.i >= QUIZ.length) return;
  Q.picks[Q.i] = k;
  $$(".q-ans button").forEach((b) => b.classList.toggle("on", +b.dataset.k === k));
  setTimeout(() => { Q.i++; drawQuiz(); }, 260);
}
function quizResult(silent) {
  const sc = quizScores(), max = sc[0]?.[1] || 1, best = sc[0]?.[0] || "business";
  const lvls = QUIZ_LEVELS[eduKey(getUser()?.eduLevel)] || ["F", "D", "B"];
  const pool = ALLPROGS.filter((p) => p.field === best && lvls.includes(p.lv));
  const seen = new Set(), progs = (pool.length ? pool : ALLPROGS.filter((p) => p.field === best)).sort((a, b) => costOf(a).first - costOf(b).first)
    .filter((p) => !seen.has(p.uni) && seen.add(p.uni)).slice(0, 6);
  if (!silent) {
    updateUser({ quiz: { best, second: sc[1]?.[0], progs: progs.map((p) => p.id) } });
    const u = getUser(); sendLead("quiz", { name: u?.name, phone: u?.phone, result: best, second: sc[1]?.[0] });
  }
  const share = `${t("q.shareMsg", { f: L(FIELDS[best]) })} ${location.href.split("#")[0]}#quiz`;
  $("#quizBox").innerHTML = `<div class="q-res">
    <div class="badge-big">${icon("cap")}</div><p class="muted" style="margin:0">${t("q.result")}</p><h3>${esc(L(FIELDS[best]))}</h3>
    <div class="q-bars"><p style="font-weight:700;margin-bottom:6px">${t("q.top3")}</p>${sc.slice(0, 3).map(([f, v]) => `<div class="q-bar"><div><span>${esc(L(FIELDS[f]))}</span><span>${num(Math.round((v / max) * 100))}%</span></div><i><span data-w="${(v / max) * 100}"></span></i></div>`).join("")}</div>
    <p style="font-weight:700">${t("q.progs")}</p>
    <div class="prog-grid">${progs.map((p) => progCard(p)).join("")}</div>
    <div class="q-actions"><a href="#eligBox" class="btn btn-primary" id="qToElig">${icon("target")} ${t("q.toElig")}</a>
      <a class="btn btn-line" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(share)}">${icon("send")} ${t("q.share")}</a>
      <button class="btn btn-line" id="qAgain">↺ ${t("q.again")}</button></div></div>`;
  requestAnimationFrame(() => setTimeout(() => $$(".q-bar i span").forEach((s) => (s.style.width = s.dataset.w + "%")), 60));
  $("#qAgain").onclick = () => { Q.i = 0; Q.picks = []; drawQuiz(); };
  $("#qToElig").onclick = () => { E.last = null; $("#eligResult").hidden = true; $("#eligForm").hidden = false; $("#stepsBar").hidden = false; const b = $(`#fieldChips button[data-v="${best}"]`); b && b.click(); };
  if (!silent) confetti();
}

document.addEventListener("DOMContentLoaded", () => {
  drawElig(); drawQuiz();
  $("#group").addEventListener("change", drawElig);
  $$("#eligForm .chips").forEach((c) => chipGroup(c, (v) => {
    if (c.dataset.name === "eng") { const x = ENGLISH_TESTS[v], w = $("#scoreWrap"); w.hidden = x.min == null; if (x.min != null) { const i = $("#engScore"); i.step = x.step; i.max = x.max; i.placeholder = (isBn() ? "যেমন " : "e.g. ") + x.min; } }
    if (c.dataset.name === "edu") $("#gpaScale").value = ["ssc", "hsc"].includes(v) ? "5" : "4";
  }));
  $("#eNext").onclick = () => eGo(1);
  $("#ePrev").onclick = () => eGo(-1);
  $("#quizBox").addEventListener("click", (e) => { const b = e.target.closest(".q-ans button"); if (b) answer(+b.dataset.k); });
  document.addEventListener("keydown", (e) => {
    if (Q.i < 0 || Q.i >= QUIZ.length || /input|select|textarea/i.test(document.activeElement.tagName)) return;
    const k = "1234".indexOf(e.key); if (k >= 0) answer(k);
  });
  bindSave($("#eligResult")); bindSave($("#quizBox"));
});
document.addEventListener("bfs:lang", () => {
  drawElig();
  if (!$("#eligResult").hidden && E.last) eResult(true);
  Q.i >= QUIZ.length ? quizResult(true) : drawQuiz();
});
