// Singleton scroll telemetry — one measurement loop, many readers.
//
// Both the WebGL journey (star streak length, shiba waypoints, nebula phase)
// and the DOM HUD (velocity readout, progress %) need the same numbers every
// frame. Rather than each consumer wiring its own scroll listener + smoothing
// (drifting out of sync and duplicating work), this module runs a single rAF
// loop and exposes a mutable snapshot that anything can read without
// subscribing or re-rendering.
//
// velocity: raw px-per-frame-at-60fps equivalent (signed; + = scrolling down)
// smoothed: exponentially smoothed velocity — what visuals should use
// progress: 0..1 through the whole document
const telemetry = {
  scrollY: 0,
  velocity: 0,
  smoothed: 0,
  progress: 0,
};

let started = false;

export function startTelemetry() {
  if (started) return;
  started = true;

  let lastY = window.scrollY;
  let lastT = performance.now();

  const tick = (now) => {
    const dt = Math.min(now - lastT, 100) || 16.7;
    lastT = now;

    const y = window.scrollY;
    // normalize to "px per 60fps frame" so downstream tuning is framerate-proof
    const instantaneous = ((y - lastY) / dt) * 16.7;
    lastY = y;

    telemetry.scrollY = y;
    telemetry.velocity = instantaneous;
    // ~120ms time constant: streaks bloom instantly on a flick, relax quickly
    const factor = 1 - Math.exp(-dt / 120);
    telemetry.smoothed += (instantaneous - telemetry.smoothed) * factor;
    if (Math.abs(telemetry.smoothed) < 0.01) telemetry.smoothed = 0;

    const max = document.documentElement.scrollHeight - window.innerHeight;
    telemetry.progress = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export default telemetry;
