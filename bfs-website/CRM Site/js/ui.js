/* ===== ছোট ছোট সহায়ক ফাংশন: আইকন, ফর্ম, টেবিল, মোডাল, Excel/PDF ===== */
(() => {
const CRM = (window.CRM = window.CRM || { views: {}, forms: {} });

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (s, r = document) => r.querySelector(s);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const today = () => ymd(new Date());
const asDate = (d) => new Date(String(d).length <= 10 ? d + "T00:00" : d);
const addDays = (n, from) => { const d = from ? asDate(from) : new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const daysTo = (d) => (d ? Math.round((asDate(String(d).slice(0, 10)) - asDate(today())) / 864e5) : null);
const fmtD = (d) => (d ? asDate(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
const fmtDT = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const money = (n) => "৳" + Math.round(Number(n) || 0).toLocaleString("en-IN");
const sum = (a, f = (x) => x) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0);
const countBy = (a, f) => a.reduce((m, x) => { const k = f(x) || "—"; m[k] = (m[k] || 0) + 1; return m; }, {});

const P = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.1.8 3.5 2.8 3.5 5.7"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  plane: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 4-4"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  book: '<path d="M5 4h13a1 1 0 0 1 1 1v15H7a2 2 0 0 1-2-2z"/><path d="M5 18a2 2 0 0 1 2-2h12M9 8h6"/>',
  check: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.4c-.5-.9-1.5-1.4-2.8-1.4-1.7 0-2.9.8-2.9 2 0 2.9 5.9 1.2 5.9 4.100 0 1.200-1.300 2-3 2-1.400 0-2.500-.6-3-1.500M12 6v2M12 16v2"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>',
  bell: '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.500 2h-15z"/><path d="M10 20.500a2 2 0 0 0 4 0"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.500"/><path d="m20 20-4.300-4.300"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  down: '<path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14"/>',
  up: '<path d="M12 16V5m0 0-4 4m4-4 4 4M5 20h14"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  out: '<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/>',
  phone: '<path d="M5 4h3.500l1.500 4-2 1.500a11 11 0 0 0 6.500 6.500l1.500-2 4 1.500V19a1.500 1.500 0 0 1-1.500 1.500C10.500 20.500 3.500 13.500 3.500 5.500A1.500 1.500 0 0 1 5 4z"/>',
  clock: '<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
  edit: '<path d="M4 20h4l10.500-10.500a2.100 2.100 0 0 0-3-3L5 17z"/><path d="m14 8 3 3"/>',
  trash: '<path d="M4 7h16M9 7V4.500h6V7M6.500 7l1 13h9l1-13"/>',
  eye: '<path d="M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12z"/><circle cx="12" cy="12" r="2.800"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  print: '<path d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="6" rx="1"/>',
};
const ic = (n) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;

const pill = (text, tone = "") => `<span class="pill ${tone}">${esc(text)}</span>`;
function av(name, size = "", photo = "") {
  if (photo) return `<img class="av ${size}" src="${esc(photo)}" alt="">`;
  const n = String(name || "?").trim(), ini = n.split(/\s+/).map((w) => [...w][0] || "").slice(0, 2).join("").toUpperCase();
  let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `<span class="av ${size}" style="--h:${h}" aria-hidden="true">${esc(ini)}</span>`;
}
function toast(msg, kind = "") {
  const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg;
  $("#toasts").appendChild(t); setTimeout(() => t.remove(), 3600);
}
const rerender = () => window.dispatchEvent(new Event("crm:render"));
const go = (hash) => { if (location.hash === hash) rerender(); else location.hash = hash; };

/* ---------- modal ---------- */
function modal(title, body, { wide, locked } = {}) {
  const el = document.createElement("div"); el.className = "modal-bg";
  el.innerHTML = `<div class="modal ${wide ? "wide" : ""}" role="dialog" aria-modal="true"><div class="modal-h"><h3>${esc(title)}</h3><button class="x" data-x aria-label="Close">${ic("x")}</button></div><div class="modal-b">${body}</div></div>`;
  const close = () => el.remove();
  if (locked) el.querySelector("[data-x]").remove();
  else { el.addEventListener("mousedown", (e) => { if (e.target === el) close(); }); el.querySelector("[data-x]").onclick = close; }
  document.body.appendChild(el);
  return { el, body: el.querySelector(".modal-b"), close };
}
function confirmBox(msg, okLabel = "Yes, continue") {
  return new Promise((res) => {
    const m = modal("Please confirm", `<p>${esc(msg)}</p><div class="modal-f"><button class="btn btn-line" data-no>Cancel</button><button class="btn btn-primary" data-yes>${esc(okLabel)}</button></div>`);
    m.body.querySelector("[data-no]").onclick = () => { m.close(); res(false); };
    m.body.querySelector("[data-yes]").onclick = () => { m.close(); res(true); };
  });
}

/* ---------- form builder ---------- */
const normOpts = (o) => (o || []).map((x) => (Array.isArray(x) ? x : [x, x]));
const opts = (o, val) => normOpts(o).map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(val ?? "") ? "selected" : ""}>${esc(l)}</option>`).join("");
const stuLabel = (s) => (s ? `${s.sid} — ${s.name}` : "");
function fieldHTML(f, v) {
  if (f.type === "section") return `<h4 class="fsec">${esc(f.label)}</h4>`;
  const id = "f_" + f.k, req = f.required ? "required" : "", val = v ?? f.def ?? "";
  const lab = `<span>${esc(f.label)}${f.required ? " *" : ""}</span>`, hint = f.hint ? `<small>${esc(f.hint)}</small>` : "";
  if (f.type === "checkbox") return `<label class="fld chk ${f.full ? "full" : ""}"><input type="checkbox" id="${id}" ${val ? "checked" : ""}> <span>${esc(f.label)}</span></label>`;
  if (f.type === "multi") return `<div class="fld full">${lab}<div class="multi" id="${id}">${normOpts(f.options).map(([a, b]) => `<label><input type="checkbox" value="${esc(a)}" ${(val || []).includes(a) ? "checked" : ""}> ${esc(b)}</label>`).join("")}</div></div>`;
  let inp;
  if (f.type === "select") inp = `<select id="${id}" ${req}>${f.blank === false ? "" : '<option value="">—</option>'}${opts(f.options, val)}</select>`;
  else if (f.type === "textarea") inp = `<textarea id="${id}" rows="${f.rows || 3}" ${req}>${esc(val)}</textarea>`;
  else if (f.type === "student") {
    const list = CRM.S.rows("students");
    inp = `<input id="${id}" list="${id}_l" value="${esc(stuLabel(list.find((s) => s.id === val)))}" ${req} placeholder="Type name or ID…" autocomplete="off"><datalist id="${id}_l">${list.map((s) => `<option value="${esc(stuLabel(s))}">`).join("")}</datalist>`;
  } else inp = `<input id="${id}" type="${f.type || "text"}" value="${esc(val)}" ${req} ${f.type === "number" ? `step="${f.step || "any"}" min="${f.min ?? 0}"` : ""} ${f.max != null ? `max="${f.max}"` : ""} placeholder="${esc(f.ph || "")}">`;
  return `<label class="fld ${f.full || f.type === "textarea" ? "full" : ""}">${lab}${inp}${hint}</label>`;
}
const formHTML = (fields, vals = {}) => `<div class="fgrid">${fields.map((f) => fieldHTML(f, vals[f.k])).join("")}</div>`;
function readForm(root, fields) {
  const o = {};
  for (const f of fields) {
    if (f.type === "section") continue;
    const el = root.querySelector("#f_" + f.k); if (!el) continue;
    if (el.dataset.off) { o[f.k] = f.type === "checkbox" ? false : f.type === "multi" ? [] : null; continue; }   // লুকানো ঘর = খালি
    if (f.type === "checkbox") o[f.k] = el.checked;
    else if (f.type === "multi") o[f.k] = [...el.querySelectorAll("input:checked")].map((i) => i.value);
    else if (f.type === "number") o[f.k] = el.value === "" ? null : Number(el.value);
    else if (f.type === "student") {
      const sid = el.value.split(" — ")[0].trim(), s = CRM.S.rows("students").find((x) => x.sid === sid);
      if (!s && (f.required || el.value.trim())) throw new Error("Pick a student from the list");
      o[f.k] = s ? s.id : null;
    } else o[f.k] = el.value.trim() === "" ? null : el.value.trim();
  }
  return o;
}
/* onSave(data, modal) — return false to keep the modal open */
function formModal({ title, fields, values, onSave, wide, saveLabel = "Save", intro = "" }) {
  const m = modal(title, `<form>${intro}${formHTML(fields, values)}<p class="err"></p><div class="modal-f"><button type="button" class="btn btn-line" data-cancel>Cancel</button><button class="btn btn-primary">${esc(saveLabel)}</button></div></form>`, { wide });
  const form = m.body.querySelector("form"), err = m.body.querySelector(".err"), btn = form.querySelector(".btn-primary");
  form.querySelector("[data-cancel]").onclick = m.close;
  form.onsubmit = async (e) => {
    e.preventDefault(); err.textContent = ""; btn.disabled = true;
    try { const r = await onSave(readForm(form, fields), m); if (r !== false) { m.close(); rerender(); } }
    catch (ex) { console.error(ex); err.textContent = ex.message || String(ex); }
    finally { btn.disabled = false; }
  };
  /* এক ঘরের উত্তর অনুযায়ী অন্য ঘর দেখানো/লুকানো (showIf) আর লেবেল বদল (labelIf) */
  const sync = () => {
    const v = {}; fields.forEach((f) => { const el = f.k && form.querySelector("#f_" + f.k); if (el) v[f.k] = el.type === "checkbox" ? el.checked : el.value; });
    fields.forEach((f) => {
      const el = f.k && form.querySelector("#f_" + f.k); if (!el) return;
      const wrap = el.closest(".fld");
      if (f.showIf) { const show = !!f.showIf(v); wrap.hidden = !show; if (show) delete el.dataset.off; else el.dataset.off = "1"; if (f.required || f.reqIf) el.required = show && (f.required || !!f.reqIf(v)); }
      else if (f.reqIf) el.required = !!f.reqIf(v);
      if (f.labelIf || f.reqIf) wrap.querySelector("span").textContent = (f.labelIf ? f.labelIf(v) : f.label) + (el.required ? " *" : "");
      if (f.attrIf) Object.entries(f.attrIf(v) || {}).forEach(([k, val]) => el.setAttribute(k, val));
    });
  };
  if (fields.some((f) => f.showIf || f.labelIf || f.reqIf || f.attrIf)) { form.addEventListener("change", sync); sync(); }
  const first = form.querySelector("input:not([type=checkbox]),select,textarea"); if (first) first.focus();
  return m;
}

/* ---------- table + click delegation ---------- */
function table(cols, rows, { act = "row", empty = "Nothing here yet", max = 400, stat = false } = {}) {
  if (!rows.length) return `<div class="empty">${esc(empty)}</div>`;
  const shown = rows.slice(0, max);
  return `<div class="tbl-wrap"><table class="tbl ${stat ? "static" : ""}"><thead><tr>${cols.map((c) => `<th class="${c.cls || ""}">${esc(c.label)}</th>`).join("")}</tr></thead><tbody>${shown.map((r) => `<tr ${stat ? "" : `data-act="${act}"`} data-id="${esc(r.id ?? "")}">${cols.map((c) => `<td class="${c.cls || ""}">${c.get(r)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>${rows.length > max ? `<p class="muted mini">Showing first ${max} of ${rows.length}. Use search or filters to narrow down.</p>` : ""}`;
}
function on(root, handlers) {
  root.onclick = (e) => { const t = e.target.closest("[data-act]"); if (!t || !root.contains(t)) return; const h = handlers[t.dataset.act]; if (h) h(t, e); };
  root.onchange = (e) => { const t = e.target.closest("[data-ch]"); if (!t) return; const h = handlers["ch:" + t.dataset.ch]; if (h) h(t, e); };
}

/* ---------- export: Excel + PDF (print) ---------- */
function exportXlsx(name, rows, sheet = "Report") {
  if (!rows.length) return toast("Nothing to export", "bad");
  if (window.XLSX) {
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), sheet.slice(0, 30)); XLSX.writeFile(wb, name + ".xlsx");
  } else {
    const keys = Object.keys(rows[0]), q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + [keys.map(q).join(","), ...rows.map((r) => keys.map((k) => q(r[k])).join(","))].join("\n")], { type: "text/csv" }));
    a.download = name + ".csv"; a.click();
  }
  CRM.S.log("export", "report", null, `${name} (${rows.length} rows)`);
}
/* ব্রাউজারের Print → "Save as PDF" — বাংলা লেখাও ঠিকমতো আসে */
function printDoc(title, html) {
  const C = window.CRM_CONFIG || {}, base = new URL(".", location.href).href;
  let fr = $("#printFrame"); if (fr) fr.remove();
  fr = document.createElement("iframe"); fr.id = "printFrame"; fr.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(fr);
  const d = fr.contentWindow.document;
  d.open(); d.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${base}"><title>${esc(title)}</title><style>
@font-face{font-family:"Li Ador Noirrit";src:url("assets/fonts/LiAdorNoirrit-Regular.ttf")}
@font-face{font-family:"Li Ador Noirrit";src:url("assets/fonts/LiAdorNoirrit-Bold.ttf");font-weight:700}
@page{margin:0}*{-webkit-print-color-adjust:exact;print-color-adjust:exact;box-sizing:border-box}
body{font-family:"Plus Jakarta Sans","Li Ador Noirrit",system-ui,sans-serif;color:#1d1a1f;font-size:10.5pt;margin:0;background:#fff}
.hd{display:flex;align-items:center;gap:14px;padding:9mm 14mm 7mm;color:#fff;background:linear-gradient(135deg,#3d0a15 0%,#6a1125 55%,#7a1428 100%);border-bottom:4px solid #c9973f}
.hd img{width:60px}.hd b{font-size:15pt;display:block;line-height:1.15}.hd small{color:#f1d9a6;letter-spacing:.06em}
.hd div:last-child{margin-left:auto;text-align:right;font-size:8.5pt;color:rgba(255,255,255,.82);line-height:1.5}
.bd{padding:8mm 14mm 16mm}
.ft{position:fixed;left:0;right:0;bottom:0;padding:3mm 14mm;font-size:8pt;color:#7a737f;border-top:1px solid #ebe3d9;background:#fbf8f4;display:flex;justify-content:space-between}
h1{font-size:15pt;margin:0 0 3px;color:#7a1428}h1+p{color:#7a737f;margin:0 0 10px}h2{font-size:11.5pt;color:#7a1428;margin:14px 0 6px}
table{width:100%;border-collapse:collapse;font-size:9pt;margin-top:8px}thead{display:table-header-group}tr{break-inside:avoid}
th{background:#7a1428;color:#fff;text-align:left;padding:6px 8px;font-weight:600}td{padding:6px 8px;border-bottom:1px solid #ebe3d9;vertical-align:top}tbody tr:nth-child(even) td{background:#fbf8f4}
.kv{display:grid;grid-template-columns:150px 1fr;gap:6px 12px;margin:12px 0;padding:14px 16px;background:#fbf8f4;border:1px solid #ebe3d9;border-radius:10px}.kv dt{color:#7a737f}.kv dd{margin:0;font-weight:600}
.big{font-size:20pt;font-weight:800;color:#7a1428}.sign{margin-top:60px;display:flex;justify-content:space-between}.sign span{border-top:1px solid #1d1a1f;padding-top:4px;width:180px;text-align:center;font-size:9pt}
.slips{display:grid;grid-template-columns:1fr 1fr;gap:5mm}.slip{border:1.5px dashed #c9973f;border-radius:10px;padding:10px 12px;break-inside:avoid;background:#fff}
.slip b{color:#7a1428;font-size:11pt}.slip small{color:#7a737f;display:block}.slip dl{display:grid;grid-template-columns:70px 1fr;gap:2px 8px;margin:6px 0 0}.slip dt{color:#7a737f}.slip dd{margin:0;font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:10.5pt}
.note{background:#f8efdf;border-left:4px solid #c9973f;padding:8px 12px;border-radius:6px;margin:8px 0}
.warn{background:#fdecea;border-left:4px solid #b3261e;padding:8px 12px;border-radius:6px;margin:8px 0}
b.k{background:#f6e9ea;color:#7a1428;padding:0 5px;border-radius:5px;white-space:nowrap}h2{break-after:avoid}ol,ul{margin:4px 0 8px;padding-left:20px;line-height:1.65}li{margin:2px 0}p{line-height:1.65}
</style></head><body><div class="hd"><img src="assets/bfs-logo-white.png" alt=""><div><b>${esc(C.orgName || "BFS CRM")}</b><small>${esc(C.orgAddress || "")}</small></div><div>${esc(title)}<br>${esc(fmtDT(new Date()))}<br>${esc(CRM.S.me ? CRM.S.me.name : "")}</div></div><div class="bd">${html}</div><div class="ft"><span>${esc(C.orgName || "")} — CRM</span><span>Confidential · for office use only</span></div></body></html>`); d.close();
  setTimeout(() => { fr.contentWindow.focus(); fr.contentWindow.print(); }, 500);
}
const tableHTML = (rows) => { if (!rows.length) return "<p>No data</p>"; const k = Object.keys(rows[0]); return `<table><thead><tr>${k.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${k.map((x) => `<td>${esc(r[x])}</td>`).join("")}</tr>`).join("")}</tbody></table>`; };
function exportPdf(title, rows, sub = "") { if (!rows.length) return toast("Nothing to export", "bad"); printDoc(title, `<h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ""}${tableHTML(rows)}`); CRM.S.log("export", "report", null, `${title} PDF (${rows.length} rows)`); }

/* ছবি ছোট করে (২০০px) সরাসরি রেকর্ডে রাখা হয় — আলাদা ফাইল স্টোরেজ লাগে না */
function shrinkImage(file, size = 200) {
  return new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error("Choose a photo (JPG or PNG)"));
    const img = new Image(); img.onerror = () => rej(new Error("Could not read this photo"));
    img.onload = () => { const c = document.createElement("canvas"), m = Math.min(img.width, img.height); c.width = c.height = size; c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, size, size); URL.revokeObjectURL(img.src); res(c.toDataURL("image/jpeg", 0.82)); };
    img.src = URL.createObjectURL(file);
  });
}
const bars = (pairs) => { const mx = Math.max(1, ...pairs.map((p) => p[1])); return pairs.map(([l, n, txt]) => `<div class="bar"><span>${esc(l)}</span><i><em style="width:${(n / mx) * 100}%"></em></i><b>${esc(txt ?? n)}</b></div>`).join("") || '<p class="muted">No data yet</p>'; };

/* "ব্যবহার নির্দেশিকা" — প্রতিটা পেজের উপরে ছোট ভাঁজ-করা বাক্স। কেউ বন্ধ করলে পরে বন্ধই থাকে (এই ব্রাউজারে) */
const GKEY = "bfs-guide-closed";
const gClosed = () => { try { return JSON.parse(localStorage.getItem(GKEY) || "[]"); } catch (e) { return []; } };
function guide(key, items, title = "ব্যবহার নির্দেশিকা") {
  return `<details class="guide" data-g="${esc(key)}" ${gClosed().includes(key) ? "" : "open"}><summary>📘 ${esc(title)}</summary><ol>${items.map((x) => `<li>${x}</li>`).join("")}</ol></details>`;
}
document.addEventListener("toggle", (e) => {
  const d = e.target; if (!d.matches || !d.matches("details.guide")) return;
  try { const c = gClosed().filter((k) => k !== d.dataset.g); if (!d.open) c.push(d.dataset.g); localStorage.setItem(GKEY, JSON.stringify(c)); } catch (x) {}
}, true);

CRM.ui = { guide, esc, $, ymd, today, addDays, daysTo, fmtD, fmtDT, money, sum, countBy, ic, pill, av, toast, rerender, go, modal, confirmBox, opts, formHTML, readForm, formModal, table, on, exportXlsx, exportPdf, printDoc, shrinkImage, tableHTML, bars, stuLabel };
})();
