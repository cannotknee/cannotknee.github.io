import { useRef } from "react";
import PropTypes from "prop-types";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

// Wraps children in a motion.div whose opacity/position are pure functions of
// this element's own scroll progress through the viewport — not a one-shot
// class toggled by IntersectionObserver. Scroll slowly and it eases in
// slowly; scroll back up and it eases back out. `fade`/`fromX` opt into an
// entrance (opacity + horizontal slide) on top of the ever-present vertical
// parallax drift.
function Parallax({ children, speed = 30, fade = false, fromX = 0, className }) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const range = shouldReduceMotion ? 0 : speed;
  const y = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const opacity = useTransform(scrollYProgress, [0, 0.25], [0, 1]);
  const x = useTransform(scrollYProgress, [0, 0.3], [shouldReduceMotion ? 0 : fromX, 0]);

  const style = fade ? { y, opacity, x } : { y };

  return (
    <motion.div ref={ref} style={style} className={className}>
      {children}
    </motion.div>
  );
}

Parallax.propTypes = {
  children: PropTypes.node.isRequired,
  speed: PropTypes.number,
  fade: PropTypes.bool,
  fromX: PropTypes.number,
  className: PropTypes.string,
};

export default Parallax;
