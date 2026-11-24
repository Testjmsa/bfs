/* ===== Firebase সংযোগ — staff.js আর apply.js দুটোই এটা ব্যবহার করে ===== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAuth, connectAuthEmulator, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, writeBatch, Timestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// ?emu=1 দিয়ে খুললে কম্পিউটারের লোকাল Firebase (টেস্টের জন্য)
export const EMU = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && (new URLSearchParams(location.search).has("emu") || sessionStorage.getItem("bfs_emu") === "1");
if (EMU) sessionStorage.setItem("bfs_emu", "1");
const cfg = EMU ? { apiKey: "demo-key", authDomain: "demo-bfs.firebaseapp.com", projectId: "demo-bfs", appId: "demo" } : window.FIREBASE_CONFIG || {};
export const READY = !!(cfg.apiKey && cfg.projectId);

export let app, auth, db;
if (READY) {
  app = initializeApp(cfg); auth = getAuth(app); db = getFirestore(app);
  if (EMU) { connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true }); connectFirestoreEmulator(db, "127.0.0.1", 8080); }
}
// স্টাফ নতুন অ্যাকাউন্ট খোলার জন্য আলাদা সংযোগ (নইলে ম্যানেজার নিজেই লগআউট হয়ে যান)
export function secondaryAuth() {
  const a2 = getAuth(initializeApp(cfg, "second-" + Date.now()));
  if (EMU) connectAuthEmulator(a2, "http://127.0.0.1:9099", { disableWarnings: true });
  return a2;
}

/* ইউজারনেম/ফোন → Firebase-এর ভেতরের ইমেইল (কাউকে ইমেইল পাঠানো হয় না) */
export const staffEmail = (u) => String(u).trim().toLowerCase().replace(/[^a-z0-9._-]/g, "") + "@staff.bfs.local";
export const studentEmail = (phone, ver) => String(phone).replace(/\D/g, "") + (ver ? `.r${ver}` : "") + "@student.bfs.local";   // ver = পাসওয়ার্ড রিসেটের সংখ্যা

export const STAGES = ["lead", "counselling", "applied", "offer", "emgs", "visa", "flight", "arrived", "closed"];
export const STAGE_NAME = {
  lead: ["নতুন লিড", "New lead"], counselling: ["কাউন্সেলিং চলছে", "Counselling"], applied: ["আবেদন জমা", "Applied"], offer: ["Offer Letter পেয়েছে", "Offer letter"],
  emgs: ["EMGS প্রসেসিং", "EMGS processing"], visa: ["ভিসা অনুমোদিত", "Visa approved"], flight: ["ফ্লাইট ঠিক", "Flight booked"], arrived: ["মালয়েশিয়ায় পৌঁছেছে", "Arrived"], closed: ["বন্ধ", "Closed"],
};
export const ROLE_NAME = { manager: ["ম্যানেজার", "Manager"], moderator: ["মডারেটর", "Moderator"], counsellor: ["কাউন্সেলর", "Counsellor"] };
export const EMGS_URL = "https://visa.educationmalaysia.gov.my/emgs/application/searchForm/";
export const nm = (pair) => (window.isBn ? (isBn() ? pair[0] : pair[1]) : pair[0]);

export const fmtTime = (ts) => { const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null; return d ? d.toLocaleString(isBn() ? "bn-BD" : "en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; };
export const fmtDate = (ts) => { const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null; return d ? d.toLocaleDateString(isBn() ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—"; };
export function receiptNo() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", d = new Date(), r = new Uint32Array(4); crypto.getRandomValues(r);
  return `RCPT-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${[...r].map((x) => A[x % A.length]).join("")}`;
}
export const errText = (e) => {
  const c = e?.code || "";
  if (/wrong-password|invalid-credential|user-not-found|invalid-login/.test(c)) return isBn() ? "ইউজারনেম/নাম্বার বা পাসওয়ার্ড ভুল" : "Wrong username/number or password";
  if (/email-already-in-use/.test(c)) return isBn() ? "এই নাম্বার/ইউজারনেমে আগেই অ্যাকাউন্ট আছে — লগইন করুন" : "An account already exists — please log in";
  if (/weak-password/.test(c)) return isBn() ? "পাসওয়ার্ড অন্তত ৬ অক্ষরের দিন" : "Password must be at least 6 characters";
  if (/permission-denied/.test(c)) return isBn() ? "এই কাজের অনুমতি আপনার নেই" : "You don't have permission for this";
  if (/network|unavailable/.test(c)) return isBn() ? "ইন্টারনেট সংযোগ দেখুন" : "Check your internet connection";
  return (isBn() ? "সমস্যা হয়েছে: " : "Something went wrong: ") + (e?.message || c);
};

/* নামের আদ্যক্ষর দিয়ে রঙিন গোল ছবি (প্রতিটা নামের রং আলাদা কিন্তু সবসময় একই) */
export function av(name, size = "") {
  const n = String(name || "?").trim(), ini = n.split(/\s+/).map((w) => [...w][0] || "").slice(0, 2).join("").toUpperCase();
  let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `<span class="av ${size}" style="--h:${h}" aria-hidden="true">${esc(ini)}</span>`;
}

/* রসিদ — প্রিন্ট করা যায় / PDF সেভ করা যায় */
export function receiptHtml(p) {
  return `<div class="rcpt" id="rcpt">
    <div class="rc-head"><img src="images/bfs-logo.png" alt="BFS"><div><b>Bright Future by Sam</b><small>${esc(L(CONFIG.address))}</small><small>${CONFIG.phoneDisplay.join(" · ")}</small></div>
      <div class="rc-no"><span>${isBn() ? "রসিদ" : "RECEIPT"}</span><b>${esc(p.receiptNo || "")}</b></div></div>
    <table class="rc-t">
      <tr><td>${isBn() ? "তারিখ" : "Date"}</td><td>${fmtDate(p.verifiedAt || p.createdAt)}</td></tr>
      <tr><td>${isBn() ? "স্টুডেন্ট আইডি" : "Student ID"}</td><td><b>${esc(p.sid)}</b></td></tr>
      <tr><td>${isBn() ? "নাম" : "Name"}</td><td>${esc(p.studentName || "")}</td></tr>
      <tr><td>${isBn() ? "ফোন" : "Phone"}</td><td>${esc(p.phone || "")}</td></tr>
      <tr><td>${isBn() ? "বাবদ" : "Purpose"}</td><td>${esc(p.purpose)}</td></tr>
      <tr><td>${isBn() ? "মাধ্যম" : "Method"}</td><td>${esc(p.method)} · TrxID: ${esc(p.trxId)}${p.sender ? ` · ${isBn() ? "পাঠানো হয়েছে" : "from"} ${esc(p.sender)}` : ""}</td></tr>
      <tr class="rc-amt"><td>${isBn() ? "পরিমাণ" : "Amount"}</td><td>${esc(p.currency)} ${Number(p.amount).toLocaleString("en-IN")}</td></tr>
    </table>
    <p class="rc-ok">✓ ${isBn() ? "টাকা পাওয়া গেছে ও যাচাই করা হয়েছে" : "Payment received and verified"}${p.verifiedBy ? ` — ${esc(p.verifiedBy)}` : ""}</p>
    <p class="rc-note">${isBn() ? "এটি কম্পিউটারে তৈরি রসিদ, সই লাগে না।" : "This is a computer-generated receipt and needs no signature."}</p>
  </div>`;
}
export function showReceipt(p) {
  let m = document.getElementById("rcModal");
  if (!m) { m = document.createElement("div"); m.id = "rcModal"; m.className = "modal"; document.body.appendChild(m);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-rc-close]")) { m.hidden = true; document.body.classList.remove("locked"); } }); }
  m.innerHTML = `<div class="modal-box rc-box">${receiptHtml(p)}<div class="rc-act"><button class="btn btn-primary" onclick="window.print()">${icon("doc")} ${isBn() ? "প্রিন্ট / PDF সেভ" : "Print / Save PDF"}</button><button class="btn btn-line" data-rc-close>${t("c.close")}</button></div></div>`;
  m.hidden = false; document.body.classList.add("locked");
}

export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword,
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, writeBatch, Timestamp };
