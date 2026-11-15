# CLAUDE.md

Personal portfolio site for Nguyen Van Thuan (software engineer, Da Nang). Full context: see README.md (Vietnamese).

## Stack
- Plain static site: `index.html`, `assets/css/style.css`, `assets/js/{content,main,stage-fx}.js`, plus the ES module `assets/js/room-3d.js`.
- No framework, no bundler, no npm dependencies. Do not introduce a build step unless the user asks.
- One approved exception: three.js, pinned to `0.160.0`, loaded from jsDelivr through the importmap in `index.html`. Only `room-3d.js` uses it: one viewport-fixed canvas with a torus knot that sways behind the extensions, rests beside the section being read and slides down the page to the next one (dimmed behind the text), and flies into a room's left column. The CSS room tubes are the fallback when WebGL or the CDN is unavailable.
- Preview: `npx serve .` or `python3 -m http.server`.

## Rules
- All user-facing copy lives in `assets/js/content.js` under `T.en` and `T.vi`. Every text change must be made in BOTH languages. The user's native language is Vietnamese; talk to him in Vietnamese.
- Script load order is fixed: content.js → main.js → stage-fx.js (globals `ROOMS`, `EXT`, `T`), then the importmap and the module room-3d.js.
- Colors only via the CSS tokens in `:root` of style.css. Single dark theme by design. One accent: `--signal` (#43f5ac).
- Fonts: Big Shoulders Display (display), IBM Plex Sans (body), IBM Plex Mono (labels/data).
- Concept is a telecom switchboard: extensions EXT 101/102/103 = rooms `migration`, `cpaas`, `ai`, routed by `location.hash`. Keep this vocabulary consistent.
- Design is inspired by the staging of adidas CHILE20 but must never use adidas/Foot Locker logos, names, marks, colors or imagery.
- Must work at 400px width with no horizontal scroll; motion is ON by default (the user's choice; the OS `prefers-reduced-motion` is not applied automatically). Visitors switch it off with the Motion button in the topbar (remembered in localStorage `motion`); state lives on `html[data-motion]`, scripts react to the `motionchange` event. Every animation must stop when motion is off; keep keyboard focus visible.
- Facts about Thuan's career must not be invented. Only use what is already in content.js / README, or what the user states.

## Commits
Small, descriptive commit messages in English (e.g. `feat: add favicon`, `fix: room card overflow on mobile`).
