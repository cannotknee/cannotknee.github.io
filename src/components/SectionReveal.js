import { useRef } from "react";
import PropTypes from "prop-types";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";

// Wraps a whole section so it doesn't just scroll past flatly. Each `variant`
// is a distinct scroll-scrubbed signature move rather than one recipe reused
// everywhere — the section should feel like arriving somewhere different,
// not the same camera-rack applied four times:
//
//   default  — rack-focus scale/blur (used for anything without a signature)
//   warp     — horizontal stretch + skew + heavy blur easing out, like
//               dropping out of light-speed as the section arrives (About)
//   dock     — slides in horizontally with a brightness/contrast surge, like
//               docking lights powering on (Experience)
//   deploy   — an iris/circle wipe opens outward from center, like a bay
//               door (Projects)
//   transmit — a left-to-right clip wipe, like a signal being received line
//               by line (Contact)
//
// All variants are pure functions of this element's own scroll progress
// through the viewport (continuous scroll-scrubbing, same idiom as
// Parallax/SectionHeader), not a one-shot IntersectionObserver trigger, so
// they ease smoothly in both scroll directions.
//
// Deliberately no rotate/perspective on any variant — this nests above
// content that may own its own 3D tilt context (TiltCard), and stacking two
// independently-animated 3D transform contexts is a GPU-compositing trap
// (see Parallax.js).
function SectionReveal({ children, className = "", variant = "default" }) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // Each of these sections wraps a good deal of its own top padding (14-20vh)
  // before real content starts, so a settle-point as early as 0.16 (as the
  // old uniform default used) finishes the transform while the section is
  // still mostly below the viewport — the drama would resolve off-screen.
  // Settling later, at 0.32, keeps the transform visibly in motion while the
  // actual content is scrolling into view.
  const stops = [0, 0.32, 0.82, 1];
  // Opacity ramps in faster than the shape/brightness transforms below settle
  // — otherwise the moment content is most visibly warped/dim is also the
  // moment it's most transparent, and by the time it's opaque enough to read,
  // the signature shape has already resolved back to normal. Reaching full
  // opacity by 0.14 while the shape keeps moving until 0.32 gives a real
  // window where the distinctive shape is both visible AND legible.
  const opacityStops = [0, 0.14, 0.82, 1];
  const flat = [1, 1, 1, 1];
  const flat0 = [0, 0, 0, 0];

  // ---- default: rack-focus scale/blur ----
  const scale = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat : [0.9, 1, 1, 0.88]);
  const defaultOpacity = useTransform(scrollYProgress, opacityStops, shouldReduceMotion ? flat : [0, 1, 1, 0.3]);
  const defaultBlurPx = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat0 : [10, 0, 0, 7]);

  // ---- warp: horizontal stretch + skew + heavy blur ----
  const warpScaleX = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat : [1.55, 1, 1, 0.75]);
  const warpSkew = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat0 : [16, 0, 0, -8]);
  const warpOpacity = useTransform(scrollYProgress, opacityStops, shouldReduceMotion ? flat : [0, 1, 1, 0.25]);
  const warpBlurPx = useTransform(scrollYProgress, opacityStops, shouldReduceMotion ? flat0 : [10, 0, 0, 9]);

  // ---- dock: horizontal slide + brightness/contrast punch ----
  // A vertical rise here would layer on top of the page's own natural
  // upward scroll motion — same axis, same direction — and just reads as
  // slightly-faster parallax, not a distinct cue (this is what made it
  // indistinguishable from a plain blur-fade). Sliding horizontally instead
  // moves on an axis nothing else on the page moves on, so it can't blend
  // into ordinary scrolling. The brightness/contrast swing is pushed to
  // overshoot past 1 (a small "power surge") so it reads against dark
  // backgrounds instead of just looking like the opacity fade.
  const dockX = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat0 : [-90, 0, 0, 60]);
  const dockBrightness = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat : [0.3, 1.15, 1, 0.6]);
  const dockContrast = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat : [0.6, 1.1, 1, 0.8]);
  const dockOpacity = useTransform(scrollYProgress, opacityStops, shouldReduceMotion ? flat : [0, 1, 1, 0.4]);
  const dockBlurPx = useTransform(scrollYProgress, opacityStops, shouldReduceMotion ? flat0 : [8, 0, 0, 6]);

  // ---- deploy: iris/circle wipe ----
  // Radius in vh, not %: a %-radius on circle() is resolved against this
  // element's OWN box (the whole multi-row grid, often 2-3 viewports tall),
  // not the viewport — so for a tall section the circle was already
  // mathematically wide open by the time enough of it scrolled into view,
  // and no sweeping edge was ever visible on screen. vh ties the radius to
  // the viewport instead, so the sweep is visible regardless of grid height.
  //
  // The radius never shrinks back down after opening, and settles at 800vh —
  // NOT a value tuned to the current grid. This has now bitten twice: the
  // circle is anchored near the TOP of the section, so its radius must reach
  // the section's farthest bottom corner, and that distance is a function of
  // the section's own height. 85vh clipped a two-row card grid; 200vh was
  // "generous" for that grid but got clipped again the moment the layout
  // changed to full-width rows (~4 viewports tall). 800vh covers a section
  // up to ~8 viewports tall — beyond any plausible layout here — and since
  // only the 0→100vh part of the growth is ever visible on screen, the extra
  // headroom costs nothing visually. Holding forever (never shrinking) means
  // opacity alone, not clipping, handles the recede-on-exit feeling — so a
  // still-visible row can never be cut off by the section's own scroll
  // progress passing some threshold.
  // Custom stops: 0→120vh is the on-screen sweep and keeps the original
  // pacing; 120→800vh is invisible headroom that finishes shortly after.
  const deployClipVh = useTransform(
    scrollYProgress,
    [0, 0.19, 0.4, 1],
    shouldReduceMotion ? [800, 800, 800, 800] : [0, 120, 800, 800]
  );
  const deployScale = useTransform(scrollYProgress, stops, shouldReduceMotion ? flat : [0.96, 1, 1, 0.97]);
  const deployOpacity = useTransform(scrollYProgress, opacityStops, shouldReduceMotion ? flat : [0, 1, 1, 0.6]);

  // ---- transmit: left-to-right clip wipe ----
  const transmitInset = useTransform(scrollYProgress, stops, shouldReduceMotion ? [0, 0, 0, 0] : [100, 0, 0, 35]);
  const transmitOpacity = useTransform(scrollYProgress, opacityStops, shouldReduceMotion ? flat : [0, 1, 1, 0.5]);

  const defaultFilter = useMotionTemplate`blur(${defaultBlurPx}px)`;
  const warpFilter = useMotionTemplate`blur(${warpBlurPx}px)`;
  const dockFilter = useMotionTemplate`blur(${dockBlurPx}px) brightness(${dockBrightness}) contrast(${dockContrast})`;
  const deployClipPath = useMotionTemplate`circle(${deployClipVh}vh at 50% 20%)`;
  const transmitClipPath = useMotionTemplate`inset(0 ${transmitInset}% 0 0)`;

  let style;
  switch (variant) {
    case "warp":
      style = { scaleX: warpScaleX, skewX: warpSkew, opacity: warpOpacity, filter: warpFilter };
      break;
    case "dock":
      style = { x: dockX, opacity: dockOpacity, filter: dockFilter };
      break;
    case "deploy":
      style = { clipPath: deployClipPath, scale: deployScale, opacity: deployOpacity };
      break;
    case "transmit":
      style = { clipPath: transmitClipPath, opacity: transmitOpacity };
      break;
    default:
      style = { scale, opacity: defaultOpacity, filter: defaultFilter };
  }

  return (
    <motion.div ref={ref} className={className} style={style}>
      {children}
    </motion.div>
  );
}

SectionReveal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  variant: PropTypes.oneOf(["default", "warp", "dock", "deploy", "transmit"]),
};

export default SectionReveal;
