import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Spaceman } from "./Spaceman";
import telemetry from "../lib/flightTelemetry";
import shibaAnchor from "../lib/shibaAnchor";

// The mission pilot. Rather than living in its own hero-only canvas, the
// shiba travels the whole page with you. Position/scale are pure functions of
// scroll progress (piecewise-lerped waypoints), so the flight scrubs both
// directions; the mouse-look lives inside Spaceman itself.
//
// x/y are fractions of the visible viewport at z=0 (0 = centre) so the
// blocking works at any aspect ratio.
// Two big appearances — co-pilot at launch, then seated in the empty right
// column beside the crew manifest (it IS the "1 shiba" on the crew list) —
// then it swoops down into the bottom-right corner and docks there for the
// rest of the page, right where a site's chat assistant lives (which, as
// Shiba-GPT, it is). Docked, it's fixed chrome like the HUD, so it never
// reads as an object sliding over the scrolling cards.
// `dock: true` waypoints are resolved per frame from pixel sizes (see
// dockWaypoint); `arc` curves the segment into a swoop and banks into it.
const WAYPOINTS = [
  { t: 0.0, x: 0.24, y: -0.04, s: 1.0 }, // launch — co-pilot, right of title
  { t: 0.08, x: 0.27, y: 0.02, s: 0.86 },
  { t: 0.17, x: 0.28, y: -0.02, s: 0.78 }, // manifest — seated beside the crew card
  { t: 0.25, x: 0.28, y: 0.02, s: 0.78 },
  { t: 0.33, dock: true, arc: -0.4 }, // swoops down into the corner before the log
  { t: 1.0, dock: true },
];

// Narrow screens have no empty side column, so the pilot flies above the
// title at launch and docks before the manifest copy reaches it.
const WAYPOINTS_NARROW = [
  { t: 0.0, x: 0.24, y: 0.38, s: 0.5 },
  { t: 0.04, x: 0.26, y: 0.4, s: 0.46 },
  { t: 0.1, dock: true, arc: -0.4 },
  { t: 1.0, dock: true },
];

// Docked size (on-screen radius, px) and clearance from the viewport's
// bottom-right edges. Hud.css moves the RTB button left to clear the dog.
// The model's real silhouette runs ~1.35× the nominal radius (more when it
// turns side-on to watch the cursor), hence the extra clearance.
const DOCK_RADIUS = { wide: 36, narrow: 26 };
const DOCK_MARGIN = 28;
const DOCK_SILHOUETTE = 1.4;
const MODEL_SCALE = 3.1;
const RADIUS_PER_SCALE = 0.2; // on-screen radius ≈ scale × this, world units

const ROLL_SECONDS = 1.1;
const BARK_SECONDS = 0.5; // two quick hops
// Room the open chat panel needs to the dog's right (panel + gap + margin,
// px; see ShibaChat), and the furthest the dog will scoot left to make it.
const CHAT_ROOM_PX = 380;
const MAX_CHAT_SHIFT = 0.25;

// The corner dock as a regular waypoint for the current canvas size.
function dockWaypoint(size, pxPerUnit) {
  const r = size.width < 640 ? DOCK_RADIUS.narrow : DOCK_RADIUS.wide;
  const cx = size.width - DOCK_MARGIN - r * DOCK_SILHOUETTE;
  const cy = size.height - DOCK_MARGIN - r * DOCK_SILHOUETTE * 1.1; // a bit taller than wide
  return {
    x: cx / size.width - 0.5,
    y: 0.5 - cy / size.height,
    s: r / (RADIUS_PER_SCALE * pxPerUnit * MODEL_SCALE),
    docked: 1,
  };
}

function sample(t, waypoints, dock) {
  let i = 0;
  while (i < waypoints.length - 2 && t > waypoints[i + 1].t) i++;
  const a = waypoints[i].dock ? dock : waypoints[i];
  const b = waypoints[i + 1].dock ? dock : waypoints[i + 1];
  const arc = waypoints[i + 1].arc || 0;
  const span = waypoints[i + 1].t - waypoints[i].t || 1;
  const raw = Math.min(Math.max((t - waypoints[i].t) / span, 0), 1);
  const f = raw * raw * (3 - 2 * raw); // smoothstep between waypoints
  // On an arc, x leads and y lags, so the path bows into a swoop.
  const fx = arc ? 1 - (1 - f) * (1 - f) : f;
  const fy = arc ? f * f : f;
  return {
    x: a.x + (b.x - a.x) * fx,
    y: a.y + (b.y - a.y) * fy,
    s: a.s + (b.s - a.s) * f,
    docked: (a.docked || 0) + ((b.docked || 0) - (a.docked || 0)) * f,
    bank: arc * Math.sin(raw * Math.PI),
  };
}

const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export default function PilotShiba({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const rollStart = useRef(-Infinity);
  const barkStart = useRef(-Infinity);
  const chatOpen = useRef(false);
  const chatShift = useRef(0);
  const lastT = useRef(-1);
  const { viewport, clock } = useThree();
  const [projected] = useState(() => new THREE.Vector3());

  useEffect(() => () => document.body.classList.remove("cursor-boop"), []);

  // The pilot is the site's "AI assistant", Shiba-GPT (see ShibaChat), which
  // drives it over window events: a little hop per reply, as if barking the
  // answer; a barrel roll on request; and while the chat is open the pilot
  // scoots left so the speech-bubble panel fits beside it.
  useEffect(() => {
    const onSpeak = () => (barkStart.current = clock.elapsedTime);
    const onRoll = () => {
      if (!reducedMotion && clock.elapsedTime - rollStart.current > ROLL_SECONDS) {
        rollStart.current = clock.elapsedTime;
      }
    };
    const onChat = (e) => (chatOpen.current = e.detail.open);
    window.addEventListener("shiba:speak", onSpeak);
    window.addEventListener("shiba:roll", onRoll);
    window.addEventListener("shiba:chat", onChat);
    return () => {
      window.removeEventListener("shiba:speak", onSpeak);
      window.removeEventListener("shiba:roll", onRoll);
      window.removeEventListener("shiba:chat", onChat);
    };
  }, [clock, reducedMotion]);

  const onClick = (e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("shiba:boop"));
  };

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const pxPerUnit = state.size.height / viewport.height;
    const waypoints = viewport.aspect < 0.75 ? WAYPOINTS_NARROW : WAYPOINTS;
    // Reduced motion: no scrubbed flight — the dog is at launch on the hero
    // and simply appears docked once you scroll past it.
    const t = reducedMotion ? (telemetry.progress < 0.08 ? 0 : 1) : telemetry.progress;
    const wp = sample(t, waypoints, dockWaypoint(state.size, pxPerUnit));

    // Bob and hops shrink with the dog so the docked one doesn't bounce
    // half its own height.
    const motionScale = Math.min(wp.s, 1);
    const bob = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.12 * motionScale;

    const p = Math.min((state.clock.elapsedTime - rollStart.current) / ROLL_SECONDS, 1);
    const rolling = p < 1;
    const bark = Math.min((state.clock.elapsedTime - barkStart.current) / BARK_SECONDS, 1);
    const barkHop = bark < 1 && !reducedMotion ? Math.abs(Math.sin(bark * Math.PI * 2)) * 0.12 : 0;
    const hop = ((rolling ? Math.sin(p * Math.PI) * 0.35 : 0) + barkHop) * Math.max(motionScale, 0.5);
    g.rotation.z = rolling ? easeInOutCubic(p) * Math.PI * 2 : reducedMotion ? 0 : wp.bank;

    const s = Math.max(wp.s, 0.0001) * MODEL_SCALE;
    const radiusPx = s * RADIUS_PER_SCALE * pxPerUnit;

    // Scoot only as far left as needed for the chat panel to fit on the
    // right. Docked, the dog stays put and the panel opens beside it instead.
    let shiftTarget = 0;
    if (chatOpen.current && viewport.aspect >= 0.75) {
      const overflow = (0.5 + wp.x) * state.size.width + radiusPx + CHAT_ROOM_PX - state.size.width;
      shiftTarget = Math.min(Math.max(overflow, 0) / state.size.width, MAX_CHAT_SHIFT) * (1 - wp.docked);
    }
    chatShift.current += (shiftTarget - chatShift.current) * Math.min(delta * 4, 1);

    g.position.set((wp.x - chatShift.current) * viewport.width, wp.y * viewport.height + bob + hop, 0);
    g.scale.set(s, s, s);
    g.visible = wp.s > 0.02;

    // Publish the dog's screen position for the chat bubbles.
    projected.copy(g.position).project(state.camera);
    shibaAnchor.x = ((projected.x + 1) / 2) * state.size.width;
    shibaAnchor.y = ((1 - projected.y) / 2) * state.size.height;
    shibaAnchor.r = radiusPx * 1.3; // nominal radius → rough silhouette
    shibaAnchor.visible = wp.s > 0.2;
    shibaAnchor.docked = wp.docked > 0.5;

    // Scrolling moves the dog without firing pointer events, so re-run the
    // hover test when it moves — otherwise a dog that flies out from under a
    // still cursor keeps the CHAT reticle, and one that flies under it doesn't.
    if (t !== lastT.current) {
      lastT.current = t;
      state.events.update?.();
    }
  });

  return (
    <group ref={groupRef}>
      <Spaceman />
      {/* Cheap invisible hit target — raycasting a sphere instead of the
          model's triangles on every pointer move. */}
      <mesh
        position={[0, 0.02, 0]}
        onClick={onClick}
        onPointerOver={() => document.body.classList.add("cursor-boop")}
        onPointerOut={() => document.body.classList.remove("cursor-boop")}
      >
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
