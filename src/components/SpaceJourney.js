import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import WarpStars from "./WarpStars";
import NebulaField from "./NebulaField";
import RingedPlanet from "./RingedPlanet";
import PilotShiba from "./PilotShiba";
import telemetry, { startTelemetry } from "../lib/flightTelemetry";

// The whole site rides inside this one fixed canvas. Scrolling the page IS
// flying the ship: star streak length follows live scroll velocity, the
// nebula recolors through mission phases, the ringed planet slides past as
// a landmark, and the shiba pilot travels waypoints from launch to landing.
//
// One persistent canvas (points + lines + two small shaders + one GLB) is
// deliberately cheaper than the old setup of two hero-only canvases that had
// to be unmounted via IntersectionObserver to stop them starving the main
// thread — everything here is a handful of draw calls with no controls
// attached, and the DPR clamp keeps fill-rate sane on hi-dpi screens.

// Gentle whole-scene parallax toward the cursor — the "you are steering"
// feel — plus a slight pitch response to scroll velocity so hard scrolls
// dip the nose.
function Rig({ children, reducedMotion }) {
  const group = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reducedMotion) return undefined;
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion]);

  useFrame(() => {
    const g = group.current;
    if (!g || reducedMotion) return;
    const targetY = mouse.current.x * 0.05;
    const targetX = -mouse.current.y * 0.03 + telemetry.smoothed * 0.0004;
    g.rotation.y += (targetY - g.rotation.y) * 0.04;
    g.rotation.x += (targetX - g.rotation.x) * 0.04;
  });

  return <group ref={group}>{children}</group>;
}

export default function SpaceJourney() {
  const shouldReduceMotion = useReducedMotion();
  const velocityRef = useRef(telemetry); // WarpStars reads .smoothed off this

  useEffect(() => {
    startTelemetry();
  }, []);

  return (
    <div className="space-journey" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 1.75]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <Rig reducedMotion={shouldReduceMotion}>
          <NebulaField reducedMotion={shouldReduceMotion} />
          <WarpStars velocityRef={velocityRef} reducedMotion={shouldReduceMotion} />
          <RingedPlanet reducedMotion={shouldReduceMotion} />
        </Rig>
        <ambientLight intensity={1.1} />
        <directionalLight position={[6, 8, 8]} intensity={1.4} color="#ffe0b8" />
        <Suspense fallback={null}>
          <PilotShiba reducedMotion={shouldReduceMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
