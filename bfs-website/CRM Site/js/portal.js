/* ===== Student portal — student নিজের ID + PIN দিয়ে নিজের ফাইলের অবস্থা দেখে। প্রতি ১ মিনিটে নিজে আপডেট হয় ===== */
(() => {
const CRM = window.CRM, { S, K, lab, tone } = CRM;
const { esc, $, fmtD, money, pill, daysTo } = CRM.ui;
const root = document.getElementById("sp"), C = window.CRM_CONFIG || {}, KEY = "bfs-portal";
const STEPS = [["new", "যোগাযোগ শুরু"], ["counselled", "কাউন্সেলিং সম্পন্ন"], ["docs_pending", "কাগজপত্র জমা"], ["applied", "বিশ্ববিদ্যালয়ে আবেদন জমা"], ["offer", "Offer Letter পাওয়া গেছে"], ["visa", "ভিসা প্রসেসিং"], ["visa_approved", "ভিসা অনুমোদিত"], ["departed", "বিদেশে যাত্রা"]];
const NOW = { new: ["👋", "আমরা আপনার তথ্য পেয়েছি", "শীঘ্রই আপনার counsellor যোগাযোগ করবেন।"], contacted: ["📞", "আপনার সাথে যোগাযোগ হয়েছে", "পরের ধাপ: অফিসে এসে বা ফোনে কাউন্সেলিং।"], counselled: ["🎓", "কাউন্সেলিং সম্পন্ন", "পরের ধাপ: প্রয়োজনীয় কাগজপত্র জমা দিন।"], docs_pending: ["📄", "কাগজপত্র জমা চলছে", "নিচের তালিকায় যেগুলো বাকি সেগুলো দ্রুত দিন।"], applied: ["📨", "বিশ্ববিদ্যালয়ে আবেদন জমা হয়েছে", "এখন বিশ্ববিদ্যালয়ের উত্তরের অপেক্ষা।"], offer: ["🎉", "Offer Letter পাওয়া গেছে", "পরের ধাপ: tuition deposit ও ভিসার কাগজ।"], visa: ["🛂", "ভিসা প্রসেসিং চলছে", "নিচে আপনার ভিসার তারিখগুলো দেখুন।"], visa_approved: ["✅", "অভিনন্দন! ভিসা অনুমোদিত", "পরের ধাপ: টিকিট ও যাত্রার প্রস্তুতি।"], visa_rejected: ["⚠️", "ভিসা অনুমোদন হয়নি", "চিন্তা করবেন না — পরবর্তী করণীয় জানতে counsellor-এর সাথে কথা বলুন।"], departed: ["✈️", "আপনি বিদেশে পৌঁছেছেন", "শুভকামনা! যেকোনো প্রয়োজনে আমাদের জানান।"], lost: ["📁", "আপনার ফাইলটি বন্ধ আছে", "আবার শুরু করতে চাইলে অফিসে যোগাযোগ করুন।"] };
const APP_BN = { draft: "প্রস্তুতি চলছে", submitted: "জমা হয়েছে", conditional: "Conditional Offer", unconditional: "Unconditional Offer", deposit: "Deposit দেওয়া হয়েছে", cas: "চূড়ান্ত কাগজ এসেছে", rejected: "গৃহীত হয়নি", withdrawn: "প্রত্যাহার" };
const VISA_BN = { preparing: "ফাইল প্রস্তুত হচ্ছে", submitted: "জমা হয়েছে", biometrics: "Biometrics সম্পন্ন", awaiting: "সিদ্ধান্তের অপেক্ষায়", approved: "অনুমোদিত", rejected: "অনুমোদন হয়নি", reapplying: "আবার আবেদন চলছে" };
const head = (inner, out) => `<header class="sp-top"><div class="sp-in"><div class="sp-brand"><img src="assets/bfs-logo-white.png" alt=""><div><b>${esc(C.orgName || "BFS")}</b><small>Student Portal</small></div><a class="btn btn-ghost sm" style="margin-left:auto;color:#fff;border:1.5px solid rgba(255,255,255,.35)" href="${esc(C.websiteUrl ? C.websiteUrl.replace(/\/+$/, "") + "/index.html" : "../index.html")}">← Website</a>${out ? '<button class="btn btn-gold sm" id="spOut" style="margin-left:8px">Log out</button>' : ""}</div>${inner}</div></header>`;
let timer;

function login(msg = "") {
  clearInterval(timer);
  root.innerHTML = `${head('<div class="sp-hello"><h1>আপনার ফাইলের অবস্থা দেখুন</h1><p>আবেদন, ভিসা, কাগজপত্র ও পেমেন্ট — সব এক জায়গায়।</p></div>')}
    <div class="sp-login"><div class="card"><form id="spf"><label class="fld"><span>মোবাইল নাম্বার বা Student ID</span><input id="spi" required placeholder="017XXXXXXXX বা BFS1001" autocomplete="username"></label>
    <label class="fld"><span>PIN (৬ সংখ্যা)</span><input id="spp" required inputmode="numeric" maxlength="6" type="password" autocomplete="current-password"></label><p class="err">${esc(msg)}</p><button class="btn btn-primary">দেখুন</button>
    <p class="muted mini" style="margin:0;text-align:center">PIN ভুলে গেলে আপনার counsellor-কে বলুন, নতুন PIN দিয়ে দেবেন।</p></form></div></div>`;
  $("#spf").onsubmit = async (e) => { e.preventDefault(); const b = e.target.querySelector("button"); b.disabled = true; await load($("#spi").value, $("#spp").value, true); b.disabled = false; };
}
async function load(sid, pin, first) {
  let d;
  try { d = await S.portal(sid, pin); }
  catch (ex) { if (first || /locked/.test(ex.message)) login(/locked/.test(ex.message) ? "অনেকবার ভুল PIN দেওয়া হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।" : "সংযোগে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।"); return; }   // পরে সংযোগ গেলে পুরোনো তথ্যই থাকে
  if (!d) return login("নাম্বার/ID বা PIN মিলছে না।");
  sessionStorage.setItem(KEY, JSON.stringify([sid, pin]));
  show(d);
  clearInterval(timer); timer = setInterval(() => { if (!document.hidden && !root.querySelector("label.busy")) load(sid, pin); }, 60000);
}
/* IELTS / English কোর্সের ছাত্রদের জন্য: ক্লাসের সময়, Zoom লিংক, homework, attendance, result */
const POST = { homework: ["📝", "Homework", "amber"], notice: ["📢", "নোটিশ", "blue"], material: ["📚", "পড়ার জিনিস", "green"] };
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || "")) ? String(u) : "");
function classCard(c) {
  const sc = CRM.scheme(c.course), pct = c.classes ? Math.round((c.present / c.classes) * 100) : null, link = safeUrl(c.link);
  const hw = c.posts.filter((p) => p.kind === "homework" && p.due && daysTo(p.due) >= 0);
  return `<div class="card sp-class"><span class="kicker">${esc(c.course || "Course")}</span><h3 style="margin-top:2px">${esc(c.batch || "")}</h3>
    <div class="sp-row"><span>ক্লাসের দিন</span><b>${esc(c.schedule || "—")}</b></div>
    <div class="sp-row"><span>সময়</span><b>${esc(c.time || "—")}</b></div>
    ${c.room ? `<div class="sp-row"><span>রুম</span><b>${esc(c.room)}</b></div>` : ""}
    ${c.teacher ? `<div class="sp-row"><span>টিচার</span><b>${esc(c.teacher)}</b></div>` : ""}
    ${c.start ? `<div class="sp-row"><span>কোর্স</span><b>${fmtD(c.start)} → ${fmtD(c.end)}</b></div>` : ""}
    ${link ? `<p style="margin:12px 0 0"><a class="btn btn-primary" target="_blank" rel="noopener" href="${esc(link)}">🎥 অনলাইন ক্লাসে যোগ দিন</a></p>` : ""}
    ${hw.length ? `<div class="note sp-due">⏰ ${hw.map((p) => `<b>${esc(p.title)}</b> — জমা ${fmtD(p.due)}`).join("<br>")}</div>` : ""}
    ${pct != null ? `<h4 style="margin:16px 0 6px">উপস্থিতি</h4><div class="prog"><i style="width:${pct}%"></i></div><p class="mini muted" style="margin:6px 0 0">${c.classes}টা ক্লাসের মধ্যে ${c.present}টায় উপস্থিত (${pct}%)${c.absent.length ? ` · অনুপস্থিত: ${c.absent.map(fmtD).join(", ")}` : ""}</p>` : ""}
    ${c.results.length ? `<h4 style="margin:16px 0 6px">টেস্টের ফলাফল</h4>${c.results.map((r) => `<div class="sp-row"><div><b>${esc(r.kind)}</b><small>${fmtD(r.date)} · ${sc.parts.map((p, i) => `${p} ${r[["l", "r", "w", "s"][i]]}`).join(" · ")}</small></div><b class="sp-band">${r.overall}</b></div>`).join("")}` : ""}
    ${c.posts.length ? `<h4 style="margin:16px 0 6px">Homework ও নোটিশ</h4>${c.posts.map((p) => { const k = POST[p.kind] || POST.notice, u = safeUrl(p.link); return `<div class="sp-post"><div>${k[0]} <b>${esc(p.title)}</b> ${pill(k[1], k[2])}${p.due ? ` <span class="mini ${daysTo(p.due) < 0 ? "muted" : ""}">জমা ${fmtD(p.due)}</span>` : ""}</div>${p.body ? `<p>${esc(p.body)}</p>` : ""}${u ? `<a href="${esc(u)}" target="_blank" rel="noopener">লিংক খুলুন ↗</a>` : ""}<small>${fmtD(p.at)}</small></div>`; }).join("")}` : ""}
  </div>`;
}
/* EMGS (মালয়েশিয়া): EMGS ফি জমা হলে, আর পাসপোর্ট নাম্বার থাকলে, নিজের EMGS অগ্রগতি দেখার কার্ড */
const EMGS_URL = "https://visa.educationmalaysia.gov.my/emgs/application/searchForm/";
function emgsCard(e) {
  if (!e) return "";
  const fee = (e.uni && S.emgsOf(e.uni)) || null, rm = fee && fee.rm ? fee.rm : e.custom_rm;
  const feeRow = rm ? `<div class="sp-row"><span>EMGS / ভিসা ফি${e.uni ? `<small>${esc(e.uni)}</small>` : ""}</span><b>RM ${money(rm).replace(/^৳\s?/, "")}${fee && fee.approx ? " (আনুমানিক)" : ""}</b></div>` : "";
  if (!e.paid) return `<div class="card"><h3>EMGS (মালয়েশিয়ার ভিসা)</h3>${feeRow}<p class="muted" style="margin:8px 0 0">EMGS ফি জমা হলে এখানে আপনার EMGS অগ্রগতি দেখা যাবে।</p></div>`;
  if (!e.passport) return `<div class="card"><h3>EMGS (মালয়েশিয়ার ভিসা) ${pill("ফি জমা হয়েছে ✓", "green")}</h3>
    <p style="margin:0 0 8px">EMGS-এ আপনার অগ্রগতি দেখতে পাসপোর্ট নাম্বার দিন:</p>
    <form id="ppf" class="sp-pp"><input id="ppn" required placeholder="যেমন A01234567" maxlength="12" autocomplete="off" style="text-transform:uppercase"><button class="btn btn-primary sm">সেভ করুন</button></form></div>`;
  if (e.show === false) return `<div class="card"><h3>EMGS (মালয়েশিয়ার ভিসা) ${pill("ফি জমা হয়েছে ✓", "green")}</h3><p style="margin:0">আপনার EMGS প্রসেসিং চলছে। কোনো আপডেট এলে আপনার counsellor সরাসরি জানাবেন — প্রশ্ন থাকলে নিচে Call বা WhatsApp করুন।</p></div>`;
  const pct = e.found === false ? null : e.percent == null ? null : Math.max(0, Math.min(100, +e.percent));
  return `<div class="card sp-emgs" id="sp-emgs"><h3>EMGS অগ্রগতি ${pill("ফি জমা হয়েছে ✓", "green")}</h3>
    ${pct != null ? `<div class="emgs-bar"><i style="width:${pct}%"></i></div><p style="margin:0 0 8px"><b style="font-size:20px">${pct}%</b> ${e.note ? `· ${esc(e.note)}` : ""}</p>` : `<p class="muted" style="margin:0 0 8px">${e.found === false ? "EMGS-এ এখনো আপনার আবেদন দেখা যাচ্ছে না — university আবেদন জমা দিলে এখানে % আসবে।" : e.note ? esc(e.note) : "আপনার counsellor EMGS-এ আবেদন জমা দিলে অগ্রগতি এখানে আসবে।"}</p>`}
    ${e.checked ? `<p class="mini muted" style="margin:-4px 0 8px">EMGS থেকে শেষ দেখা: ${fmtD(e.checked)}</p>` : ""}
    ${feeRow}
    <div class="sp-row"><span>পাসপোর্ট নাম্বার</span><b class="mono">${esc(e.passport)}</b></div>
    <div class="sp-row"><span>Nationality</span><b>Bangladesh</b></div>
    ${e.submitted_on ? `<div class="sp-row"><span>EMGS-এ জমা</span><b>${fmtD(e.submitted_on)}</b></div>` : ""}
    <p style="margin:12px 0 0"><button class="btn btn-gold" id="emgsGo">EMGS-এ নিজে দেখুন ↗</button></p>
    <p class="muted mini" style="margin:6px 0 0">বোতাম চাপলে পাসপোর্ট নাম্বার কপি হয়ে EMGS-এর পেজ খুলবে। সেখানে Passport number ঘরে paste করুন, Nationality-তে <b>Bangladesh</b> বাছুন, শর্তে টিক দিয়ে Search চাপুন।</p></div>`;
}
/* আপনার counsellor — উপরেই, এক চাপে ফোন বা WhatsApp */
function coun(d, wa) {
  if (!d.counsellor) return `<div class="card sp-coun"><span class="sp-av">?</span><div><small>আপনার counsellor</small><b>শীঘ্রই একজন counsellor আপনার দায়িত্ব নেবেন</b></div></div>`;
  const ini = String(d.counsellor.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return `<div class="card sp-coun"><span class="sp-av">${esc(ini)}</span><div><small>আপনার counsellor</small><b>${esc(d.counsellor.name)}</b></div>
    ${d.counsellor.phone ? `<span class="sp-coun-act"><a class="btn btn-line sm" href="tel:${esc(d.counsellor.phone)}">📞 Call</a><a class="btn btn-primary sm" target="_blank" rel="noopener" href="https://wa.me/${esc(wa)}">WhatsApp</a></span>` : ""}</div>`;
}
/* এখন আপনার করণীয় — যা বাকি আছে, সেটা এক জায়গায় */
function todo(d, miss, due, v) {
  const L = [];
  if (miss.length) L.push(["📄", `${miss.length}টা কাগজ এখনো দেননি`, miss.slice(0, 3).join(", ") + (miss.length > 3 ? " …" : ""), "#sp-docs", "ফাইল দিন"]);
  if (due > 0) L.push(["💳", `বাকি টাকা ${money(due)}`, "অফিসে বা counsellor-এর দেওয়া মাধ্যমে জমা দিন", "#sp-pay", "দেখুন"]);
  if (d.emgs && d.emgs.paid && !d.emgs.passport) L.push(["🛂", "পাসপোর্ট নাম্বার দিন", "EMGS-এর অগ্রগতি দেখতে লাগবে", "#sp-emgs", "দিন"]);
  if (v) [["Appointment", v.appointment_date], ["Biometrics", v.biometrics_date], ["Interview", v.interview_date]].forEach(([l, dt]) => { const n = daysTo(dt); if (dt && n >= 0 && n <= 30) L.push(["📅", `${l} — ${fmtD(dt)}`, n === 0 ? "আজ!" : `${n} দিন বাকি`, "#sp-visa", "দেখুন"]); });
  (d.classes || []).forEach((c) => c.posts.filter((p) => p.kind === "homework" && p.due && daysTo(p.due) >= 0).forEach((p) => L.push(["📝", `Homework: ${p.title}`, `জমা ${fmtD(p.due)}`, "", ""])));
  return L.length ? `<div class="card sp-todo"><h3>এখন আপনার করণীয়</h3>${L.map(([e, t, sub, href, btn]) => `<div class="sp-todo-row"><span class="e">${e}</span><div><b>${esc(t)}</b><small>${esc(sub)}</small></div>${href ? `<a class="btn btn-line sm" href="${href}">${btn}</a>` : ""}</div>`).join("")}</div>`
    : `<div class="card sp-todo ok"><h3>এখন আপনার করণীয়</h3><p style="margin:0">✓ আপাতত আপনার কিছু করার নেই — আমরা আপনার ফাইল নিয়ে কাজ করছি।</p></div>`;
}
function show(d) {
  const rank = STEPS.findIndex((x) => x[0] === (d.status === "contacted" ? "new" : d.status === "visa_rejected" ? "visa" : d.status)), now = NOW[d.status] || NOW.new;
  const base = CRM.docTypes({ status: d.status, test_type: d.test_type }), need = [...base, ...d.docs.map((x) => x.type).filter((t) => !base.includes(t))], st = (t) => (d.docs.find((x) => x.type === t) || {}).status || "pending";
  const got = need.filter((t) => ["uploaded", "verified"].includes(st(t))), miss = need.filter((t) => !["uploaded", "verified"].includes(st(t))), due = d.pay.total - d.pay.paid, v = d.visa;
  const vd = v ? [["জমার তারিখ", v.submitted_on], ["Appointment", v.appointment_date], ["Biometrics", v.biometrics_date], ["Interview", v.interview_date], ["সিদ্ধান্ত", v.decision_date]].filter((x) => x[1]) : [];
  const wa = d.counsellor && String(d.counsellor.phone || "").replace(/\D/g, "").replace(/^0/, "880");
  root.innerHTML = `${head(`<div class="sp-hello"><h1>${esc(d.name)}</h1><p>Student ID: ${esc(d.sid)}${d.country ? " · " + esc(d.country) : ""}</p></div>`, true)}
  <div class="sp-body">
    ${CRM.ui.guide("portal", ["উপরে <b>বর্তমান অবস্থা</b> আর <b>যাত্রাপথ</b>-এ দেখুন আপনার ফাইল কোন ধাপে আছে। অফিস কিছু আপডেট করলে প্রতি মিনিটে নিজে থেকে এখানে আসে।", "<b>কাগজপত্র</b>-এ যেটা বাকি তার পাশে <b>ফাইল দিন</b> চাপুন, ফাইল বা মোবাইলে তোলা ছবি দিন। অফিস যাচাই করলে “যাচাই সম্পন্ন ✓” দেখাবে।", "IELTS/English কোর্সে থাকলে ক্লাসের সময়, <b>অনলাইন ক্লাসে যোগ দিন</b> বোতাম আর homework এখানেই পাবেন।", "মালয়েশিয়ার ক্ষেত্রে EMGS ফি জমা হলে <b>EMGS অগ্রগতি</b> কার্ড আসবে।", "কোনো প্রশ্ন থাকলে নিচে counsellor-কে Call বা WhatsApp করুন।"])}
    <div class="card sp-now"><span class="dot">${now[0]}</span><div><span class="kicker">বর্তমান অবস্থা</span><div class="big">${now[1]}</div><span class="muted">${now[2]}</span></div></div>
    ${coun(d, wa)}
    <div class="sp-tiles">
      <a href="#sp-docs" class="${miss.length ? "warn" : "ok"}"><b>${got.length}/${need.length}</b><span>কাগজ জমা</span></a>
      ${d.pay.total > 0 ? `<a href="#sp-pay" class="${due > 0 ? "warn" : "ok"}"><b>${due > 0 ? money(due) : "✓"}</b><span>${due > 0 ? "বাকি টাকা" : "সব টাকা পরিশোধ"}</span></a>` : ""}
      <a href="#sp-apps"><b>${d.apps.length}</b><span>বিশ্ববিদ্যালয়ে আবেদন</span></a>
      ${d.emgs && d.emgs.paid && d.emgs.show !== false && d.emgs.percent != null ? `<a href="#sp-emgs" class="ok"><b>${Math.round(d.emgs.percent)}%</b><span>EMGS অগ্রগতি</span></a>` : v ? `<a href="#sp-visa"><b>${esc(VISA_BN[v.status] || v.status)}</b><span>ভিসা</span></a>` : ""}
    </div>
    ${todo(d, miss, due, v)}
    ${d.status === "lost" ? "" : `<div class="card"><h3>আপনার যাত্রাপথ</h3><ol class="steps">${STEPS.map(([k, l], i) => `<li class="${i < rank ? "done" : i === rank ? (d.status === "visa_rejected" ? "bad" : rank === STEPS.length - 1 ? "done" : "now") : ""}"><i>${i < rank || (i === rank && rank === STEPS.length - 1) ? "✓" : i + 1}</i>${l}${i === rank && d.status === "visa_rejected" ? " — অনুমোদন হয়নি" : ""}</li>`).join("")}</ol></div>`}
    ${(d.classes || []).map(classCard).join("")}
    ${d.apps.length ? `<div class="card" id="sp-apps"><h3>বিশ্ববিদ্যালয়ে আবেদন</h3>${d.apps.map((a) => `<div class="sp-row"><div><b>${esc(a.university || "")}</b><small>${esc([a.course, a.intake, a.country].filter(Boolean).join(" · "))}</small></div>${pill(APP_BN[a.status] || a.status, tone(K.APP_STATUS, a.status))}</div>`).join("")}</div>` : ""}
    ${v ? `<div class="card" id="sp-visa"><h3>ভিসা <span>${pill(VISA_BN[v.status] || v.status, tone(K.VISA_STATUS, v.status))}</span></h3>${vd.map(([l, dt]) => { const n = daysTo(dt); return `<div class="sp-row"><span>${l}</span><b>${fmtD(dt)}${n > 0 && n <= 30 ? ` ${pill(n + " দিন বাকি", "amber")}` : n === 0 ? ` ${pill("আজ", "red")}` : ""}</b></div>`; }).join("") || '<p class="muted">তারিখ ঠিক হলে এখানে দেখা যাবে।</p>'}</div>` : ""}
    ${emgsCard(d.emgs)}
    <div class="card" id="sp-docs"><h3>কাগজপত্র <span class="muted mini">${got.length} / ${need.length} জমা হয়েছে</span></h3><div class="prog" style="margin-bottom:6px"><i style="width:${(got.length / need.length) * 100}%"></i></div>
      <p class="muted mini" style="margin:0 0 6px">নিজেই ফাইল দিতে পারবেন — PDF, JPG বা PNG, সর্বোচ্চ ${CRM.MAXMB} MB। মোবাইলে কাগজের ছবি তুলেও দেওয়া যায়।</p>
      ${need.map((t) => { const x = st(t), lab = { pending: ["এখনো দেননি", "amber"], uploaded: ["জমা হয়েছে · যাচাই চলছে", "blue"], verified: ["যাচাই সম্পন্ন ✓", "green"], rejected: ["আবার দিন", "red"] }[x];
        return `<div class="sp-row"><div><b>${esc(t)}</b><small>${pill(lab[0], lab[1])}</small></div>${x === "verified" ? "" : `<label class="btn ${x === "uploaded" ? "btn-line" : "btn-primary"} sm">${x === "uploaded" ? "আবার দিন" : "ফাইল দিন"}<input type="file" hidden accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf" data-up="${esc(t)}"></label>`}</div>`; }).join("")}
    </div>
    ${d.pay.total > 0 ? `<div class="card" id="sp-pay"><h3>পেমেন্ট</h3><div class="sp-row"><span>মোট</span><b>${money(d.pay.total)}</b></div><div class="sp-row"><span>পরিশোধ করা হয়েছে</span><b style="color:var(--ok)">${money(d.pay.paid)}</b></div><div class="sp-row"><span>বাকি</span><b style="color:${due > 0 ? "var(--bad)" : "var(--ok)"}">${due > 0 ? money(due) : "কিছু বাকি নেই ✓"}</b></div></div>` : ""}
    ${d.departure_date ? `<div class="card"><h3>যাত্রা</h3><div class="sp-row"><span>তারিখ</span><b>${fmtD(d.departure_date)}</b></div>${d.flight ? `<div class="sp-row"><span>ফ্লাইট</span><b>${esc(d.flight)}</b></div>` : ""}</div>` : ""}
    
  </div><p class="sp-foot">প্রতি মিনিটে নিজে থেকে আপডেট হয় · সর্বশেষ ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>`;
  root.querySelectorAll("[data-up]").forEach((inp) => (inp.onchange = async () => {
    const f = inp.files[0], lab = inp.closest("label"); if (!f) return;
    const [sid, pin] = JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || "[]");
    lab.classList.add("busy"); lab.firstChild.textContent = "তোলা হচ্ছে…";
    try { await S.portalUpload(sid, pin, inp.dataset.up, f); CRM.ui.toast("ফাইল জমা হয়েছে ✓ আমাদের অফিস যাচাই করবে", "ok"); load(sid, pin); }
    catch (ex) { CRM.ui.toast(ex.message === "locked" ? "অনেকবার ভুল PIN — ১৫ মিনিট পরে চেষ্টা করুন" : ex.message, "bad"); lab.classList.remove("busy"); lab.firstChild.textContent = "ফাইল দিন"; inp.value = ""; }
  }));
  const eg = $("#emgsGo"); if (eg) eg.onclick = async () => { try { await navigator.clipboard.writeText(d.emgs.passport); CRM.ui.toast("পাসপোর্ট নাম্বার কপি হয়েছে — EMGS পেজে paste করুন", "ok"); } catch (x) {} window.open(EMGS_URL, "_blank", "noopener"); };
  const pf = $("#ppf"); if (pf) pf.onsubmit = async (ev) => { ev.preventDefault(); const [sid, pin] = JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || "[]");
    try { await S.portalPassport(sid, pin, $("#ppn").value); CRM.ui.toast("পাসপোর্ট নাম্বার সেভ হয়েছে ✓", "ok"); load(sid, pin); } catch (ex) { CRM.ui.toast(ex.message, "bad"); } };
  $("#spOut").onclick = () => { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); login(); };
}
S.init().catch((e) => console.warn(e)).then(() => { const saved = JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || "null"); if (saved) load(saved[0], saved[1], true); else login(); });
})();
