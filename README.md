# Kenny Ong — Portfolio

Personal portfolio site, live at **[cannotknee.github.io](https://cannotknee.github.io)**.

A single-page React site (About / Experience / Projects / Contact) built around
scroll-scrubbed animation — every reveal, parallax drift, and draw-in is a
continuous function of scroll position rather than a one-shot "fade in when
visible" trigger, so it scrubs smoothly forward *and* backward as you scroll.

## Stack

- **React** (Create React App)
- **Framer Motion** — scroll-linked transforms (`useScroll` / `useTransform`) for parallax, fades, and the section-header underline/clip-path reveals
- **React Three Fiber** / **three.js** / **drei** — the hero's starfield and 3D spaceman scene
- Plain CSS with a small token file (`src/styles/tokens.css`) for the color/spacing system

## Notable pieces

- `components/Parallax.js` — wraps content in a scroll-scrubbed fade/slide/drift, reusable across sections
- `components/SectionHeader.js` — the numbered heading + underline, revealed via scroll-linked `clip-path`
- `components/TiltCard.js` — cursor-reactive 3D tilt for the Experience and Project cards, driven by a `requestAnimationFrame` loop with time-constant smoothing (not a physics spring, which doesn't behave well when continuously retargeted by `mousemove`)
- `components/ScrollAurora.js` — the ambient background glow that drifts with total page scroll
- `components/ShootingStars.js`, `HeroAurora.js`, `ParallaxStars.js`, `Spaceman.js` — hero canvas/WebGL effects

The two hero `<Canvas>` scenes are unmounted via `IntersectionObserver` once
the hero scrolls out of view, since React Three Fiber otherwise renders them
forever in the background.

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
  App.js              # page layout and top-level scroll wiring
  components/          # section components and shared animation primitives
  styles/tokens.css    # colors, spacing, type scale
  assets/               # images, resume PDF, icons
```
