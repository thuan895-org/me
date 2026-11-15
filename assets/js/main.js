/* App logic: language switch, hash-routed rooms, copy buttons. Depends on content.js (ROOMS, EXT, T). */
let lang = "en";
try { const s = localStorage.getItem("lang"); if (s === "vi" || s === "en") lang = s; } catch (e) {}

// Motion is on by default; the visitor can switch it off with the Motion button (remembered).
// stage-fx.js and room-3d.js read html[data-motion] and listen for "motionchange".
let reduce = false;
try { const m = localStorage.getItem("motion"); if (m === "on" || m === "off") reduce = m === "off"; } catch (e) {}
document.documentElement.dataset.motion = reduce ? "off" : "on";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function applyLang() {
  const d = T[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.innerHTML = d[el.dataset.i18n]; });
  document.querySelectorAll("[data-i18n-label]").forEach((el) => { el.setAttribute("aria-label", d[el.dataset.i18nLabel]); });
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.getElementById("motion").setAttribute("aria-pressed", String(!reduce));
  document.getElementById("log").innerHTML = `
    <div class="cdr-head reveal" style="--i:0"><span class="label">${esc(d.cdr)}</span><span class="label">${d.log.length} ${esc(d.records)}</span></div>` + d.log.map((r, i) => {
    const head = `<span class="log-role">${esc(r.role)}</span><span class="log-org">${esc(r.org)}</span>`;
    const open = openLog.has(i);
    return `
    <div class="log-row reveal" style="--i:${i + 1}">
      <div class="log-when">
        <span class="cdr-id">CDR-${String(d.log.length - i).padStart(4, "0")}</span>
        <span>${esc(r.when)}</span>
        <span class="cdr-dur">${duration(r.start, r.end, d)}</span>
        <span class="cdr-state${r.now ? " live" : ""}">${r.now ? `<span class="led" aria-hidden="true"></span>` : ""}${esc(r.now ? d.inCall : d.ended)}</span>
      </div>
      <div class="log-what">
        ${r.note ? `
        <button type="button" class="log-toggle" data-log="${i}" aria-expanded="${open}" aria-controls="log-d${i}">${head}<span class="log-plus" aria-hidden="true"></span></button>
        <div class="log-detail" id="log-d${i}"${open ? "" : " inert"}><div><p class="log-note">${esc(r.note)}</p></div></div>` : head}
      </div>
    </div>`;
  }).join("");
  renderRoom();
}

// Call length from "YYYY" or "YYYY-MM"; an open record runs to this month.
function duration(start, end, d) {
  const n = new Date();
  const m = (v) => { const [y, mo] = v.split("-").map(Number); return y * 12 + (mo || 0); };
  const total = (end ? m(end) : n.getFullYear() * 12 + n.getMonth() + 1) - m(start);
  const y = Math.floor(total / 12), mo = total % 12;
  return [y ? y + d.yr : "", mo ? mo + d.mo : ""].filter(Boolean).join(" ");
}

// Call log rows that are expanded; the current job starts open.
const openLog = new Set([0]);
document.getElementById("log").addEventListener("click", (e) => {
  const b = e.target.closest("[data-log]");
  if (!b) return;
  const i = Number(b.dataset.log), open = !openLog.has(i);
  open ? openLog.add(i) : openLog.delete(i);
  b.setAttribute("aria-expanded", String(open));
  document.getElementById(`log-d${i}`).inert = !open;
});

function currentRoom() {
  const h = location.hash.slice(1);
  return ROOMS.includes(h) ? h : null;
}

let shownRoom = null;

function renderRoom() {
  const r = currentRoom();
  // Hidden layers stay out of the Tab order and the accessibility tree.
  document.getElementById("floor").inert = !!r;
  document.querySelector(".nameplate").inert = !!r;
  document.getElementById("room").inert = !r;
  if (!r) { delete document.body.dataset.room; shownRoom = null; return; }
  document.body.dataset.room = r;
  const d = T[lang], c = d.rooms[r];
  if (r !== shownRoom) {
    // New room: copy its glyph (pathLength lets CSS draw each stroke in) and replay the transition.
    const src = document.querySelector(`.exhibit[data-room="${r}"] .glyph`);
    const glyph = document.getElementById("room-glyph");
    glyph.innerHTML = src ? src.innerHTML : "";
    glyph.querySelectorAll("svg *").forEach((el) => el.setAttribute("pathLength", "1"));
    ["sweep", "room-card"].forEach((id) => {
      const el = document.getElementById(id), cls = id === "sweep" ? "run" : "swap";
      el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    });
    document.getElementById("room-card").scrollTop = 0; // each room starts at its title
    shownRoom = r;
  }
  const next = ROOMS[(ROOMS.indexOf(r) + 1) % ROOMS.length];
  document.getElementById("room-card").innerHTML = `
    <div class="room-top">
      <button type="button" class="btn-outline" data-go="">← ${esc(d.back)}</button>
      <div class="call-state"><span class="led" aria-hidden="true"></span><span class="label">${esc(d.connected)} · ${EXT[r]}</span></div>
    </div>
    <h2 class="room-title">${esc(c.title)}</h2>
    <p class="room-lede">${esc(c.lede)}</p>
    ${c.diff ? diffBlock(r, c.diff) : ""}
    <ul class="room-points">${c.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <div class="chip-group"><span class="label">${esc(c.outLabel)}</span><div class="chips">${c.out.map((o) => `<span class="chip lit">${esc(o)}</span>`).join("")}</div></div>
    <div class="chip-group"><span class="label">${esc(d.stackLabel)}</span><div class="chips">${c.stack.map((o) => `<span class="chip">${esc(o)}</span>`).join("")}</div></div>
    <div class="room-nav">
      <button type="button" class="btn-solid" data-go="${next}">${esc(d.next)} · ${EXT[next]}</button>
    </div>`;
}

// A room's before/after, drawn as a unified diff: removed lines first, then added.
function diffBlock(r, f) {
  const lines = [...f.del.map((t) => ["del", "−", t, "del"]), ...f.add.map((t) => ["add", "+", t, "ins"])];
  return `
    <figure class="diff">
      <figcaption><span class="label">${r}.diff</span><span class="diff-stat"><b class="add">+${f.add.length}</b> <b class="del">−${f.del.length}</b></span></figcaption>
      <div class="diff-body">
        <div class="diff-hunk">@@ ${esc(f.hunk)} @@</div>
        ${lines.map(([k, s, t, tag], i) => `<div class="diff-line ${k}" style="--i:${i}"><span class="diff-sign" aria-hidden="true">${s}</span><${tag}>${esc(t)}</${tag}></div>`).join("")}
      </div>
    </figure>`;
}

function go(room) {
  const from = currentRoom();
  location.hash = room || "stage";
  renderRoom(); // apply inert now so focus can move before hashchange fires
  if (room) { document.getElementById("room-card").focus({ preventScroll: true }); }
  else {
    const btn = document.querySelector(`.exhibit[data-room="${from}"]`) || document.querySelector(".exhibit");
    if (btn) btn.focus({ preventScroll: true });
  }
}

document.querySelectorAll(".exhibit").forEach((b) => b.addEventListener("click", () => go(b.dataset.room)));
document.getElementById("room-card").addEventListener("click", (e) => {
  const b = e.target.closest("[data-go]");
  if (b) go(b.dataset.go || null);
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && currentRoom()) go(null); });
window.addEventListener("hashchange", renderRoom);

document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => {
  lang = b.dataset.lang;
  try { localStorage.setItem("lang", lang); } catch (e) {}
  applyLang();
}));

document.getElementById("motion").addEventListener("click", (e) => {
  reduce = !reduce;
  try { localStorage.setItem("motion", reduce ? "off" : "on"); } catch (err) {}
  document.documentElement.dataset.motion = reduce ? "off" : "on";
  e.currentTarget.setAttribute("aria-pressed", String(!reduce));
  document.dispatchEvent(new Event("motionchange"));
});

document.getElementById("to-contact").addEventListener("click", () => {
  document.getElementById("contact").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", () => {
  const el = document.getElementById(b.dataset.copy);
  const text = el.textContent.replace(/\s/g, b.dataset.copy === "v-phone" ? "" : " ").trim();
  const done = () => { b.textContent = T[lang].copied; setTimeout(() => { b.textContent = T[lang].copy; }, 1600); };
  const fallback = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
  try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
}));

applyLang();

/* ---------- Scroll: sections "patch in" as they reach the viewport ---------- */
(function () {
  const sections = document.querySelectorAll("main .section");
  const counters = document.querySelectorAll("[data-count]");

  function count(el) {
    const to = Number(el.dataset.count), suf = el.dataset.suffix || "", t0 = performance.now();
    const step = (t) => {
      const k = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  if (reduce || !("IntersectionObserver" in window)) {
    sections.forEach((s) => s.classList.add("is-lit"));
  } else {
    document.documentElement.classList.add("fx");
    counters.forEach((el) => { el.textContent = "0" + (el.dataset.suffix || ""); });
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-lit");
      en.target.querySelectorAll("[data-count]").forEach(count);
      io.unobserve(en.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    sections.forEach((s) => io.observe(s));
    // Motion switched off mid-page: show everything that has not patched in yet.
    document.addEventListener("motionchange", () => {
      if (!reduce) return;
      sections.forEach((s) => { if (!s.classList.contains("is-lit")) { s.classList.add("is-lit"); io.unobserve(s); } });
      counters.forEach((el) => { el.textContent = el.dataset.count + (el.dataset.suffix || ""); });
    });
  }

  // Signal meter: bars light up with scroll depth; shown once the stage is behind you.
  const meter = document.getElementById("meter");
  const bars = meter.querySelectorAll("i");
  let queued = false;
  function update() {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    const lvl = Math.min(bars.length, Math.ceil(p * bars.length));
    bars.forEach((b, i) => b.classList.toggle("on", i < lvl));
    const show = scrollY > document.getElementById("stage").offsetHeight * 0.6;
    meter.classList.toggle("show", show);
    meter.inert = !show;
  }
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
  meter.addEventListener("click", () => {
    scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    const btn = document.querySelector(".exhibit");
    if (btn && !currentRoom()) btn.focus({ preventScroll: true });
  });
})();

/* ---------- Dialer: type 101–103 anywhere to patch through; IVR keys in Contact ---------- */
(function () {
  const dialer = document.getElementById("dialer");
  const num = document.getElementById("dialer-num");
  const state = document.getElementById("dialer-state");
  const ivr = document.querySelector(".ivr");
  const codes = Object.fromEntries(ROOMS.map((r) => [EXT[r].replace(/\D/g, ""), r]));
  let buf = "", wait = 0, hide = 0;

  function show(label, digits) {
    state.textContent = label; num.textContent = digits;
    dialer.classList.add("show");
    clearTimeout(hide);
    hide = setTimeout(() => dialer.classList.remove("show"), 1800);
  }

  function toTop() { scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }

  function press(key) {
    const d = T[lang];
    const pressed = ivr.querySelector(`[data-ivr="${key}"]`);
    if (pressed) { pressed.classList.add("hit"); setTimeout(() => pressed.classList.remove("hit"), 260); }
    show(d["ivr_" + key], key);
    if (key === "1") location.href = "mailto:" + document.getElementById("v-email").textContent.trim();
    else if (key === "2") window.open(document.querySelector('.contact a[href*="linkedin"]').href, "_blank", "noopener");
    else if (key === "3") window.open(document.querySelector('.contact a[href*="github"]').href, "_blank", "noopener");
    else if (key === "0") { toTop(); go(null); }
  }

  // Single-digit IVR keys only count while the menu is on screen.
  function ivrVisible() {
    const r = ivr.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  }

  function resolve() {
    clearTimeout(wait);
    const d = T[lang], dialed = buf;
    buf = "";
    if (codes[dialed]) { show(`${EXT[codes[dialed]]} · ${d.connected}`, dialed); toTop(); go(codes[dialed]); }
    else if (dialed.length === 1 && "0123".includes(dialed) && (dialed === "0" || ivrVisible())) press(dialed);
    else show(d.noExt, dialed);
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !/^[0-9]$/.test(e.key)) return;
    if (e.target.closest("input, textarea, select, [contenteditable]")) return;
    buf += e.key;
    clearTimeout(wait);
    // Keep listening while the digits could still become an extension.
    const prefix = Object.keys(codes).some((c) => c.startsWith(buf) && c !== buf);
    if (prefix) { show(T[lang].dialing, buf + "_"); wait = setTimeout(resolve, 900); }
    else resolve();
  });

  ivr.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ivr]");
    if (b) press(b.dataset.ivr);
  });
})();
