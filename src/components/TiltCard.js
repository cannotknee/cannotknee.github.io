import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useReducedMotion } from "framer-motion";

function clamp01(n) {
  return Math.min(Math.max(n, 0), 1);
}

// Cursor-reactive 3D tilt, driven by a plain requestAnimationFrame loop that
// exponentially smooths toward the pointer's last known position — not a
// physics spring. A spring is tuned to settle toward a FIXED target; here
// the target moves on every mousemove (many times a second), so the
// spring's transient response (its overshoot/momentum) never actually
// finished before being retargeted again, which is what kept reading as
// jitter/snapping no matter how stiffness/damping were tuned. A frame-rate
// driven lerp-toward-target has no transient to overshoot with — it's the
// standard technique real tilt-card implementations use.
//
// The pointer listeners live on a plain, never-transformed outer element;
// only an inner wrapper rotates, via a direct imperative style write on
// this hot path (bypassing React re-renders). If the same element both
// listened for the pointer and rotated, fast mouse movement would slip the
// cursor off the now visually-shifted box mid-gesture, firing a spurious
// mouseleave that snapped the tilt flat — keeping the hit-test box stable
// avoids that too.
function TiltCard({
  children,
  overlay,
  className = "",
  innerClassName = "",
  as: Tag = "div",
  tiltAmount = 5,
  ...rest
}) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const target = useRef({ x: 0.5, y: 0.5 });
  const current = useRef({ x: 0.5, y: 0.5, rotX: 0, rotY: 0 });

  useEffect(() => {
    if (shouldReduceMotion) return undefined;

    let rafId;
    let lastTime = null;
    // Time-constant-based smoothing (not a fixed per-frame fraction): the
    // fraction of remaining distance closed each tick scales with actual
    // elapsed time, so convergence speed stays constant in real time
    // whether frames land every 16ms or every 60ms. A fixed per-frame
    // fraction (the previous version of this component) only takes a step
    // once per RENDERED frame regardless of how much time that frame
    // covered — under any frame hiccup, corrections got sparse-but-large
    // instead of small-and-continuous, which read as a stutter-then-flick.
    const timeConstantMs = 90;
    const tick = (now) => {
      if (lastTime === null) lastTime = now;
      const dt = Math.min(now - lastTime, 100); // clamp so a tab-backgrounded gap doesn't jump
      lastTime = now;
      const factor = 1 - Math.exp(-dt / timeConstantMs);

      const c = current.current;
      const t = target.current;
      c.x += (t.x - c.x) * factor;
      c.y += (t.y - c.y) * factor;

      const rotY = (c.x - 0.5) * 2 * tiltAmount;
      const rotX = (0.5 - c.y) * 2 * tiltAmount;

      // Skip the DOM write once settled — avoids touching style every frame
      // at rest across every card on the page.
      if (Math.abs(rotX - c.rotX) > 0.01 || Math.abs(rotY - c.rotY) > 0.01) {
        c.rotX = rotX;
        c.rotY = rotY;
        if (innerRef.current) {
          innerRef.current.style.transform =
            `perspective(900px) rotateX(${rotX.toFixed(3)}deg) rotateY(${rotY.toFixed(3)}deg)`;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldReduceMotion, tiltAmount]);

  if (shouldReduceMotion) {
    return (
      <Tag ref={outerRef} className={className} {...rest}>
        {children}
        {overlay}
      </Tag>
    );
  }

  function handleMove(e) {
    const rect = outerRef.current.getBoundingClientRect();
    target.current = {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  }

  function handleLeave() {
    target.current = { x: 0.5, y: 0.5 };
  }

  return (
    <Tag
      ref={outerRef}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      {...rest}
    >
      <div
        ref={innerRef}
        className={innerClassName}
        style={{ willChange: "transform", backfaceVisibility: "hidden" }}
      >
        {children}
      </div>
      {overlay}
    </Tag>
  );
}

TiltCard.propTypes = {
  children: PropTypes.node.isRequired,
  overlay: PropTypes.node,
  className: PropTypes.string,
  innerClassName: PropTypes.string,
  as: PropTypes.elementType,
  tiltAmount: PropTypes.number,
};

export default TiltCard;
