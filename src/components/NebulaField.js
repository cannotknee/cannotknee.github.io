import { useRef } from "react";
import { extend, useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import telemetry from "../lib/flightTelemetry";

// Drifting nebula clouds behind the starfield — a full-screen plane driven by
// a hand-rolled value-noise fbm (no texture assets), additively blended so it
// glows through the stars rather than occluding them.
//
// The three uniform colors lerp through PHASES as the journey progresses,
// so the ambient atmosphere itself travels: violet launch void → cold deep
// blue for the flight log → warm ember glow in the payload bay → home again.
const NebulaMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new THREE.Color("#4a2a9e"),
    uColorB: new THREE.Color("#141a4d"),
    uColorC: new THREE.Color("#8f2f5f"),
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying vec2 vUv;

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

    float fbm(vec2 p) {
      float v = 0.0;
      float amp = 0.5;
      for (int i = 0; i < 5; i++) {
        v += amp * noise(p);
        p *= 2.02;
        amp *= 0.5;
      }
      return v;
    }

    void main() {
      vec2 centered = vUv * 2.0 - 1.0;
      vec2 p = vUv * 2.6;
      p += vec2(uTime * 0.012, -uTime * 0.007);

      float n = fbm(p + fbm(p * 1.6));
      float n2 = fbm(p * 1.9 - uTime * 0.01 + 4.2);

      vec3 color = mix(uColorB, uColorA, smoothstep(0.2, 0.85, n));
      color = mix(color, uColorC, smoothstep(0.55, 0.95, n2) * 0.55);

      float vignette = 1.0 - smoothstep(0.25, 1.2, length(centered));
      float density = smoothstep(0.32, 0.9, n) * vignette;

      gl_FragColor = vec4(color, density * 0.42);
    }
  `
);

extend({ NebulaMaterial });

// Color stops along the journey: [progress, colorA, colorB, colorC]
const PHASES = [
  [0.0, "#4a2a9e", "#141a4d", "#8f2f5f"], // launch — violet void
  [0.22, "#1e3f8a", "#0c1638", "#54308f"], // manifest — cooling blue
  [0.45, "#173257", "#0a1230", "#3a2a6e"], // flight log — coldest, deepest
  [0.68, "#b0491c", "#33150b", "#8f6420"], // payload bay — ember glow
  [0.92, "#3a2a8a", "#10173f", "#7a2f57"], // open channel — home indigo
  [1.0, "#3a2a8a", "#10173f", "#7a2f57"],
];

const stopsA = PHASES.map(([, a]) => new THREE.Color(a));
const stopsB = PHASES.map(([, , b]) => new THREE.Color(b));
const stopsC = PHASES.map(([, , , c]) => new THREE.Color(c));
const stopsT = PHASES.map(([t]) => t);

function lerpStops(target, stops, t) {
  let i = 0;
  while (i < stopsT.length - 2 && t > stopsT[i + 1]) i++;
  const span = stopsT[i + 1] - stopsT[i] || 1;
  const local = Math.min(Math.max((t - stopsT[i]) / span, 0), 1);
  target.lerpColors(stops[i], stops[i + 1], local);
}

export default function NebulaField({ reducedMotion = false }) {
  const matRef = useRef(null);

  useFrame((_, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    if (!reducedMotion) mat.uTime += delta;
    const t = telemetry.progress;
    lerpStops(mat.uniforms.uColorA.value, stopsA, t);
    lerpStops(mat.uniforms.uColorB.value, stopsB, t);
    lerpStops(mat.uniforms.uColorC.value, stopsC, t);
  });

  return (
    <mesh position={[0, 0, -24]} renderOrder={-2}>
      <planeGeometry args={[74, 74, 1, 1]} />
      <nebulaMaterial
        ref={matRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
