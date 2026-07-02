import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";

const MOUSE_INFLUENCE_Y = 0.28; // rotation around Y from horizontal mouse movement
const MOUSE_INFLUENCE_X = 0.16; // rotation around X from vertical mouse movement
const EASE = 0.04; // spring-follow smoothing, lower = lazier drift

// Drei's <Stars> wrapped in a group that gently tilts toward the cursor,
// giving the starfield a parallax feel as the mouse moves across the hero.
export default function ParallaxStars(props) {
  const groupRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const targetRotationY = mouse.current.x * MOUSE_INFLUENCE_Y;
    const targetRotationX = -mouse.current.y * MOUSE_INFLUENCE_X;
    group.rotation.y += (targetRotationY - group.rotation.y) * EASE;
    group.rotation.x += (targetRotationX - group.rotation.x) * EASE;
  });

  return (
    <group ref={groupRef}>
      <Stars
        radius={90}
        depth={60}
        count={4500}
        factor={4}
        saturation={0}
        fade
        speed={0.8}
        {...props}
      />
    </group>
  );
}
