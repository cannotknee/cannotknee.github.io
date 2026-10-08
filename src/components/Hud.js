import { useEffect, useRef, useState } from "react";
import telemetry, { startTelemetry } from "../lib/flightTelemetry";
import "./Hud.css";

// Cockpit chrome. Fixed frame around the whole page that treats the visit as
// a flight: a live velocity readout (in fractions of lightspeed, driven by
// real scroll speed — flick the wheel, watch it spike toward 0.99c), distance
// through the mission, elapsed mission time, and the current phase.
//
// The numbers update via direct textContent writes inside one rAF loop —
// they change every frame, and pushing that through React state would
// re-render the tree 60×/second for no reason. Only the phase label (which
// changes a handful of times per visit) goes through state.
const PHASES = [
  { id: "home", label: "LAUNCH" },
  { id: "about", label: "CREW MANIFEST" },
  { id: "experience", label: "FLIGHT LOG" },
  { id: "projects", label: "PAYLOAD" },
  { id: "contact", label: "OPEN CHANNEL" },
];

export default function Hud({ visible }) {
  const velRef = useRef(null);
  const distRef = useRef(null);
  const metRef = useRef(null);
  const [phase, setPhase] = useState(0);
  const [showRtb, setShowRtb] = useState(false);

  useEffect(() => {
    startTelemetry();
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      if (velRef.current) {
        const c = Math.min(Math.abs(telemetry.smoothed) * 0.006, 0.99);
        velRef.current.textContent = c.toFixed(2);
      }
      if (distRef.current) {
        distRef.current.textContent = (telemetry.progress * 100).toFixed(1).padStart(4, "0");
      }
      if (metRef.current) {
        const s = Math.floor((now - t0) / 1000);
        metRef.current.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
          s % 60
        ).padStart(2, "0")}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      let current = 0;
      PHASES.forEach((p, i) => {
        const el = document.getElementById(p.id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.5) current = i;
      });
      setPhase(current);
      setShowRtb(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`hud ${visible ? "hud-visible" : ""}`} aria-hidden="true">
      <span className="hud-corner hud-corner-tl" />
      <span className="hud-corner hud-corner-tr" />
      <span className="hud-corner hud-corner-bl" />
      <span className="hud-corner hud-corner-br" />

      <div className="hud-phase-rail">
        {/* Launch is phase 00 so the rail matches the numbered section
            headers (Crew Manifest = PHASE 01, etc.) */}
        <span className="hud-phase-label">
          PHASE {String(phase).padStart(2, "0")} ⁄ {PHASES[phase].label}
        </span>
        <div className="hud-phase-ticks">
          {PHASES.map((p, i) => (
            <span key={p.id} className={`hud-tick ${i === phase ? "hud-tick-active" : ""}`} />
          ))}
        </div>
      </div>

      <div className="hud-readouts">
        <span className="hud-readout">
          <span className="hud-key">VEL</span>
          <span className="hud-val">
            <span ref={velRef}>0.00</span>c
          </span>
        </span>
        <span className="hud-readout">
          <span className="hud-key">DIST</span>
          <span className="hud-val">
            <span ref={distRef}>000.0</span>%
          </span>
        </span>
        <span className="hud-readout hud-readout-met">
          <span className="hud-key">MET</span>
          <span className="hud-val" ref={metRef}>
            00:00
          </span>
        </span>
      </div>

      <button
        className={`hud-rtb ${showRtb ? "hud-rtb-visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Return to top"
        aria-hidden={!showRtb}
        tabIndex={showRtb ? 0 : -1}
      >
        <span className="hud-rtb-arrow">↑</span>
        <span className="hud-rtb-label">RTB</span>
      </button>
    </div>
  );
}
