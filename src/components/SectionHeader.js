import { useRef } from "react";
import PropTypes from "prop-types";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";

// Section number + heading + underline, all scroll-scrubbed off this
// element's own progress through the viewport — not a one-shot
// IntersectionObserver trigger. Scroll slowly and the underline draws in
// slowly; scroll back up and it retracts. The heading itself wipes into
// view via clip-path and sharpens out of a soft blur, like a lens racking
// into focus. `underlineOnly` skips the fade/slide-up (used when a parent,
// e.g. a Parallax wrapper, already owns that motion) and just handles the
// underline draw + heading wipe.
function SectionHeader({ number, title, className = "", underlineOnly = false }) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 90%", "start 45%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 0 : 20, 0]);
  const scaleX = useTransform(scrollYProgress, [0.35, 1], [0, 1]);
  const wipe = useTransform(scrollYProgress, [0.1, 0.85], [100, 0]);
  const clipPath = useMotionTemplate`inset(0 ${wipe}% 0 0)`;
  const blurPx = useTransform(scrollYProgress, [0, 0.6], [10, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  const style = underlineOnly ? undefined : { opacity, y };
  const headingStyle = shouldReduceMotion ? undefined : { clipPath, filter };

  return (
    <motion.div ref={ref} className={`section-header ${className}`} style={style}>
      <span className="section-number">{number}</span>
      <motion.h2 style={headingStyle}>
        {title}
        <motion.span
          className="section-header-underline"
          style={{ scaleX: shouldReduceMotion ? 1 : scaleX }}
        />
      </motion.h2>
    </motion.div>
  );
}

SectionHeader.propTypes = {
  number: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  className: PropTypes.string,
  underlineOnly: PropTypes.bool,
};

export default SectionHeader;
