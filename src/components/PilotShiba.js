import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Spaceman } from "./Spaceman";
import telemetry from "../lib/flightTelemetry";

// The mission pilot. Rather than living in its own hero-only canvas, the
// shiba now travels the whole page with you: prominent co-pilot beside the
// launch title, drifting to a small observer during the manifest and flight
// log, slipping out of frame while the payload bay deploys, then returning
// front-and-center for the open channel at the end. Position/scale are pure
// functions of scroll progress (piecewise-lerped waypoints), so the flight
// scrubs both directions; the mouse-look lives inside Spaceman itself.
//
// x/y are fractions of the visible viewport at z=0 so the blocking works at
// any aspect ratio.
// The pilot makes exactly two appearances: co-pilot at launch (drifting up
// and away through the crew manifest, then off the right edge), and the
// send-off at Open Channel. No mid-journey cameo — an earlier version kept
// it hovering along the top edge through the flight log, and a fixed object
// sliding over scrolling content read as a rendering glitch, not a flyover.
const WAYPOINTS = [
  { t: 0.0, x: 0.24, y: -0.04, s: 1.0 }, // launch — co-pilot, right of title
  { t: 0.1, x: 0.3, y: 0.14, s: 0.8 },
  { t: 0.24, x: 0.36, y: 0.32, s: 0.46 }, // manifest — drifts up and away
  { t: 0.36, x: 0.54, y: 0.4, s: 0.0 }, // exits off the right edge before the log
  { t: 0.86, x: 0.34, y: -0.6, s: 0.0 },
  { t: 0.94, x: 0.32, y: -0.14, s: 0.8 }, // open channel — right of the console
  { t: 1.0, x: 0.32, y: -0.1, s: 0.85 },
];

// Narrow screens have no empty side column — the text runs nearly full
// width — so the pilot flies higher at launch and returns below the
// console copy at the end.
const WAYPOINTS_NARROW = [
  { t: 0.0, x: 0.24, y: 0.38, s: 0.5 },
  { t: 0.1, x: 0.28, y: 0.42, s: 0.44 },
  { t: 0.24, x: 0.34, y: 0.44, s: 0.36 },
  { t: 0.36, x: 0.56, y: 0.46, s: 0.0 },
  { t: 0.86, x: 0.0, y: -0.65, s: 0.0 },
  { t: 0.94, x: 0.0, y: -0.34, s: 0.55 },
  { t: 1.0, x: 0.0, y: -0.3, s: 0.6 },
];

function sample(t, waypoints) {
  let i = 0;
  while (i < waypoints.length - 2 && t > waypoints[i + 1].t) i++;
  const a = waypoints[i];
  const b = waypoints[i + 1];
  const span = b.t - a.t || 1;
  let f = Math.min(Math.max((t - a.t) / span, 0), 1);
  f = f * f * (3 - 2 * f); // smoothstep between waypoints
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    s: a.s + (b.s - a.s) * f,
  };
}

export default function PilotShiba({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const { viewport } = useThree();

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = reducedMotion ? 0 : telemetry.progress;
    const wp = sample(t, viewport.aspect < 0.75 ? WAYPOINTS_NARROW : WAYPOINTS);
    const bob = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
    g.position.set(wp.x * viewport.width, wp.y * viewport.height + bob, 0);
    const s = Math.max(wp.s, 0.0001) * 3.1;
    g.scale.set(s, s, s);
    g.visible = wp.s > 0.02;
  });

  return (
    <group ref={groupRef}>
      <Spaceman />
    </group>
  );
}
