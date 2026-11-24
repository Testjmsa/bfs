/* ===== মালয়েশিয়ার লাইন-স্কেচ (পেট্রোনাস টুইন টাওয়ার, KL টাওয়ার, জবা ফুল, প্লেন) — সব SVG, কোনো ছবি ফাইল লাগে না ===== */
function twinTower(cx) {
  // ধাপে ধাপে সরু হয়ে ওঠা টাওয়ার
  const tiers = [[380, 44], [150, 38], [118, 30], [92, 22], [72, 14], [56, 6]];
  let d = "";
  for (let i = 0; i < tiers.length; i++) {
    const [y, w] = tiers[i], top = i < tiers.length - 1 ? tiers[i + 1][0] : 42;
    d += `M${cx - w / 2} ${y}V${top}H${cx + w / 2}V${y}`;
  }
  d += `M${cx} 42V8`;                                                    // চূড়া
  for (let x = -16; x <= 16; x += 8) d += `M${cx + x} 372V158`;         // সামনের লাইন
  for (let y = 180; y < 372; y += 26) d += `M${cx - 22} ${y}H${cx + 22}`; // তলা
  return d;
}
function sketchTwin() {
  return `<svg viewBox="0 0 200 400" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path class="draw" d="${twinTower(52)}"/><path class="draw" d="${twinTower(148)}"/>
    <path class="draw" d="M74 214H126M74 224H126M80 224L100 252L120 224"/>
    <path d="M0 380H200" stroke-width="2"/></svg>`;
}
function sketchKLTower() {
  return `<svg viewBox="0 0 120 400" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path class="draw" d="M52 380L56 150H64L68 380M50 380H70M58 360V170M62 360V170"/>
    <path class="draw" d="M42 150Q60 158 78 150L74 128Q60 122 46 128Z M46 128Q60 112 74 128M50 120H70"/>
    <path class="draw" d="M60 112V24M56 70H64M57 50H63"/><circle cx="60" cy="22" r="2.5"/>
    <path d="M10 380H110" stroke-width="2"/></svg>`;
}
function sketchHibiscus() {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * Math.PI / 180, x = 60 + Math.cos(a) * 30, y = 60 + Math.sin(a) * 30;
    return `M60 60Q${60 + Math.cos(a - 0.6) * 46} ${60 + Math.sin(a - 0.6) * 46} ${x} ${y}Q${60 + Math.cos(a + 0.6) * 46} ${60 + Math.sin(a + 0.6) * 46} 60 60`;
  }).join("");
  return `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
    <path class="draw" d="${petals}"/><path class="draw" d="M60 60L84 30M84 30l4-3M84 30l3 4M84 30l-2-4"/></svg>`;
}
function sketchPlane() {
  return `<svg viewBox="0 0 220 80" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M4 70Q70 70 120 44" stroke-dasharray="3 6"/>
    <path class="draw" d="M150 30L196 18Q206 16 206 22Q206 27 196 30L150 42L134 60H126L136 40L116 46L108 54H102L108 42L106 34H112L120 40L140 34L128 16H136Z"/></svg>`;
}
/* পুরো স্কাইলাইন (হিরো, পেজ-হেডার, ফুটারে) */
function skyline() {
  return `<svg class="skyline" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M0 214H1200"/>
    <path d="M40 214V150H80V214M90 214V120H120V214M128 214V170H170V214M180 214V140L200 128L220 140V214"/>
    <g transform="translate(250,5) scale(0.55)" stroke-width="2.6"><path class="draw" d="${twinTower(52)}"/><path class="draw" d="${twinTower(148)}"/><path d="M74 214H126M74 224H126M80 224L100 252L120 224"/></g>
    <path d="M470 214V160H520V214M530 214V130H560V214M568 214V175H610V214"/>
    <g transform="translate(640,5) scale(0.55)" stroke-width="2.6"><path class="draw" d="M52 380L56 150H64L68 380M50 380H70 M42 150Q60 158 78 150L74 128Q60 122 46 128Z M46 128Q60 112 74 128 M60 112V24"/></g>
    <path d="M720 214V150H760V214M770 214V110H800V214M808 214V165H850V214M860 214V140H900V214M910 214V178H960V214"/>
    <path d="M990 214V196M990 196Q975 170 960 168M990 196Q1000 168 1018 166M990 196Q985 165 994 150M990 196Q1006 180 1024 186"/>
    <path d="M1060 214V200M1060 200Q1048 178 1034 176M1060 200Q1070 176 1086 174M1060 200Q1056 172 1064 160"/>
    <path d="M1100 214V158H1150V214M1158 214V184H1196V214"/></svg>`;
}
function injectSketches() {
  // পেজ-হেডারে (index ছাড়া সব পেজে)
  $$(".page-hero").forEach((h) => {
    if (h.querySelector(".ph-art")) return;
    h.classList.add("has-art");
    h.insertAdjacentHTML("beforeend", `<span class="ph-tag">${isBn() ? "স্টাডি অ্যাব্রড · মালয়েশিয়া" : "Study abroad · Malaysia"}</span><div class="ph-art" aria-hidden="true">${sketchTwin()}${sketchKLTower()}</div>${skyline()}`);
  });
  // ফুটারের উপরে স্কাইলাইন
  const f = $("#site-footer");
  if (f && !f.querySelector(".skyline")) f.insertAdjacentHTML("afterbegin", skyline());
  // হোম হিরো
  const hero = $(".hero");
  if (hero && !hero.querySelector(".hero-art")) {
    hero.insertAdjacentHTML("beforeend", `<div class="hero-art" aria-hidden="true">${sketchTwin()}</div><div class="hero-plane" aria-hidden="true">${sketchPlane()}</div>${skyline()}`);
  }
  $$("[data-sketch]").forEach((el) => {
    const k = el.dataset.sketch;
    el.innerHTML = { twin: sketchTwin, kl: sketchKLTower, flower: sketchHibiscus, plane: sketchPlane }[k]?.() || "";
  });
}
document.addEventListener("DOMContentLoaded", injectSketches);
document.addEventListener("bfs:lang", () => $$(".ph-tag").forEach((t) => (t.textContent = isBn() ? "স্টাডি অ্যাব্রড · মালয়েশিয়া" : "Study abroad · Malaysia")));
