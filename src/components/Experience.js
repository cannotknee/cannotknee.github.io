import React from "react";
import PropTypes from "prop-types";
import "./Experience.css";

function Experience({ title, description, techStack, link, timeline }) {
  return (
    <a href={link} className="experience-link" target="_blank" rel="noopener noreferrer">
      <div className="experience-card">
        <div className="experience-timeline">{timeline}</div>
        <div className="experience-details">
          <h3 className="experience-title">{title}</h3>
          <p className="experience-description">{description}</p>
          <div className="experience-tech-container">
          {techStack.map((tech, index) => (
            <button key={index} className="experience-tech">
              {tech}
            </button>
          ))}
        </div>
        </div>
      </div>
    </a>
  );
}

Experience.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  techStack: PropTypes.arrayOf(PropTypes.string).isRequired,
  timeline: PropTypes.string.isRequired,
};

export default Experience;
