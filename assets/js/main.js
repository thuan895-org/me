/* App logic: language switch, hash-routed rooms, copy buttons. Depends on content.js (ROOMS, EXT, T). */
let lang = "en";
try { const s = localStorage.getItem("lang"); if (s === "vi" || s === "en") lang = s; } catch (e) {}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function applyLang() {
  const d = T[lang];
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.innerHTML = d[el.dataset.i18n]; });
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.getElementById("log").innerHTML = d.log.map((r) => `
    <div class="log-row">
      <div class="log-when">${esc(r.when)}</div>
      <div class="log-what">
        <span class="log-role">${esc(r.role)}</span>
        <span class="log-org">${esc(r.org)}</span>
        ${r.note ? `<p class="log-note">${esc(r.note)}</p>` : ""}
      </div>
    </div>`).join("");
  renderRoom();
}

function currentRoom() {
  const h = location.hash.slice(1);
  return ROOMS.includes(h) ? h : null;
}

function renderRoom() {
  const r = currentRoom();
  if (!r) { delete document.body.dataset.room; return; }
  document.body.dataset.room = r;
  const d = T[lang], c = d.rooms[r];
  const src = document.querySelector(`.exhibit[data-room="${r}"] .glyph`);
  document.getElementById("room-glyph").innerHTML = src ? src.innerHTML : "";
  const next = ROOMS[(ROOMS.indexOf(r) + 1) % ROOMS.length];
  document.getElementById("room-card").innerHTML = `
    <div class="call-state"><span class="led" aria-hidden="true"></span><span class="label">${esc(d.connected)} · ${EXT[r]}</span></div>
    <h2 class="room-title">${esc(c.title)}</h2>
    <p class="room-lede">${esc(c.lede)}</p>
    <ul class="room-points">${c.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    <div class="chip-group"><span class="label">${esc(c.outLabel)}</span><div class="chips">${c.out.map((o) => `<span class="chip lit">${esc(o)}</span>`).join("")}</div></div>
    <div class="chip-group"><span class="label">${esc(d.stackLabel)}</span><div class="chips">${c.stack.map((o) => `<span class="chip">${esc(o)}</span>`).join("")}</div></div>
    <div class="room-nav">
      <button type="button" class="btn-outline" data-go="">← ${esc(d.back)}</button>
      <button type="button" class="btn-solid" data-go="${next}">${esc(d.next)} · ${EXT[next]}</button>
    </div>`;
}

function go(room) {
  if (room) { location.hash = room; }
  else {
    location.hash = "stage";
    const btn = document.querySelector(".exhibit");
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
