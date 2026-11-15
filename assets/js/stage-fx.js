/* ---------- Ambient: dust + wet-floor reflections, plus one "world" per room ---------- */
(function () {
  const stage = document.getElementById("stage");
  const cv = document.getElementById("fx");
  const ctx = cv.getContext("2d");
  let reduce = document.documentElement.dataset.motion === "off"; // set by main.js, toggled by the Motion button
  let running = false;
  let w = 0, h = 0, dpr = 1, dust = [], nodes = [], edges = [];

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
    // AI room: a small agent network, each node wired to its two nearest neighbours.
    nodes = Array.from({ length: Math.max(10, Math.round((w * h) / 60000)) }, () => ({ x: Math.random() * w, y: Math.random() * h * 0.9 }));
    edges = [];
    nodes.forEach((a, i) => {
      nodes.map((b, j) => [j, (a.x - b.x) ** 2 + (a.y - b.y) ** 2]).filter(([j]) => j !== i)
        .sort((p, q) => p[1] - q[1]).slice(0, 2)
        .forEach(([j]) => { if (!edges.some(([x, y]) => x === j && y === i)) edges.push([i, j]); });
    });
  }

  // EXT 101 · the past: legacy CRT, grain and a slow rolling scan band.
  function legacy(t) {
    ctx.fillStyle = "rgba(4,7,8,0.22)";
    for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
    const n = Math.round((w * h) / 700);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = `rgba(220,240,232,${Math.random() * 0.09})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
    }
    const band = (t / 9) % (h + 160) - 80;
    const g = ctx.createLinearGradient(0, band - 80, 0, band + 80);
    g.addColorStop(0, "rgba(244,251,248,0)"); g.addColorStop(0.5, "rgba(244,251,248,0.035)"); g.addColorStop(1, "rgba(244,251,248,0)");
    ctx.fillStyle = g; ctx.fillRect(0, band - 80, w, 160);
  }

  // EXT 102 · the present: live voice traces on an oscilloscope.
  function scope(t) {
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = `rgba(67,245,172,${0.32 - k * 0.09})`;
      ctx.lineWidth = 1.5 - k * 0.3;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const env = 0.35 + 0.65 * Math.abs(Math.sin(x / 210 - t / (1100 + k * 300)));
        const y = h * 0.52 + Math.sin(x / (38 + k * 21) + t / (260 + k * 90)) * 46 * env * (1 - k * 0.25);
        x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }

  // EXT 103 · the future: clean grid, agents passing calls between nodes.
  function network(t) {
    ctx.strokeStyle = "rgba(244,251,248,0.035)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < w; x += 48) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = 0; y < h; y += 48) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.stroke();
    ctx.strokeStyle = "rgba(244,251,248,0.12)";
    ctx.beginPath();
    for (const [i, j] of edges) { ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); }
    ctx.stroke();
    edges.forEach(([i, j], e) => {
      const k = (t / 1800 + e * 0.37) % 1, a = nodes[i], b = nodes[j];
      ctx.fillStyle = "rgba(67,245,172,0.8)";
      ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 1.8, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "rgba(244,251,248,0.55)";
    for (const p of nodes) { ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill(); }
  }

  const worlds = { migration: legacy, cpaas: scope, ai: network };

  function tubes() {
    const sr = stage.getBoundingClientRect();
    const list = document.body.dataset.room
      ? document.querySelectorAll(".room-light .tube i")
      : document.querySelectorAll(".floor .tube i");
    return Array.from(list).map((el) => {
      const r = el.getBoundingClientRect();
      const green = el === el.parentElement.children[1] && document.body.dataset.room !== "migration";
      return { x: r.left - sr.left, wd: r.width, top: r.bottom - sr.top, green, vis: r.width > 0 };
    }).filter((t) => t.vis);
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    const world = worlds[document.body.dataset.room];
    if (world) world(t);
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
    if (reduce) running = false;
    else requestAnimationFrame(frame);
  }

  function start() {
    if (reduce) frame(0);
    else if (!running) { running = true; requestAnimationFrame(frame); }
  }

  size();
  addEventListener("resize", size);
  addEventListener("hashchange", () => { if (reduce) setTimeout(() => frame(0), 50); });
  document.addEventListener("motionchange", () => { reduce = document.documentElement.dataset.motion === "off"; start(); });
  start();
})();
