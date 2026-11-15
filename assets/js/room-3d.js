/* 3D hero: a torus knot under three area lights (one per extension), drawn on one canvas fixed to the viewport.
   On the stage it sways behind the extensions. Scrolling down carries it up with the page for a moment, then it
   drifts back to the middle of the screen (inertia) and stays with the reader, smaller and dimmer, behind the text;
   scrolling also pushes the sway along. Opening a room flies it into the left column, where the light panels and a
   glossy floor come up around it.
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
    new THREE.MeshStandardMaterial({ color: token("--white-light"), roughness: 0, metalness: 0 })
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
      l.color.set(token(i === 1 ? m.mid : "--white-light"));
      l.intensity = i === 1 ? m.midI : m.side;
    });
  }

  // How far the reader has left the stage: 0 at the top, 1 once the stage is mostly scrolled away.
  const away = () => Math.min(Math.max(scrollY / (stage.offsetHeight * 0.6), 0), 1);

  // Where the rig should be right now (viewport px): the room's left column, or behind the extensions at the top
  // of the page, easing to the middle of the screen as the reader scrolls on.
  function target() {
    const col = holder.getBoundingClientRect(), a = away();
    if (document.body.dataset.room && col.width) {
      return { x: col.left + col.width / 2, y: col.top + col.height / 2, scale: 1, room: 1, a };
    }
    const top = stage.offsetHeight * 0.42;
    return { x: w / 2, y: top + (h / 2 - top) * a, scale: STAGE_SCALE + (PAGE_SCALE - STAGE_SCALE) * a, room: 0, a };
  }

  const cur = { x: null, y: 0, scale: STAGE_SCALE, room: 0, a: 0 };
  let spin = scrollY * SCROLL_SPIN, last = 0, lastScroll = scrollY;

  function frame(t) {
    const dt = last ? Math.min((t - last) / 1000, 0.1) : 1;
    last = t;
    setWorld(document.body.dataset.room || "stage");
    const tg = target();
    const k = reduce ? 1 : 1 - Math.exp(-dt * 4);
    if (cur.x === null) { cur.x = tg.x; cur.y = tg.y; }
    // Inertia: the knot first rides along with the page, then the spring below pulls it back to its spot.
    if (!reduce) cur.y -= scrollY - lastScroll;
    lastScroll = scrollY;
    cur.x += (tg.x - cur.x) * k;
    cur.y += (tg.y - cur.y) * (reduce ? 1 : 1 - Math.exp(-dt * 2.5));
    cur.scale += (tg.scale - cur.scale) * k;
    cur.room += (tg.room - cur.room) * k;
    cur.a += (tg.a - cur.a) * k;
    aim(cur.x, cur.y);
    knot.scale.setScalar(cur.scale);
    renderer.domElement.style.opacity = String(1 - PAGE_DIM * cur.a);

    // Panels and floor only belong to a room: they come up as the knot settles in.
    floor.material.opacity = cur.room;
    helpers.forEach((hp) => { hp.visible = cur.room > 0.6; });

    // Sway like three.js' instancing/scatter example; scrolling pushes the clock forward.
    if (!reduce) spin += (scrollY * SCROLL_SPIN - spin) * (1 - Math.exp(-dt * 6));
    const time = (reduce ? 0 : t / 1000) + spin;
    knot.rotation.x = Math.sin(time / 4);
    knot.rotation.y = Math.sin(time / 2);
    renderer.render(scene, camera);
  }

  addEventListener("resize", () => { fit(); if (reduce) frame(0); });
  fit();
  holder.classList.add("has-3d");
  return { frame, renderer };
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
  run();
}).catch(() => {}); // no WebGL or CDN unreachable: the CSS tubes remain
