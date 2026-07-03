import { motion, useTransform, useReducedMotion } from "framer-motion";
import PropTypes from "prop-types";

// Two huge blurred glow blobs, fixed behind the whole page, drifting and
// rotating as a pure function of total page scroll progress. Ties every
// section together with one continuous ambient motion instead of each
// section feeling like an isolated card. Purely decorative — aria-hidden.
function ScrollAurora({ progress }) {
  const shouldReduceMotion = useReducedMotion();

  const yA = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : 500]);
  const xA = useTransform(progress, [0, 0.5, 1], [0, shouldReduceMotion ? 0 : 140, shouldReduceMotion ? 0 : -80]);
  const rotateA = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : 60]);
  const opacityA = useTransform(progress, [0, 0.15, 0.6, 1], [0.5, 0.85, 0.55, 0.75]);

  const yB = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : -420]);
  const xB = useTransform(progress, [0, 0.5, 1], [0, shouldReduceMotion ? 0 : -160, shouldReduceMotion ? 0 : 100]);
  const rotateB = useTransform(progress, [0, 1], [0, shouldReduceMotion ? 0 : -45]);
  const opacityB = useTransform(progress, [0, 0.2, 0.7, 1], [0.3, 0.6, 0.35, 0.55]);

  return (
    <div className="scroll-aurora" aria-hidden="true">
      <motion.div
        className="aurora-blob aurora-blob-a"
        style={{ y: yA, x: xA, rotate: rotateA, opacity: opacityA }}
      />
      <motion.div
        className="aurora-blob aurora-blob-b"
        style={{ y: yB, x: xB, rotate: rotateB, opacity: opacityB }}
      />
    </div>
  );
}

ScrollAurora.propTypes = {
  progress: PropTypes.object.isRequired,
};

export default ScrollAurora;
