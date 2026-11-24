/* ===== Universities page ===== */
let uField = "", pShow = 12, curUni = null, mLevel = "", mQuery = "";
const LV_ORDER = ["E", "C", "F", "D", "B", "M", "P"];

function uniCard(u) {
  const n = (u.programs || []).length;
  return `<button type="button" class="uni tilt" data-uni="${u.id}">
    <div class="uni-logo"><img src="${logoSrc(u.id)}" alt="${esc(u.name)} logo" loading="lazy"></div>
    <div class="uni-b">
      <h3>${esc(u.name)}</h3>
      <span class="city">${icon("map")} ${esc(u.city)}</span>
      <div class="badges">${qsOf(u.id) ? `<span class="badge top">${icon("star")} QS #${num(qsOf(u.id).rank)}</span>` : ""}${u.ct ? `<span class="badge ct">${t("unis.ct")}</span>` : ""}${n ? `<span class="badge fee">${t("unis.count", { n: num(n) })}</span>` : ""}</div>
      <span class="uni-go">${t("unis.info")} ${icon("arrow")}</span>
    </div></button>`;
}
function renderUnis() {
  const q = $("#uSearch").value.toLowerCase().trim();
  const list = UNIVERSITIES.filter((u) => (!uField || u.fields.includes(uField)) && (!q || (u.name + " " + u.city).toLowerCase().includes(q)))
    .sort((a, b) => (b.programs ? 1 : 0) - (a.programs ? 1 : 0));
  $("#uniGrid").innerHTML = list.map(uniCard).join("") +
    `<div class="uni uni-more"><b>${t("unis.more")}</b><p class="muted">${t("unis.moreD")}</p><a class="btn btn-gold sm" target="_blank" rel="noopener" href="${waLink(isBn() ? "অন্য একটি ইউনিভার্সিটি সম্পর্কে জানতে চাই" : "I'd like to ask about another university")}">${icon("chat")} ${t("m.wa")}</a></div>`;
}
function renderFilter() {
  const f = $("#uFilter");
  const fields = Object.keys(FIELDS).filter((k) => k !== "english" && UNIVERSITIES.some((u) => u.fields.includes(k)));
  f.innerHTML = `<button type="button" data-v="" class="${!uField ? "on" : ""}">${t("unis.all")} (${num(UNIVERSITIES.length)})</button>` +
    fields.map((k) => `<button type="button" data-v="${k}" class="${uField === k ? "on" : ""}">${esc(L(FIELDS[k]))}</button>`).join("");
}

/* ---------- modal ---------- */
function openUni(id, push = true) {
  const u = UNI[id]; if (!u) return;
  curUni = u; mLevel = ""; mQuery = "";
  drawModal();
  $("#uModal").hidden = false; document.body.classList.add("locked");
  if (push) history.replaceState(null, "", "#" + id);
  setTimeout(() => $("#mClose")?.focus(), 50);
}
function closeUni() {
  $("#uModal").hidden = true; document.body.classList.remove("locked"); curUni = null;
  history.replaceState(null, "", location.pathname + location.search);
}
/* ইউনিভার্সিটির বিস্তারিত: শুধু নাম, লোগো, লোকেশন, র‍্যাংকিং, Credit Transfer আর কয়টা প্রোগ্রাম */
const qsOf = (id) => { const r = QS_RANK[id]; return !r ? null : typeof r === "string" ? { rank: r } : r; };
function drawModal() {
  const u = curUni; if (!u) return;
  const n = ALLPROGS.filter((p) => p.uni === u.id).length, qs = qsOf(u.id);
  const fact = (ic, label, val, note = "") => `<div class="uf"><span class="uf-ic">${icon(ic)}</span><div><small>${label}</small><b>${val}</b>${note ? `<em>${note}</em>` : ""}</div></div>`;
  $("#mBox").innerHTML = `
    <div class="m-head">
      <div class="m-logo"><img src="${logoSrc(u.id)}" alt=""></div>
      <div><h2 id="mTitle">${esc(u.name)}</h2><p>${t(u.type === "public" ? "m.public" : "m.private")}</p></div>
      <button class="m-x" id="mClose" aria-label="${t("c.close")}">${icon("x")}</button>
    </div>
    <div class="m-body">
      <div class="uni-facts">
        ${fact("map", t("uf.loc"), esc(u.city))}
        ${fact("star", t("uf.rank", { y: QS_YEAR }), qs ? "#" + num(qs.rank) : t("uf.noRank"), qs?.note ? esc(L(qs.note)) : "")}
        ${fact("globe", "Credit Transfer", u.ct ? t("uf.yes") : t("uf.no"), u.ct ? t("uf.ctNote") : "")}
        ${fact("book", t("uf.progs"), n ? t("unis.count", { n: num(n) }) : t("uf.ask"))}
      </div>
      <div class="m-cta">
        <a class="btn btn-primary" href="visit.html?uni=${u.id}">${icon("calendar")} ${t("m.apply")}</a>
        <a class="btn btn-line" target="_blank" rel="noopener" href="${waLink((isBn() ? "আমি জানতে চাই: " : "I'd like to know about: ") + u.name)}">${icon("chat")} ${t("m.wa")}</a>
      </div>
    </div>`;
  $("#mClose").onclick = closeUni;
}
function drawList() {
  const q = mQuery.toLowerCase().trim();
  const progs = ALLPROGS.filter((p) => p.uni === curUni.id && (!mLevel || p.lv === mLevel) && (!q || p.name.toLowerCase().includes(q)));
  const saved = getUser()?.saved || [];
  $("#mList").innerHTML = LV_ORDER.map((l) => {
    const g = progs.filter((p) => p.lv === l); if (!g.length) return "";
    return `<div class="pgroup"><span>${L(LEVEL_NAME[l])}</span><span>${num(g.length)}</span></div>` + g.map((p) => `
      <div class="prow" data-prog="${p.id}" tabindex="0" role="button"><div><div class="pn">${esc(p.name)}</div><div class="pd">${yrs(p.y)} · ${esc(L(FIELDS[p.field]))}</div></div>
        <div class="pf"><b>${feeText(p)}</b><small>${t("pc.first")} ≈ RM ${money(costOf(p).first)} · ${t("c.vary")}</small></div>
        <button class="heart ${saved.includes(p.id) ? "on" : ""}" data-id="${p.id}" aria-label="save" aria-pressed="${saved.includes(p.id)}">${icon("heart")}</button></div>`).join("");
  }).join("") || `<p class="muted" style="padding:18px">${t("unis.none")}</p>`;
}

/* ---------- program search ---------- */
function fillSelects() {
  const keep = (id) => $("#" + id).value;
  const lv = keep("pLevel"), fd = keep("pField"), un = keep("pUni");
  $("#pLevel").innerHTML = `<option value="">${t("unis.allLv")}</option>` + LV_ORDER.map((l) => `<option value="${l}">${L(LEVEL_NAME[l])}</option>`).join("");
  $("#pField").innerHTML = `<option value="">${t("unis.allField")}</option>` + Object.keys(FIELDS).map((k) => `<option value="${k}">${esc(L(FIELDS[k]))}</option>`).join("");
  $("#pUni").innerHTML = `<option value="">${t("unis.allUni")}</option>` + UNIVERSITIES.filter((u) => u.programs).map((u) => `<option value="${u.id}">${esc(u.name)}</option>`).join("");
  $("#pLevel").value = lv; $("#pField").value = fd; $("#pUni").value = un;
}
function renderProgs() {
  const q = $("#pSearch").value.toLowerCase().trim(), lv = $("#pLevel").value, f = $("#pField").value, un = $("#pUni").value;
  const list = ALLPROGS.filter((p) => (!q || p.name.toLowerCase().includes(q)) && (!lv || p.lv === lv) && (!f || p.field === f) && (!un || p.uni === un))
    .sort((a, b) => a.fee - b.fee);
  $("#pCount").textContent = t("unis.found", { n: num(list.length) });
  $("#progGrid").innerHTML = list.slice(0, pShow).map((p) => progCard(p)).join("") || `<p class="muted">${t("unis.none")}</p>`;
  $("#pMore").hidden = list.length <= pShow;
}

function init() {
  $("#uSearchBox").insertAdjacentHTML("afterbegin", icon("search"));
  $("#pSearchBox").insertAdjacentHTML("afterbegin", icon("search"));
  $("#pVary").innerHTML = icon("spark") + `<span>${t("m.varyNote")}</span>`;
  renderFilter(); renderUnis(); fillSelects(); renderProgs();
  chipGroup($("#uFilter"), (v) => { uField = v; renderUnis(); });
  $("#uSearch").addEventListener("input", renderUnis);
  ["pSearch", "pLevel", "pField", "pUni"].forEach((id) => $("#" + id).addEventListener("input", () => { pShow = 12; renderProgs(); }));
  $("#pMore").onclick = () => { pShow += 12; renderProgs(); };
  $("#uniGrid").addEventListener("click", (e) => { const b = e.target.closest("[data-uni]"); if (b) openUni(b.dataset.uni); });
  $("#uModal").addEventListener("click", (e) => { if (e.target.id === "uModal") closeUni(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#uModal").hidden) closeUni(); });
  bindSave($("#progGrid")); bindSave($("#mBox"));
  const h = location.hash.slice(1); if (UNI[h]) openUni(h, false);
}
document.addEventListener("DOMContentLoaded", init);
document.addEventListener("bfs:lang", () => {
  $("#pVary").innerHTML = icon("spark") + `<span>${t("m.varyNote")}</span>`;
  renderFilter(); renderUnis(); fillSelects(); renderProgs(); if (curUni) drawModal();
});
