import { useRef } from "react";
import PropTypes from "prop-types";
import {
  motion,
  useScroll,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import "./Project.css";
import Parallax from "./Parallax";
import TiltCard from "./TiltCard";

// PAYLOAD DEPLOYMENT — each project is a full-width deployment row, image
// and text alternating sides down the page. This deliberately kills the
// three-column card grid: a grid of identical hover-cards is the single most
// recognizable template pattern in dev portfolios, and it also forced
// descriptions behind a hover state. Here every payload gets a whole row,
// its description in the open, and a porthole-framed image that racks into
// focus as it scrolls into view.

// Image starts zoomed and soft; scrolling the row through the viewport pulls
// it into a sharp settled frame — scroll-scrubbed, so it runs both ways.
function PayloadImage({ src, alt }) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 45%"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 1 : 1.25, 1]);
  const blurPx = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 0 : 12, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.div ref={ref} className="payload-img-wrap" style={{ scale, filter }}>
      <img src={src} alt={alt} className="payload-img" />
    </motion.div>
  );
}

function Project({ projects }) {
  return (
    <div className="payload-list">
      {projects.map((project, i) => (
        <Parallax key={project.title} speed={30} fade>
          <article className={`payload-row ${i % 2 === 1 ? "payload-row-flip" : ""}`}>
            <span className="payload-index" aria-hidden="true">
              {project.code || `P-0${i + 1}`}
            </span>

            <TiltCard className="payload-media" innerClassName="payload-media-inner" tiltAmount={4}>
              <div className="payload-porthole">
                <PayloadImage src={project.imageSrc} alt={project.title} />
                <span className="payload-scanline" aria-hidden="true" />
              </div>
            </TiltCard>

            <div className="payload-body">
              <p className="payload-kicker">
                PAYLOAD {project.code || `P-0${i + 1}`} ⁄ DEPLOYED
              </p>
              <h3 className="payload-title">{project.title}</h3>
              <p className="payload-desc">{project.description}</p>
              <div className="payload-tags">
                {project.techStack.map((tech) => (
                  <span key={tech} className="payload-tech">
                    {tech}
                  </span>
                ))}
              </div>
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="payload-link"
                >
                  View payload <span className="payload-arrow">↗</span>
                </a>
              )}
            </div>
          </article>
        </Parallax>
      ))}
    </div>
  );
}

Project.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      code: PropTypes.string,
      description: PropTypes.string.isRequired,
      techStack: PropTypes.arrayOf(PropTypes.string).isRequired,
      link: PropTypes.string,
      imageSrc: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Project;
