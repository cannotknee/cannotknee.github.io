import { useEffect, useRef } from "react";
import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import telemetry from "../lib/flightTelemetry";

// Banded gas-giant: horizontal cloud bands warped by fbm noise, with a warm
// amber fresnel rim so the limb reads as lit by a nearby sun. Recolored for
// Mission KO-2026's rust/ember palette (the old teal version was part of the
// generic cyan-on-navy look this redesign retires).
const PlanetMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorDeep: new THREE.Color("#2a1208"),
    uColorMid: new THREE.Color("#8c3b1f"),
    uColorGlow: new THREE.Color("#ffb03a"),
  },
  `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  `
    uniform float uTime;
    uniform vec3 uColorDeep;
    uniform vec3 uColorMid;
    uniform vec3 uColorGlow;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewDir;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
    }
    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      float warp = noise(vec2(vUv.x * 3.0, uTime * 0.04)) * 0.5;
      float bands = sin((vUv.y + warp * 0.15) * 16.0) * 0.5 + 0.5;
      vec3 base = mix(uColorDeep, uColorMid, bands);

      float turbulence = noise(vUv * vec2(7.0, 14.0) + vec2(uTime * 0.015, 0.0));
      base = mix(base, uColorMid, turbulence * 0.3);
      base += uColorGlow * 0.04;

      float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), 2.2);
      vec3 color = base + uColorGlow * fresnel * 1.05;

      gl_FragColor = vec4(color, 1.0);
    }
  `
);

const RingMaterial = shaderMaterial(
  { uColor: new THREE.Color("#ffb03a") },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      float r = vUv.y;
      float gap = smoothstep(0.0, 0.06, abs(fract(r * 9.0) - 0.5) - 0.06);
      float fade = smoothstep(1.0, 0.15, r) * smoothstep(0.0, 0.12, r);
      float alpha = fade * (0.3 + gap * 0.45);
      gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 0.5));
    }
  `
);

extend({ PlanetMaterial, RingMaterial });

const MOUSE_INFLUENCE = 0.12;
const EASE = 0.04;

// The planet is a landmark you fly PAST: prominent beside the launch title,
// then it slides away and sinks below the horizon as the journey continues,
// gone by the time the payload bay arrives. Position is a pure function of
// scroll progress so it scrubs both ways.
export default function RingedPlanet({ reducedMotion = false }) {
  const groupRef = useRef(null);
  const planetRef = useRef(null);
  const ringRef = useRef(null);
  const planetMatRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame((state, delta) => {
    if (!reducedMotion) {
      if (planetMatRef.current) planetMatRef.current.uTime += delta;
      if (planetRef.current) planetRef.current.rotation.y += delta * 0.05;
      if (ringRef.current) ringRef.current.rotation.z += delta * 0.012;
    }

    const group = groupRef.current;
    if (!group) return;

    // Exit via the right margin and sink below the viewport by ~1/3 of the
    // journey — the first version drifted toward screen-center as it
    // receded and ended up parked behind the flight-log/payload text.
    const t = reducedMotion ? 0 : Math.min(telemetry.progress / 0.35, 1);
    const drift = t * t; // ease-in: barely moves at hero, accelerates away
    group.position.x = 10.8 + drift * 5;
    group.position.z = -16 - drift * 10;
    group.position.y = 4.7 - drift * 26 + Math.sin(state.clock.elapsedTime * 0.15) * 0.18;

    const targetY = mouse.current.x * MOUSE_INFLUENCE;
    const targetX = -mouse.current.y * MOUSE_INFLUENCE;
    group.rotation.y += (targetY - group.rotation.y) * EASE;
    group.rotation.x += (targetX - group.rotation.x) * EASE;
  });

  return (
    <group ref={groupRef} position={[10.8, 4.7, -16]} rotation={[0.3, 0, 0.22]}>
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.7, 40, 40]} />
        <planetMaterial ref={planetMatRef} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
        <ringGeometry args={[2.3, 3.6, 96]} />
        <ringMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
