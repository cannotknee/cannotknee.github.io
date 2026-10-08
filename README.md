# Kenny Ong — Portfolio

Personal portfolio site, live at **[cannotknee.github.io](https://cannotknee.github.io)**.

A single-page React site framed as a spaceflight, "Mission KO-2026": the
sections are mission phases (Crew Manifest, Flight Log, Payload, Open
Channel), scrolling flies the ship, and a shiba in a spacesuit is the
co-pilot. Every reveal, parallax drift and draw-in is a continuous function of
scroll position, so it scrubs forward *and* backward as you scroll.

## Stack

- **React** (Create React App)
- **Framer Motion** — scroll-linked transforms (`useScroll` / `useTransform`) for parallax, fades, and the section-header reveals
- **React Three Fiber** / **three.js** / **drei** — one persistent background canvas (star streaks, nebula, ringed planet, shiba GLB)
- Plain CSS with a small token file (`src/styles/tokens.css`) for the color/spacing system

## Notable pieces

- `components/SpaceJourney.js` — the fixed WebGL canvas. Lazy-loaded from `App.js`, so three.js (most of the bundle) arrives after the hero text has painted. Pointer events are sourced from `#root`, so the canvas stays `pointer-events: none` but its objects are still clickable.
- `lib/flightTelemetry.js` — one rAF loop measuring scroll position/velocity, read by both the canvas and the HUD
- `components/PilotShiba.js` — the co-pilot's scroll-driven waypoints, plus the easter egg: click it for a barrel roll and a radio reply in the HUD
- `components/Hud.js` — cockpit chrome: phase rail (left), live telemetry rail (right), co-pilot comms
- `components/Parallax.js`, `SectionReveal.js`, `SectionHeader.js` — scroll-scrubbed reveal primitives
- `components/TiltCard.js` — cursor-reactive 3D tilt for the Experience and Project cards, driven by a `requestAnimationFrame` loop with time-constant smoothing (not a physics spring, which doesn't behave well when continuously retargeted by `mousemove`)

## Assets

- `public/spaceman.glb` has its texture resized to 1024² and stored as WebP
  (`gltf-transform resize` + `gltf-transform webp`), 2.9 MB → 230 KB. Keep
  the mesh/node structure intact: `Spaceman.js` reads nodes by name.
- Project screenshots are WebP, max 1200 px wide.
- `public/og-image.jpg` is the 1200×630 link-preview card.

## Getting started

```bash
npm install
npm start       # dev server at http://localhost:3000
npm run build   # production build to /build
npm run deploy  # publish /build to GitHub Pages via gh-pages
```

## Project structure

```
src/
  App.js               # page layout, content, and top-level scroll wiring
  components/          # section components, 3D scene, animation primitives
  lib/                 # shared scroll telemetry
  styles/tokens.css    # colors, spacing, type scale
  assets/              # project images, resume PDF, icons
```
