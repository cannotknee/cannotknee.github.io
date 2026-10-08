import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Spaceman } from "./Spaceman";
import telemetry from "../lib/flightTelemetry";

// The mission pilot. Rather than living in its own hero-only canvas, the
// shiba travels the whole page with you. Position/scale are pure functions of
// scroll progress (piecewise-lerped waypoints), so the flight scrubs both
// directions; the mouse-look lives inside Spaceman itself.
//
// x/y are fractions of the visible viewport at z=0 so the blocking works at
// any aspect ratio.
// Three appearances: co-pilot at launch, seated in the empty right column
// beside the crew manifest (it IS the "1 shiba" on the crew list), then the
// send-off at Open Channel. It leaves before the flight log — a fixed object
// sliding over scrolling cards reads as a rendering glitch, not a flyover.
const WAYPOINTS = [
  { t: 0.0, x: 0.24, y: -0.04, s: 1.0 }, // launch — co-pilot, right of title
  { t: 0.08, x: 0.27, y: 0.02, s: 0.86 },
  { t: 0.17, x: 0.28, y: -0.02, s: 0.78 }, // manifest — seated beside the crew card
  { t: 0.25, x: 0.28, y: 0.02, s: 0.78 },
  { t: 0.33, x: 0.56, y: 0.3, s: 0.0 }, // banks off the right edge before the log
  { t: 0.86, x: 0.34, y: -0.6, s: 0.0 },
  { t: 0.94, x: 0.32, y: -0.14, s: 0.8 }, // open channel — right of the console
  { t: 1.0, x: 0.32, y: -0.1, s: 0.85 },
];

// Narrow screens have no empty side column — the text runs nearly full
// width — so the pilot flies higher at launch, leaves before the manifest
// copy reaches it, and returns below the console copy at the end.
const WAYPOINTS_NARROW = [
  { t: 0.0, x: 0.24, y: 0.38, s: 0.5 },
  { t: 0.05, x: 0.3, y: 0.44, s: 0.42 },
  { t: 0.12, x: 0.56, y: 0.5, s: 0.0 },
  { t: 0.86, x: 0.0, y: -0.65, s: 0.0 },
  { t: 0.94, x: 0.0, y: -0.34, s: 0.55 },
  { t: 1.0, x: 0.0, y: -0.3, s: 0.6 },
];

const ROLL_SECONDS = 1.1;
const BARK_SECONDS = 0.5; // two quick hops
const CHAT_SHIFT = 0.12; // viewport fraction to dodge the open chat panel

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

const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export default function PilotShiba({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const rollStart = useRef(-Infinity);
  const boops = useRef(0);
  const { viewport, clock } = useThree();

  useEffect(() => () => document.body.classList.remove("cursor-boop"), []);

  // Shiba-GPT hooks (see ShibaChat): a little hop when it "replies", as if
  // barking the answer, and while the chat panel is open — it covers the
  // right column — the pilot scoots left to stay in view of its own chat.
  const barkStart = useRef(-Infinity);
  const chatOpen = useRef(false);
  const chatShift = useRef(0);
  useEffect(() => {
    const onSpeak = () => (barkStart.current = clock.elapsedTime);
    const onChat = (e) => (chatOpen.current = e.detail.open);
    window.addEventListener("shiba:speak", onSpeak);
    window.addEventListener("shiba:chat", onChat);
    return () => {
      window.removeEventListener("shiba:speak", onSpeak);
      window.removeEventListener("shiba:chat", onChat);
    };
  }, [clock]);

  // Clicking the pilot is the site's one easter egg: a barrel roll, and a
  // radio reply that the HUD picks up off the window event.
  const boop = (e) => {
    e.stopPropagation();
    boops.current += 1;
    if (!reducedMotion && clock.elapsedTime - rollStart.current > ROLL_SECONDS) {
      rollStart.current = clock.elapsedTime;
    }
    window.dispatchEvent(new CustomEvent("shiba:boop", { detail: { count: boops.current } }));
  };

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const t = reducedMotion ? 0 : telemetry.progress;
    const wp = sample(t, viewport.aspect < 0.75 ? WAYPOINTS_NARROW : WAYPOINTS);
    const bob = reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.12;

    const p = Math.min((state.clock.elapsedTime - rollStart.current) / ROLL_SECONDS, 1);
    const rolling = p < 1;
    const bark = Math.min((state.clock.elapsedTime - barkStart.current) / BARK_SECONDS, 1);
    const barkHop = bark < 1 && !reducedMotion ? Math.abs(Math.sin(bark * Math.PI * 2)) * 0.12 : 0;
    const hop = (rolling ? Math.sin(p * Math.PI) * 0.35 : 0) + barkHop;
    g.rotation.z = rolling ? easeInOutCubic(p) * Math.PI * 2 : 0;

    const shiftTarget = chatOpen.current && viewport.aspect >= 0.75 ? CHAT_SHIFT : 0;
    chatShift.current += (shiftTarget - chatShift.current) * Math.min(delta * 4, 1);

    g.position.set((wp.x - chatShift.current) * viewport.width, wp.y * viewport.height + bob + hop, 0);
    const s = Math.max(wp.s, 0.0001) * 3.1;
    g.scale.set(s, s, s);
    g.visible = wp.s > 0.02;
  });

  return (
    <group ref={groupRef}>
      <Spaceman />
      {/* Cheap invisible hit target — raycasting a sphere instead of the
          model's triangles on every pointer move. */}
      <mesh
        position={[0, 0.02, 0]}
        onClick={boop}
        onPointerOver={() => document.body.classList.add("cursor-boop")}
        onPointerOut={() => document.body.classList.remove("cursor-boop")}
      >
        <sphereGeometry args={[0.17, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
