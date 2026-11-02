/* ---------- Ambient: dust + wet-floor reflections ---------- */
(function () {
  const stage = document.getElementById("stage");
  const cv = document.getElementById("fx");
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, dpr = 1, dust = [];

  function size() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = stage.clientWidth; h = stage.clientHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round((w * h) / 9000);
    dust = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.2 + 0.2, v: Math.random() * 0.15 + 0.03, a: Math.random() * 0.5 + 0.1
    }));
  }

  function tubes() {
    const sr = stage.getBoundingClientRect();
    const list = document.body.dataset.room
      ? document.querySelectorAll(".room-light .tube i")
      : document.querySelectorAll(".floor .tube i");
    return Array.from(list).map((el) => {
      const r = el.getBoundingClientRect();
      const green = el === el.parentElement.children[1];
      return { x: r.left - sr.left, wd: r.width, top: r.bottom - sr.top, green, vis: r.width > 0 };
    }).filter((t) => t.vis);
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const p of dust) {
      if (!reduce) { p.y -= p.v; p.x += Math.sin((t / 4000) + p.y / 60) * 0.08; if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; } }
      ctx.fillStyle = `rgba(220,240,232,${p.a})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const tb of tubes()) {
      const len = Math.min(h - tb.top, 160);
      if (len <= 4) continue;
      const g = ctx.createLinearGradient(0, tb.top, 0, tb.top + len);
      const col = tb.green ? "67,245,172" : "244,251,248";
      g.addColorStop(0, `rgba(${col},0.42)`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      const wob = reduce ? 0 : Math.sin(t / 700 + tb.x) * 1.5;
      for (let i = 0; i < 6; i++) {
        const y = tb.top + 4 + i * (len / 6);
        ctx.fillRect(tb.x - 2 + wob * (i % 2 ? 1 : -1), y, tb.wd + 4, len / 6 - 3);
      }
    }
    if (!reduce) requestAnimationFrame(frame);
  }

  size();
  addEventListener("resize", size);
  if (reduce) { frame(0); addEventListener("hashchange", () => setTimeout(() => frame(0), 50)); }
  else requestAnimationFrame(frame);
})();
