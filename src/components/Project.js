import React from "react";
import PropTypes from "prop-types";
import "./Project.css"; // Create a CSS file for styling

function Project({ title, description, techStack, link, imageSrc }) {
  return (
    <a href={link} className="project-link" target="_blank" rel="noopener noreferrer">
      <div className="project-card">
        <div className="project-content">
          <div>
            <h3 className="project-title">{title}</h3>
            <p className="project-description">{description}</p>
            <div className="project-tech-container">
              {techStack.map((tech, index) => (
                <button key={index} className="project-tech">
                  {tech}
                </button>
              ))}
            </div>
          </div>
          <div>
            <img src={imageSrc} alt={title} className="project-image" />
          </div>
        </div>
      </div>
    </a>
  );
}

Project.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  techStack: PropTypes.arrayOf(PropTypes.string).isRequired,
  link: PropTypes.string.isRequired,
  imageSrc: PropTypes.string.isRequired,
};

export default Project;
