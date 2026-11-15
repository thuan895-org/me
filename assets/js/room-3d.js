/* Room hero: a torus knot under three area lights (one per extension), beside the room card on wide screens.
   three.js loads lazily from the CDN (see the importmap in index.html) the first time a room opens; until then,
   or if WebGL/the CDN fails, the CSS tubes stay as the fallback. */
const holder = document.querySelector(".room-light");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wide = matchMedia("(min-width: 761px)");

// Each world gets its own knot (p, q turns) and light mood; the middle panel is the extension's own line.
const WORLDS = {
  migration: { p: 2, q: 3, side: 2, mid: "--mute", midI: 3 },
  cpaas: { p: 3, q: 4, side: 3, mid: "--signal", midI: 8 },
  ai: { p: 2, q: 5, side: 6, mid: "--signal", midI: 5 }
};

const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
let app = null, booting = null, live = null;

async function boot() {
  const THREE = await import("three");
  const { RectAreaLightUniformsLib } = await import("three/addons/lights/RectAreaLightUniformsLib.js");
  const { RectAreaLightHelper } = await import("three/addons/helpers/RectAreaLightHelper.js");
  RectAreaLightUniformsLib.init();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.domElement.className = "room-3d";
  renderer.domElement.setAttribute("aria-hidden", "true");
  holder.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 1, 100);

  // Three panels at the back, lighting the knot towards the camera: white, the line, white.
  const lights = [-5, 0, 5].map((x) => {
    const l = new THREE.RectAreaLight(0xffffff, 5, 4, 10);
    l.position.set(x, 6, 5);
    scene.add(l, new RectAreaLightHelper(l));
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
  floor.position.z = -5; // ends at the panels, so no unlit strip shows behind them
  scene.add(floor);

  const knot = new THREE.Mesh(
    new THREE.TorusKnotGeometry(1.5, 0.5, 200, 16),
    new THREE.MeshStandardMaterial({ color: token("--white-light"), roughness: 0, metalness: 0 })
  );
  knot.position.set(0, 5.5, 0);
  scene.add(knot);

  function fit() {
    const w = holder.clientWidth, h = holder.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull back on narrow columns so all three panels stay in frame.
    camera.position.set(0, 5, 5 - Math.max(22, 21 / camera.aspect));
    camera.lookAt(0, 5.5, 0);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(fit).observe(holder);
  fit();

  function setWorld(room) {
    const w = WORLDS[room];
    knot.geometry.dispose();
    knot.geometry = new THREE.TorusKnotGeometry(1.5, 0.5, 200, 16, w.p, w.q);
    lights.forEach((l, i) => {
      l.color.set(token(i === 1 ? w.mid : "--white-light"));
      l.intensity = i === 1 ? w.midI : w.side;
    });
  }

  function render(t) {
    knot.rotation.y = t / 1600;
    knot.rotation.x = Math.sin(t / 2600) * 0.35;
    renderer.render(scene, camera);
  }

  holder.classList.add("has-3d");
  return { setWorld, render, renderer };
}

// Follow body[data-room]: run the loop only while a room is open on a wide screen.
async function sync() {
  const room = document.body.dataset.room;
  const show = !!room && wide.matches;
  if (show && room === live) return; // re-render of the same room (e.g. language switch)
  if (app) app.renderer.setAnimationLoop(null);
  live = show ? room : null;
  if (!show) return;
  try {
    app = app || await (booting = booting || boot());
  } catch (e) {
    return; // no WebGL or CDN unreachable: the CSS tubes remain
  }
  if (live !== room) return; // the visitor moved on while three.js was loading
  app.setWorld(room);
  if (reduce) app.render(1200);
  else app.renderer.setAnimationLoop(app.render);
}

new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["data-room"] });
wide.addEventListener("change", sync);
sync();
