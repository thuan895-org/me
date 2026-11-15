/* 3D hero: a torus knot under three area lights (one per extension), drawn on one canvas fixed to the viewport.
   It rests at a spot on the page: behind the extensions (or, in a room, in the left column between the light
   panels), or beside the section being read, dimmer, behind the text. While the reader scrolls (wheel, touchpad or
   a swipe with momentum) the knot holds still on screen and never reads the scroll position, so it cannot lag or
   judder against the page; SETTLE_DELAY after the scrolling stops it glides to the spot for what is now on screen.
   The sway runs on time alone. Opening a room flies it into the left column, where the light panels and a glossy
   floor come up around it; scrolling down from a room works like the main page.
   three.js loads from the CDN (see the importmap in index.html); without WebGL or the CDN nothing is drawn and
   the CSS tubes in the room stay as the fallback. */
const stage = document.getElementById("stage");
const holder = document.querySelector(".room-light");
let reduce = document.documentElement.dataset.motion === "off"; // set by main.js, toggled by the Motion button

// Each world gets its own knot (p, q turns) and light mood; the middle panel is the extension's own line.
const WORLDS = {
  stage: { p: 2, q: 3, side: 2, mid: "--signal", midI: 4 },
  migration: { p: 2, q: 3, side: 2, mid: "--mute", midI: 3 },
  cpaas: { p: 3, q: 4, side: 3, mid: "--signal", midI: 8 },
  ai: { p: 2, q: 5, side: 6, mid: "--signal", midI: 5 }
};
const STAGE_SCALE = 2;    // the knot is bigger behind the extensions than in a room
const PAGE_SCALE = 2.1;   // ...and a touch bigger once it follows the reader down the page
const PAGE_DIM = 0.55;    // how much it fades behind the text
const SETTLE_DELAY = 500; // ms without scrolling before the knot moves to its new spot
const SLIDE_EASE = 2.2;   // how fast it glides there, per second; lower = slower
const SIDE = 0.74;        // on wide screens the knot rests off centre (fraction of width), alternating right and left

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

async function boot() {
  const THREE = await import("three");
  const { RectAreaLightUniformsLib } = await import("three/addons/lights/RectAreaLightUniformsLib.js");
  const { RectAreaLightHelper } = await import("three/addons/helpers/RectAreaLightHelper.js");
  RectAreaLightUniformsLib.init();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.domElement.className = "stage-3d";
  renderer.domElement.setAttribute("aria-hidden", "true");
  document.body.insertBefore(renderer.domElement, stage);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 200);

  // One rig: knot at the origin, panels behind it, floor below.
  const rig = new THREE.Group();
  scene.add(rig);

  // Three panels at the back, lighting the knot towards the camera: white, the line, white.
  const helpers = [];
  const lights = [-5, 0, 5].map((x) => {
    const l = new THREE.RectAreaLight(0xffffff, 5, 4, 10);
    l.position.set(x, 0.5, 5);
    const hp = new RectAreaLightHelper(l);
    rig.add(l, hp);
    helpers.push(hp);
    return l;
  });

  // Glossy dark floor: the panels reflect in it like the wet stage floor; its rim fades into the stage.
  const fade = document.createElement("canvas");
  fade.width = fade.height = 256;
  const fc = fade.getContext("2d"), grad = fc.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0.35, "#fff"); grad.addColorStop(1, "#000");
  fc.fillStyle = grad; fc.fillRect(0, 0, 256, 256);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 20),
    new THREE.MeshStandardMaterial({ color: token("--panel"), roughness: 0.12, metalness: 0, transparent: true, alphaMap: new THREE.CanvasTexture(fade) })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -5.5, -5); // ends at the panels, so no unlit strip shows behind them
  rig.add(floor);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.5, 200, 16),
    new THREE.MeshStandardMaterial({ color: token("--lamp"), roughness: 0, metalness: 0 })
  );
  rig.add(knot);

  // The rig stays at the origin and the camera looks straight at it; its distance keeps a room's rig the size of
  // the left column. To place the rig on screen we shift the projection centre (setViewOffset) instead of moving
  // the rig, so the knot and the panels behind it share one vanishing point and stay lined up anywhere.
  let w = 1, h = 1;
  function fit() {
    w = innerWidth; h = innerHeight;
    renderer.setSize(w, h, false);
    const col = holder.getBoundingClientRect();
    const upp = col.width ? Math.max(15 / col.width, 13 / col.height) : 15 / (w * 0.9); // world units per pixel
    camera.aspect = w / h;
    camera.position.set(0, 0, -(h * upp) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    camera.lookAt(0, 0, 0);
  }

  // Draw the origin at viewport pixel (x, y).
  function aim(x, y) {
    camera.setViewOffset(w, h, w / 2 - x, h / 2 - y, w, h);
    camera.updateProjectionMatrix();
  }

  let world = null;
  function setWorld(name) {
    if (name === world) return;
    world = name;
    const m = WORLDS[name];
    knot.geometry.dispose();
    knot.geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 16, m.p, m.q);
    lights.forEach((l, i) => {
      l.color.set(token(i === 1 ? m.mid : "--lamp"));
      l.intensity = i === 1 ? m.midI : m.side;
    });
  }

  const sections = Array.from(document.querySelectorAll("main .section"));

  // Resting spots on the page (page px): the top spot (behind the extensions, or a room's left column with its
  // panels), then the middle of each section.
  function anchors() {
    const col = holder.getBoundingClientRect();
    const top = document.body.dataset.room && col.width
      ? { x: col.left + col.width / 2, y: col.top + scrollY + col.height / 2, scale: 1, a: 0, room: 1 }
      : { x: w / 2, y: stage.offsetHeight * 0.42, scale: STAGE_SCALE, a: 0, room: 0 };
    // Sections alternate sides on wide screens (right, left, right...), so each settle swings the knot across.
    const side = (i) => (innerWidth > 760 ? w * (i % 2 ? 1 - SIDE : SIDE) : w / 2);
    return [top].concat(sections.map((el, i) => {
      const r = el.getBoundingClientRect();
      return { x: side(i), y: r.top + scrollY + r.height / 2, scale: PAGE_SCALE, a: 1, room: 0 };
    }));
  }

  // The spot for the section nearest the middle of the screen.
  function spot() {
    const mid = scrollY + h / 2;
    return anchors().reduce((best, p) => (Math.abs(p.y - mid) < Math.abs(best.y - mid) ? p : best));
  }

  // Scrolling = a scroll event within the last SETTLE_DELAY ms (this also covers momentum after a swipe).
  let scrolling = false, settleTimer = 0;
  addEventListener("scroll", () => {
    scrolling = true;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { scrolling = false; }, SETTLE_DELAY);
  }, { passive: true });

  // cur.x / cur.y are viewport px: while scrolling nothing here moves, so the knot simply holds its place on screen.
  const cur = { x: null, y: 0, scale: STAGE_SCALE, room: 0, a: 0 };
  let last = 0;

  function frame(t) {
    const dt = last ? Math.min((t - last) / 1000, 0.1) : 1;
    last = t;
    setWorld(document.body.dataset.room || "stage");
    if (reduce || !scrolling || cur.x === null) {
      const tg = spot(), ty = tg.y - scrollY;
      if (cur.x === null) { cur.x = tg.x; cur.y = ty; }
      const k = reduce ? 1 : 1 - Math.exp(-dt * 4);
      // Flying into or out of a room is quick; gliding between sections is slower.
      const slide = reduce ? 1 : tg.room !== Math.round(cur.room) ? k : 1 - Math.exp(-dt * SLIDE_EASE);
      cur.x += (tg.x - cur.x) * slide;
      cur.y += (ty - cur.y) * slide;
      cur.scale += (tg.scale - cur.scale) * k;
      cur.room += (tg.room - cur.room) * k;
      cur.a += (tg.a - cur.a) * k;
    }
    aim(cur.x, cur.y);
    knot.scale.setScalar(cur.scale);
    renderer.domElement.style.opacity = String(1 - PAGE_DIM * cur.a);

    // Panels and floor only belong to a room: they come up as the knot settles in.
    floor.material.opacity = cur.room;
    helpers.forEach((hp) => { hp.visible = cur.room > 0.6; });

    // Sway like three.js' instancing/scatter example, on time alone.
    const time = reduce ? 0 : t / 1000;
    knot.rotation.x = Math.sin(time / 4);
    knot.rotation.y = Math.sin(time / 2);
    renderer.render(scene, camera);
  }

  addEventListener("resize", () => { fit(); if (reduce) frame(0); });
  fit();
  holder.classList.add("has-3d");
  // Theme switch: re-read the colours that come from CSS tokens.
  function retheme() {
    floor.material.color.set(token("--panel"));
    knot.material.color.set(token("--lamp"));
    world = null; // setWorld() re-colours the lights on the next frame
  }

  return { frame, renderer, retheme };
}

boot().then((app) => {
  // Animate while motion is on; otherwise draw still frames when something changes.
  const run = () => {
    app.renderer.setAnimationLoop(reduce ? null : app.frame);
    if (reduce) app.frame(0);
  };
  addEventListener("scroll", () => { if (reduce) app.frame(0); }, { passive: true });
  new MutationObserver(() => { if (reduce) app.frame(0); }).observe(document.body, { attributes: true, attributeFilter: ["data-room"] });
  document.addEventListener("motionchange", () => { reduce = document.documentElement.dataset.motion === "off"; run(); });
  document.addEventListener("themechange", () => { app.retheme(); if (reduce) app.frame(0); });
  run();
}).catch(() => {}); // no WebGL or CDN unreachable: the CSS tubes remain
