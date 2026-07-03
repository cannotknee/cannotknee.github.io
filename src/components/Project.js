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

// Middle column drifts further than the outer two — a subtle masonry-style
// parallax across the grid as the user scrolls past it.
function speedForIndex(i) {
  return i % 3 === 1 ? 60 : 30;
}

// Image starts zoomed in and soft-focused; scrolling the card through the
// viewport pulls it into a sharp, settled frame — a scroll-scrubbed
// depth-of-field reveal, independent of the card's own hover zoom (which
// stays a plain CSS transition on the <img> itself).
function ProjectCardImage({ src, alt }) {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 45%"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 1 : 1.3, 1]);
  const blurPx = useTransform(scrollYProgress, [0, 1], [shouldReduceMotion ? 0 : 14, 0]);
  const filter = useMotionTemplate`blur(${blurPx}px)`;

  return (
    <motion.div ref={ref} className="project-card-img-wrap" style={{ scale, filter }}>
      <img src={src} alt={alt} className="project-card-img" />
    </motion.div>
  );
}

function Project({ projects }) {
  return (
    <div className="projects-grid">
      {projects.map((project, i) => (
        <Parallax key={i} speed={speedForIndex(i)} fade delay={(i % 3) * 0.08}>
          <TiltCard
            as="article"
            className="project-card"
            innerClassName="project-card-inner"
            tiltAmount={4}
          >
            <div className="project-card-media">
              <ProjectCardImage src={project.imageSrc} alt={project.title} />
              <span className="project-card-number">0{i + 1}</span>

              <div className="project-card-title-bar">
                <h3 className="project-card-title">{project.title}</h3>
              </div>

              <div className="project-card-overlay">
                <h3 className="project-card-overlay-title">{project.title}</h3>
                <p className="project-card-desc">{project.description}</p>
                <div className="project-card-tags">
                  {project.techStack.map((tech, j) => (
                    <span key={j} className="project-tech">{tech}</span>
                  ))}
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-card-link"
                  >
                    View Project <span className="project-card-arrow">↗</span>
                  </a>
                )}
              </div>
            </div>
          </TiltCard>
        </Parallax>
      ))}
    </div>
  );
}

Project.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      techStack: PropTypes.arrayOf(PropTypes.string).isRequired,
      link: PropTypes.string,
      imageSrc: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Project;
