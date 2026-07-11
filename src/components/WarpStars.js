import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// The signature interaction of the whole site: a starfield that streaks into
// warp lines in direct proportion to how fast you scroll. Scroll gently and
// it's a calm drifting field; flick the wheel and every star stretches into
// a hyperspace streak along the direction of travel, then relaxes as your
// "ship" coasts back down.
//
// Implementation notes:
// - Each star is a 2-vertex line segment (head + tail). The tail vertex is
//   displaced in the vertex shader by a length driven by uVel, so streak
//   length is a pure GPU uniform — zero per-frame attribute writes.
// - A second Points draw over the same base positions gives each star a
//   visible core (1px lines alone read too faint for the "at rest" state).
// - Stars live in a fixed z-box and wrap via a scrolling uOffset uniform,
//   so flying forward forever never runs out of stars.
// Two draw calls total.

const STAR_COUNT = 2600;
const BOX = { x: 90, y: 60, zNear: 6, zFar: -70 };
const Z_SPAN = BOX.zNear - BOX.zFar;

const CREAM = new THREE.Color("#ede6d6");
const AMBER = new THREE.Color("#ffb03a");
const ORANGE = new THREE.Color("#ff5c1f");

function buildAttributes() {
  const basesLine = new Float32Array(STAR_COUNT * 2 * 3);
  const tailsLine = new Float32Array(STAR_COUNT * 2);
  const seedsLine = new Float32Array(STAR_COUNT * 2);
  const colorsLine = new Float32Array(STAR_COUNT * 2 * 3);

  const basesPoint = new Float32Array(STAR_COUNT * 3);
  const seedsPoint = new Float32Array(STAR_COUNT);
  const colorsPoint = new Float32Array(STAR_COUNT * 3);

  const c = new THREE.Color();
  for (let i = 0; i < STAR_COUNT; i++) {
    const x = (Math.random() - 0.5) * BOX.x;
    const y = (Math.random() - 0.5) * BOX.y;
    const z = BOX.zFar + Math.random() * Z_SPAN;
    const seed = Math.random();

    // ~82% cream, ~14% amber, ~4% signal orange
    const roll = Math.random();
    c.copy(roll < 0.82 ? CREAM : roll < 0.96 ? AMBER : ORANGE);

    for (let v = 0; v < 2; v++) {
      const li = (i * 2 + v) * 3;
      basesLine[li] = x;
      basesLine[li + 1] = y;
      basesLine[li + 2] = z;
      tailsLine[i * 2 + v] = v; // 0 = head, 1 = tail
      seedsLine[i * 2 + v] = seed;
      colorsLine[li] = c.r;
      colorsLine[li + 1] = c.g;
      colorsLine[li + 2] = c.b;
    }

    const pi = i * 3;
    basesPoint[pi] = x;
    basesPoint[pi + 1] = y;
    basesPoint[pi + 2] = z;
    seedsPoint[i] = seed;
    colorsPoint[pi] = c.r;
    colorsPoint[pi + 1] = c.g;
    colorsPoint[pi + 2] = c.b;
  }

  return { basesLine, tailsLine, seedsLine, colorsLine, basesPoint, seedsPoint, colorsPoint };
}

const WRAP_CHUNK = `
  vec3 wrapped(vec3 base, float offset) {
    vec3 p = base;
    p.z = ${BOX.zFar.toFixed(1)} + mod(base.z - (${BOX.zFar.toFixed(1)}) + offset, ${Z_SPAN.toFixed(1)});
    return p;
  }
`;

const lineVertex = `
  uniform float uOffset;
  uniform float uVel;
  uniform float uTime;
  attribute float aTail;
  attribute float aSeed;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  ${WRAP_CHUNK}
  void main() {
    vec3 p = wrapped(position, uOffset);

    // Streak length: proportional to velocity, capped so violent scrolls
    // stay elegant lines rather than screen-length smears.
    float streak = clamp(uVel * 0.055, -7.0, 7.0);
    p.z -= streak * aTail;

    float depthFade = smoothstep(${BOX.zFar.toFixed(1)}, -38.0, p.z);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
    // Head is bright, tail fades to nothing — reads as motion, not a bar.
    vAlpha = (1.0 - aTail * 0.92) * depthFade * mix(twinkle, 1.0, min(abs(uVel) * 0.02, 1.0));
    vColor = aColor;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const lineFragment = `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    gl_FragColor = vec4(vColor, vAlpha * 0.9);
  }
`;

const pointVertex = `
  uniform float uOffset;
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  ${WRAP_CHUNK}
  void main() {
    vec3 p = wrapped(position, uOffset);
    float depthFade = smoothstep(${BOX.zFar.toFixed(1)}, -30.0, p.z);
    float twinkle = 0.5 + 0.5 * sin(uTime * (0.6 + aSeed * 1.8) + aSeed * 40.0);
    vAlpha = depthFade * (0.35 + twinkle * 0.65);
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.1 + aSeed * 1.9) * uPixelRatio * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const pointFragment = `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    // round soft dot
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float m = smoothstep(0.5, 0.12, d);
    gl_FragColor = vec4(vColor, vAlpha * m);
  }
`;

export default function WarpStars({ velocityRef, reducedMotion }) {
  const lineMat = useRef(null);
  const pointMat = useRef(null);
  const offset = useRef(0);

  const attrs = useMemo(buildAttributes, []);

  const lineUniforms = useMemo(
    () => ({ uOffset: { value: 0 }, uVel: { value: 0 }, uTime: { value: 0 } }),
    []
  );
  const pointUniforms = useMemo(
    () => ({
      uOffset: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 1.75) },
    }),
    []
  );

  useFrame((state, dt) => {
    const vel = reducedMotion ? 0 : velocityRef.current.smoothed;
    // ambient forward drift + scroll-driven flight
    const speed = reducedMotion ? 0.12 : 0.55 + vel * 0.02;
    offset.current += speed * Math.min(dt, 0.05);

    if (lineMat.current) {
      lineMat.current.uniforms.uOffset.value = offset.current;
      lineMat.current.uniforms.uVel.value = vel;
      lineMat.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (pointMat.current) {
      pointMat.current.uniforms.uOffset.value = offset.current;
      pointMat.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.basesLine, 3]} />
          <bufferAttribute attach="attributes-aTail" args={[attrs.tailsLine, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[attrs.seedsLine, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[attrs.colorsLine, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={lineMat}
          uniforms={lineUniforms}
          vertexShader={lineVertex}
          fragmentShader={lineFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.basesPoint, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[attrs.seedsPoint, 1]} />
          <bufferAttribute attach="attributes-aColor" args={[attrs.colorsPoint, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={pointMat}
          uniforms={pointUniforms}
          vertexShader={pointVertex}
          fragmentShader={pointFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
