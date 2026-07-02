import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "./Project.css";
import Parallax from "./Parallax";

// Middle column drifts further than the outer two — a subtle masonry-style
// parallax across the grid as the user scrolls past it.
function speedForIndex(i) {
  return i % 3 === 1 ? 60 : 30;
}

function Project({ projects }) {
  useEffect(() => {
    const cards = document.querySelectorAll(".project-card");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            setTimeout(() => entry.target.style.setProperty("--delay", "0s"), 900);
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    cards.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="projects-grid">
      {projects.map((project, i) => (
        <Parallax key={i} speed={speedForIndex(i)}>
          <article
            className="project-card"
            style={{ "--delay": `${i * 0.12}s` }}
          >
            <div className="project-card-media">
              <img
                src={project.imageSrc}
                alt={project.title}
                className="project-card-img"
              />
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
      description: PropTypes.string.isRequired,
      techStack: PropTypes.arrayOf(PropTypes.string).isRequired,
      link: PropTypes.string,
      imageSrc: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default Project;
