/* 3D hero: a torus knot under three area lights (one per extension), drawn on one canvas fixed to the viewport.
   On the stage it sways behind the extensions. Further down it belongs to the page: it rests beside the section
   being read and scrolls with it like content, and when the reader moves on to another section it slides slowly
   down (or up) the page to that one (SLIDE_EASE), dimmer, behind the text. Scrolling also pushes the sway along,
   through a smoothed copy of the scroll position so wheel steps don't make it judder. Opening a room flies it into
   the left column, where the light panels and a glossy floor come up around it.
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
const SCROLL_SPIN = 0.01; // seconds of sway per scrolled pixel
const SCROLL_EASE = 1.8;  // how fast the smoothed scroll (sway) catches up, per second
const SLIDE_EASE = 1.6;   // how fast the knot slides to the next section, per second; lower = slower
const SIDE = 0.74;        // on wide screens the knot rests right of centre (fraction of width), clear of the text

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

  let eased = scrollY; // smoothed scroll position for the sway
  const sections = Array.from(document.querySelectorAll("main .section"));

  // Resting spots on the page (page px, not viewport): behind the extensions, then the middle of each section.
  function anchors() {
    const side = innerWidth > 760 ? w * SIDE : w / 2;
    return [{ x: w / 2, y: stage.offsetHeight * 0.42, a: 0 }].concat(sections.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: side, y: r.top + scrollY + r.height / 2, a: 1 };
    }));
  }

  // The spot for the section nearest the middle of the screen.
  function spot() {
    const mid = scrollY + h / 2;
    return anchors().reduce((best, p) => (Math.abs(p.y - mid) < Math.abs(best.y - mid) ? p : best));
  }

  const cur = { x: null, y: 0, scale: STAGE_SCALE, room: 0, a: 0 };
  let last = 0;

  function frame(t) {
    const dt = last ? Math.min((t - last) / 1000, 0.1) : 1;
    last = t;
    setWorld(document.body.dataset.room || "stage");
    eased += (scrollY - eased) * (reduce ? 1 : 1 - Math.exp(-dt * SCROLL_EASE));
    const k = reduce ? 1 : 1 - Math.exp(-dt * 4);
    const col = holder.getBoundingClientRect();
    const inRoom = !!document.body.dataset.room && col.width > 0;
    // cur.x / cur.y live in page px; the viewport position is cur.y - scrollY, so between slides the knot scrolls
    // exactly like the content around it.
    const tg = inRoom
      ? { x: col.left + col.width / 2, y: col.top + scrollY + col.height / 2, a: 0 }
      : spot();
    if (cur.x === null) { cur.x = tg.x; cur.y = tg.y; }
    const slide = inRoom ? k : reduce ? 1 : 1 - Math.exp(-dt * SLIDE_EASE);
    cur.x += (tg.x - cur.x) * slide;
    cur.y += (tg.y - cur.y) * slide;
    cur.scale += ((inRoom ? 1 : STAGE_SCALE + (PAGE_SCALE - STAGE_SCALE) * tg.a) - cur.scale) * k;
    cur.room += ((inRoom ? 1 : 0) - cur.room) * k;
    cur.a += (tg.a - cur.a) * k;
    aim(cur.x, cur.y - scrollY);
    knot.scale.setScalar(cur.scale);
    renderer.domElement.style.opacity = String(1 - PAGE_DIM * cur.a);

    // Panels and floor only belong to a room: they come up as the knot settles in.
    floor.material.opacity = cur.room;
    helpers.forEach((hp) => { hp.visible = cur.room > 0.6; });

    // Sway like three.js' instancing/scatter example; scrolling pushes the clock forward.
    const time = (reduce ? 0 : t / 1000) + eased * SCROLL_SPIN;
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
